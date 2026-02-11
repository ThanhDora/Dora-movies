import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { isAdmin } from "@/lib/vip";
import { grantVipManual } from "@/lib/db";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id || !isAdmin(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const body = await req.json();
  const { userId, durationDays } = body;
  if (!userId || !durationDays || typeof durationDays !== "number") {
    return NextResponse.json({ error: "userId and durationDays required" }, { status: 400 });
  }
  try {
    await grantVipManual(userId, durationDays, session.user.id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 400 });
  }
}
