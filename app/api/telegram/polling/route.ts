import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { isAdmin } from "@/lib/vip";
import { sendTelegramMessage, WELCOME_MESSAGE } from "@/lib/telegram-utils";

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_API_URL = "https://api.telegram.org/bot";

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
    
    const response = await fetch(url, { 
      signal: AbortSignal.timeout(5000),
      headers: { "Content-Type": "application/json" }
    });
    
    if (!response.ok) {
      return NextResponse.json({ 
        ok: false,
        error: `Failed to get updates: ${response.status}` 
      }, { status: 500 });
    }
    
    const data = await response.json();
    
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
      
      if (text === "/start" || text?.startsWith("/start")) {
        await sendTelegramMessage(chatId, WELCOME_MESSAGE);
        processed++;
      }
    }

    if (lastUpdateId > 0) {
      const ackUrl = `${TELEGRAM_API_URL}${BOT_TOKEN}/getUpdates?offset=${lastUpdateId + 1}`;
      await fetch(ackUrl).catch(() => {});
    }

    return NextResponse.json({ 
      ok: true, 
      message: `Đã xử lý ${processed} tin nhắn`,
      processed,
      totalUpdates: data.result.length
    });
  } catch (e) {
    return NextResponse.json({ 
      error: e instanceof Error ? e.message : "Unknown error" 
    }, { status: 500 });
  }
}
