const BRAND = {
  name: 'TZW LTD FEMS',
  tagline: 'Fire Extinguisher Management System',
  primary: '#c0392b',
  primaryDark: '#922b21',
  text: '#1f2937',
  muted: '#6b7280',
  background: '#f3f4f6',
  card: '#ffffff',
};

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function renderEmailLayout(options: {
  title: string;
  preheader?: string;
  bodyHtml: string;
  footerNote?: string;
}): string {
  const preheader = options.preheader ? escapeHtml(options.preheader) : '';
  const footer = options.footerNote ?? 'This is an automated message from TZW LTD FEMS. Please do not reply to this email.';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(options.title)}</title>
</head>
<body style="margin:0;padding:0;background-color:${BRAND.background};font-family:Arial,Helvetica,sans-serif;color:${BRAND.text};">
  <span style="display:none;max-height:0;overflow:hidden;opacity:0;">${preheader}</span>
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:${BRAND.background};padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;background:${BRAND.card};border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
          <tr>
            <td style="background:linear-gradient(135deg,${BRAND.primary},${BRAND.primaryDark});padding:28px 32px;text-align:center;">
              <div style="font-size:24px;font-weight:700;color:#ffffff;letter-spacing:0.5px;">${BRAND.name}</div>
              <div style="font-size:13px;color:rgba(255,255,255,0.85);margin-top:6px;">${BRAND.tagline}</div>
            </td>
          </tr>
          <tr>
            <td style="padding:32px;">
              ${options.bodyHtml}
            </td>
          </tr>
          <tr>
            <td style="padding:20px 32px 28px;border-top:1px solid #e5e7eb;background:#fafafa;">
              <p style="margin:0;font-size:12px;line-height:1.6;color:${BRAND.muted};">${escapeHtml(footer)}</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function ctaButton(label: string, href: string): string {
  return `<table role="presentation" cellspacing="0" cellpadding="0" style="margin:28px auto 0;">
    <tr>
      <td style="border-radius:8px;background:${BRAND.primary};">
        <a href="${escapeHtml(href)}" style="display:inline-block;padding:14px 28px;font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;">${escapeHtml(label)}</a>
      </td>
    </tr>
  </table>`;
}

export function passwordResetOtpEmail(params: {
  firstName: string;
  otp: string;
  expiresMinutes: number;
}) {
  const greeting = params.firstName ? `Hi ${params.firstName},` : 'Hi,';
  const bodyHtml = `
    <h1 style="margin:0 0 12px;font-size:22px;color:${BRAND.text};">Password reset code</h1>
    <p style="margin:0 0 20px;font-size:15px;line-height:1.6;color:${BRAND.muted};">${escapeHtml(greeting)} use the verification code below to reset your password. This code expires in ${params.expiresMinutes} minutes.</p>
    <div style="text-align:center;margin:28px 0;">
      <div style="display:inline-block;padding:18px 32px;border:2px dashed ${BRAND.primary};border-radius:10px;background:#fef2f2;">
        <span style="font-size:32px;font-weight:700;letter-spacing:8px;color:${BRAND.primaryDark};font-family:'Courier New',monospace;">${escapeHtml(params.otp)}</span>
      </div>
    </div>
    <p style="margin:0;font-size:14px;line-height:1.6;color:${BRAND.muted};">Enter this code on the verification page. Do not share it with anyone — TZW LTD staff will never ask for your code.</p>
  `;

  const text = `${greeting}\n\nYour password reset verification code is: ${params.otp}\n\nThis code expires in ${params.expiresMinutes} minutes.\n\nDo not share this code with anyone.`;

  return {
    subject: 'Your password reset code - TZW LTD FEMS',
    text,
    html: renderEmailLayout({
      title: 'Password reset code',
      preheader: `Your verification code is ${params.otp}`,
      bodyHtml,
      footerNote: 'If you did not request a password reset, you can safely ignore this email.',
    }),
  };
}

export function welcomeEmail(params: { firstName: string; loginUrl: string }) {
  const greeting = params.firstName ? `Welcome, ${params.firstName}!` : 'Welcome!';
  const bodyHtml = `
    <h1 style="margin:0 0 12px;font-size:22px;color:${BRAND.text};">${escapeHtml(greeting)}</h1>
    <p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:${BRAND.muted};">Your TZW LTD Fire Extinguisher Management System account is ready. You can sign in to view extinguisher status, schedule inspections, and manage your profile.</p>
    ${ctaButton('Sign in to your account', params.loginUrl)}
    <p style="margin:24px 0 0;font-size:14px;line-height:1.6;color:${BRAND.muted};">If you have any questions, contact your TZW LTD administrator.</p>
  `;

  const text = `${greeting}\n\nYour account has been created successfully.\n\nSign in here: ${params.loginUrl}\n\nThank you for joining TZW LTD FEMS.`;

  return {
    subject: 'Welcome to TZW LTD FEMS',
    text,
    html: renderEmailLayout({
      title: 'Welcome to TZW LTD FEMS',
      preheader: 'Your account is ready — sign in to get started',
      bodyHtml,
    }),
  };
}

export function passwordResetSuccessEmail() {
  const bodyHtml = `
    <h1 style="margin:0 0 12px;font-size:22px;color:${BRAND.text};">Password reset successful</h1>
    <p style="margin:0;font-size:15px;line-height:1.6;color:${BRAND.muted};">Your password was changed successfully. You can now sign in with your new password.</p>
    <p style="margin:16px 0 0;font-size:14px;line-height:1.6;color:${BRAND.muted};">If you did not make this change, contact support immediately.</p>
  `;

  const text = 'Your password was reset successfully.\n\nIf you did not make this change, contact support immediately.';

  return {
    subject: 'Password reset successful - TZW LTD FEMS',
    text,
    html: renderEmailLayout({
      title: 'Password reset successful',
      preheader: 'Your password was changed successfully',
      bodyHtml,
    }),
  };
}
