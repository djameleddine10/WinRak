import { Router } from 'express';
import adminRoutes from './modules/admin/admin.routes';
import authRoutes from './modules/auth/auth.routes';
import userRoutes from './modules/users/users.routes';
import driverRoutes from './modules/drivers/drivers.routes';
import rideRoutes from './modules/rides/rides.routes';
import contractRoutes from './modules/contracts/contracts.routes';
import paymentRoutes from './modules/payments/payments.routes';
import incidentRoutes from './modules/incidents/incidents.routes';
import ratingRoutes from './modules/ratings/ratings.routes';
import notificationRoutes from './modules/notifications/notifications.routes';
import vehicleRoutes from './modules/vehicles/vehicles.routes';

export const router = Router();

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/drivers', driverRoutes);
router.use('/rides', rideRoutes);
router.use('/contracts', contractRoutes);
router.use('/payments', paymentRoutes);
router.use('/incidents', incidentRoutes);
router.use('/ratings', ratingRoutes);
router.use('/notifications', notificationRoutes);
router.use('/vehicles', vehicleRoutes);
router.use('/admin', adminRoutes);
