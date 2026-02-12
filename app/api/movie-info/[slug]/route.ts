import { NextResponse } from "next/server";

const BASE = process.env.NEXT_PUBLIC_API_URL;

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    if (!BASE) {
      return NextResponse.json({ error: "API URL not configured" }, { status: 500 });
    }

    const res = await fetch(`${BASE}/v1/api/phim/${encodeURIComponent(slug)}`, {
      headers: { "Content-Type": "application/json" },
    });

    if (!res.ok) {
      return NextResponse.json({ error: "Movie not found" }, { status: 404 });
    }

    const data = await res.json();
    const item = data?.data?.item;
    if (!item) {
      return NextResponse.json({ error: "Movie data not found" }, { status: 404 });
    }

    return NextResponse.json({
      name: String(item.name || ""),
      origin_name: String(item.origin_name || ""),
    });
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
