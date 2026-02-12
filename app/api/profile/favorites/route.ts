import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getFavorites, addFavorite, removeFavorite } from "@/lib/db";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const list = await getFavorites(session.user.id);
  return NextResponse.json({ items: list });
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  let body: { movieSlug?: unknown; movieTitle?: unknown; posterUrl?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const movieSlug = typeof body.movieSlug === "string" ? body.movieSlug.trim() : "";
  if (!movieSlug) {
    return NextResponse.json({ error: "movieSlug required" }, { status: 400 });
  }
  const movieTitle = typeof body.movieTitle === "string" ? body.movieTitle : null;
  const posterUrl = typeof body.posterUrl === "string" ? body.posterUrl : null;
  await addFavorite({ userId: session.user.id, movieSlug, movieTitle, posterUrl });
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const u = new URL(req.url);
  const movieSlug = u.searchParams.get("movieSlug")?.trim() ?? "";
  if (!movieSlug) {
    return NextResponse.json({ error: "movieSlug required" }, { status: 400 });
  }
  await removeFavorite(session.user.id, movieSlug);
  return NextResponse.json({ ok: true });
}
