import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { deletePlaylist } from "@/lib/db";

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id: playlistId } = await params;
  if (!playlistId) {
    return NextResponse.json({ error: "Playlist id required" }, { status: 400 });
  }
  await deletePlaylist(session.user.id, playlistId);
  return NextResponse.json({ ok: true });
}
