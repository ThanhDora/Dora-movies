import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { isAdmin } from "@/lib/vip";

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
    let baseUrl = process.env.NEXTAUTH_URL;
    if (!baseUrl && process.env.VERCEL_URL) {
      baseUrl = `https://${process.env.VERCEL_URL}`;
    }
    if (!baseUrl) {
      return NextResponse.json({ 
        error: "NEXTAUTH_URL chưa được cấu hình. Trên localhost, vui lòng:\n1. Deploy lên Vercel và setup webhook\n2. Hoặc dùng /api/telegram/polling để check tin nhắn thủ công",
        suggestion: "Gọi POST /api/telegram/polling để check tin nhắn mà không cần webhook"
      }, { status: 400 });
    }
    
    const webhookUrl = `${baseUrl}/api/telegram/webhook`;
    
    console.log("[Telegram] Setting webhook to:", webhookUrl);
    
    const url = `${TELEGRAM_API_URL}${BOT_TOKEN}/setWebhook`;
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        url: webhookUrl,
        allowed_updates: ["message"],
      }),
    });

    const result = await response.json();
    console.log("[Telegram] Webhook setup result:", result);

    if (result.ok) {
      return NextResponse.json({ 
        ok: true, 
        message: "Webhook đã được thiết lập thành công",
        webhookUrl,
        result 
      });
    } else {
      return NextResponse.json({ 
        ok: false, 
        error: result.description || "Failed to set webhook",
        result 
      }, { status: 400 });
    }
  } catch (e) {
    console.error("[Telegram] Setup webhook error:", e);
    return NextResponse.json({ 
      error: e instanceof Error ? e.message : "Unknown error" 
    }, { status: 500 });
  }
}
