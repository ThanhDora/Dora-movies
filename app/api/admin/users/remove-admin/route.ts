import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { isAdmin } from "@/lib/vip";
import { getUserById, updateUserRole } from "@/lib/db";
import type { UserRole } from "@/types/db";

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
    return NextResponse.json({ error: "Cannot remove yourself" }, { status: 400 });
  }
  const target = await getUserById(userId);
  if (!target) return NextResponse.json({ error: "User not found" }, { status: 404 });
  const r = target.role as UserRole;
  if (r !== "admin" && r !== "super_admin") {
    return NextResponse.json({ error: "User is not admin" }, { status: 400 });
  }
  if (session.user.role === "admin" && r === "super_admin") {
    return NextResponse.json({ error: "Admin cannot modify super_admin" }, { status: 403 });
  }
  await updateUserRole(userId, "free");
  return NextResponse.json({ ok: true });
}
