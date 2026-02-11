import { getHome, getMovie, getWatchUrl } from "@/lib/api";
import type { SectionData, Movie } from "@/types";

export const dynamic = "force-dynamic";
import HomeHero from "@/components/HomeHero";
import LazySection from "@/components/LazySection";

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
  const featured = sliderMovies[0];
  const hasHero = featured && sliderMovies.length > 0;

  let watchUrls: string[] = [];
  if (sliderMovies.length > 0) {
    const results = await Promise.allSettled(
      sliderMovies.map((m) => getMovie(m.slug).then((data) => getWatchUrl(data.currentMovie)))
    );
    watchUrls = results.map((r) => (r.status === "fulfilled" ? r.value : ""));
  }

  return (
    <>
      {hasHero ? (
        <section className="w-full -mt-14 md:-mt-[70px]">
          <HomeHero featured={featured} movies={sliderMovies} watchUrls={watchUrls} />
        </section>
      ) : null}
      <main id="sections" className="w-full max-w-[1600px] mx-auto px-3 sm:px-4 py-6 sm:py-8">
        {sections.map((item, i) => {
          const template = item.show_template || item.label;
          return <LazySection key={i} item={item} showTemplate={template} />;
        })}
      </main>
    </>
  );
}
