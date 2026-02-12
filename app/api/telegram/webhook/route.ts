import { NextResponse } from "next/server";

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_API_URL = "https://api.telegram.org/bot";

async function sendTelegramMessage(chatId: string, text: string, parseMode: "HTML" | "Markdown" = "HTML"): Promise<boolean> {
  if (!BOT_TOKEN) {
    console.error("[Telegram Webhook] BOT_TOKEN missing");
    return false;
  }
  
  try {
    const url = `${TELEGRAM_API_URL}${BOT_TOKEN}/sendMessage`;
    console.log("[Telegram Webhook] Sending message to chat:", chatId);
    console.log("[Telegram Webhook] Message length:", text.length);
    
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
    
    console.log("[Telegram Webhook] Response status:", response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error("[Telegram Webhook] Send message failed:", errorText);
      return false;
    }
    
    const result = await response.json();
    console.log("[Telegram Webhook] Send message success:", result.ok);
    return true;
  } catch (err) {
    console.error("[Telegram Webhook] Send message error:", err);
    return false;
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    console.log("[Telegram Webhook] Received update:", JSON.stringify(body, null, 2));
    
    const message = body.message;
    if (!message) {
      console.log("[Telegram Webhook] No message in update");
      return NextResponse.json({ ok: true });
    }
    
    const chatId = message.chat?.id;
    const text = message.text;
    const from = message.from;
    
    console.log("[Telegram Webhook] Message:", { chatId, text, from: from?.username || from?.first_name });
    
    if (!chatId) {
      console.log("[Telegram Webhook] No chatId in message");
      return NextResponse.json({ ok: true });
    }
    
    if (text === "/start" || text?.startsWith("/start")) {
      const welcomeMessage = `
🤖 <b>Chào mừng đến với Dora Movies Bot!</b>

Tôi sẽ gửi thông báo cho bạn về:
🚨 Lỗi hệ thống
🎬 Phim mới được thêm
👤 Người dùng mới đăng ký

Bot đã sẵn sàng hoạt động!
      `.trim();
      
      const sent = await sendTelegramMessage(String(chatId), welcomeMessage);
      console.log("[Telegram Webhook] Sent /start response to chat:", chatId, "Success:", sent);
    } else if (text) {
      console.log("[Telegram Webhook] Received other message:", text);
    }
    
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[Telegram Webhook] Error:", e);
    return NextResponse.json({ ok: true });
  }
}

export async function GET(req: Request) {
  return NextResponse.json({ message: "Telegram webhook endpoint" });
}
