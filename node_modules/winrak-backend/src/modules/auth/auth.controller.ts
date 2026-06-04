import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';
import { authService } from './auth.service';

const sendOtpSchema = Joi.object({
  phone: Joi.string().required().messages({
    'any.required': 'رقم الهاتف مطلوب.',
  }),
});

const verifyOtpSchema = Joi.object({
  phone: Joi.string().required(),
  code: Joi.string().length(6).pattern(/^\d+$/).required().messages({
    'string.length': 'رمز التحقق يتكون من 6 أرقام.',
    'string.pattern.base': 'رمز التحقق يجب أن يكون أرقاماً فقط.',
  }),
});

export const sendOtpHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { error, value } = sendOtpSchema.validate(req.body);
    if (error) return res.status(400).json({ success: false, message: error.message });

    const result = await authService.sendOtp(value.phone);
    res.json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
};

export const verifyOtpHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { error, value } = verifyOtpSchema.validate(req.body);
    if (error) return res.status(400).json({ success: false, message: error.message });

    const result = await authService.verifyOtp(value.phone, value.code);
    res.json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
};

export const refreshTokenHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) return res.status(400).json({ success: false, message: 'رمز التحديث مطلوب.' });

    const result = await authService.refreshToken(refreshToken);
    res.json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
};

export const logoutHandler = async (_req: Request, res: Response) => {
  res.json({ success: true, message: 'تم تسجيل الخروج بنجاح.' });
};
