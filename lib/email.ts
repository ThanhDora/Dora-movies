import { Resend } from "resend";

const resendApiKey = process.env.RESEND_API_KEY;
const fromEmail = process.env.EMAIL_FROM || "movies@dorateam.net";
const siteName = process.env.NEXT_PUBLIC_SITE_NAME || "Dora Movies";

function getBaseUrl(): string {
  if (process.env.NEXTAUTH_URL) return process.env.NEXTAUTH_URL;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return "http://localhost:3000";
}

export async function sendVerificationEmail(email: string, token: string): Promise<boolean> {
  const url = `${getBaseUrl()}/api/verify-email?token=${encodeURIComponent(token)}`;
  const html = `
    <p>Xin chào,</p>
    <p>Bạn đã đăng ký tài khoản tại ${siteName}. Vui lòng xác minh email bằng cách nhấn vào link dưới đây:</p>
    <p><a href="${url}" style="color:#ff2a14;font-weight:bold">Xác minh email</a></p>
    <p>Link có hiệu lực 24 giờ. Nếu bạn không đăng ký, hãy bỏ qua email này.</p>
    <p>— ${siteName}</p>
  `;
  if (process.env.NODE_ENV === "development") {
    console.log("[Email] Verification link (dán vào trình duyệt nếu không nhận mail):", url);
  }
  if (!resendApiKey) {
    if (process.env.NODE_ENV === "development") {
      console.warn("[Email] RESEND_API_KEY chưa cấu hình hoặc rỗng — không gửi email thật.");
    }
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
      if (process.env.NODE_ENV === "development") {
        console.error("[Email] Verification send failed:", JSON.stringify(error, null, 2));
      }
      return false;
    }
    if (process.env.NODE_ENV === "development" && data?.id) {
      console.log("[Email] Verification email sent, Resend id:", data.id);
    }
    return true;
  } catch (err) {
    if (process.env.NODE_ENV === "development") {
      console.error("[Email] Verification send error:", err);
    }
    return false;
  }
}

export async function sendPasswordResetEmail(email: string, token: string): Promise<boolean> {
  const url = `${getBaseUrl()}/reset-password?token=${encodeURIComponent(token)}`;
  const html = `
    <p>Xin chào,</p>
    <p>Bạn đã yêu cầu đặt lại mật khẩu tại ${siteName}. Nhấn vào link dưới đây để đặt mật khẩu mới:</p>
    <p><a href="${url}" style="color:#e6b800;font-weight:bold">Đặt lại mật khẩu</a></p>
    <p>Link có hiệu lực 1 giờ. Nếu không phải bạn yêu cầu, hãy bỏ qua email này.</p>
    <p>— ${siteName}</p>
  `;
  if (process.env.NODE_ENV === "development") {
    console.log("[Email] Password reset link:", url);
  }
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
    if (error && process.env.NODE_ENV === "development") {
      console.error("[Email] Password reset send failed:", JSON.stringify(error, null, 2));
    }
    return !error;
  } catch (err) {
    if (process.env.NODE_ENV === "development") {
      console.error("[Email] Password reset error:", err);
    }
    return false;
  }
}

export async function sendLoginNotificationEmail(email: string): Promise<boolean> {
  const time = new Date().toLocaleString("vi-VN");
  const html = `
    <p>Xin chào,</p>
    <p>Bạn vừa đăng nhập vào tài khoản ${siteName} lúc <strong>${time}</strong>.</p>
    <p>Nếu không phải bạn, vui lòng đổi mật khẩu ngay.</p>
    <p>— ${siteName}</p>
  `;
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
    if (error && process.env.NODE_ENV === "development") {
      console.error("[Email] Login notification failed:", JSON.stringify(error, null, 2));
    }
    return !error;
  } catch (err) {
    if (process.env.NODE_ENV === "development") {
      console.error("[Email] Login notification error:", err);
    }
    return false;
  }
}
