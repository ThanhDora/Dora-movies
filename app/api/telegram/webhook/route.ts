import { NextResponse } from "next/server";
import { sendTelegramMessage, WELCOME_MESSAGE } from "@/lib/telegram-utils";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const message = body.message;
    if (!message) {
      return NextResponse.json({ ok: true });
    }
    
    const chatId = message.chat?.id;
    const text = message.text;
    
    if (!chatId) {
      return NextResponse.json({ ok: true });
    }
    
    if (text === "/start" || text?.startsWith("/start")) {
      await sendTelegramMessage(String(chatId), WELCOME_MESSAGE);
    }
    
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: true });
  }
}

export async function GET() {
  return NextResponse.json({ message: "Telegram webhook endpoint" });
}
