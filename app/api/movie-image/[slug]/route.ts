import { NextResponse } from "next/server";

const BASE = process.env.NEXT_PUBLIC_API_URL;

function cdnMovieUrl(cdnBase: string, filename?: string): string {
  if (!filename) return "";
  if (filename.startsWith("http")) return filename;
  return `${cdnBase}/uploads/movies/${filename}`;
}

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
    const cdn = data?.data?.APP_DOMAIN_CDN_IMAGE || "";
    const thumb = data?.data?.item?.thumb_url;
    const poster = data?.data?.item?.poster_url;
    const image = thumb || poster;

    if (!image || !cdn) {
      return NextResponse.json({ error: "Image not found" }, { status: 404 });
    }

    const imageUrl = cdnMovieUrl(cdn, image);
    return NextResponse.json({ imageUrl });
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
