import { NextResponse } from "next/server";
import { hash } from "bcryptjs";
import {
  getPasswordResetTokenByToken,
  deletePasswordResetToken,
  getUserByEmail,
  updateUserPassword,
} from "@/lib/db";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const token = typeof body.token === "string" ? body.token.trim() : "";
    const newPassword = typeof body.newPassword === "string" ? body.newPassword : "";
    if (!token) {
      return NextResponse.json({ error: "Link không hợp lệ." }, { status: 400 });
    }
    if (newPassword.length < 6 || newPassword.length > 15) {
      return NextResponse.json({ error: "Mật khẩu mới phải từ 6 đến 15 ký tự." }, { status: 400 });
    }
    const row = await getPasswordResetTokenByToken(token);
    if (!row) {
      return NextResponse.json({ error: "Link không hợp lệ hoặc đã hết hạn." }, { status: 400 });
    }
    if (new Date() > row.expires) {
      await deletePasswordResetToken(token);
      return NextResponse.json({ error: "Link đã hết hạn. Vui lòng yêu cầu gửi lại email." }, { status: 400 });
    }
    const user = await getUserByEmail(row.email);
    if (!user) {
      await deletePasswordResetToken(token);
      return NextResponse.json({ error: "Tài khoản không tồn tại." }, { status: 400 });
    }
    const passwordHash = await hash(newPassword, 10);
    await updateUserPassword(user.id, passwordHash);
    await deletePasswordResetToken(token);
    return NextResponse.json({ ok: true });
  } catch (e) {
    if (process.env.NODE_ENV === "development") {
      console.error("[reset-password]", e);
    }
    return NextResponse.json({ error: "Có lỗi xảy ra. Vui lòng thử lại." }, { status: 500 });
  }
}
