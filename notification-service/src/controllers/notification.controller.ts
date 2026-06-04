import { Response } from 'express';
import { z } from 'zod';
import * as notificationService from '../services/notification.service';

const sendSchema = z.object({
  recipientEmail: z.string().email(),
  subject: z.string().min(1),
  body: z.string().min(1),
  html: z.string().optional(),
  type: z.enum([
    'INSPECTION_SCHEDULED',
    'PASSWORD_RESET',
    'INSPECTION_OVERDUE',
    'PASSWORD_CHANGED',
    'PASSWORD_RESET_SUCCESS',
    'EMAIL_CHANGED',
    'WELCOME',
  ]),
});

export async function send(req: { body: unknown }, res: Response) {
  const parsed = sendSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ success: false, message: 'Validation failed', errors: parsed.error.flatten() });
  }
  const notification = await notificationService.sendEmail(parsed.data);
  return res.status(201).json({ success: true, message: 'Notification processed', data: notification });
}

export async function list(_req: unknown, res: Response) {
  const notifications = await notificationService.listNotifications();
  return res.json({ success: true, data: notifications });
}

export async function getById(req: { params: { id: string } }, res: Response) {
  const notification = await notificationService.getNotification(req.params.id);
  if (!notification) return res.status(404).json({ success: false, message: 'Not found' });
  return res.json({ success: true, data: notification });
}
