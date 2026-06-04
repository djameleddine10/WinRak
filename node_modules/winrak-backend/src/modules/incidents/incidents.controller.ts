import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../utils/prisma';
import { contractsService } from '../contracts/contracts.service';
import { AppError } from '../../middleware/errorHandler';

export const reportIncident = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { rideId, incidentType, description, totalLossAmount, evidenceUrls = [] } = req.body;
    const driverId = req.user!.driverId;
    if (!driverId) throw new AppError('مخصص للسائقين فقط.', 403);

    const ride = await prisma.ride.findUnique({ where: { id: rideId } });
    if (!ride || ride.driverId !== driverId) throw new AppError('الرحلة غير موجودة أو غير مصرح.', 404);

    const existing = await prisma.incident.findUnique({ where: { rideId } });
    if (existing) throw new AppError('تم الإبلاغ عن حادثة لهذه الرحلة مسبقاً.', 400);

    const lossBreakdown = totalLossAmount
      ? await contractsService.calculateLossSharing('new', totalLossAmount, driverId)
      : null;

    const contract = await prisma.driverContract.findFirst({ where: { driverId, isActive: true } });

    const incident = await prisma.incident.create({
      data: {
        rideId,
        driverId,
        contractId: contract?.id,
        incidentType,
        description,
        totalLossAmount: totalLossAmount || null,
        winrakCovers: lossBreakdown?.winrakCovers || null,
        driverCovers: lossBreakdown?.driverCovers || null,
        evidenceUrls,
      },
    });

    res.status(201).json({ success: true, incident, lossBreakdown });
  } catch (err) { next(err); }
};

export const getIncident = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const incident = await prisma.incident.findUnique({
      where: { id: req.params.id },
      include: { ride: true, driver: { include: { user: { select: { fullName: true, phone: true } } } } },
    });
    if (!incident) throw new AppError('الحادثة غير موجودة.', 404);
    res.json({ success: true, incident });
  } catch (err) { next(err); }
};

export const resolveIncident = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { status, adminNote } = req.body; // APPROVED or REJECTED
    const incident = await prisma.incident.update({
      where: { id: req.params.id },
      data: { status, adminNote, resolvedAt: new Date() },
    });
    res.json({ success: true, incident });
  } catch (err) { next(err); }
};

export const listIncidents = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { status, page = '1', limit = '20' } = req.query;
    const incidents = await prisma.incident.findMany({
      where: { ...(status && { status: status as any }) },
      orderBy: { reportedAt: 'desc' },
      skip: (parseInt(page as string) - 1) * parseInt(limit as string),
      take: parseInt(limit as string),
      include: { driver: { include: { user: { select: { fullName: true } } } } },
    });
    res.json({ success: true, incidents });
  } catch (err) { next(err); }
};
