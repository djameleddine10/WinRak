import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../utils/prisma';

export const getProfile = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.userId },
      select: { id:true, phone:true, fullName:true, email:true, avatarUrl:true, role:true, winPoints:true, preferredLanguage:true, createdAt:true },
    });
    res.json({ success: true, user });
  } catch (err) { next(err); }
};

export const updateProfile = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { fullName, email, avatarUrl, preferredLanguage } = req.body;
    const user = await prisma.user.update({
      where: { id: req.user!.userId },
      data: { ...(fullName && { fullName }), ...(email && { email }), ...(avatarUrl && { avatarUrl }), ...(preferredLanguage && { preferredLanguage }) },
    });
    res.json({ success: true, user });
  } catch (err) { next(err); }
};

export const addEmergencyContact = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, phone } = req.body;
    const contact = await prisma.emergencyContact.create({ data: { userId: req.user!.userId, name, phone } });
    res.status(201).json({ success: true, contact });
  } catch (err) { next(err); }
};

export const getWinPoints = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const [user, history] = await Promise.all([
      prisma.user.findUnique({ where: { id: req.user!.userId }, select: { winPoints: true } }),
      prisma.winPointsLog.findMany({ where: { userId: req.user!.userId }, orderBy: { createdAt: 'desc' }, take: 20 }),
    ]);
    res.json({ success: true, balance: user?.winPoints, history });
  } catch (err) { next(err); }
};
