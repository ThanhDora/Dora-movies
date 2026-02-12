import { getHome, getMovie, getWatchUrl, getRegionBySlug, getCategoryBySlug } from "@/lib/api";
import type { SectionData, Movie } from "@/types";

export const dynamic = "force-dynamic";
import HomeHero from "@/components/HomeHero";
import LazySection from "@/components/LazySection";
import SectionRegionRow from "@/components/SectionRegionRow";
import Top10SeriesSection from "@/components/Top10SeriesSection";
import Top10MoviesSection from "@/components/Top10MoviesSection";
import AnimeTreasureSection from "@/components/AnimeTreasureSection";

const REGION_ROWS: { slug: string; title: string; theme: "korea" | "china" | "usuk" }[] = [
  { slug: "han-quoc", title: "Phim Hàn Quốc mới nhất", theme: "korea" },
  { slug: "trung-quoc", title: "Phim Trung Quốc mới nhất", theme: "china" },
  { slug: "au-my", title: "Phim US-UK mới nhất", theme: "usuk" },
];

const ACTION_CATEGORY_SLUG = "hanh-dong";

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const hasFilter =
    params.search ||
    params.categorys ||
    params.years ||
    params.regions ||
    params.types ||
    params.sorts;

  if (hasFilter) {
    const { redirect } = await import("next/navigation");
    const q = new URLSearchParams();
    if (params.search) q.set("search", String(params.search));
    if (params.categorys) q.set("categorys", String(params.categorys));
    if (params.regions) q.set("regions", String(params.regions));
    if (params.years) q.set("years", String(params.years));
    if (params.types) q.set("types", String(params.types));
    if (params.sorts) q.set("sorts", String(params.sorts));
    if (params.page) q.set("page", String(params.page));
    redirect(`/catalog?${q.toString()}`);
  }

  let slider: SectionData | null = null;
  let sections: SectionData[] = [];

  try {
    const home = await getHome();
    slider = home.slider || null;
    sections = home.sections || [];
  } catch {
    slider = null;
    sections = [];
  }

  const sliderMovies = (slider?.data as Movie[] | undefined) ?? [];
  let heroMovies: Movie[] = sliderMovies;
  let watchUrls: string[] = [];

  if (sliderMovies.length > 0) {
    const results = await Promise.allSettled(
      sliderMovies.map((m) => getMovie(m.slug))
    );
    watchUrls = results.map((r) => {
      if (r.status !== "fulfilled" || !r.value?.currentMovie) return "";
      return getWatchUrl(r.value.currentMovie) ?? "";
    });
    heroMovies = sliderMovies.map((m, i) => {
      const r = results[i];
      if (r.status !== "fulfilled" || !r.value?.currentMovie) return m;
      const d = r.value.currentMovie;
      return {
        ...m,
        content: d.content ?? m.content,
        categories: d.categories ?? m.categories,
      };
    });
  }

  const featured = heroMovies[0];
  const hasHero = featured && heroMovies.length > 0;

  const regionRowsData = await Promise.all(
    REGION_ROWS.map(async ({ slug, title, theme }) => {
      try {
        const { region, data } = await getRegionBySlug(slug, 1);
        const movies = data.data || [];
        return { title, link: region.url || `/quoc-gia/${slug}`, movies, theme };
      } catch {
        return { title, link: `/quoc-gia/${slug}`, movies: [] as Movie[], theme };
      }
    })
  );

  const isNewUpdates = (item: SectionData) => {
    const label = (item.label || "").toLowerCase();
    return label.includes("cập nhật") || label.includes("moi cap nhat");
  };
  const newUpdatesSection = sections.find(isNewUpdates) ?? null;
  const isPhimBo = (s: SectionData) => (s.link || "").includes("phim-bo") || (s.label || "").toLowerCase().includes("phim bộ");
  const isPhimLe = (s: SectionData) => (s.link || "").includes("phim-le") || (s.label || "").toLowerCase().includes("phim lẻ") || (s.label || "").toLowerCase().includes("phim le");
  const isActionSection = (s: SectionData) => (s.link || "").includes("hanh-dong") || (s.link || "").includes("action") || (s.label || "").toLowerCase().includes("kho phim hành động") || (s.label || "").toLowerCase().includes("hành động");
  const otherSections = sections.filter((item) => !isNewUpdates(item) && !isPhimBo(item) && !isPhimLe(item) && !isActionSection(item));
  const phimBoSection = sections.find(isPhimBo);
  const phimLeSection = sections.find(isPhimLe);
  const top10Series = (phimBoSection?.topview ?? phimBoSection?.data?.slice(0, 10) ?? []) as Movie[];
  const top10Movies = (phimLeSection?.topview ?? phimLeSection?.data?.slice(0, 10) ?? []) as Movie[];

  let actionData: { category: { url: string }; movies: Movie[] } | null = null;
  let actionWatchUrl: string | undefined;
  try {
    const { category, data } = await getCategoryBySlug(ACTION_CATEGORY_SLUG, 1);
    const list = (data.data || []) as Movie[];
    if (list.length > 0) {
      actionData = { category: { url: category.url || `/the-loai/${ACTION_CATEGORY_SLUG}` }, movies: list };
    }
  } catch {
    const actionSection = sections.find(isActionSection);
    const list = (actionSection?.data || []) as Movie[];
    if (list.length > 0) {
      actionData = { category: { url: actionSection?.link || `/the-loai/${ACTION_CATEGORY_SLUG}` }, movies: list };
    }
  }
  if (actionData && actionData.movies.length > 0) {
    const toFetch = actionData.movies.slice(0, 12);
    const details = await Promise.all(toFetch.map((m) => getMovie(m.slug).catch(() => null)));
    actionWatchUrl = details[0] ? getWatchUrl(details[0].currentMovie) || undefined : undefined;
    actionData = {
      ...actionData,
      movies: actionData.movies.map((m, i) => {
        const d = details[i];
        if (!d) return m;
        return {
          ...m,
          content: d.currentMovie?.content ?? m.content,
          categories: d.currentMovie?.categories ?? m.categories,
        };
      }),
    };
  }

  return (
    <>
      {hasHero ? (
        <section className="w-full -mt-14 md:-mt-[70px]">
          <HomeHero featured={featured} movies={heroMovies} watchUrls={watchUrls} />
        </section>
      ) : null}
      <main id="sections" className="w-full max-w-[1600px] mx-auto px-3 sm:px-4 py-6 sm:py-8">
        {newUpdatesSection && (
          <LazySection
            key="new-updates"
            item={newUpdatesSection}
            showTemplate={newUpdatesSection.show_template || newUpdatesSection.label}
          />
        )}
        {top10Series.length > 0 && <Top10SeriesSection movies={top10Series} />}
        {regionRowsData.some((r) => r.movies.length > 0) && (
          <section className="mb-10 rounded-2xl bg-[#0f0f12] p-4 sm:p-5 overflow-hidden">
            {regionRowsData.map((row, i) =>
              row.movies.length > 0 ? (
                <div key={i} className={i > 0 ? "mt-6 pt-6" : ""}>
                  <SectionRegionRow title={row.title} link={row.link} movies={row.movies} theme={row.theme} embedded />
                </div>
              ) : null
            )}
          </section>
        )}
        {top10Movies.length > 0 && <Top10MoviesSection movies={top10Movies} />}
        {otherSections.map((item, i) => {
          const template = item.show_template || item.label;
          return <LazySection key={i} item={item} showTemplate={template} />;
        })}
        {actionData && actionData.movies.length > 0 && (
          <AnimeTreasureSection
            title="Kho phim hành động"
            link={actionData.category.url}
            featured={actionData.movies[0]}
            movies={actionData.movies}
            watchUrl={actionWatchUrl}
          />
        )}
      </main>
    </>
  );
}
