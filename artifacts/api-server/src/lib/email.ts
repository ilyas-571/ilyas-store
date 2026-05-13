import nodemailer from 'nodemailer';
import { logger } from './logger';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export async function sendOrderConfirmationEmail(toEmail: string, orderId: number, totalPrice: number) {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    logger.warn('SMTP credentials not configured. Skipping order confirmation email.');
    return;
  }

  try {
    const info = await transporter.sendMail({
      from: `"Ilyas Store" <${process.env.SMTP_USER}>`,
      to: toEmail,
      subject: `Order Confirmation - #${orderId}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #ddd; padding: 20px;">
          <h1 style="color: #333;">Thank you for your order!</h1>
          <p>We've received your order <strong>#${orderId}</strong> and are processing it now.</p>
          <p>Total amount: <strong>PKR ${totalPrice.toFixed(2)}</strong></p>
          <p>We'll notify you once it ships.</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
          <p style="font-size: 12px; color: #888;">If you have any questions, please reply to this email.</p>
        </div>
      `,
    });
    logger.info(`Order confirmation email sent for order ${orderId}: ${info.messageId}`);
  } catch (error) {
    logger.error(error, `Failed to send order confirmation email for order ${orderId}:`);
  }
}

export async function sendNewOrderAdminAlert(orderId: number, totalPrice: number) {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    logger.warn('SMTP credentials not configured. Skipping admin alert email.');
    return;
  }

  const adminEmail = process.env.ADMIN_EMAIL || process.env.SMTP_USER;

  try {
    const info = await transporter.sendMail({
      from: `"Ilyas Store System" <${process.env.SMTP_USER}>`,
      to: adminEmail,
      subject: `🚨 New Order Received - #${orderId}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #ddd; padding: 20px;">
          <h1 style="color: #d9534f;">New Order Alert!</h1>
          <p>A new order <strong>#${orderId}</strong> has just been placed.</p>
          <p>Total amount: <strong>PKR ${totalPrice.toFixed(2)}</strong></p>
          <p><a href="${process.env.NEXT_PUBLIC_SITE_URL || ""}/admin/orders">View in Admin Dashboard</a></p>
        </div>
      `,
    });
    logger.info(`Admin alert email sent for order ${orderId}: ${info.messageId}`);
  } catch (error) {
    logger.error(error, `Failed to send admin alert email for order ${orderId}:`);
  }
}
