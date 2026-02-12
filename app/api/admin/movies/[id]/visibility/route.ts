import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { isAdmin } from "@/lib/vip";
import { updateMovieVisibility } from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id || !isAdmin(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const { id } = await params;
  let isVisible = false;
  try {
    const body = await req.json();
    isVisible = Boolean(body.isVisible);
    await updateMovieVisibility(id, isVisible);
    revalidatePath("/", "layout");
    revalidatePath("/catalog");
    revalidatePath("/danh-sach");
    revalidatePath("/phim", "layout");
    return NextResponse.json({ ok: true, isVisible });
  } catch (e) {
    const errorMsg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: errorMsg }, { status: 400 });
  }
}
