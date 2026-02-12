import type {
  Movie,
  Episode,
  Category,
  Region,
  Tag,
  Actor,
  Director,
  Catalog,
  HomeData,
  CatalogParams,
  PaginatedResponse,
  SearchResultItem,
  RateResponse,
} from "@/types";
import { getApprovedMovieSlugs, getHiddenMovieSlugs } from "@/lib/db";

const BASE = process.env.NEXT_PUBLIC_API_URL;
const FETCH_TIMEOUT = 8000;
const MAX_RETRIES = 2;
const RETRY_DELAY = 1000;

const cache = new Map<string, { data: unknown; expires: number }>();
const CACHE_TTL = 60000;

async function safeApprovedSlugs(): Promise<Set<string>> {
  try {
    return await getApprovedMovieSlugs();
  } catch {
    return new Set();
  }
}

async function safeHiddenSlugs(): Promise<Set<string>> {
  try {
    return await getHiddenMovieSlugs();
  } catch {
    return new Set();
  }
}

async function fetchApi<T>(path: string, options?: RequestInit, useCache = false): Promise<T> {
  const url = path.startsWith("http") ? path : `${BASE}${path}`;
  const cacheKey = `${url}:${JSON.stringify(options?.body || {})}`;
  
  if (useCache) {
    const cached = cache.get(cacheKey);
    if (cached && cached.expires > Date.now()) {
      return cached.data as T;
    }
  }
  
  let lastError: Error | null = null;
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT);
      const res = await fetch(url, {
        ...options,
        signal: controller.signal,
        headers: { "Content-Type": "application/json", ...options?.headers },
        next: { revalidate: 60 },
      });
      clearTimeout(timeout);
      
      if (!res.ok) {
        if (res.status >= 500 && attempt < MAX_RETRIES) {
          await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY * (attempt + 1)));
          continue;
        }
        throw new Error(`API error: ${res.status}`);
      }
      
      const data = await res.json() as T;
      
      if (useCache) {
        cache.set(cacheKey, { data, expires: Date.now() + CACHE_TTL });
      }
      
      return data;
    } catch (e) {
      lastError = e instanceof Error ? e : new Error(String(e));
      if (attempt < MAX_RETRIES && (lastError.name === "AbortError" || (lastError.message.includes("500") || lastError.message.includes("503")))) {
        await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY * (attempt + 1)));
        continue;
      }
      throw lastError;
    }
  }
  throw lastError || new Error("Fetch failed");
}

function emptyHomeData(): HomeData {
  return {
    menu: [
      { name: "Trang chủ", link: "/" },
      { name: "Cập nhật", link: "/danh-sach/phim-moi-cap-nhat" },
      { name: "Phim lẻ", link: "/danh-sach/phim-le" },
      { name: "Phim bộ", link: "/danh-sach/phim-bo" },
      { name: "TV Shows", link: "/danh-sach/tv-shows" },
      { name: "Thể loại", link: "/the-loai" },
      { name: "Quốc gia", link: "/quoc-gia" },
    ],
    title: "Dora Movies",
    slider: { label: "Phim mới", data: [] },
    sections: [],
    settings: {},
  };
}

type OphimV1List = {
  status: boolean;
  message: string;
  data: {
    titlePage?: string;
    items: unknown[];
    params: {
      pagination: {
        totalItems: number;
        totalItemsPerPage: number;
        currentPage: number;
        pageRanges?: number;
      };
    };
    APP_DOMAIN_CDN_IMAGE: string;
    APP_DOMAIN_FRONTEND?: string;
  };
};

type OphimRawItem = Record<string, unknown>;

function viewCountFromItem(item: OphimRawItem): number | undefined {
  const keys = ["view", "views", "view_total", "total_view", "count_view", "view_count"];
  for (const k of keys) {
    const v = item[k];
    if (v !== undefined && v !== null && v !== "") {
      const n = Number(v);
      if (!Number.isNaN(n) && n >= 0) return n;
    }
  }
  return undefined;
}

type OphimV1Movie = {
  status: boolean;
  message: string;
  data: {
    item: OphimRawItem;
    APP_DOMAIN_CDN_IMAGE: string;
  };
};

type OphimV1SimpleList = {
  status: boolean;
  message: string;
  data: unknown[] | { items: unknown[] };
};

function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function hash32(str: string): number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function cdnMovieUrl(cdnBase: string, filename?: string): string {
  if (!filename) return "";
  if (filename.startsWith("http")) return filename;
  return `${cdnBase}/uploads/movies/${filename}`;
}

function mapCategoryRef(ref: OphimRawItem): Category {
  const slug = String(ref.slug || "");
  return {
    id: slug,
    name: String(ref.name || ""),
    slug,
    url: `/the-loai/${slug}`,
  };
}

function mapRegionRef(ref: OphimRawItem): Region {
  const slug = String(ref.slug || "");
  return {
    id: slug,
    name: String(ref.name || ""),
    slug,
    url: `/quoc-gia/${slug}`,
  };
}

function buildEpisodes(movieSlug: string, rawEpisodes: unknown[]): Episode[] {
  const out: Episode[] = [];
  (rawEpisodes || []).forEach((group: unknown) => {
    const g = group as OphimRawItem;
    const serverName = String(g.server_name || "");
    const serverData = Array.isArray(g.server_data) ? g.server_data : [];
    serverData.forEach((sd: unknown) => {
      const s = sd as OphimRawItem;
      const name = String(s.name || "");
      const slug = String(s.slug || name);
      if (s.link_embed) {
        const id = hash32(`${serverName}:${slug}:embed`);
        out.push({
          id,
          name,
          slug,
          server: serverName,
          type: "embed",
          link: String(s.link_embed),
          url: `/phim/${movieSlug}/${slug}-${id}`,
        });
      }
      if (s.link_m3u8) {
        const id = hash32(`${serverName}:${slug}:m3u8`);
        out.push({
          id,
          name,
          slug,
          server: serverName,
          type: "m3u8",
          link: String(s.link_m3u8),
          url: `/phim/${movieSlug}/${slug}-${id}`,
        });
      }
    });
  });
  return out;
}

function mapItemToMovie(item: OphimRawItem, cdnBase: string): Movie {
  const slug = String(item.slug || "");
  const categories = Array.isArray(item.category) ? item.category.map(mapCategoryRef) : [];
  const regions = Array.isArray(item.country) ? item.country.map(mapRegionRef) : [];
  const actorsRaw = Array.isArray(item.actor) ? (item.actor as string[]) : [];
  const directorsRaw = Array.isArray(item.director) ? (item.director as string[]) : [];
  const actors: Actor[] = actorsRaw
    .filter(Boolean)
    .map((name: string, idx: number) => {
      const slugA = slugify(name) || String(idx);
      return { id: slugA, name, slug: slugA, url: `/dien-vien/${slugA}` };
    });
  const directors: Director[] = directorsRaw
    .filter(Boolean)
    .map((name: string, idx: number) => {
      const slugD = slugify(name) || String(idx);
      return { id: slugD, name, slug: slugD, url: `/dao-dien/${slugD}` };
    });

  return {
    id: String(item._id || slug),
    slug,
    name: String(item.name || ""),
    origin_name: String(item.origin_name || ""),
    thumb_url: cdnMovieUrl(cdnBase, item.thumb_url as string | undefined),
    poster_url: cdnMovieUrl(cdnBase, item.poster_url as string | undefined),
    url: `/phim/${slug}`,
    content: item.content ? String(item.content) : undefined,
    publish_year: item.year ? Number(item.year) : undefined,
    quality: item.quality ? String(item.quality) : undefined,
    language: item.lang ? String(item.lang) : undefined,
    type: item.type ? String(item.type) : undefined,
    episode_current: item.episode_current ? String(item.episode_current) : undefined,
    episode_total: item.episode_total ? String(item.episode_total) : undefined,
    episode_time: item.time ? String(item.time) : undefined,
    status: item.status ? String(item.status) : undefined,
    view_total: viewCountFromItem(item),
    is_copyright: typeof item.is_copyright === "boolean" ? item.is_copyright : undefined,
    notify: item.notify ? String(item.notify) : undefined,
    showtimes: item.showtimes ? String(item.showtimes) : undefined,
    trailer_url: item.trailer_url ? String(item.trailer_url) : undefined,
    categories,
    regions,
    tags: [],
    actors,
    directors,
    episodes: Array.isArray(item.episodes) ? buildEpisodes(slug, item.episodes) : [],
    rating_star: 0,
    rating_count: 0,
  };
}

function toPaginatedResponse(
  items: unknown[],
  cdnBase: string,
  page: number,
  totalItems: number,
  perPage: number,
  path: string,
  query: Record<string, string>
): PaginatedResponse<Movie> {
  const lastPage = Math.max(1, Math.ceil(totalItems / perPage));
  const make = (p: number) => {
    const q = new URLSearchParams(query);
    q.set("page", String(p));
    return `${path}?${q.toString()}`;
  };
  const links: { url: string | null; label: string; active: boolean }[] = [];
  const windowSize = 2;
  const start = Math.max(1, page - windowSize);
  const end = Math.min(lastPage, page + windowSize);
  if (start > 1) links.push({ url: make(1), label: "1", active: page === 1 });
  if (start > 2) links.push({ url: null, label: "...", active: false });
  for (let p = start; p <= end; p++) {
    links.push({ url: make(p), label: String(p), active: p === page });
  }
  if (end < lastPage - 1) links.push({ url: null, label: "...", active: false });
  if (end < lastPage) links.push({ url: make(lastPage), label: String(lastPage), active: page === lastPage });

  return {
    data: items.map((it) => mapItemToMovie(it as OphimRawItem, cdnBase)),
    current_page: page,
    last_page: lastPage,
    per_page: perPage,
    total: totalItems,
    from: (page - 1) * perPage + 1,
    to: Math.min(page * perPage, totalItems),
    path,
    first_page_url: make(1),
    last_page_url: make(lastPage),
    next_page_url: page < lastPage ? make(page + 1) : null,
    prev_page_url: page > 1 ? make(page - 1) : null,
    links,
  };
}

function mapSort(sorts?: string): { sort_field?: string; sort_type?: string } {
  if (sorts === "create") return { sort_field: "created.time", sort_type: "desc" };
  if (sorts === "year") return { sort_field: "year", sort_type: "desc" };
  if (sorts === "view") return { sort_field: "view", sort_type: "desc" };
  if (sorts === "update") return { sort_field: "modified.time", sort_type: "desc" };
  return { sort_field: "modified.time", sort_type: "desc" };
}

function filterByApproved<T extends { slug?: unknown }>(items: T[], approved: Set<string>, hidden: Set<string>): T[] {
  return items.filter((item) => {
    const slug = item.slug;
    if (typeof slug !== "string" || !slug) return false;
    if (hidden.has(slug)) return false;
    return true;
  });
}

export async function getHome(): Promise<HomeData> {
  if (!BASE) return emptyHomeData();
  try {
    const [cats, regs, latest, single, series, approvedSet, hiddenSet, animeRes] = await Promise.all([
      fetchApi<OphimV1SimpleList>("/v1/api/the-loai", undefined, true),
      fetchApi<OphimV1SimpleList>("/v1/api/quoc-gia", undefined, true),
      fetchApi<OphimV1List>("/v1/api/danh-sach/phim-moi-cap-nhat?page=1", undefined, true),
      fetchApi<OphimV1List>("/v1/api/danh-sach/phim-le?page=1", undefined, true),
      fetchApi<OphimV1List>("/v1/api/danh-sach/phim-bo?page=1", undefined, true),
      safeApprovedSlugs(),
      safeHiddenSlugs(),
      (async () => {
        const results = await Promise.allSettled([
          fetchApi<OphimV1List>("/v1/api/the-loai/hanh-dong?page=1", undefined, true),
          fetchApi<OphimV1List>("/v1/api/the-loai/action?page=1", undefined, true),
        ]);
        const slugs: [string, string][] = [["hanh-dong", "/the-loai/hanh-dong"], ["action", "/the-loai/action"]];
        for (let i = 0; i < results.length; i++) {
          const r = results[i];
          if (r.status === "fulfilled" && r.value?.data?.items?.length)
            return { res: r.value, link: slugs[i][1] };
        }
        return null;
      })(),
    ]);

  const categoriesRaw = Array.isArray(cats.data) ? cats.data : cats.data.items;
  const regionsRaw = Array.isArray(regs.data) ? regs.data : regs.data.items;

  const categoryMenu = (categoriesRaw || []).map((c: unknown) => {
    const row = c as OphimRawItem;
    return { name: String(row.name || ""), link: `/the-loai/${String(row.slug || "")}` };
  });
  const regionMenu = (regionsRaw || []).map((c: unknown) => {
    const row = c as OphimRawItem;
    return { name: String(row.name || ""), link: `/quoc-gia/${String(row.slug || "")}` };
  });

  const menu = [
    { name: "Trang chủ", link: "/" },
    { name: "Cập nhật", link: "/danh-sach/phim-moi-cap-nhat" },
    { name: "Phim lẻ", link: "/danh-sach/phim-le" },
    { name: "Phim bộ", link: "/danh-sach/phim-bo" },
    { name: "TV Shows", link: "/danh-sach/tv-shows" },
    { name: "Thể loại", link: "/the-loai", children: categoryMenu },
    { name: "Quốc gia", link: "/quoc-gia", children: regionMenu },
  ];

  const cdnLatest = latest.data.APP_DOMAIN_CDN_IMAGE;
  const cdnSingle = single.data.APP_DOMAIN_CDN_IMAGE;
  const cdnSeries = series.data.APP_DOMAIN_CDN_IMAGE;

  let latestMovies = latest.data.items.map((it) => mapItemToMovie(it as OphimRawItem, cdnLatest));
  let singleMovies = single.data.items.map((it) => mapItemToMovie(it as OphimRawItem, cdnSingle));
  let seriesMovies = series.data.items.map((it) => mapItemToMovie(it as OphimRawItem, cdnSeries));
  latestMovies = filterByApproved(latestMovies, approvedSet, hiddenSet);
  singleMovies = filterByApproved(singleMovies, approvedSet, hiddenSet);
  seriesMovies = filterByApproved(seriesMovies, approvedSet, hiddenSet);

  let animeMovies: Movie[] = [];
  let animeLink = "/the-loai/hanh-dong";
  if (animeRes && animeRes.res?.data?.items?.length) {
    const cdnAnime = animeRes.res.data.APP_DOMAIN_CDN_IMAGE;
    animeMovies = animeRes.res.data.items.map((it) => mapItemToMovie(it as OphimRawItem, cdnAnime));
    animeMovies = filterByApproved(animeMovies, approvedSet, hiddenSet);
    animeLink = animeRes.link;
  }
  if (animeMovies.length === 0 && latestMovies.length > 0) {
    animeMovies = latestMovies.slice(0, 24);
    animeLink = "/danh-sach/phim-moi-cap-nhat";
  }

  const sectionsOut: HomeData["sections"] = [
    { label: "Phim mới cập nhật", show_template: "section_thumb", data: latestMovies },
    {
      label: "Phim lẻ",
      show_template: "section_side",
      data: singleMovies,
      topview: singleMovies.slice(0, 10),
      link: "/danh-sach/phim-le",
    },
    {
      label: "Phim bộ",
      show_template: "section_side",
      data: seriesMovies,
      topview: seriesMovies.slice(0, 10),
      link: "/danh-sach/phim-bo",
    },
  ];
  if (animeMovies.length > 0) {
    sectionsOut.push({
      label: "Kho phim hành động",
      show_template: "section_thumb",
      data: animeMovies,
      link: animeLink,
    });
  }

    return {
      menu,
      title: "Dora Movies",
      slider: { label: "Phim mới", data: latestMovies.slice(0, 10) },
      sections: sectionsOut,
      settings: {},
    };
  } catch {
    return emptyHomeData();
  }
}

export async function search(q: string): Promise<SearchResultItem[]> {
  if (!q.trim() || !BASE) return [];
  const params = new URLSearchParams({ keyword: q.trim(), page: "1" });
  const [res, approvedSet, hiddenSet] = await Promise.all([
    fetchApi<OphimV1List>(`/v1/api/tim-kiem?${params}`),
    safeApprovedSlugs(),
    safeHiddenSlugs(),
  ]);
  const cdn = res.data.APP_DOMAIN_CDN_IMAGE;
  let items = (res.data.items || []) as OphimRawItem[];
  items = filterByApproved(items.filter((it): it is OphimRawItem & { slug: string } => typeof it.slug === "string"), approvedSet, hiddenSet);
  return items.slice(0, 5).map((row) => ({
    title: String(row.name || ""),
    original_title: String(row.origin_name || ""),
    year: row.year ? Number(row.year) : undefined,
    total_episode: row.episode_total ? String(row.episode_total) : undefined,
    image: cdnMovieUrl(cdn, row.thumb_url as string | undefined),
    image_poster: cdnMovieUrl(cdn, row.poster_url as string | undefined),
    slug: `/phim/${String(row.slug || "")}`,
  }));
}

export async function getCatalog(
  params: CatalogParams
): Promise<PaginatedResponse<Movie>> {
  const page = params.page || 1;
  if (!BASE) {
    const query: Record<string, string> = {};
    if (params.search) query.search = params.search;
    if (params.categorys) query.categorys = params.categorys;
    if (params.regions) query.regions = params.regions;
    if (params.years) query.years = params.years;
    if (params.types) query.types = params.types;
    if (params.sorts) query.sorts = params.sorts;
    return toPaginatedResponse([], "", 1, 0, 24, "/catalog", query);
  }
  const q = new URLSearchParams({ page: String(page) });
  if (params.categorys) q.set("category", params.categorys);
  if (params.regions) q.set("country", params.regions);
  if (params.years) q.set("year", params.years);
  if (params.types) q.set("type", params.types);
  const sort = mapSort(params.sorts);
  if (sort.sort_field) q.set("sort_field", sort.sort_field);
  if (sort.sort_type) q.set("sort_type", sort.sort_type);

  const endpoint = params.search
    ? `/v1/api/tim-kiem?keyword=${encodeURIComponent(params.search)}&${q.toString()}`
    : `/v1/api/danh-sach/phim-moi-cap-nhat?${q.toString()}`;

  const [res, approvedSet, hiddenSet] = await Promise.all([
    fetchApi<OphimV1List>(endpoint),
    safeApprovedSlugs(),
    safeHiddenSlugs(),
  ]);
  const p = res.data.params.pagination;
  const perPage = 25;
  const totalItems = p.totalItems ?? res.data.items.length;
  let items = res.data.items as OphimRawItem[];
  items = filterByApproved(items, approvedSet, hiddenSet);
  
  if (items.length < perPage && page * p.totalItemsPerPage < totalItems) {
    const nextPage = page + 1;
    const nextQ = new URLSearchParams({ page: String(nextPage) });
    if (params.categorys) nextQ.set("category", params.categorys);
    if (params.regions) nextQ.set("country", params.regions);
    if (params.years) nextQ.set("year", params.years);
    if (params.types) nextQ.set("type", params.types);
    const sort = mapSort(params.sorts);
    if (sort.sort_field) nextQ.set("sort_field", sort.sort_field);
    if (sort.sort_type) nextQ.set("sort_type", sort.sort_type);
    const nextEndpoint = params.search
      ? `/v1/api/tim-kiem?keyword=${encodeURIComponent(params.search)}&${nextQ.toString()}`
      : `/v1/api/danh-sach/phim-moi-cap-nhat?${nextQ.toString()}`;
    try {
      const nextRes = await fetchApi<OphimV1List>(nextEndpoint);
      const nextItems = filterByApproved(nextRes.data.items as OphimRawItem[], approvedSet, hiddenSet);
      items = [...items, ...nextItems].slice(0, perPage);
    } catch {
      //
    }
  } else {
    items = items.slice(0, perPage);
  }
  
  const query: Record<string, string> = {};
  if (params.search) query.search = params.search;
  if (params.categorys) query.categorys = params.categorys;
  if (params.regions) query.regions = params.regions;
  if (params.years) query.years = params.years;
  if (params.types) query.types = params.types;
  if (params.sorts) query.sorts = params.sorts;
  return toPaginatedResponse(
    items as unknown[],
    res.data.APP_DOMAIN_CDN_IMAGE,
    page,
    totalItems,
    perPage,
    "/catalog",
    query
  );
}

export async function getCategories(): Promise<Category[]> {
  const res = await fetchApi<OphimV1SimpleList>("/v1/api/the-loai");
  const list = Array.isArray(res.data) ? res.data : res.data.items;
  return (list || []).map((c: unknown) => {
    const row = c as OphimRawItem;
    return {
      id: String(row.slug || ""),
      name: String(row.name || ""),
      slug: String(row.slug || ""),
      url: `/the-loai/${String(row.slug || "")}`,
    };
  });
}

export async function getRegions(): Promise<Region[]> {
  const res = await fetchApi<OphimV1SimpleList>("/v1/api/quoc-gia");
  const list = Array.isArray(res.data) ? res.data : res.data.items;
  return (list || []).map((c: unknown) => {
    const row = c as OphimRawItem;
    return {
      id: String(row.slug || ""),
      name: String(row.name || ""),
      slug: String(row.slug || ""),
      url: `/quoc-gia/${String(row.slug || "")}`,
    };
  });
}

export async function getYears(): Promise<number[]> {
  const year = new Date().getFullYear();
  const out: number[] = [];
  for (let y = year; y >= 1970; y--) out.push(y);
  return out;
}

export async function getCategoryBySlug(
  slug: string,
  page = 1
): Promise<{ category: Category; data: PaginatedResponse<Movie> }> {
  const [res, approvedSet, hiddenSet] = await Promise.all([
    fetchApi<OphimV1List>(`/v1/api/the-loai/${encodeURIComponent(slug)}?page=${page}`),
    safeApprovedSlugs(),
    safeHiddenSlugs(),
  ]);
  const p = res.data.params.pagination;
  const perPage = 25;
  const totalItems = p.totalItems ?? res.data.items.length;
  let items = res.data.items as OphimRawItem[];
  items = filterByApproved(items, approvedSet, hiddenSet);
  
  if (items.length < perPage && page * p.totalItemsPerPage < totalItems) {
    try {
      const nextRes = await fetchApi<OphimV1List>(`/v1/api/the-loai/${encodeURIComponent(slug)}?page=${page + 1}`);
      const nextItems = filterByApproved(nextRes.data.items as OphimRawItem[], approvedSet, hiddenSet);
      items = [...items, ...nextItems].slice(0, perPage);
    } catch {
      items = items.slice(0, perPage);
    }
  } else {
    items = items.slice(0, perPage);
  }
  
  const query: Record<string, string> = {};
  const data = toPaginatedResponse(items as unknown[], res.data.APP_DOMAIN_CDN_IMAGE, page, totalItems, perPage, `/the-loai/${slug}`, query);
  return {
    category: { id: slug, name: res.data.titlePage || slug, slug, url: `/the-loai/${slug}` },
    data,
  };
}

export async function getRegionBySlug(
  slug: string,
  page = 1
): Promise<{ region: Region; data: PaginatedResponse<Movie> }> {
  const [res, approvedSet, hiddenSet] = await Promise.all([
    fetchApi<OphimV1List>(`/v1/api/quoc-gia/${encodeURIComponent(slug)}?page=${page}`),
    safeApprovedSlugs(),
    safeHiddenSlugs(),
  ]);
  const p = res.data.params.pagination;
  const perPage = 25;
  const totalItems = p.totalItems ?? res.data.items.length;
  let items = res.data.items as OphimRawItem[];
  items = filterByApproved(items, approvedSet, hiddenSet);
  
  if (items.length < perPage && page * p.totalItemsPerPage < totalItems) {
    try {
      const nextRes = await fetchApi<OphimV1List>(`/v1/api/quoc-gia/${encodeURIComponent(slug)}?page=${page + 1}`);
      const nextItems = filterByApproved(nextRes.data.items as OphimRawItem[], approvedSet, hiddenSet);
      items = [...items, ...nextItems].slice(0, perPage);
    } catch {
      items = items.slice(0, perPage);
    }
  } else {
    items = items.slice(0, perPage);
  }
  
  const query: Record<string, string> = {};
  const data = toPaginatedResponse(items as unknown[], res.data.APP_DOMAIN_CDN_IMAGE, page, totalItems, perPage, `/quoc-gia/${slug}`, query);
  return {
    region: { id: slug, name: res.data.titlePage || slug, slug, url: `/quoc-gia/${slug}` },
    data,
  };
}

export async function getTagBySlug(
  slug: string,
  _page = 1
): Promise<{ tag: Tag; data: PaginatedResponse<Movie> }> {
  void slug;
  void _page;
  throw new Error("Tag endpoint not supported by ophim1.com API");
}

export async function getCatalogBySlug(
  slug: string,
  page = 1
): Promise<{ catalog: Catalog; data: PaginatedResponse<Movie> }> {
  const [res, approvedSet, hiddenSet] = await Promise.all([
    fetchApi<OphimV1List>(`/v1/api/danh-sach/${encodeURIComponent(slug)}?page=${page}`),
    safeApprovedSlugs(),
    safeHiddenSlugs(),
  ]);
  const p = res.data.params.pagination;
  const perPage = 25;
  const totalItems = p.totalItems ?? res.data.items.length;
  let items = res.data.items as OphimRawItem[];
  items = filterByApproved(items, approvedSet, hiddenSet);
  
  if (items.length < perPage && page * p.totalItemsPerPage < totalItems) {
    try {
      const nextRes = await fetchApi<OphimV1List>(`/v1/api/danh-sach/${encodeURIComponent(slug)}?page=${page + 1}`);
      const nextItems = filterByApproved(nextRes.data.items as OphimRawItem[], approvedSet, hiddenSet);
      items = [...items, ...nextItems].slice(0, perPage);
    } catch {
      items = items.slice(0, perPage);
    }
  } else {
    items = items.slice(0, perPage);
  }
  
  const query: Record<string, string> = {};
  const data = toPaginatedResponse(items as unknown[], res.data.APP_DOMAIN_CDN_IMAGE, page, totalItems, perPage, `/danh-sach/${slug}`, query);
  return {
    catalog: { id: slug, name: res.data.titlePage || slug, slug },
    data,
  };
}

export async function getActorBySlug(
  slug: string,
  _page = 1
): Promise<{ person: Actor; data: PaginatedResponse<Movie> }> {
  void slug;
  void _page;
  throw new Error("Actor endpoint not supported by ophim1.com API");
}

export async function getDirectorBySlug(
  slug: string,
  _page = 1
): Promise<{ person: Director; data: PaginatedResponse<Movie> }> {
  void slug;
  void _page;
  throw new Error("Director endpoint not supported by ophim1.com API");
}

export async function getMovie(slug: string): Promise<{
  currentMovie: Movie;
  movie_related: Movie[];
  movie_related_top: Movie[];
}> {
  const [res, approvedSet, hiddenSet] = await Promise.all([
    fetchApi<OphimV1Movie>(`/v1/api/phim/${encodeURIComponent(slug)}`),
    safeApprovedSlugs(),
    safeHiddenSlugs(),
  ]);
  if (hiddenSet.has(slug)) {
    throw new Error("NOT_FOUND");
  }
  const cdn = res.data.APP_DOMAIN_CDN_IMAGE;
  const currentMovie = mapItemToMovie(res.data.item, cdn);
  const categorySlug = currentMovie.categories?.[0]?.slug;
  let related: Movie[] = [];
  if (categorySlug) {
    const results = await Promise.allSettled([
      fetchApi<OphimV1List>(`/v1/api/the-loai/${encodeURIComponent(categorySlug)}?page=1`),
      fetchApi<OphimV1List>(`/v1/api/the-loai/${encodeURIComponent(categorySlug)}?page=2`),
      fetchApi<OphimV1List>(`/v1/api/the-loai/${encodeURIComponent(categorySlug)}?page=3`),
    ]);
    const combined: unknown[] = [];
    let cdnBase = "";
    for (const r of results) {
      if (r.status === "fulfilled" && r.value?.data?.items) {
        combined.push(...r.value.data.items);
        if (!cdnBase && r.value.data.APP_DOMAIN_CDN_IMAGE) cdnBase = r.value.data.APP_DOMAIN_CDN_IMAGE;
      }
    }
    related = combined.map((it) => mapItemToMovie(it as OphimRawItem, cdnBase));
    related = filterByApproved(related, approvedSet, hiddenSet);
    related = related.filter((m) => m.slug !== currentMovie.slug).slice(0, 60);
  }
  return { currentMovie, movie_related: related, movie_related_top: related.slice(0, 10) };
}

export function getWatchUrl(movie: Movie): string {
  const episodes = movie.episodes || [];
  if (movie.is_copyright || !episodes.length) return "";
  const byServer = new Map<string, Episode[]>();
  episodes.forEach((ep) => {
    const list = byServer.get(ep.server) || [];
    list.push(ep);
    byServer.set(ep.server, list);
  });
  const firstServer = Array.from(byServer.keys()).sort()[0];
  const list = byServer.get(firstServer) || [];
  const byName = new Map<string, Episode[]>();
  list.forEach((ep) => {
    const name = ep.name || "";
    const arr = byName.get(name) || [];
    arr.push(ep);
    byName.set(name, arr);
  });
  const names = Array.from(byName.keys()).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
  const firstName = names[0];
  const eps = byName.get(firstName) || [];
  const byType = eps.sort((a, b) => (b.type || "").localeCompare(a.type || ""));
  const first = byType[0];
  return first?.url || (movie.url ? `${movie.url}/tap-1-${first?.id}` : "");
}

export async function getEpisode(
  movieSlug: string,
  episodeSlug: string,
  episodeId: string
): Promise<{
  currentMovie: Movie;
  episode: Episode;
  movie_related: Movie[];
  movie_related_top: Movie[];
}> {
  const movieData = await getMovie(movieSlug);
  const eps = movieData.currentMovie.episodes || [];
  const idNum = Number(episodeId);
  const episode =
    eps.find((e) => e.slug === episodeSlug && e.id === idNum) ||
    eps.find((e) => e.slug === episodeSlug) ||
    eps[0];
  if (!episode) throw new Error("Episode not found");
  return {
    currentMovie: movieData.currentMovie,
    episode,
    movie_related: movieData.movie_related,
    movie_related_top: movieData.movie_related_top,
  };
}

export async function reportEpisode(
  _movieSlug: string,
  _episodeSlug: string,
  _payload: { id: number; message?: string }
): Promise<void> {
  void _movieSlug;
  void _episodeSlug;
  void _payload;
  throw new Error("Report not supported by ophim1.com API");
}

export async function rateMovie(
  _movieSlug: string,
  rating: number,
  currentCount = 0
): Promise<RateResponse> {
  void _movieSlug;
  return {
    status: true,
    rating_star: String(rating),
    rating_count: currentCount + 1,
  };
}
