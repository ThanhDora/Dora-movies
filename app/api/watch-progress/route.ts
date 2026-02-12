import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { updateWatchProgress } from "@/lib/db";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  let body: { movieSlug?: unknown; episodePath?: unknown; progressSeconds?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const movieSlug = typeof body.movieSlug === "string" ? body.movieSlug.trim() : "";
  const episodePath = body.episodePath != null ? String(body.episodePath) : null;
  const progressSeconds = typeof body.progressSeconds === "number" && body.progressSeconds >= 0 ? Math.floor(body.progressSeconds) : 0;
  if (!movieSlug) {
    return NextResponse.json({ error: "movieSlug required" }, { status: 400 });
  }
  try {
    await updateWatchProgress({
      userId: session.user.id,
      movieSlug,
      episodePath,
      progressSeconds,
    });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Failed to save progress" }, { status: 500 });
  }
}
