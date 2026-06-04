import crypto from 'crypto';
import { prisma } from '../../utils/prisma';
import { AppError } from '../../middleware/errorHandler';

type ContractType = 'STANDARD' | 'PREMIUM' | 'PARTNER';

const TEMPLATES: Record<ContractType, { profitWinrak: number; profitDriver: number; lossWinrak: number; lossDriver: number; monthlyLossCap: number }> = {
  STANDARD: { profitWinrak: 15, profitDriver: 85, lossWinrak: 30, lossDriver: 70, monthlyLossCap: 5000 },
  PREMIUM:  { profitWinrak: 12, profitDriver: 88, lossWinrak: 40, lossDriver: 60, monthlyLossCap: 8000 },
  PARTNER:  { profitWinrak: 10, profitDriver: 90, lossWinrak: 50, lossDriver: 50, monthlyLossCap: 12000 },
};

const TERMS_V1 = `عقد الشراكة بين WinRak وشركائنا من السائقين

المادة 1 — توزيع الأرباح
تُوزَّع أرباح كل رحلة مكتملة بالنسب المتفق عليها بين الطرفين.

المادة 2 — تقاسم الخسائر (الميزة الحصرية)
تتحمل شركة WinRak نسبة من الخسائر الناجمة عن:
أ) حوادث الطريق، ب) أعطال السيارة أثناء الرحلة، ج) أضرار الراكب، د) إلغاء الرحلة المفاجئ.

المادة 3 — سقف الخسارة الشهري
لا يتجاوز ما يتحمله السائق من خسائر الحد الأقصى المحدد في هذا العقد شهرياً.

المادة 4 — الالتزامات
يلتزم السائق بالحفاظ على تقييم لا يقل عن 3.5 نجوم.

المادة 5 — إنهاء العقد
يحق لأي طرف إنهاء العقد بإشعار مسبق مدته 30 يوماً.`;

export const contractsService = {
  async getMyContract(driverId: string) {
    const c = await prisma.driverContract.findFirst({ where: { driverId, isActive: true }, orderBy: { createdAt: 'desc' } });
    if (!c) throw new AppError('لا يوجد عقد نشط.', 404);
    return c;
  },

  async createContractOffer(driverId: string, contractType: ContractType = 'STANDARD') {
    await prisma.driverContract.updateMany({ where: { driverId, isActive: true }, data: { isActive: false } });
    const t = TEMPLATES[contractType];
    const validUntil = new Date(); validUntil.setFullYear(validUntil.getFullYear() + 1);
    return prisma.driverContract.create({
      data: {
        driverId, contractType,
        profitWinrakPercent: t.profitWinrak, profitDriverPercent: t.profitDriver,
        lossWinrakPercent: t.lossWinrak, lossDriverPercent: t.lossDriver,
        monthlyLossCap: t.monthlyLossCap,
        termsHash: crypto.createHash('sha256').update(TERMS_V1).digest('hex'),
        termsVersion: 'v1.0', validUntil, isActive: false,
      },
    });
  },

  async signContract(driverId: string, contractId: string, driverSignature: string) {
    const c = await prisma.driverContract.findFirst({ where: { id: contractId, driverId } });
    if (!c) throw new AppError('العقد غير موجود.', 404);
    if (c.signedAt) throw new AppError('هذا العقد موقَّع مسبقاً.', 400);
    const sig = crypto.createHash('sha256').update(`${driverId}:${contractId}:${driverSignature}:${Date.now()}`).digest('hex');
    const signed = await prisma.driverContract.update({ where: { id: contractId }, data: { signedAt: new Date(), digitalSignature: sig, isActive: true } });
    await prisma.driver.update({ where: { id: driverId }, data: { status: 'ACTIVE' } });
    return signed;
  },

  async getContractTerms() {
    return { terms: TERMS_V1, hash: crypto.createHash('sha256').update(TERMS_V1).digest('hex'), version: 'v1.0', templates: TEMPLATES };
  },

  async calculateLossSharing(incidentId: string, totalLossAmount: number, driverId: string) {
    const contract = await prisma.driverContract.findFirst({ where: { driverId, isActive: true } });
    if (!contract) return { winrakCovers: 0, driverCovers: totalLossAmount, message: 'لا يوجد عقد نشط.' };

    const monthStart = new Date(); monthStart.setDate(1); monthStart.setHours(0,0,0,0);
    const agg = await prisma.incident.aggregate({
      where: { driverId, status: { in: ['APPROVED','RESOLVED'] }, reportedAt: { gte: monthStart }, NOT: { id: incidentId } },
      _sum: { driverCovers: true },
    });
    const usedCap = Number(agg._sum.driverCovers || 0);
    const remainCap = Math.max(0, Number(contract.monthlyLossCap) - usedCap);
    const rawDriver = totalLossAmount * (Number(contract.lossDriverPercent) / 100);
    const cappedDriver = Math.min(rawDriver, remainCap);
    const winrakAmount = totalLossAmount - cappedDriver;

    return {
      totalLoss: totalLossAmount,
      winrakCovers: Math.round(winrakAmount),
      driverCovers: Math.round(cappedDriver),
      monthlyCapRemaining: remainCap - cappedDriver,
      breakdown: { contractType: contract.contractType, lossRatio: `WinRak ${contract.lossWinrakPercent}% / السائق ${contract.lossDriverPercent}%`, monthlyCapTotal: Number(contract.monthlyLossCap) },
    };
  },
};
