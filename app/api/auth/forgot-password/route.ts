import { NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { getUserByEmail } from "@/lib/db";
import { createPasswordResetToken } from "@/lib/db";
import { sendPasswordResetEmail } from "@/lib/email";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    if (!email) {
      return NextResponse.json({ error: "Vui lòng nhập email." }, { status: 400 });
    }
    const user = await getUserByEmail(email);
    if (!user?.password_hash) {
      return NextResponse.json({ ok: true });
    }
    const token = randomBytes(32).toString("hex");
    const expires = new Date(Date.now() + 60 * 60 * 1000);
    await createPasswordResetToken(email, token, expires);
    await sendPasswordResetEmail(email, token);
    return NextResponse.json({ ok: true });
  } catch (e) {
    if (process.env.NODE_ENV === "development") {
      console.error("[forgot-password]", e);
    }
    return NextResponse.json({ error: "Có lỗi xảy ra. Vui lòng thử lại." }, { status: 500 });
  }
}
