import { Resend } from "resend";

const resendApiKey = process.env.RESEND_API_KEY;
const fromEmail = process.env.EMAIL_FROM || "movies@dorateam.net";
const siteName = process.env.NEXT_PUBLIC_SITE_NAME || "Dora Movies";

function getBaseUrl(): string {
  if (process.env.NEXTAUTH_URL) return process.env.NEXTAUTH_URL;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return "http://localhost:3000";
}

// Palette email (tương thích client, inline-only) — accent đỏ đồng bộ với site
const EMAIL = {
  bg: "#0c0c0e",
  card: "#16161a",
  cardBorder: "#25252a",
  accent: "#ff2a14",
  accentDark: "#e02512",
  text: "#e4e4e7",
  textMuted: "#a1a1aa",
  textFooter: "#71717a",
  danger: "#f87171",
} as const;

function getEmailTemplate(content: string, buttonText?: string, buttonUrl?: string): string {
  return `
<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>${siteName}</title>
  <!--[if mso]>
  <noscript><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript>
  <![endif]-->
</head>
<body style="margin:0;padding:0;background-color:${EMAIL.bg};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;-webkit-font-smoothing:antialiased;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:${EMAIL.bg};">
    <tr>
      <td align="center" style="padding:32px 16px;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:520px;width:100%;background-color:${EMAIL.card};border:1px solid ${EMAIL.cardBorder};border-radius:12px;overflow:hidden;">
          <!-- Header -->
          <tr>
            <td style="padding:28px 24px 24px;text-align:center;border-bottom:1px solid ${EMAIL.cardBorder};">
              <h1 style="margin:0;color:${EMAIL.accent};font-size:24px;font-weight:700;letter-spacing:-0.02em;">${siteName}</h1>
              <p style="margin:6px 0 0;color:${EMAIL.textMuted};font-size:13px;font-weight:400;">Email từ hệ thống</p>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:28px 24px;">
              <div style="color:${EMAIL.text};font-size:15px;line-height:1.65;">
                ${content}
              </div>
              ${buttonText && buttonUrl ? `
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-top:28px;">
                <tr>
                  <td align="center">
                    <a href="${buttonUrl}" style="display:inline-block;padding:14px 28px;background-color:${EMAIL.accent};color:#fff;text-decoration:none;border-radius:8px;font-weight:600;font-size:15px;">${buttonText}</a>
                  </td>
                </tr>
              </table>
              ` : ""}
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding:20px 24px;background-color:${EMAIL.bg};border-top:1px solid ${EMAIL.cardBorder};">
              <p style="margin:0;color:${EMAIL.textFooter};font-size:12px;text-align:center;line-height:1.5;">
                Email tự động từ ${siteName}. Nếu không phải bạn thực hiện, hãy bỏ qua.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

export async function sendVerificationEmail(email: string, token: string): Promise<boolean> {
  const url = `${getBaseUrl()}/api/verify-email?token=${encodeURIComponent(token)}`;
  const content = `
    <p style="margin:0 0 16px 0;color:${EMAIL.text};font-size:17px;font-weight:600;">Xin chào!</p>
    <p style="margin:0 0 16px 0;color:${EMAIL.text};">Cảm ơn bạn đã đăng ký tại <strong style="color:${EMAIL.accent};">${siteName}</strong>.</p>
    <p style="margin:0 0 16px 0;color:${EMAIL.text};">Nhấn nút bên dưới để xác minh địa chỉ email của bạn:</p>
    <p style="margin:16px 0 0;color:${EMAIL.textMuted};font-size:13px;">Link xác minh có hiệu lực <strong style="color:${EMAIL.accent};">24 giờ</strong>. Sau đó bạn cần yêu cầu gửi lại email.</p>
  `;
  const html = getEmailTemplate(content, "Xác minh email", url);
  if (!resendApiKey) {
    return false;
  }
  try {
    const resend = new Resend(resendApiKey);
    const from = fromEmail.includes("<") ? fromEmail : `${siteName} <${fromEmail}>`;
    const { data, error } = await resend.emails.send({
      from,
      to: [email],
      subject: `Xác minh email - ${siteName}`,
      html,
    });
    if (error) {
      return false;
    }
    return true;
  } catch (err) {
    return false;
  }
}

export async function sendPasswordResetEmail(email: string, token: string): Promise<boolean> {
  const url = `${getBaseUrl()}/reset-password?token=${encodeURIComponent(token)}`;
  const content = `
    <p style="margin:0 0 16px 0;color:${EMAIL.text};font-size:17px;font-weight:600;">Xin chào!</p>
    <p style="margin:0 0 16px 0;color:${EMAIL.text};">Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản tại <strong style="color:${EMAIL.accent};">${siteName}</strong>.</p>
    <p style="margin:0 0 16px 0;color:${EMAIL.text};">Nhấn nút bên dưới để tạo mật khẩu mới:</p>
    <p style="margin:16px 0 0;color:${EMAIL.textMuted};font-size:13px;">Link có hiệu lực <strong style="color:${EMAIL.accent};">1 giờ</strong>. Nếu không phải bạn yêu cầu, hãy bỏ qua email này.</p>
  `;
  const html = getEmailTemplate(content, "Đặt lại mật khẩu", url);
  if (!resendApiKey) return false;
  try {
    const resend = new Resend(resendApiKey);
    const from = fromEmail.includes("<") ? fromEmail : `${siteName} <${fromEmail}>`;
    const { error } = await resend.emails.send({
      from,
      to: [email],
      subject: `Đặt lại mật khẩu - ${siteName}`,
      html,
    });
    return !error;
  } catch (err) {
    return false;
  }
}

/** Format thời gian theo múi giờ Việt Nam (UTC+7). */
function formatVietnamTime(date: Date): string {
  try {
    const s = new Intl.DateTimeFormat("vi-VN", {
      timeZone: "Asia/Ho_Chi_Minh",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).format(date);
    if (s) return s;
  } catch {
    /* fallback bên dưới */
  }
  // Fallback: tính UTC+7 thủ công (server có thể thiếu ICU timezone)
  const d = new Date(date.getTime() + 7 * 60 * 60 * 1000);
  const day = d.getUTCDate();
  const month = d.getUTCMonth() + 1;
  const year = d.getUTCFullYear();
  const hour = d.getUTCHours();
  const minute = d.getUTCMinutes();
  const monthNames = "tháng 1,tháng 2,tháng 3,tháng 4,tháng 5,tháng 6,tháng 7,tháng 8,tháng 9,tháng 10,tháng 11,tháng 12".split(",");
  return `${day} ${monthNames[month - 1]} ${year}, ${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

export async function sendLoginNotificationEmail(email: string): Promise<boolean> {
  const time = formatVietnamTime(new Date());
  const content = `
    <p style="margin:0 0 16px 0;color:${EMAIL.text};font-size:17px;font-weight:600;">Thông báo đăng nhập</p>
    <p style="margin:0 0 16px 0;color:${EMAIL.text};">Có một lần đăng nhập vào tài khoản của bạn tại <strong style="color:${EMAIL.accent};">${siteName}</strong>.</p>
    <div style="background-color:${EMAIL.bg};border-left:4px solid ${EMAIL.accent};padding:14px 18px;margin:18px 0;border-radius:6px;">
      <p style="margin:0;color:${EMAIL.text};font-size:15px;"><strong style="color:${EMAIL.accent};">Thời gian:</strong> ${time}</p>
    </div>
    <p style="margin:16px 0 0;color:${EMAIL.textMuted};font-size:13px;">Nếu không phải bạn, hãy <strong style="color:${EMAIL.danger};">đổi mật khẩu ngay</strong> để bảo vệ tài khoản.</p>
  `;
  const html = getEmailTemplate(content);
  if (!resendApiKey) return false;
  try {
    const resend = new Resend(resendApiKey);
    const from = fromEmail.includes("<") ? fromEmail : `${siteName} <${fromEmail}>`;
    const { error } = await resend.emails.send({
      from,
      to: [email],
      subject: `Đăng nhập thành công - ${siteName}`,
      html,
    });
    return !error;
  } catch (err) {
    return false;
  }
}
