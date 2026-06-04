import { config } from '../config/env';

export async function sendNotification(params: {
  recipientEmail: string;
  subject: string;
  body: string;
  type: 'INSPECTION_SCHEDULED' | 'INSPECTION_OVERDUE';
}) {
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
    console.error('Notification failed:', err);
  }
}
