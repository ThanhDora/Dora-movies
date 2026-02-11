import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { updateUserImage } from "@/lib/db";

const MAX_SIZE = 400 * 1024;

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const body = await req.json();
    const { image } = body;
    if (typeof image !== "string") {
      return NextResponse.json({ error: "image required" }, { status: 400 });
    }
    if (!image.startsWith("data:image/")) {
      return NextResponse.json({ error: "Invalid image format" }, { status: 400 });
    }
    if (image.length > MAX_SIZE) {
      return NextResponse.json({ error: "Image too large" }, { status: 400 });
    }
    await updateUserImage(session.user.id, image);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 400 });
  }
}
