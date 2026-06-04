import { Request, Response, NextFunction } from 'express';
import Stripe from 'stripe';
import { prisma } from '../../utils/prisma';
import { AppError } from '../../middleware/errorHandler';

const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY)
  : null;

export const createPaymentIntent = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!stripe) throw new AppError('الدفع الإلكتروني غير مفعل حالياً.', 503);
    const { rideId } = req.body;

    const ride = await prisma.ride.findUnique({ where: { id: rideId } });
    if (!ride || ride.passengerId !== req.user!.userId) throw new AppError('الرحلة غير موجودة.', 404);
    if (!ride.totalFare) throw new AppError('لم يتم تحديد سعر الرحلة بعد.', 400);

    // Stripe uses smallest currency unit — DZD has no subunit, use cents (EUR fallback)
    const intent = await stripe.paymentIntents.create({
      amount: Math.round(Number(ride.totalFare) * 100), // in centimes
      currency: 'dzd',
      metadata: { rideId, userId: req.user!.userId },
    });

    res.json({ success: true, clientSecret: intent.client_secret });
  } catch (err) { next(err); }
};

export const confirmPayment = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { rideId, stripePaymentId } = req.body;
    const ride = await prisma.ride.findUnique({ where: { id: rideId } });
    if (!ride) throw new AppError('الرحلة غير موجودة.', 404);

    await prisma.payment.upsert({
      where: { rideId },
      create: { rideId, amount: ride.totalFare!, method: 'CARD', status: 'COMPLETED', stripePaymentId },
      update: { status: 'COMPLETED', stripePaymentId },
    });

    await prisma.ride.update({ where: { id: rideId }, data: { paymentStatus: 'COMPLETED' } });
    res.json({ success: true, message: 'تم الدفع بنجاح.' });
  } catch (err) { next(err); }
};

export const getPaymentHistory = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const payments = await prisma.payment.findMany({
      where: { ride: { passengerId: req.user!.userId } },
      orderBy: { createdAt: 'desc' },
      take: 20,
      include: { ride: { select: { pickupAddress: true, dropoffAddress: true, completedAt: true } } },
    });
    res.json({ success: true, payments });
  } catch (err) { next(err); }
};
