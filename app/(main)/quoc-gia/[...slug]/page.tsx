import { getRegionBySlug, getCategories, getRegions, getYears } from "@/lib/api";
import LazyMovieGrid from "@/components/LazyMovieGrid";
import CatalogFilter from "@/components/CatalogFilter";
import Pagination from "@/components/Pagination";
import { notFound } from "next/navigation";

export default async function RegionPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string[] }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { slug } = await params;
  const slugStr = slug?.[0] ?? "";
  const sp = await searchParams;
  const page = typeof sp.page === "string" ? parseInt(sp.page, 10) || 1 : 1;

  let region: Awaited<ReturnType<typeof getRegionBySlug>>["region"] | null = null;
  let data: Awaited<ReturnType<typeof getRegionBySlug>>["data"] | null = null;
  let categories: Awaited<ReturnType<typeof getCategories>> = [];
  let regionsList: Awaited<ReturnType<typeof getRegions>> = [];
  let yearsList: number[] = [];

  try {
    const [catRes, regRes, yearsRes, slugRes] = await Promise.all([
      getCategories(),
      getRegions(),
      getYears(),
      getRegionBySlug(slugStr, page),
    ]);
    categories = catRes;
    regionsList = regRes;
    yearsList = yearsRes;
    region = slugRes.region;
    data = slugRes.data;
  } catch {
    notFound();
  }

  if (!region || !data) notFound();

  const sectionName = `Phim quốc gia ${region.name}`;
  const queryForPagination: Record<string, string> = {};

  return (
    <main className="w-full max-w-[1600px] mx-auto px-3 sm:px-4 py-4 sm:py-6">
      <div className="mb-4 sm:mb-6">
        <div className="bg-[#25252b] rounded-lg p-3 sm:p-4">
          <div className="flex flex-wrap items-center gap-3 sm:gap-4 overflow-x-auto">
            <span className="text-white font-medium shrink-0" title={sectionName}>
              {sectionName}
            </span>
            <CatalogFilter
              regions={String(region.id)}
              categories={categories}
              regionsList={regionsList}
              yearsList={yearsList}
            />
          </div>
        </div>
      </div>
      {data.data?.length ? (
        <LazyMovieGrid movies={data.data} />
      ) : (
        <p className="text-white/70 py-8">Không có dữ liệu cho mục này</p>
      )}
      {data && (
        <Pagination
          paginator={data}
          basePath={`/quoc-gia/${slugStr}`}
          query={queryForPagination}
        />
      )}
    </main>
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string[] }>;
}) {
  const { slug } = await params;
  try {
    const res = await getRegionBySlug(slug?.[0] ?? "", 1);
    const title = res.region.seo_title || res.region.name;
    return { title: `${title} | Dora Movies` };
  } catch {
    return { title: "Quốc gia | Dora Movies" };
  }
}
