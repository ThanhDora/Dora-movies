import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { isAdmin } from "@/lib/vip";

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_API_URL = "https://api.telegram.org/bot";

async function sendTelegramMessage(chatId: string, text: string): Promise<boolean> {
  if (!BOT_TOKEN) return false;
  
  try {
    const url = `${TELEGRAM_API_URL}${BOT_TOKEN}/sendMessage`;
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: "HTML",
      }),
    });
    
    return response.ok;
  } catch {
    return false;
  }
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id || !isAdmin(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (!BOT_TOKEN) {
    return NextResponse.json({ error: "TELEGRAM_BOT_TOKEN not configured" }, { status: 400 });
  }

  try {
    const url = `${TELEGRAM_API_URL}${BOT_TOKEN}/getUpdates`;
    console.log("[Telegram Polling] Fetching updates...");
    
    const response = await fetch(url, { 
      signal: AbortSignal.timeout(5000),
      headers: { "Content-Type": "application/json" }
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error("[Telegram Polling] Failed to get updates:", errorText);
      return NextResponse.json({ 
        ok: false,
        error: `Failed to get updates: ${response.status}` 
      }, { status: 500 });
    }
    
    const data = await response.json();
    console.log("[Telegram Polling] Updates response:", JSON.stringify(data, null, 2));
    
    if (!data.ok || !data.result || data.result.length === 0) {
      return NextResponse.json({ 
        ok: true, 
        message: "Không có tin nhắn mới",
        processed: 0,
        updates: []
      });
    }

    let processed = 0;
    let lastUpdateId = 0;

    for (const update of data.result) {
      lastUpdateId = update.update_id;
      const message = update.message;
      
      if (!message || !message.chat?.id) continue;
      
      const chatId = String(message.chat.id);
      const text = message.text;
      
      console.log("[Telegram Polling] Processing update:", { updateId: update.update_id, chatId, text });
      
      if (text === "/start" || text?.startsWith("/start")) {
        const welcomeMessage = `
🤖 <b>Chào mừng đến với Dora Movies Bot!</b>

Tôi sẽ gửi thông báo cho bạn về:
🚨 Lỗi hệ thống
🎬 Phim mới được thêm
👤 Người dùng mới đăng ký

Bot đã sẵn sàng hoạt động!
        `.trim();
        
        const sent = await sendTelegramMessage(chatId, welcomeMessage);
        console.log("[Telegram Polling] Sent response to chat:", chatId, "Success:", sent);
        processed++;
      }
    }

    if (lastUpdateId > 0) {
      const ackUrl = `${TELEGRAM_API_URL}${BOT_TOKEN}/getUpdates?offset=${lastUpdateId + 1}`;
      await fetch(ackUrl).catch(() => {});
      console.log("[Telegram Polling] Acknowledged updates up to:", lastUpdateId);
    }

    return NextResponse.json({ 
      ok: true, 
      message: `Đã xử lý ${processed} tin nhắn`,
      processed,
      totalUpdates: data.result.length
    });
  } catch (e) {
    console.error("[Telegram Polling] Error:", e);
    return NextResponse.json({ 
      error: e instanceof Error ? e.message : "Unknown error" 
    }, { status: 500 });
  }
}
