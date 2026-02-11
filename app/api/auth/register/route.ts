import { NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { randomBytes } from "crypto";
import { registerUser, createVerificationToken } from "@/lib/db";
import { sendVerificationEmail } from "@/lib/email";

function toUserMessage(e: unknown): string {
  const msg = e instanceof Error ? e.message : "";
  if (msg.includes("Email already registered")) return "Email này đã được đăng ký.";
  if (msg.includes("DATABASE_URL") || msg.includes("Can't reach database") || msg.includes("host:5432")) {
    return "Chưa kết nối được database. Trên Vercel: vào Settings → Environment Variables, thêm DATABASE_URL là connection string Postgres (dạng postgresql://... từ Vercel Postgres / Neon / Supabase).";
  }
  return msg || "Đăng ký thất bại. Vui lòng thử lại.";
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, password, name } = body;
    if (!email || typeof email !== "string" || !password || typeof password !== "string") {
      return NextResponse.json({ error: "Vui lòng nhập email và mật khẩu." }, { status: 400 });
    }
    const trimmed = email.trim().toLowerCase();
    if (password.length < 6) {
      return NextResponse.json({ error: "Mật khẩu tối thiểu 6 ký tự." }, { status: 400 });
    }
    const passwordHash = await hash(password, 10);
    await registerUser({ email: trimmed, passwordHash, name: name?.trim() || null });
    const token = randomBytes(32).toString("hex");
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await createVerificationToken(trimmed, token, expires);
    const emailSent = await sendVerificationEmail(trimmed, token);
    return NextResponse.json({ ok: true, emailSent });
  } catch (e) {
    return NextResponse.json({ error: toUserMessage(e) }, { status: 400 });
  }
}
