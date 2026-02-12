import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { isAdmin } from "@/lib/vip";
import { sendMessage } from "@/lib/telegram";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id || !isAdmin(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const result = await sendMessage("🤖 <b>Test bot Telegram</b>\n\nBot đang hoạt động bình thường!");
    if (result) {
      return NextResponse.json({ ok: true, message: "Đã gửi tin nhắn test thành công" });
    } else {
      return NextResponse.json({ ok: false, error: "Không thể gửi tin nhắn. Kiểm tra TELEGRAM_BOT_TOKEN và TELEGRAM_CHAT_ID trong .env" }, { status: 500 });
    }
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Unknown error" }, { status: 500 });
  }
}
