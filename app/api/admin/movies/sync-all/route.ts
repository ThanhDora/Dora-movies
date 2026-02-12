import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { isAdmin } from "@/lib/vip";
import { upsertMovieVisibility, clearApprovedSlugsCache } from "@/lib/db";

const BASE = process.env.NEXT_PUBLIC_API_URL;

async function fetchAllSlugsFromEndpoint(path: string, maxPages = 10): Promise<string[]> {
  const allSlugs: string[] = [];
  for (let page = 1; page <= maxPages; page++) {
    const url = path.startsWith("http") ? path : `${BASE}${path}?page=${page}`;
    try {
      const res = await fetch(url, { headers: { "Content-Type": "application/json" } });
      if (!res.ok) break;
      const data = await res.json();
      const items = data?.data?.items ?? [];
      if (items.length === 0) break;
      const slugs = items.map((it: { slug?: string }) => String(it?.slug ?? "")).filter(Boolean);
      allSlugs.push(...slugs);
      const pagination = data?.data?.params?.pagination;
      if (pagination && page >= pagination.totalItems / pagination.totalItemsPerPage) break;
    } catch {
      break;
    }
  }
  return allSlugs;
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id || !isAdmin(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const [latest, single, series] = await Promise.all([
      fetchAllSlugsFromEndpoint("/v1/api/danh-sach/phim-moi-cap-nhat"),
      fetchAllSlugsFromEndpoint("/v1/api/danh-sach/phim-le"),
      fetchAllSlugsFromEndpoint("/v1/api/danh-sach/phim-bo"),
    ]);
    const allSlugs = [...new Set([...latest, ...single, ...series])];
    
    let synced = 0;
    for (const slug of allSlugs) {
      try {
        await upsertMovieVisibility(slug, true, null);
        synced++;
      } catch (e) {
        if (process.env.NODE_ENV === "development") {
          console.error(`[sync-all] Error syncing ${slug}:`, e);
        }
      }
    }
    
    clearApprovedSlugsCache();
    return NextResponse.json({
      ok: true,
      synced,
      total: allSlugs.length,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Sync failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
