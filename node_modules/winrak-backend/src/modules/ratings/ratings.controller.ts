import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../utils/prisma';
import { AppError } from '../../middleware/errorHandler';

export const submitRating = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { rideId, revieweeId, overallScore, cleanlinessScore, professionalismScore, safetyScore, punctualityScore, comment } = req.body;

    const ride = await prisma.ride.findUnique({ where: { id: rideId } });
    if (!ride || ride.status !== 'COMPLETED') throw new AppError('لا يمكن تقييم رحلة غير مكتملة.', 400);

    const rating = await prisma.rating.create({
      data: { rideId, reviewerId: req.user!.userId, revieweeId, overallScore, cleanlinessScore, professionalismScore, safetyScore, punctualityScore, comment },
    });

    // Update driver average rating
    const avgResult = await prisma.rating.aggregate({
      where: { revieweeId },
      _avg: { overallScore: true },
    });

    const driver = await prisma.driver.findFirst({ where: { userId: revieweeId } });
    if (driver) {
      await prisma.driver.update({
        where: { id: driver.id },
        data: { rating: avgResult._avg.overallScore ?? 5.0 },
      });
    }

    res.status(201).json({ success: true, rating });
  } catch (err) { next(err); }
};

export const getRideRatings = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const ratings = await prisma.rating.findMany({ where: { rideId: req.params.rideId } });
    res.json({ success: true, ratings });
  } catch (err) { next(err); }
};
