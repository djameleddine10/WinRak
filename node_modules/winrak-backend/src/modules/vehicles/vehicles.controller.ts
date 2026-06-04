import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../utils/prisma';

export const getMyVehicles = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const vehicles = await prisma.vehicle.findMany({
      where: { driverId: req.user!.driverId!, isActive: true },
    });
    res.json({ success: true, vehicles });
  } catch (err) { next(err); }
};

export const addVehicle = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { brand, model, year, color, plateNumber, vehicleType } = req.body;
    const vehicle = await prisma.vehicle.create({
      data: { driverId: req.user!.driverId!, brand, model, year, color, plateNumber, vehicleType },
    });
    res.status(201).json({ success: true, vehicle });
  } catch (err) { next(err); }
};

export const updateVehicle = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const vehicle = await prisma.vehicle.update({
      where: { id: req.params.id },
      data: req.body,
    });
    res.json({ success: true, vehicle });
  } catch (err) { next(err); }
};
