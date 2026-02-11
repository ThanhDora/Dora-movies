import Link from "next/link";
import Image from "next/image";
import { getMovie, getEpisode } from "@/lib/api";
import MovieCard from "@/components/MovieCard";
import StarRating from "@/components/StarRating";
import TrailerModal from "@/components/TrailerModal";
import MovieSingleContent from "./MovieSingleContent";
import EpisodeContent from "./EpisodeContent";
import { notFound } from "next/navigation";
import type { Movie, Episode as EpisodeType } from "@/types";

function getYoutubeId(url: string): string | null {
  if (!url || !url.includes("youtube")) return null;
  try {
    const u = new URL(url);
    return u.searchParams.get("v");
  } catch {
    return null;
  }
}

function getWatchUrl(movie: Movie): string {
  const episodes = movie.episodes || [];
  if (movie.is_copyright || !episodes.length) return "";
  const byServer = new Map<string, EpisodeType[]>();
  episodes.forEach((ep) => {
    const list = byServer.get(ep.server) || [];
    list.push(ep);
    byServer.set(ep.server, list);
  });
  const firstServer = Array.from(byServer.keys()).sort()[0];
  const list = byServer.get(firstServer) || [];
  const byName = new Map<string, EpisodeType[]>();
  list.forEach((ep) => {
    const name = ep.name || "";
    const arr = byName.get(name) || [];
    arr.push(ep);
    byName.set(name, arr);
  });
  const names = Array.from(byName.keys()).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
  const lastName = names[names.length - 1];
  const eps = byName.get(lastName) || [];
  const byType = eps.sort((a, b) => (b.type || "").localeCompare(a.type || ""));
  const first = byType[0];
  return first?.url || (movie.url ? `${movie.url}/tap-1-${first?.id}` : "");
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
      return (
        <EpisodeContent
          currentMovie={data.currentMovie}
          episode={data.episode}
          movie_related={data.movie_related}
          movie_related_top={data.movie_related_top}
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
      movie_related_top={data.movie_related_top}
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
          title: `${data.currentMovie.name} - Tập ${data.episode.name} | Ophim`,
        };
      }
    } catch {
      //
    }
  }
  try {
    const data = await getMovie(segment);
    return {
      title: `${data.currentMovie.name} | Ophim`,
      description: data.currentMovie.content?.replace(/<[^>]*>/g, "").slice(0, 160),
    };
  } catch {
    return { title: "Phim | Ophim" };
  }
}
