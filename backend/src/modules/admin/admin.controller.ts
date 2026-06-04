import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../utils/prisma';

export const getStats = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const today = new Date(); today.setHours(0, 0, 0, 0);

    const [totalRides, todayRides, activeRides, totalDrivers, onlineDrivers, pendingIncidents, completedRides] =
      await Promise.all([
        prisma.ride.count(),
        prisma.ride.count({ where: { requestedAt: { gte: today } } }),
        prisma.ride.count({ where: { status: { in: ['SEARCHING', 'ACCEPTED', 'ARRIVED', 'IN_PROGRESS'] } } }),
        prisma.driver.count({ where: { status: 'ACTIVE' } }),
        prisma.driver.count({ where: { isOnline: true } }),
        prisma.incident.count({ where: { status: 'PENDING' } }),
        prisma.ride.findMany({ where: { status: 'COMPLETED', completedAt: { gte: today } }, select: { totalFare: true } }),
      ]);

    const todayRevenue = completedRides.reduce((s, r) => s + (r.totalFare || 0), 0);

    res.json({
      success: true,
      stats: { totalRides, todayRides, activeRides, totalDrivers, onlineDrivers, pendingIncidents, todayRevenue },
    });
  } catch (err) { next(err); }
};

export const getDriversList = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const drivers = await prisma.driver.findMany({
      include: {
        user: { select: { fullName: true, phone: true, avatarUrl: true } },
        vehicles: { where: { isActive: true } },
        contracts: { where: { isActive: true }, select: { contractType: true, profitDriverPercent: true, lossWinrakPercent: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    res.json({ success: true, drivers });
  } catch (err) { next(err); }
};

export const getRidesList = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { status, page = '1', limit = '20' } = req.query;
    const rides = await prisma.ride.findMany({
      where: { ...(status && { status: status as string }) },
      include: {
        passenger: { select: { fullName: true, phone: true } },
        driver: { include: { user: { select: { fullName: true } } } },
        vehicle: { select: { brand: true, model: true, plateNumber: true } },
      },
      orderBy: { requestedAt: 'desc' },
      skip: (parseInt(page as string) - 1) * parseInt(limit as string),
      take: parseInt(limit as string),
    });
    const total = await prisma.ride.count({ where: { ...(status && { status: status as string }) } });
    res.json({ success: true, rides, total });
  } catch (err) { next(err); }
};

export const getIncidentsList = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { status } = req.query;
    const incidents = await prisma.incident.findMany({
      where: { ...(status && { status: status as string }) },
      include: {
        driver: { include: { user: { select: { fullName: true, phone: true } } } },
        ride: { select: { pickupAddress: true, dropoffAddress: true } },
      },
      orderBy: { reportedAt: 'desc' },
    });
    res.json({ success: true, incidents });
  } catch (err) { next(err); }
};
