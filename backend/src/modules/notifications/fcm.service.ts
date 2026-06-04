import { prisma } from '../../utils/prisma';
import { logger } from '../../utils/logger';

interface NotificationPayload {
  title: string;
  body: string;
  data?: Record<string, string>;
}

export async function notifyUser(userId: string, payload: NotificationPayload) {
  try {
    await prisma.notification.create({
      data: {
        userId, type: (payload.data?.type as string) || 'SYSTEM',
        title: payload.title, body: payload.body,
        data: payload.data ? JSON.stringify(payload.data) : null,
      },
    });

    // Firebase push (only if configured)
    if (!process.env.FIREBASE_PROJECT_ID) return;

    const driver = await prisma.driver.findFirst({ where: { userId } });
    if (!driver?.fcmToken) return;

    const admin = await import('firebase-admin');
    if (!admin.apps?.length) {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        } as any),
      });
    }

    await admin.messaging().send({
      token: driver.fcmToken,
      notification: { title: payload.title, body: payload.body },
      data: payload.data,
    });
  } catch (err) {
    logger.error('Notification error:', err);
  }
}
