import { Resend } from "resend";

const resendApiKey = process.env.RESEND_API_KEY;
const fromEmail = process.env.EMAIL_FROM || "movies@dorateam.net";
const siteName = process.env.NEXT_PUBLIC_SITE_NAME || "Dora Movies";

function getBaseUrl(): string {
  if (process.env.NEXTAUTH_URL) return process.env.NEXTAUTH_URL;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return "http://localhost:3000";
}

function getEmailTemplate(content: string, buttonText?: string, buttonUrl?: string): string {
  return `
<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${siteName}</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #0a0a0c;">
  <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #0a0a0c; padding: 20px;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" style="max-width: 600px; width: 100%; border-collapse: collapse; background-color: #1a1a1f; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);">
          <tr>
            <td style="background: linear-gradient(135deg, #e6b800 0%, #d4a800 100%); padding: 40px 30px; text-align: center;">
              <h1 style="margin: 0; color: #0a0a0c; font-size: 28px; font-weight: 700; letter-spacing: -0.5px;">${siteName}</h1>
            </td>
          </tr>
          <tr>
            <td style="padding: 40px 30px;">
              <div style="color: #e0e0e0; font-size: 16px; line-height: 1.6;">
                ${content}
              </div>
              ${buttonText && buttonUrl ? `
              <table role="presentation" style="width: 100%; margin: 30px 0;">
                <tr>
                  <td align="center">
                    <a href="${buttonUrl}" style="display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #e6b800 0%, #d4a800 100%); color: #0a0a0c; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; transition: all 0.3s ease;">${buttonText}</a>
                  </td>
                </tr>
              </table>
              ` : ''}
            </td>
          </tr>
          <tr>
            <td style="padding: 30px; background-color: #151518; border-top: 1px solid #2a2a2f;">
              <p style="margin: 0; color: #888; font-size: 14px; text-align: center; line-height: 1.5;">
                Email này được gửi tự động từ hệ thống ${siteName}.<br>
                Nếu bạn không thực hiện hành động này, vui lòng bỏ qua email này.
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
    <p style="margin: 0 0 20px 0; color: #e0e0e0; font-size: 18px; font-weight: 600;">Xin chào!</p>
    <p style="margin: 0 0 20px 0; color: #c0c0c0;">Cảm ơn bạn đã đăng ký tài khoản tại <strong style="color: #e6b800;">${siteName}</strong>.</p>
    <p style="margin: 0 0 20px 0; color: #c0c0c0;">Để hoàn tất quá trình đăng ký, vui lòng xác minh địa chỉ email của bạn bằng cách nhấn vào nút bên dưới:</p>
    <p style="margin: 20px 0; color: #888; font-size: 14px;">⚠️ Link xác minh có hiệu lực trong <strong style="color: #e6b800;">24 giờ</strong>. Sau thời gian này, bạn sẽ cần yêu cầu gửi lại email xác minh.</p>
  `;
  const html = getEmailTemplate(content, "Xác minh email", url);
  if (!resendApiKey) {
    return false;
  }
  try {
    const resend = new Resend(resendApiKey);
    const from = fromEmail.includes("<") ? fromEmail : `${siteName} <${fromEmail}>`;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
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
    <p style="margin: 0 0 20px 0; color: #e0e0e0; font-size: 18px; font-weight: 600;">Xin chào!</p>
    <p style="margin: 0 0 20px 0; color: #c0c0c0;">Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản của bạn tại <strong style="color: #e6b800;">${siteName}</strong>.</p>
    <p style="margin: 0 0 20px 0; color: #c0c0c0;">Nhấn vào nút bên dưới để tạo mật khẩu mới:</p>
    <p style="margin: 20px 0; color: #888; font-size: 14px;">⚠️ Link đặt lại mật khẩu có hiệu lực trong <strong style="color: #e6b800;">1 giờ</strong>. Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng bỏ qua email này và mật khẩu của bạn sẽ không thay đổi.</p>
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

export async function sendLoginNotificationEmail(email: string): Promise<boolean> {
  const time = new Date().toLocaleString("vi-VN", {
    timeZone: "Asia/Ho_Chi_Minh",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
  const content = `
    <p style="margin: 0 0 20px 0; color: #e0e0e0; font-size: 18px; font-weight: 600;">Thông báo đăng nhập</p>
    <p style="margin: 0 0 20px 0; color: #c0c0c0;">Chúng tôi ghi nhận một lần đăng nhập vào tài khoản của bạn tại <strong style="color: #e6b800;">${siteName}</strong>.</p>
    <div style="background-color: #151518; border-left: 4px solid #e6b800; padding: 16px 20px; margin: 20px 0; border-radius: 4px;">
      <p style="margin: 0; color: #e0e0e0; font-size: 16px;"><strong style="color: #e6b800;">Thời gian:</strong> ${time}</p>
    </div>
    <p style="margin: 20px 0; color: #888; font-size: 14px;">⚠️ Nếu bạn không thực hiện đăng nhập này, vui lòng <strong style="color: #e6b800;">đổi mật khẩu ngay lập tức</strong> để bảo vệ tài khoản của bạn.</p>
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
