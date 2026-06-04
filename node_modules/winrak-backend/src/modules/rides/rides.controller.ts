import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';
import { ridesService } from './rides.service';

type VehicleType = 'GO' | 'PLUS' | 'XL' | 'SHE' | 'DELIVER';

const estimateSchema = Joi.object({
  pickupLat: Joi.number().min(-90).max(90).required(),
  pickupLng: Joi.number().min(-180).max(180).required(),
  dropoffLat: Joi.number().min(-90).max(90).required(),
  dropoffLng: Joi.number().min(-180).max(180).required(),
  vehicleType: Joi.string().valid('GO', 'PLUS', 'XL', 'SHE', 'DELIVER').default('GO'),
});

const requestSchema = Joi.object({
  pickupLat: Joi.number().required(), pickupLng: Joi.number().required(),
  pickupAddress: Joi.string().required(),
  dropoffLat: Joi.number().required(), dropoffLng: Joi.number().required(),
  dropoffAddress: Joi.string().required(),
  serviceType: Joi.string().valid('GO', 'PLUS', 'XL', 'SHE', 'DELIVER').default('GO'),
  paymentMethod: Joi.string().valid('CASH', 'CARD').default('CASH'),
});

export const estimateRide = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { error, value } = estimateSchema.validate(req.body);
    if (error) return res.status(400).json({ success: false, message: error.message });
    const result = await ridesService.estimate(value.pickupLat, value.pickupLng, value.dropoffLat, value.dropoffLng, value.vehicleType as VehicleType);
    res.json({ success: true, ...result });
  } catch (err) { next(err); }
};

export const requestRide = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { error, value } = requestSchema.validate(req.body);
    if (error) return res.status(400).json({ success: false, message: error.message });
    const result = await ridesService.requestRide(req.user!.userId, value);
    res.status(201).json({ success: true, ...result });
  } catch (err) { next(err); }
};

export const acceptRide    = async (req: Request, res: Response, next: NextFunction) => { try { res.json({ success: true, ride: await ridesService.acceptRide(req.params.id, req.user!.driverId!) }); } catch (err) { next(err); } };
export const driverArrived = async (req: Request, res: Response, next: NextFunction) => { try { res.json({ success: true, ride: await ridesService.updateRideStatus(req.params.id, req.user!.driverId!, 'ARRIVED') }); } catch (err) { next(err); } };
export const startRide     = async (req: Request, res: Response, next: NextFunction) => { try { res.json({ success: true, ride: await ridesService.updateRideStatus(req.params.id, req.user!.driverId!, 'IN_PROGRESS') }); } catch (err) { next(err); } };
export const completeRide  = async (req: Request, res: Response, next: NextFunction) => { try { res.json({ success: true, ride: await ridesService.updateRideStatus(req.params.id, req.user!.driverId!, 'COMPLETED') }); } catch (err) { next(err); } };
export const cancelRide    = async (req: Request, res: Response, next: NextFunction) => { try { res.json({ success: true, ...(await ridesService.cancelRide(req.params.id, req.user!.userId, req.body.reason)) }); } catch (err) { next(err); } };
export const getRideById   = async (req: Request, res: Response, next: NextFunction) => { try { res.json({ success: true, ride: await ridesService.trackRide(req.params.id) }); } catch (err) { next(err); } };
export const getMyRides    = async (req: Request, res: Response, next: NextFunction) => { try { res.json({ success: true, ...(await ridesService.getMyRides(req.user!.userId, +(req.query.page||1), +(req.query.limit||10))) }); } catch (err) { next(err); } };

export const trackRide = async (req: Request, res: Response, next: NextFunction) => {
  try {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    const ride = await ridesService.trackRide(req.params.id);
    res.write(`data: ${JSON.stringify({ type: 'INITIAL', ride })}\n\n`);
    const { io } = await import('../../index');
    const handler = (data: unknown) => res.write(`data: ${JSON.stringify(data)}\n\n`);
    io.on(`ride:update:${req.params.id}`, handler);
    req.on('close', () => io.off(`ride:update:${req.params.id}`, handler));
  } catch (err) { next(err); }
};
