"use client";

import { useState, useEffect } from "react";
import Image from "next/image";

export default function MovieImage({ slug }: { slug: string }) {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    async function fetchImage() {
      try {
        const res = await fetch(`/api/movie-image/${encodeURIComponent(slug)}`, {
          headers: { "Content-Type": "application/json" },
        });
        if (res.ok) {
          const data = await res.json();
          if (data.imageUrl) {
            setImageUrl(data.imageUrl);
          } else {
            setError(true);
          }
        } else {
          setError(true);
        }
      } catch (err) {
        setError(true);
      } finally {
        setLoading(false);
      }
    }
    fetchImage();
  }, [slug]);

  if (loading) {
    return (
      <div className="w-20 h-28 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
        <svg className="w-6 h-6 text-white/20 animate-spin" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      </div>
    );
  }

  if (!imageUrl || error) {
    return (
      <div className="w-20 h-28 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
        <svg className="w-8 h-8 text-white/20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      </div>
    );
  }

  return (
    <div className="w-20 h-28 rounded-lg overflow-hidden border border-white/10 shrink-0 relative bg-white/5">
      <Image
        src={imageUrl}
        alt={slug}
        fill
        className="object-cover"
        sizes="80px"
        unoptimized
        onError={() => setError(true)}
      />
    </div>
  );
}
