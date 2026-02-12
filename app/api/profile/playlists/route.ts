import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getPlaylists, createPlaylist } from "@/lib/db";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const list = await getPlaylists(session.user.id);
  return NextResponse.json({ playlists: list });
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  let body: { name?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const name = typeof body.name === "string" ? body.name.trim() : "";
  try {
    const id = await createPlaylist(session.user.id, name || "Danh sách mới");
    return NextResponse.json({ id, ok: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Tạo danh sách thất bại.";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
