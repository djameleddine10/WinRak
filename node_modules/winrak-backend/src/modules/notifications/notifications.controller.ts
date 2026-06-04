import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../utils/prisma';

export const getMyNotifications = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const notifications = await prisma.notification.findMany({
      where: { userId: req.user!.userId },
      orderBy: { sentAt: 'desc' },
      take: 30,
    });
    res.json({ success: true, notifications });
  } catch (err) { next(err); }
};

export const markRead = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await prisma.notification.updateMany({
      where: { id: req.params.id, userId: req.user!.userId },
      data: { isRead: true, readAt: new Date() },
    });
    res.json({ success: true });
  } catch (err) { next(err); }
};

export const updateFcmToken = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { fcmToken } = req.body;
    if (req.user!.driverId) {
      await prisma.driver.update({ where: { id: req.user!.driverId }, data: { fcmToken } });
    }
    res.json({ success: true });
  } catch (err) { next(err); }
};
