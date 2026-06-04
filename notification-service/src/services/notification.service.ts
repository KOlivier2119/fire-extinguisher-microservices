import nodemailer from 'nodemailer';
import { config } from '../config/env';
import { prisma } from '../lib/prisma';
import { NotificationType } from '../generated/prisma/client';

const transporter = nodemailer.createTransport({
  host: config.smtp.host,
  port: config.smtp.port,
  secure: false,
  auth: config.smtp.user ? { user: config.smtp.user, pass: config.smtp.pass } : undefined,
});

export async function sendEmail(params: {
  recipientEmail: string;
  subject: string;
  body: string;
  html?: string;
  type: NotificationType;
}) {
  const notification = await prisma.notification.create({
    data: {
      recipientEmail: params.recipientEmail,
      subject: params.subject,
      body: params.body,
      type: params.type,
      status: 'PENDING',
    },
  });

  const mailOptions = {
    from: config.smtp.from,
    to: params.recipientEmail,
    subject: params.subject,
    text: params.body,
    html: params.html ?? `<p>${params.body.replace(/\n/g, '<br>')}</p>`,
  };

  const attempt = async () => {
    if (!config.smtp.user) {
      console.log('[Notification - dev mode]', { ...mailOptions, html: '[html omitted in log]' });
      return { messageId: 'dev-mode' };
    }
    return transporter.sendMail(mailOptions);
  };

  try {
    await attempt();
    return prisma.notification.update({
      where: { id: notification.id },
      data: { status: 'SENT', sentAt: new Date() },
    });
  } catch (firstError) {
    try {
      await attempt();
      return prisma.notification.update({
        where: { id: notification.id },
        data: { status: 'SENT', sentAt: new Date() },
      });
    } catch (retryError) {
      return prisma.notification.update({
        where: { id: notification.id },
        data: {
          status: 'FAILED',
          errorMessage: (retryError as Error).message,
        },
      });
    }
  }
}

export async function listNotifications() {
  return prisma.notification.findMany({ orderBy: { createdAt: 'desc' } });
}

export async function getNotification(id: string) {
  return prisma.notification.findUnique({ where: { id } });
}
