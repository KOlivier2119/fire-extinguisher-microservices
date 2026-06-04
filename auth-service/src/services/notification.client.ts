import { config } from '../config/env';

export type NotificationType =
  | 'PASSWORD_RESET'
  | 'PASSWORD_CHANGED'
  | 'PASSWORD_RESET_SUCCESS'
  | 'EMAIL_CHANGED'
  | 'WELCOME'
  | 'INSPECTION_SCHEDULED'
  | 'INSPECTION_OVERDUE';

interface SendNotificationParams {
  recipientEmail: string;
  subject: string;
  body: string;
  html?: string;
  type: NotificationType;
}

export async function sendNotification(params: SendNotificationParams): Promise<void> {
  try {
    const response = await fetch(`${config.notificationServiceUrl}/notifications/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Service-Key': config.serviceApiKey,
      },
      body: JSON.stringify(params),
    });
    if (!response.ok) {
      console.warn(`Notification send failed: ${response.status} ${response.statusText}`);
    }
  } catch (err) {
    console.error('Failed to send notification:', err);
  }
}
