import { Server, Socket } from 'socket.io';
import { verifyToken } from '../utils/jwt';
import { prisma } from '../utils/prisma';
import { logger } from '../utils/logger';

export function setupSocketHandlers(io: Server) {
  // Auth middleware for socket
  io.use(async (socket: Socket, next) => {
    try {
      const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.split(' ')[1];
      if (!token) return next(new Error('Authentication required'));

      const payload = verifyToken(token);
      (socket as any).user = payload;
      next();
    } catch {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', async (socket: Socket) => {
    const user = (socket as any).user;
    logger.info(`Socket connected: ${user.userId} (${user.role})`);

    // Join personal room
    socket.join(`user:${user.userId}`);

    if (user.role === 'DRIVER' && user.driverId) {
      socket.join(`driver:${user.driverId}`);

      // Check if driver is online and join drivers_online room
      const driver = await prisma.driver.findUnique({ where: { id: user.driverId } });
      if (driver?.isOnline) socket.join('drivers_online');
    }

    // ─── Driver Events ────────────────────────────────────────
    socket.on('driver:go_online', async () => {
      if (!user.driverId) return;
      await prisma.driver.update({
        where: { id: user.driverId },
        data: { isOnline: true, lastSeenAt: new Date() },
      });
      socket.join('drivers_online');
      socket.emit('driver:status', { online: true });
      logger.info(`Driver ${user.driverId} went online`);
    });

    socket.on('driver:go_offline', async () => {
      if (!user.driverId) return;
      await prisma.driver.update({
        where: { id: user.driverId },
        data: { isOnline: false },
      });
      socket.leave('drivers_online');
      socket.emit('driver:status', { online: false });
    });

    socket.on('location:update', async (data: { lat: number; lng: number; heading?: number; speed?: number }) => {
      if (!user.driverId) return;
      const { lat, lng, heading, speed } = data;

      await prisma.driver.update({
        where: { id: user.driverId },
        data: { currentLat: lat, currentLng: lng, currentHeading: heading, lastSeenAt: new Date() },
      });

      // Get active ride for this driver
      const activeRide = await prisma.ride.findFirst({
        where: { driverId: user.driverId, status: { in: ['ACCEPTED', 'DRIVER_ARRIVING', 'ARRIVED', 'IN_PROGRESS'] } },
      });

      if (activeRide) {
        // Notify passenger
        io.to(`user:${activeRide.passengerId}`).emit('driver:location_update', {
          rideId: activeRide.id,
          lat, lng, heading, speed,
        });

        // Log to ride history
        await prisma.rideLocationLog.create({
          data: { rideId: activeRide.id, lat, lng, heading: heading ?? null, speed: speed ?? null },
        }).catch(() => {}); // Non-blocking
      }
    });

    // ─── Chat Events ──────────────────────────────────────────
    socket.on('chat:send', async (data: { rideId: string; message: string }) => {
      const { rideId, message } = data;
      if (!message?.trim()) return;

      const ride = await prisma.ride.findUnique({ where: { id: rideId } });
      if (!ride) return;

      const isParticipant = ride.passengerId === user.userId ||
        (user.driverId && ride.driverId === user.driverId);
      if (!isParticipant) return;

      const chat = await prisma.chatMessage.create({
        data: { rideId, senderId: user.userId, message: message.trim() },
      });

      // Notify both parties
      const recipientId = ride.passengerId === user.userId ? null : ride.passengerId;
      io.to(`user:${ride.passengerId}`).emit('chat:message', chat);
      if (ride.driverId) io.to(`driver:${ride.driverId}`).emit('chat:message', chat);
    });

    // ─── SOS ──────────────────────────────────────────────────
    socket.on('sos:trigger', async (data: { lat: number; lng: number; rideId?: string }) => {
      logger.warn(`SOS triggered by user ${user.userId}`);

      await prisma.sosAlert.create({
        data: { userId: user.userId, rideId: data.rideId, lat: data.lat, lng: data.lng },
      });

      // Notify admins
      io.to('admins').emit('sos:alert', {
        userId: user.userId, rideId: data.rideId,
        lat: data.lat, lng: data.lng,
        timestamp: new Date(),
      });

      socket.emit('sos:confirmed', { message: 'تم إرسال طلب الطوارئ. فريق الدعم على علم.' });
    });

    socket.on('disconnect', async () => {
      if (user.driverId) {
        await prisma.driver.update({
          where: { id: user.driverId },
          data: { lastSeenAt: new Date() },
        }).catch(() => {});
      }
      logger.info(`Socket disconnected: ${user.userId}`);
    });
  });
}
