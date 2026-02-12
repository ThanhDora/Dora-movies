const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const CHAT_ID = process.env.TELEGRAM_CHAT_ID;

const TELEGRAM_API_URL = "https://api.telegram.org/bot";

export async function sendMessage(text: string, parseMode: "HTML" | "Markdown" = "HTML"): Promise<boolean> {
  console.log("[Telegram] sendMessage called");
  console.log("[Telegram] BOT_TOKEN:", BOT_TOKEN ? `${BOT_TOKEN.substring(0, 10)}...` : "MISSING");
  console.log("[Telegram] CHAT_ID:", CHAT_ID || "MISSING");
  
  if (!BOT_TOKEN || !CHAT_ID) {
    console.error("[Telegram] Missing BOT_TOKEN or CHAT_ID");
    return false;
  }

  try {
    const url = `${TELEGRAM_API_URL}${BOT_TOKEN}/sendMessage`;
    console.log("[Telegram] Sending to URL:", url.replace(BOT_TOKEN, "BOT_TOKEN_HIDDEN"));
    console.log("[Telegram] Message length:", text.length);
    
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: CHAT_ID,
        text,
        parse_mode: parseMode,
        disable_web_page_preview: false,
      }),
    });

    console.log("[Telegram] Response status:", response.status, response.statusText);

    if (!response.ok) {
      const error = await response.text();
      console.error("[Telegram] Send message failed:", error);
      return false;
    }

    const result = await response.json();
    console.log("[Telegram] Send message success:", result.ok ? "OK" : "FAILED");
    return true;
  } catch (err) {
    console.error("[Telegram] Send message error:", err);
    return false;
  }
}

async function sendPhoto(photoUrl: string, caption: string, parseMode: "HTML" | "Markdown" = "HTML"): Promise<boolean> {
  console.log("[Telegram] sendPhoto called");
  console.log("[Telegram] Photo URL:", photoUrl.substring(0, 50) + "...");
  
  if (!BOT_TOKEN || !CHAT_ID) {
    console.error("[Telegram] Missing BOT_TOKEN or CHAT_ID");
    return false;
  }

  try {
    const url = `${TELEGRAM_API_URL}${BOT_TOKEN}/sendPhoto`;
    console.log("[Telegram] Sending photo to URL:", url.replace(BOT_TOKEN, "BOT_TOKEN_HIDDEN"));
    
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: CHAT_ID,
        photo: photoUrl,
        caption,
        parse_mode: parseMode,
      }),
    });

    console.log("[Telegram] Photo response status:", response.status, response.statusText);

    if (!response.ok) {
      const error = await response.text();
      console.error("[Telegram] Send photo failed:", error);
      return false;
    }

    const result = await response.json();
    console.log("[Telegram] Send photo success:", result.ok ? "OK" : "FAILED");
    return true;
  } catch (err) {
    console.error("[Telegram] Send photo error:", err);
    return false;
  }
}

export async function sendErrorNotification(error: Error | string, context?: string): Promise<void> {
  console.log("[Telegram] sendErrorNotification called", { context });
  const errorMessage = error instanceof Error ? error.message : String(error);
  const errorStack = error instanceof Error ? error.stack : "";
  const timestamp = new Date().toLocaleString("vi-VN");

  const message = `
🚨 <b>Lỗi hệ thống</b>

<b>Thời gian:</b> ${timestamp}
${context ? `<b>Ngữ cảnh:</b> ${context}` : ""}

<b>Lỗi:</b>
<code>${escapeHtml(errorMessage)}</code>

${errorStack ? `<b>Stack trace:</b>\n<pre>${escapeHtml(errorStack.slice(0, 1000))}</pre>` : ""}
  `.trim();

  await sendMessage(message).catch((err) => {
    console.error("[Telegram] Failed to send error notification:", err);
  });
}

export async function sendNewMovieNotification(movie: {
  name: string;
  origin_name?: string;
  slug: string;
  image?: string;
  year?: number;
  description?: string;
}): Promise<void> {
  console.log("[Telegram] sendNewMovieNotification called", { name: movie.name, slug: movie.slug });
  const siteUrl = process.env.NEXTAUTH_URL || process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000";
  const movieUrl = `${siteUrl}/phim/${movie.slug}`;

  const caption = `
🎬 <b>Phim mới được thêm</b>

<b>Tên phim:</b> ${escapeHtml(movie.name)}
${movie.origin_name ? `<b>Tên gốc:</b> ${escapeHtml(movie.origin_name)}` : ""}
${movie.year ? `<b>Năm:</b> ${movie.year}` : ""}

<b>Xem ngay:</b> <a href="${movieUrl}">${movieUrl}</a>
  `.trim();

  if (movie.image) {
    await sendPhoto(movie.image, caption).catch((err) => {
      console.error("[Telegram] Failed to send movie photo:", err);
    });
  } else {
    await sendMessage(caption).catch((err) => {
      console.error("[Telegram] Failed to send movie message:", err);
    });
  }
}

export async function sendNewUserNotification(user: {
  email: string;
  name?: string | null;
  role?: string;
}): Promise<void> {
  console.log("[Telegram] sendNewUserNotification called", { email: user.email, name: user.name });
  const timestamp = new Date().toLocaleString("vi-VN");

  const message = `
👤 <b>Người dùng mới đăng ký</b>

<b>Thời gian:</b> ${timestamp}
<b>Email:</b> ${escapeHtml(user.email)}
${user.name ? `<b>Tên:</b> ${escapeHtml(user.name)}` : ""}
<b>Vai trò:</b> ${user.role || "free"}
  `.trim();

  await sendMessage(message).catch((err) => {
    console.error("[Telegram] Failed to send user notification:", err);
  });
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
