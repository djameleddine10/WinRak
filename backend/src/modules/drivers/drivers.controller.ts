import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../utils/prisma';
import { AppError } from '../../middleware/errorHandler';

export const registerAsDriver = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const existing = await prisma.driver.findUnique({ where: { userId: req.user!.userId } });
    if (existing) return res.status(400).json({ success: false, message: 'أنت مسجل كسائق بالفعل.' });

    const driver = await prisma.driver.create({ data: { userId: req.user!.userId } });

    await prisma.user.update({ where: { id: req.user!.userId }, data: { role: 'DRIVER' } });

    res.status(201).json({ success: true, driver, message: 'تم تسجيلك كسائق. يرجى رفع الوثائق المطلوبة.' });
  } catch (err) { next(err); }
};

export const getDriverProfile = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const driver = await prisma.driver.findUnique({
      where: { id: req.user!.driverId! },
      include: {
        user: { select: { fullName: true, phone: true, avatarUrl: true, email: true } },
        vehicles: { where: { isActive: true } },
        contracts: { where: { isActive: true } },
        documents: true,
      },
    });
    res.json({ success: true, driver });
  } catch (err) { next(err); }
};

export const getNearbyDrivers = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { lat, lng, radius = 5, vehicleType } = req.query;
    if (!lat || !lng) return res.status(400).json({ success: false, message: 'الإحداثيات مطلوبة.' });

    const drivers = await prisma.$queryRaw<any[]>`
      SELECT d.id, d."currentLat", d."currentLng", d.rating, d."totalTrips",
             u."fullName", u."avatarUrl",
             v.brand, v.model, v.color, v."plateNumber", v."vehicleType",
             (6371 * acos(cos(radians(${parseFloat(lat as string)})) * cos(radians(d."currentLat"::float))
               * cos(radians(d."currentLng"::float) - radians(${parseFloat(lng as string)}))
               + sin(radians(${parseFloat(lat as string)})) * sin(radians(d."currentLat"::float)))) AS distance_km
      FROM drivers d
      JOIN users u ON u.id = d."userId"
      JOIN vehicles v ON v."driverId" = d.id AND v."isActive" = true
      WHERE d."isOnline" = true AND d.status = 'ACTIVE'
        AND d."currentLat" IS NOT NULL
        ${vehicleType ? prisma.$queryRaw`AND v."vehicleType" = ${vehicleType}` : prisma.$queryRaw``}
      HAVING (6371 * acos(cos(radians(${parseFloat(lat as string)})) * cos(radians(d."currentLat"::float))
               * cos(radians(d."currentLng"::float) - radians(${parseFloat(lng as string)}))
               + sin(radians(${parseFloat(lat as string)})) * sin(radians(d."currentLat"::float)))) <= ${parseFloat(radius as string)}
      ORDER BY distance_km ASC
      LIMIT 10
    `;

    res.json({ success: true, drivers });
  } catch (err) { next(err); }
};

export const updateLocation = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { lat, lng, heading } = req.body;
    await prisma.driver.update({
      where: { id: req.user!.driverId! },
      data: { currentLat: lat, currentLng: lng, currentHeading: heading, lastSeenAt: new Date() },
    });
    res.json({ success: true });
  } catch (err) { next(err); }
};

export const updateStatus = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { isOnline } = req.body;
    const driver = await prisma.driver.update({
      where: { id: req.user!.driverId! },
      data: { isOnline },
    });
    res.json({ success: true, isOnline: driver.isOnline });
  } catch (err) { next(err); }
};

export const getEarnings = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { period = 'today' } = req.query;
    const driverId = req.user!.driverId!;

    const now = new Date();
    let startDate = new Date();

    if (period === 'today') startDate.setHours(0, 0, 0, 0);
    else if (period === 'week') { startDate.setDate(now.getDate() - 7); }
    else if (period === 'month') { startDate.setDate(1); startDate.setHours(0, 0, 0, 0); }

    const [earnings, driver] = await Promise.all([
      prisma.earning.findMany({
        where: { driverId, earnedAt: { gte: startDate } },
        orderBy: { earnedAt: 'desc' },
      }),
      prisma.driver.findUnique({ where: { id: driverId }, select: { totalEarnings: true, totalTrips: true, rating: true } }),
    ]);

    const total = earnings.reduce((sum, e) => sum + Number(e.amount), 0);

    res.json({ success: true, total, earnings, driver, period });
  } catch (err) { next(err); }
};

export const submitDocuments = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { documents } = req.body; // Array of { docType, fileUrl }
    const driverId = req.user!.driverId!;

    const created = await prisma.$transaction(
      documents.map((doc: { docType: string; fileUrl: string }) =>
        prisma.driverDocument.upsert({
          where: { id: `${driverId}-${doc.docType}` },
          create: { driverId, docType: doc.docType, fileUrl: doc.fileUrl },
          update: { fileUrl: doc.fileUrl, isVerified: false },
        })
      )
    );

    await prisma.driver.update({
      where: { id: driverId },
      data: { status: 'DOCUMENTS_SUBMITTED' },
    });

    res.json({ success: true, documents: created });
  } catch (err) { next(err); }
};

export const getDriverRides = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const driverId = req.user!.driverId!;

    const [rides, total] = await Promise.all([
      prisma.ride.findMany({
        where: { driverId },
        orderBy: { requestedAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: { passenger: { select: { fullName: true, avatarUrl: true } } },
      }),
      prisma.ride.count({ where: { driverId } }),
    ]);

    res.json({ success: true, rides, total, page, totalPages: Math.ceil(total / limit) });
  } catch (err) { next(err); }
};
