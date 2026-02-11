import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { isAdmin } from "@/lib/vip";
import { deleteUser, getUserById } from "@/lib/db";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id || !isAdmin(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const body = await req.json();
  const userId = typeof body.userId === "string" ? body.userId : null;
  if (!userId) {
    return NextResponse.json({ error: "userId required" }, { status: 400 });
  }
  if (userId === session.user.id) {
    return NextResponse.json({ error: "Cannot delete your own account" }, { status: 400 });
  }
  const target = await getUserById(userId);
  if (target && session.user.role === "admin" && target.role === "super_admin") {
    return NextResponse.json({ error: "Admin cannot modify super_admin" }, { status: 403 });
  }
  try {
    await deleteUser(userId);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "User not found or delete failed" }, { status: 400 });
  }
}
