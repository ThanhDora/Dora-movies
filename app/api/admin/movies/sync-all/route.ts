import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { isAdmin } from "@/lib/vip";
import { upsertMovieVisibility, clearApprovedSlugsCache, insertMovieApprovals } from "@/lib/db";
import { sendErrorNotification } from "@/lib/telegram";
import { getPrisma } from "@/lib/prisma";

const BASE = process.env.NEXT_PUBLIC_API_URL;

async function fetchAllSlugsFromEndpoint(path: string, maxPages = 500): Promise<string[]> {
  const allSlugs: Set<string> = new Set();
  let hasMore = true;
  let page = 1;
  let consecutiveEmptyPages = 0;
  
  while (hasMore && page <= maxPages) {
    const url = path.startsWith("http") ? path : `${BASE}${path}${path.includes("?") ? "&" : "?"}page=${page}`;
    try {
      const res = await fetch(url, { 
        headers: { "Content-Type": "application/json" },
        signal: AbortSignal.timeout(15000)
      });
      if (!res.ok) {
        hasMore = false;
        break;
      }
      const data = await res.json();
      const items = data?.data?.items ?? [];
      if (items.length === 0) {
        consecutiveEmptyPages++;
        if (consecutiveEmptyPages >= 3) {
          hasMore = false;
          break;
        }
        page++;
        await new Promise(resolve => setTimeout(resolve, 100));
        continue;
      }
      consecutiveEmptyPages = 0;
      
      const slugs = items.map((it: { slug?: string }) => String(it?.slug ?? "")).filter(Boolean);
      slugs.forEach((slug: string) => allSlugs.add(slug));
      
      const pagination = data?.data?.params?.pagination;
      if (pagination) {
        const totalItems = pagination.totalItems || 0;
        const itemsPerPage = pagination.totalItemsPerPage || 24;
        const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
        if (page >= totalPages || page >= maxPages) {
          hasMore = false;
          break;
        }
      } else {
        if (page >= maxPages) {
          hasMore = false;
          break;
        }
      }
      page++;
      await new Promise(resolve => setTimeout(resolve, 50));
    } catch (e) {
      consecutiveEmptyPages++;
      if (consecutiveEmptyPages >= 3) {
        hasMore = false;
        break;
      }
      page++;
      await new Promise(resolve => setTimeout(resolve, 200));
    }
  }
  
  return Array.from(allSlugs);
}

async function fetchSlugsFromCategories(): Promise<string[]> {
  try {
    const res = await fetch(`${BASE}/v1/api/the-loai`, {
      headers: { "Content-Type": "application/json" },
      signal: AbortSignal.timeout(10000)
    });
    if (!res.ok) return [];
    const data = await res.json();
    const categories = Array.isArray(data?.data) ? data.data : data?.data?.items || [];
    const categorySlugs = categories
      .map((c: { slug?: string }) => String(c?.slug || ""))
      .filter(Boolean);
    
    const allSlugs = new Set<string>();
    for (let i = 0; i < categorySlugs.length; i++) {
      const slug = categorySlugs[i];
      try {
        const slugs = await fetchAllSlugsFromEndpoint(`/v1/api/the-loai/${slug}`, 200);
        slugs.forEach(s => allSlugs.add(s));
        await new Promise(resolve => setTimeout(resolve, 50));
      } catch (e) {
      }
    }
    
    return Array.from(allSlugs);
  } catch (e) {
    return [];
  }
}

async function fetchSlugsFromRegions(): Promise<string[]> {
  try {
    const res = await fetch(`${BASE}/v1/api/quoc-gia`, {
      headers: { "Content-Type": "application/json" },
      signal: AbortSignal.timeout(10000)
    });
    if (!res.ok) return [];
    const data = await res.json();
    const regions = Array.isArray(data?.data) ? data.data : data?.data?.items || [];
    const regionSlugs = regions
      .map((r: { slug?: string }) => String(r?.slug || ""))
      .filter(Boolean);
    
    const allSlugs = new Set<string>();
    for (let i = 0; i < regionSlugs.length; i++) {
      const slug = regionSlugs[i];
      try {
        const slugs = await fetchAllSlugsFromEndpoint(`/v1/api/quoc-gia/${slug}`, 200);
        slugs.forEach(s => allSlugs.add(s));
        await new Promise(resolve => setTimeout(resolve, 50));
      } catch (e) {
      }
    }
    
    return Array.from(allSlugs);
  } catch (e) {
    return [];
  }
}

async function fetchSlugsFromYears(): Promise<string[]> {
  const currentYear = new Date().getFullYear();
  const years: number[] = [];
  for (let y = currentYear; y >= 1970; y--) {
    years.push(y);
  }
  
  const allSlugs = new Set<string>();
  for (let i = 0; i < years.length; i++) {
    const year = years[i];
    try {
      const slugs = await fetchAllSlugsFromEndpoint(`/v1/api/danh-sach/phim-moi-cap-nhat?year=${year}`, 100);
      slugs.forEach(s => allSlugs.add(s));
      await new Promise(resolve => setTimeout(resolve, 50));
    } catch (e) {
    }
  }
  
  return Array.from(allSlugs);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id || !isAdmin(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const endpoints = [
      "/v1/api/danh-sach/phim-moi-cap-nhat",
      "/v1/api/danh-sach/phim-le",
      "/v1/api/danh-sach/phim-bo",
      "/v1/api/danh-sach/phim-hoat-hinh",
      "/v1/api/danh-sach/phim-tv-shows",
      "/v1/api/danh-sach/phim-sap-chieu",
    ];
    
    const endpointResults = await Promise.allSettled(
      endpoints.map((endpoint) => fetchAllSlugsFromEndpoint(endpoint))
    );
    
    const successfulResults = endpointResults
      .map((result) => result.status === "fulfilled" ? result.value : [])
      .filter(slugs => slugs.length > 0);
    
    const endpointCounts = endpointResults.map((result, idx) => ({
      endpoint: endpoints[idx],
      count: result.status === "fulfilled" ? result.value.length : 0,
      error: result.status === "rejected" ? result.reason?.message : null,
    }));
    
    const categorySlugs = await fetchSlugsFromCategories();
    
    if (categorySlugs.length > 0) {
      endpointCounts.push({
        endpoint: "categories",
        count: categorySlugs.length,
        error: null,
      });
    }
    
    const regionSlugs = await fetchSlugsFromRegions();
    
    if (regionSlugs.length > 0) {
      endpointCounts.push({
        endpoint: "regions",
        count: regionSlugs.length,
        error: null,
      });
    }
    
    const yearSlugs = await fetchSlugsFromYears();
    
    if (yearSlugs.length > 0) {
      endpointCounts.push({
        endpoint: "years",
        count: yearSlugs.length,
        error: null,
      });
    }
    
    const allSlugs = [...new Set([...successfulResults.flat(), ...categorySlugs, ...regionSlugs, ...yearSlugs])];
    
    const prisma = getPrisma();
    let newSlugs: string[] = [];
    let newMoviesCount = 0;
    
    if (prisma) {
      const existing = await prisma.movieApproval.findMany({
        where: { slug: { in: allSlugs } },
        select: { slug: true },
      });
      const existingSet = new Set(existing.map((r: { slug: string }) => r.slug));
      newSlugs = allSlugs.filter((s) => !existingSet.has(s));
      newMoviesCount = newSlugs.length;
    }
    
    if (newMoviesCount > 0) {
      await insertMovieApprovals(newSlugs, "doramovies");
    }
    
    let synced = 0;
    let errors = 0;
    const batchSize = 100;
    const slugsArray = Array.from(allSlugs);
    
    for (let i = 0; i < slugsArray.length; i += batchSize) {
      const batch = slugsArray.slice(i, i + batchSize);
      await Promise.allSettled(
        batch.map(async (slug) => {
          try {
            await upsertMovieVisibility(slug, true, null);
            synced++;
          } catch (e) {
            errors++;
          }
        })
      );
      
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    clearApprovedSlugsCache();
    
    if (newMoviesCount > 0 && newSlugs.length > 0) {
      fetch(`${process.env.NEXTAUTH_URL || "http://localhost:3000"}/api/telegram/new-movies`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Cookie": req.headers.get("cookie") || "",
        },
        body: JSON.stringify({ slugs: newSlugs.slice(0, 10) }),
      }).catch(() => {});
    }
    
    if (errors > 0) {
      sendErrorNotification(`Sync movies có ${errors} lỗi trong ${synced + errors} phim`, "sync-all").catch(() => {});
    }
    
    return NextResponse.json({
      ok: true,
      synced,
      errors,
      newMovies: newMoviesCount,
      total: allSlugs.length,
      endpointCounts,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Sync failed";
    sendErrorNotification(msg, "sync-all").catch(() => {});
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
