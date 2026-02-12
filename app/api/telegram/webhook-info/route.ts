import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { isAdmin } from "@/lib/vip";

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_API_URL = "https://api.telegram.org/bot";

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id || !isAdmin(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (!BOT_TOKEN) {
    return NextResponse.json({ error: "TELEGRAM_BOT_TOKEN not configured" }, { status: 400 });
  }

  try {
    const url = `${TELEGRAM_API_URL}${BOT_TOKEN}/getWebhookInfo`;
    const response = await fetch(url);
    const result = await response.json();
    
    return NextResponse.json({ 
      ok: true,
      webhookInfo: result,
      currentUrl: process.env.NEXTAUTH_URL || process.env.VERCEL_URL 
        ? `https://${process.env.VERCEL_URL || new URL(process.env.NEXTAUTH_URL || "").hostname}`
        : "http://localhost:3000",
    });
  } catch (e) {
    return NextResponse.json({ 
      error: e instanceof Error ? e.message : "Unknown error" 
    }, { status: 500 });
  }
}
