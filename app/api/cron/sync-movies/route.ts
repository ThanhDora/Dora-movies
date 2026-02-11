import { NextResponse } from "next/server";
import { insertMovieApprovals } from "@/lib/db";

const BASE = process.env.NEXT_PUBLIC_API_URL;
const CRON_SECRET = process.env.CRON_SECRET;

async function fetchSlugsFromEndpoint(path: string): Promise<string[]> {
  const url = path.startsWith("http") ? path : `${BASE}${path}`;
  const res = await fetch(url, { headers: { "Content-Type": "application/json" } });
  if (!res.ok) return [];
  const data = await res.json();
  const items = data?.data?.items ?? [];
  return items.map((it: { slug?: string }) => String(it?.slug ?? "")).filter(Boolean);
}

export async function POST(req: Request) {
  const authHeader = req.headers.get("authorization");
  if (CRON_SECRET && authHeader !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const [latest, single, series] = await Promise.all([
      fetchSlugsFromEndpoint("/v1/api/danh-sach/phim-moi-cap-nhat?page=1"),
      fetchSlugsFromEndpoint("/v1/api/danh-sach/phim-le?page=1"),
      fetchSlugsFromEndpoint("/v1/api/danh-sach/phim-bo?page=1"),
    ]);
    const allSlugs = [...new Set([...latest, ...single, ...series])];
    const inserted = await insertMovieApprovals(allSlugs, "doramovies");
    return NextResponse.json({ ok: true, inserted, total: allSlugs.length });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Sync failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
