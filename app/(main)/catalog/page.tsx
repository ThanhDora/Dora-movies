import { getCatalog, getCategories, getRegions, getYears } from "@/lib/api";
import LazyMovieGrid from "@/components/LazyMovieGrid";
import CatalogFilter from "@/components/CatalogFilter";
import Pagination from "@/components/Pagination";

export const metadata = {
  title: "Danh sách phim | Ophim",
  description: "Danh sách phim, tìm kiếm và lọc theo thể loại, quốc gia, năm",
};

export default async function CatalogPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const search = typeof params.search === "string" ? params.search : undefined;
  const categorys = typeof params.categorys === "string" ? params.categorys : undefined;
  const regions = typeof params.regions === "string" ? params.regions : undefined;
  const years = typeof params.years === "string" ? params.years : undefined;
  const types = typeof params.types === "string" ? params.types : undefined;
  const sorts = typeof params.sorts === "string" ? params.sorts : undefined;
  const page = typeof params.page === "string" ? parseInt(params.page, 10) || 1 : 1;

  const sectionName =
    search ? `Tìm kiếm phim: ${search}` : "Danh Sách Phim";

  let data: Awaited<ReturnType<typeof getCatalog>> | null = null;
  let categories: Awaited<ReturnType<typeof getCategories>> = [];
  let regionsList: Awaited<ReturnType<typeof getRegions>> = [];
  let yearsList: number[] = [];

  try {
    const [catRes, regRes, yearsRes, catalogRes] = await Promise.all([
      getCategories(),
      getRegions(),
      getYears(),
      getCatalog({ search, categorys, regions, years, types, sorts, page }),
    ]);
    categories = catRes;
    regionsList = regRes;
    yearsList = yearsRes;
    data = catalogRes;
  } catch {
    data = null;
  }

  const queryForPagination: Record<string, string> = {};
  if (search) queryForPagination.search = search;
  if (categorys) queryForPagination.categorys = categorys;
  if (regions) queryForPagination.regions = regions;
  if (years) queryForPagination.years = years;
  if (types) queryForPagination.types = types;
  if (sorts) queryForPagination.sorts = sorts;

  return (
    <main className="w-full max-w-[1600px] mx-auto px-3 sm:px-4 py-4 sm:py-6">
      <div className="mb-4 sm:mb-6">
        <div className="bg-[#25252b] rounded-lg p-3 sm:p-4">
          <div className="flex flex-wrap items-center gap-3 sm:gap-4 overflow-x-auto">
            <span className="text-white font-medium shrink-0" title={sectionName}>
              {sectionName}
            </span>
            <CatalogFilter
              search={search}
              categorys={categorys}
              regions={regions}
              years={years}
              types={types}
              sorts={sorts}
              categories={categories}
              regionsList={regionsList}
              yearsList={yearsList}
            />
          </div>
        </div>
      </div>
      {data?.data?.length ? (
        <LazyMovieGrid movies={data.data} />
      ) : (
        <p className="text-white/70 py-8">Không có dữ liệu cho mục này</p>
      )}
      {data && (
        <Pagination
          paginator={data}
          basePath="/catalog"
          query={queryForPagination}
        />
      )}
    </main>
  );
}
