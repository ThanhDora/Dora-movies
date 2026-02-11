"use client";

import { useState } from "react";
import { rateMovie } from "@/lib/api";

interface StarRatingProps {
  movieSlug: string;
  initialScore: number;
  initialCount: number;
}

export default function StarRating({
  movieSlug,
  initialScore,
  initialCount,
}: StarRatingProps) {
  const [score, setScore] = useState(initialScore);
  const [count, setCount] = useState(initialCount);
  const [rated, setRated] = useState(false);
  const [message, setMessage] = useState("");

  const handleClick = async (value: number) => {
    if (rated) return;
    try {
      const res = await rateMovie(movieSlug, value, count);
      setScore(parseFloat(res.rating_star));
      setCount(res.rating_count);
      setRated(true);
      setMessage(`Bạn đã đánh giá ${value} sao cho phim này!`);
    } catch {
      setMessage("Có lỗi xảy ra.");
    }
  };

  const filled = Math.round(score);

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-1">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => handleClick(value)}
            disabled={rated}
            className={`p-0.5 text-lg border-0 bg-transparent cursor-pointer disabled:cursor-default ${value <= filled ? "text-amber-400" : "text-white/40"}`}
            title={`${value} sao`}
          >
            ★
          </button>
        ))}
      </div>
      <p className="text-white/70 text-sm">({score} sao / {count} đánh giá)</p>
      {message && <p className="text-white/80 text-sm" id="movies-rating-msg">{message}</p>}
    </div>
  );
}
