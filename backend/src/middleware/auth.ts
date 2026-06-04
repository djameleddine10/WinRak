import { Request, Response, NextFunction } from 'express';
import { verifyToken, JwtPayload } from '../utils/jwt';
import { AppError } from './errorHandler';

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

export const authenticate = (req: Request, _res: Response, next: NextFunction) => {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) throw new AppError('غير مصرح. يرجى تسجيل الدخول.', 401);

  try {
    req.user = verifyToken(header.split(' ')[1]);
    next();
  } catch {
    throw new AppError('الجلسة منتهية. يرجى تسجيل الدخول مجدداً.', 401);
  }
};

export const requireDriver = (req: Request, _res: Response, next: NextFunction) => {
  if (req.user?.role !== 'DRIVER' && req.user?.role !== 'ADMIN') {
    throw new AppError('هذا الإجراء مخصص للسائقين فقط.', 403);
  }
  next();
};

export const requireAdmin = (req: Request, _res: Response, next: NextFunction) => {
  if (req.user?.role !== 'ADMIN') {
    throw new AppError('هذا الإجراء مخصص للمشرفين فقط.', 403);
  }
  next();
};
