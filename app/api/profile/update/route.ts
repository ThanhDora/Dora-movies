import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { updateUserName } from "@/lib/db";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  let body: { name?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const name = typeof body.name === "string" ? body.name.trim() : "";
  try {
    await updateUserName(session.user.id, name || null);
    return NextResponse.json({ ok: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Lỗi cập nhật";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
