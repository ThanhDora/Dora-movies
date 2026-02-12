import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { isAdmin } from "@/lib/vip";
import { insertMovieApprovals, updateMovieApprovalStatus, getPendingMovieApprovals, clearApprovedSlugsCache } from "@/lib/db";

const BASE = process.env.NEXT_PUBLIC_API_URL;

async function fetchSlugsFromEndpoint(path: string): Promise<string[]> {
  const url = path.startsWith("http") ? path : `${BASE}${path}`;
  const res = await fetch(url, { headers: { "Content-Type": "application/json" } });
  if (!res.ok) return [];
  const data = await res.json();
  const items = data?.data?.items ?? [];
  return items.map((it: { slug?: string }) => String(it?.slug ?? "")).filter(Boolean);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id || !isAdmin(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const [latest, single, series] = await Promise.all([
      fetchSlugsFromEndpoint("/v1/api/danh-sach/phim-moi-cap-nhat?page=1"),
      fetchSlugsFromEndpoint("/v1/api/danh-sach/phim-le?page=1"),
      fetchSlugsFromEndpoint("/v1/api/danh-sach/phim-bo?page=1"),
    ]);
    const allSlugs = [...new Set([...latest, ...single, ...series])];
    
    const inserted = await insertMovieApprovals(allSlugs, "doramovies");
    
    const pendingMovies = await getPendingMovieApprovals();
    let approved = 0;
    for (const movie of pendingMovies) {
      try {
        await updateMovieApprovalStatus(movie.id, "approved", session.user.id);
        approved++;
      } catch (e) {
        if (process.env.NODE_ENV === "development") {
          console.error(`[sync-and-approve] Error approving ${movie.slug}:`, e);
        }
      }
    }
    
    clearApprovedSlugsCache();
    return NextResponse.json({
      ok: true,
      inserted,
      approved,
      total: allSlugs.length,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Sync failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
