import { NextResponse } from "next/server";
import { sendErrorNotification } from "@/lib/telegram";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { error, stack, componentStack, context } = body;
    await sendErrorNotification(error || "Unknown error", context || "Client Error");
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
