// import Link from "next/link";
// import Image from "next/image";
import { getMovie, getEpisode, getWatchUrl } from "@/lib/api";
import { auth } from "@/lib/auth";
import { recordWatchHistory, getWatchProgress } from "@/lib/db";
// import MovieCard from "@/components/MovieCard";
// import StarRating from "@/components/StarRating";
// import TrailerModal from "@/components/TrailerModal";
import MovieSingleContent from "./MovieSingleContent";
import EpisodeContent from "./EpisodeContent";
import { notFound } from "next/navigation";
import type { Movie } from "@/types";

function getYoutubeId(url: string): string | null {
  if (!url || !url.includes("youtube")) return null;
  try {
    const u = new URL(url);
    return u.searchParams.get("v");
  } catch {
    return null;
  }
}

export default async function PhimPage({
  params,
}: {
  params: Promise<{ slug: string[] }>;
}) {
  const { slug } = await params;
  const segment = slug?.[0] ?? "";
  const second = slug?.[1];

  if (second) {
    const match = second.match(/^(.+)-(\d+)$/);
    if (match) {
      const [, episodeSlug, id] = match;
      let data: Awaited<ReturnType<typeof getEpisode>> | null = null;
      try {
        data = await getEpisode(segment, episodeSlug, id);
      } catch {
        notFound();
      }
      if (!data) notFound();
      const session = await auth();
      let initialProgressSeconds: number | undefined;
      if (session?.user?.id) {
        recordWatchHistory({
          userId: session.user.id,
          movieSlug: segment,
          episodePath: second,
          movieTitle: data.currentMovie.name,
          posterUrl: data.currentMovie.thumb_url || data.currentMovie.poster_url || null,
        }).catch(() => { });
        const progress = await getWatchProgress(session.user.id, segment);
        if (progress?.episodePath === second && progress.progressSeconds != null && progress.progressSeconds > 0) {
          initialProgressSeconds = progress.progressSeconds;
        }
      }
      return (
        <EpisodeContent
          currentMovie={data.currentMovie}
          episode={data.episode}
          movie_related={data.movie_related}
          episodePath={second}
          initialProgressSeconds={initialProgressSeconds}
          isLoggedIn={!!session?.user?.id}
        />
      );
    }
  }

  let data: Awaited<ReturnType<typeof getMovie>> | null = null;
  try {
    data = await getMovie(segment);
  } catch {
    notFound();
  }
  if (!data) notFound();

  return (
    <MovieSingleContent
      currentMovie={data.currentMovie}
      movie_related={data.movie_related}
      watchUrl={getWatchUrl(data.currentMovie)}
      trailerId={getYoutubeId(data.currentMovie.trailer_url || "")}
    />
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string[] }>;
}) {
  const { slug } = await params;
  const segment = slug?.[0] ?? "";
  const second = slug?.[1];
  if (second) {
    try {
      const match = second.match(/^(.+)-(\d+)$/);
      if (match) {
        const [, episodeSlug, id] = match;
        const data = await getEpisode(segment, episodeSlug, id);
        return {
          title: `${data.currentMovie.name} - Tập ${data.episode.name} | Dora Movies`,
        };
      }
    } catch {
      //
    }
  }
  try {
    const data = await getMovie(segment);
    return {
      title: `${data.currentMovie.name} | Dora Movies`,
      description: data.currentMovie.content?.replace(/<[^>]*>/g, "").slice(0, 160),
    };
  } catch {
    return { title: "Phim | Dora Movies" };
  }
}
