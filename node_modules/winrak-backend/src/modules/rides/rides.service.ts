import { prisma } from '../../utils/prisma';
import { calculatePrice } from './pricing.service';
import { AppError } from '../../middleware/errorHandler';
import { notifyUser } from '../notifications/fcm.service';
import { io } from '../../index';

type VehicleType = 'GO' | 'PLUS' | 'XL' | 'SHE' | 'DELIVER';
type RideStatus = 'REQUESTED' | 'SEARCHING' | 'ACCEPTED' | 'DRIVER_ARRIVING' | 'ARRIVED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';

export const ridesService = {
  async estimate(pLat: number, pLng: number, dLat: number, dLng: number, vehicleType: VehicleType = 'GO') {
    return calculatePrice(pLat, pLng, dLat, dLng, vehicleType);
  },

  async requestRide(passengerId: string, data: {
    pickupLat: number; pickupLng: number; pickupAddress: string;
    dropoffLat: number; dropoffLng: number; dropoffAddress: string;
    serviceType: VehicleType; paymentMethod: string;
  }) {
    const active = await prisma.ride.findFirst({
      where: { passengerId, status: { in: ['REQUESTED','SEARCHING','ACCEPTED','DRIVER_ARRIVING','ARRIVED','IN_PROGRESS'] } },
    });
    if (active) throw new AppError('لديك رحلة نشطة بالفعل.', 400);

    const pricing = await calculatePrice(data.pickupLat, data.pickupLng, data.dropoffLat, data.dropoffLng, data.serviceType);

    const ride = await prisma.ride.create({
      data: {
        passengerId, serviceType: data.serviceType,
        pickupLat: data.pickupLat, pickupLng: data.pickupLng, pickupAddress: data.pickupAddress,
        dropoffLat: data.dropoffLat, dropoffLng: data.dropoffLng, dropoffAddress: data.dropoffAddress,
        distanceKm: pricing.estimatedDistance, durationMinutes: pricing.estimatedDuration,
        baseFare: pricing.baseFare, totalFare: pricing.total,
        paymentMethod: data.paymentMethod, status: 'SEARCHING',
      },
      include: { passenger: { select: { fullName: true, phone: true, avatarUrl: true } } },
    });

    io.to('drivers_online').emit('ride:new_request', {
      rideId: ride.id,
      pickup: { lat: data.pickupLat, lng: data.pickupLng, address: data.pickupAddress },
      dropoff: { address: data.dropoffAddress },
      serviceType: data.serviceType, fare: pricing.total,
      estimatedDistance: pricing.estimatedDistance, estimatedDuration: pricing.estimatedDuration,
    });

    return { ride, pricing };
  },

  async acceptRide(rideId: string, driverId: string) {
    const ride = await prisma.ride.findUnique({ where: { id: rideId } });
    if (!ride) throw new AppError('الرحلة غير موجودة.', 404);
    if (ride.status !== 'SEARCHING' && ride.status !== 'REQUESTED') throw new AppError('لم يعد هذا الطلب متاحاً.', 400);

    const driver = await prisma.driver.findUnique({
      where: { id: driverId },
      include: {
        user: { select: { fullName: true, avatarUrl: true, phone: true } },
        vehicles: { where: { isActive: true } },
      },
    });
    if (!driver) throw new AppError('السائق غير موجود.', 404);
    if (!driver.isOnline) throw new AppError('يجب أن تكون متصلاً لقبول الرحلات.', 400);

    const vehicle = driver.vehicles.find(v => v.vehicleType === ride.serviceType) || driver.vehicles[0];
    if (!vehicle) throw new AppError('ليس لديك مركبة مناسبة.', 400);

    const updated = await prisma.ride.update({
      where: { id: rideId },
      data: { driverId, vehicleId: vehicle.id, status: 'ACCEPTED', acceptedAt: new Date() },
    });

    io.to(`user:${ride.passengerId}`).emit('ride:status_changed', {
      rideId, status: 'ACCEPTED',
      driver: { id: driver.id, name: driver.user.fullName, avatar: driver.user.avatarUrl, phone: driver.user.phone, rating: driver.rating, vehicle },
    });

    await notifyUser(ride.passengerId, {
      title: 'تم قبول طلبك! 🚖', body: `${driver.user.fullName} في طريقه إليك.`,
      data: { rideId, type: 'RIDE_ACCEPTED' },
    });

    return updated;
  },

  async updateRideStatus(rideId: string, driverId: string, newStatus: RideStatus) {
    const ride = await prisma.ride.findUnique({ where: { id: rideId } });
    if (!ride) throw new AppError('الرحلة غير موجودة.', 404);
    if (ride.driverId !== driverId) throw new AppError('غير مصرح.', 403);

    const updated = await prisma.ride.update({
      where: { id: rideId },
      data: {
        status: newStatus,
        ...(newStatus === 'ARRIVED'      && { arrivedAt:   new Date() }),
        ...(newStatus === 'IN_PROGRESS'  && { startedAt:   new Date() }),
        ...(newStatus === 'COMPLETED'    && { completedAt: new Date() }),
      },
    });

    if (newStatus === 'COMPLETED' && ride.totalFare) {
      const contract = await prisma.driverContract.findFirst({ where: { driverId, isActive: true } });
      const pct = contract ? Number(contract.profitDriverPercent) : 85;
      const cut = (Number(ride.totalFare) * pct) / 100;
      await prisma.earning.create({ data: { driverId, rideId, amount: cut, type: 'RIDE_EARNING' } });
      await prisma.driver.update({ where: { id: driverId }, data: { totalTrips: { increment: 1 }, totalEarnings: { increment: cut } } });
      await prisma.user.update({ where: { id: ride.passengerId }, data: { winPoints: { increment: 10 } } });
      await prisma.winPointsLog.create({ data: { userId: ride.passengerId, action: 'RIDE_COMPLETED', points: 10, rideId } });
    }

    io.to(`user:${ride.passengerId}`).emit('ride:status_changed', { rideId, status: newStatus });
    if (driverId) io.to(`driver:${driverId}`).emit('ride:status_changed', { rideId, status: newStatus });

    if (newStatus === 'ARRIVED')
      await notifyUser(ride.passengerId, { title: 'السائق وصل! 🚗', body: 'توجه إلى نقطة الانتقاء.', data: { rideId, type: 'DRIVER_ARRIVED' } });
    if (newStatus === 'COMPLETED')
      await notifyUser(ride.passengerId, { title: 'وصلت بسلام! ✅', body: 'شكراً لاستخدامك WinRak. قيّم رحلتك.', data: { rideId, type: 'RIDE_COMPLETED' } });

    return updated;
  },

  async cancelRide(rideId: string, userId: string, reason?: string) {
    const ride = await prisma.ride.findUnique({ where: { id: rideId } });
    if (!ride) throw new AppError('الرحلة غير موجودة.', 404);
    if (['COMPLETED', 'CANCELLED'].includes(ride.status)) throw new AppError('لا يمكن إلغاء هذه الرحلة.', 400);

    await prisma.ride.update({
      where: { id: rideId },
      data: { status: 'CANCELLED', cancelledBy: userId, cancellationNote: reason, cancelledAt: new Date() },
    });

    const notifyId = ride.passengerId === userId ? ride.driverId : ride.passengerId;
    if (notifyId) io.to(`user:${notifyId}`).emit('ride:status_changed', { rideId, status: 'CANCELLED' });
    return { message: 'تم إلغاء الرحلة.' };
  },

  async trackRide(rideId: string) {
    const ride = await prisma.ride.findUnique({
      where: { id: rideId },
      include: {
        driver: { select: { currentLat: true, currentLng: true, currentHeading: true, rating: true, user: { select: { fullName: true, avatarUrl: true, phone: true } } } },
        vehicle: { select: { brand: true, model: true, color: true, plateNumber: true } },
      },
    });
    if (!ride) throw new AppError('الرحلة غير موجودة.', 404);
    return ride;
  },

  async getMyRides(userId: string, page = 1, limit = 10) {
    const skip = (page - 1) * limit;
    const [rides, total] = await Promise.all([
      prisma.ride.findMany({
        where: { passengerId: userId }, orderBy: { requestedAt: 'desc' }, skip, take: limit,
        include: { driver: { select: { user: { select: { fullName: true, avatarUrl: true } } } }, vehicle: { select: { brand: true, model: true } }, ratings: { where: { reviewerId: userId } } },
      }),
      prisma.ride.count({ where: { passengerId: userId } }),
    ]);
    return { rides, total, page, totalPages: Math.ceil(total / limit) };
  },
};
