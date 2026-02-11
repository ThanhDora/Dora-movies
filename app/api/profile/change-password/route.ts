import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getUserById, updateUserPassword } from "@/lib/db";
import { compare, hash } from "bcryptjs";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = await req.json();
  const currentPassword = typeof body.currentPassword === "string" ? body.currentPassword : "";
  const newPassword = typeof body.newPassword === "string" ? body.newPassword : "";
  if (!currentPassword || !newPassword) {
    return NextResponse.json({ error: "Nhập đầy đủ mật khẩu hiện tại và mật khẩu mới" }, { status: 400 });
  }
  if (newPassword.length < 6) {
    return NextResponse.json({ error: "Mật khẩu mới tối thiểu 6 ký tự" }, { status: 400 });
  }
  const user = await getUserById(session.user.id);
  if (!user?.password_hash) {
    return NextResponse.json({ error: "Tài khoản đăng nhập bằng mạng xã hội, không đổi mật khẩu được" }, { status: 400 });
  }
  const ok = await compare(currentPassword, user.password_hash);
  if (!ok) {
    return NextResponse.json({ error: "Mật khẩu hiện tại không đúng" }, { status: 400 });
  }
  const passwordHash = await hash(newPassword, 10);
  await updateUserPassword(session.user.id, passwordHash);
  return NextResponse.json({ ok: true });
}
