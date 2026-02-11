import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { isAdmin } from "@/lib/vip";
import { createUserAsAdmin } from "@/lib/db";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.role || !isAdmin(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const body = await req.json();
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const name = typeof body.name === "string" ? body.name.trim() || undefined : undefined;
  if (!email) {
    return NextResponse.json({ error: "email required" }, { status: 400 });
  }
  try {
    await createUserAsAdmin({ email, name, role: "free" });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 400 });
  }
}
