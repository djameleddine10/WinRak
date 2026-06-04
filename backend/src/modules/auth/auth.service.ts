import { prisma } from '../../utils/prisma';
import { redis } from '../../utils/redis';
import { generateOtp, sendOtp } from '../../utils/otp';
import { signToken, signRefreshToken } from '../../utils/jwt';
import { AppError } from '../../middleware/errorHandler';
import { logger } from '../../utils/logger';

const OTP_EXPIRY = parseInt(process.env.OTP_EXPIRY_MINUTES || '5') * 60;
const OTP_MAX_ATTEMPTS = parseInt(process.env.OTP_MAX_ATTEMPTS || '3');

export const authService = {
  async sendOtp(phone: string) {
    const normalized = normalizePhone(phone);
    if (!normalized) throw new AppError('رقم الهاتف غير صالح.', 400);

    const lockKey = `otp_lock:${normalized}`;
    const locked = await redis.get(lockKey);
    if (locked) throw new AppError('انتظر قليلاً قبل طلب رمز جديد.', 429);

    const code = generateOtp();
    const otpKey = `otp:${normalized}`;

    await redis.set(otpKey, JSON.stringify({ code, attempts: 0 }), 'EX', OTP_EXPIRY);
    await redis.set(lockKey, '1', 'EX', 60);

    const sent = await sendOtp(normalized, code);
    if (!sent) throw new AppError('فشل إرسال رمز التحقق. حاول مجدداً.', 500);

    return { message: 'تم إرسال رمز التحقق.', phone: normalized };
  },

  async verifyOtp(phone: string, code: string) {
    const normalized = normalizePhone(phone);
    if (!normalized) throw new AppError('رقم الهاتف غير صالح.', 400);

    const otpKey = `otp:${normalized}`;
    const raw = await redis.get(otpKey);
    if (!raw) throw new AppError('رمز التحقق منتهي الصلاحية. اطلب رمزاً جديداً.', 400);

    const otpData = JSON.parse(raw);

    if (otpData.attempts >= OTP_MAX_ATTEMPTS) {
      await redis.del(otpKey);
      throw new AppError('تجاوزت الحد الأقصى للمحاولات. اطلب رمزاً جديداً.', 400);
    }

    // DEV MODE: accept "000000" as master OTP for testing
    const isDev = process.env.NODE_ENV === 'development';
    const isMasterCode = isDev && code === '000000';

    if (!isMasterCode && otpData.code !== code) {
      otpData.attempts += 1;
      await redis.set(otpKey, JSON.stringify(otpData), 'EX', OTP_EXPIRY);
      throw new AppError('رمز التحقق غير صحيح.', 400);
    }

    await redis.del(otpKey);

    let user = await prisma.user.findUnique({ where: { phone: normalized } });
    const isNew = !user;

    if (!user) {
      user = await prisma.user.create({
        data: { phone: normalized, isVerified: true },
      });
      logger.info(`New user registered: ${normalized}`);
    } else if (!user.isVerified) {
      user = await prisma.user.update({
        where: { id: user.id },
        data: { isVerified: true },
      });
    }

    const driver = await prisma.driver.findUnique({ where: { userId: user.id } });

    const payload = {
      userId: user.id,
      role: user.role,
      ...(driver && { driverId: driver.id }),
    };

    return {
      isNew,
      accessToken: signToken(payload),
      refreshToken: signRefreshToken(payload),
      user: {
        id: user.id,
        phone: user.phone,
        fullName: user.fullName,
        avatarUrl: user.avatarUrl,
        role: user.role,
        winPoints: user.winPoints,
        preferredLanguage: user.preferredLanguage,
      },
    };
  },

  async refreshToken(token: string) {
    const { verifyToken } = await import('../../utils/jwt');
    try {
      const payload = verifyToken(token);
      const user = await prisma.user.findUnique({ where: { id: payload.userId } });
      if (!user || !user.isActive) throw new AppError('الجلسة غير صالحة.', 401);

      const driver = await prisma.driver.findUnique({ where: { userId: user.id } });
      const newPayload = {
        userId: user.id,
        role: user.role,
        ...(driver && { driverId: driver.id }),
      };

      return { accessToken: signToken(newPayload) };
    } catch {
      throw new AppError('رمز التحديث غير صالح.', 401);
    }
  },
};

function normalizePhone(phone: string): string | null {
  const cleaned = phone.replace(/\s+/g, '').replace(/-/g, '');
  if (/^\+213[5-7]\d{8}$/.test(cleaned)) return cleaned;
  if (/^0[5-7]\d{8}$/.test(cleaned)) return '+213' + cleaned.slice(1);
  if (/^213[5-7]\d{8}$/.test(cleaned)) return '+' + cleaned;
  // For testing: allow any number
  if (process.env.NODE_ENV === 'development' && cleaned.length >= 5) return cleaned;
  return null;
}
