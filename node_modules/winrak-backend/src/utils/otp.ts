import { logger } from './logger';

export const generateOtp = (): string =>
  Math.floor(100000 + Math.random() * 900000).toString();

export const sendOtp = async (phone: string, code: string): Promise<boolean> => {
  // DEV MODE — print OTP to console, no SMS needed
  if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_ACCOUNT_SID.startsWith('AC')) {
    logger.info(`📱 [DEV OTP] Phone: ${phone} → Code: ${code}`);
    return true;
  }

  try {
    const twilio = await import('twilio');
    const client = twilio.default(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN
    );
    await client.messages.create({
      body: `رمز WinRak: ${code} — لا تشاركه مع أحد.`,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: phone,
    });
    return true;
  } catch (err) {
    logger.error('Failed to send OTP via Twilio:', err);
    return false;
  }
};
