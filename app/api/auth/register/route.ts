import { NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { registerUser } from "@/lib/db";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, password, name } = body;
    if (!email || typeof email !== "string" || !password || typeof password !== "string") {
      return NextResponse.json({ error: "Email and password required" }, { status: 400 });
    }
    const trimmed = email.trim().toLowerCase();
    if (password.length < 6) {
      return NextResponse.json({ error: "Password at least 6 characters" }, { status: 400 });
    }
    const passwordHash = await hash(password, 10);
    await registerUser({ email: trimmed, passwordHash, name: name?.trim() || null });
    return NextResponse.json({ ok: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Registration failed";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
