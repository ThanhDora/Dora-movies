const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_API_URL = "https://api.telegram.org/bot";

export const WELCOME_MESSAGE = `
🤖 <b>Chào mừng đến với Dora Movies Bot!</b>

Tôi sẽ gửi thông báo cho bạn về:
🚨 Lỗi hệ thống
🎬 Phim mới được thêm
👤 Người dùng mới đăng ký

Bot đã sẵn sàng hoạt động!
`.trim();

export async function sendTelegramMessage(chatId: string, text: string, parseMode: "HTML" | "Markdown" = "HTML"): Promise<boolean> {
  if (!BOT_TOKEN) return false;
  
  try {
    const url = `${TELEGRAM_API_URL}${BOT_TOKEN}/sendMessage`;
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: parseMode,
        disable_web_page_preview: false,
      }),
    });
    
    return response.ok;
  } catch {
    return false;
  }
}
