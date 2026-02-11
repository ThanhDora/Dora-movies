import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { isAdmin } from "@/lib/vip";
import { createUserAsAdmin } from "@/lib/db";
import type { UserRole } from "@/types/db";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.role || !isAdmin(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const body = await req.json();
  const { email, name, role } = body;
  if (!email || typeof email !== "string") {
    return NextResponse.json({ error: "email required" }, { status: 400 });
  }
  const r = (role === "super_admin" ? "super_admin" : "admin") as UserRole;
  try {
    await createUserAsAdmin({ email: email.trim().toLowerCase(), name: name?.trim(), role: r });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 400 });
  }
}
