import { Injectable } from '@nestjs/common';
import { Resend } from 'resend';
import envConfig from '../config.js';
import * as React from 'react';
import OTPEmail from '../../../emails/otp.js';

@Injectable()
export class EmailService {
  private resend: Resend;

  constructor() {
    this.resend = new Resend(envConfig.RESEND_API_KEY);
  }

  async sendOTP(payload: { email: string; code: string }) {
    const subject = 'Mã OTP';

    return this.resend.emails.send({
      from: 'E-commerce <no-reply@lazycatdiary.id.vn>',
      to: [payload.email],
      subject,
      react: <OTPEmail otpCode={payload.code} title={subject} />
    });
  }
}
