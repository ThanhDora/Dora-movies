import Link from "next/link";
import type { PaginatedResponse } from "@/types";

interface PaginationProps {
  paginator: PaginatedResponse<unknown>;
  basePath?: string;
  query?: Record<string, string>;
}

function getPageNumbers(current: number, last: number, windowSize = 2): (number | "ellipsis")[] {
  if (last <= 1) return [];
  const pages: (number | "ellipsis")[] = [];
  const start = Math.max(1, current - windowSize);
  const end = Math.min(last, current + windowSize);
  if (start > 1) {
    pages.push(1);
    if (start > 2) pages.push("ellipsis");
  }
  for (let p = start; p <= end; p++) pages.push(p);
  if (end < last) {
    if (end < last - 1) pages.push("ellipsis");
    pages.push(last);
  }
  return pages;
}

export default function Pagination({
  paginator,
  basePath = "/catalog",
  query = {},
}: PaginationProps) {
  const { current_page, last_page } = paginator;
  if (last_page <= 1) return null;

  const makeUrl = (page: number) => {
    const q = new URLSearchParams(query);
    q.set("page", String(page));
    const path = basePath.replace(/\?.*$/, "");
    return `${path}?${q.toString()}`;
  };

  const base = "min-h-[44px] min-w-[44px] inline-flex items-center justify-center px-3 py-2.5 text-sm font-medium rounded-lg transition-colors touch-manipulation";
  const btn = `${base} bg-[#25252b] text-white hover:bg-[#2a2a32] active:bg-[#1a1a1e]`;
  const active = `${base} bg-[#ff2a14] text-white cursor-default pointer-events-none`;

  const pages = getPageNumbers(current_page, last_page);

  return (
    <nav className="flex flex-wrap items-center justify-center gap-2 py-6 sm:py-8" aria-label="Phân trang">
      <span className="text-white/70 text-sm shrink-0">
        Trang {current_page} / {last_page}
      </span>
      {current_page > 1 ? (
        <Link href={makeUrl(current_page - 1)} className={btn} title="Trang trước">
          Trước
        </Link>
      ) : (
        <span className={`${base} bg-[#25252b]/50 text-white/40 cursor-not-allowed`}>Trước</span>
      )}
      <span className="sr-only">Trang {current_page} / {last_page}</span>
      <div className="flex flex-wrap items-center justify-center gap-1">
        {pages.map((p, i) =>
          p === "ellipsis" ? (
            <span key={`ellipsis-${i}`} className="min-w-[44px] min-h-[44px] inline-flex items-center justify-center text-white/50 text-sm">
              …
            </span>
          ) : (
            p === current_page ? (
              <span key={p} className={active} aria-current="page">
                {p}
              </span>
            ) : (
              <Link key={p} href={makeUrl(p)} className={btn} title={`Trang ${p}`}>
                {p}
              </Link>
            )
          )
        )}
      </div>
      {current_page < last_page ? (
        <Link href={makeUrl(current_page + 1)} className={btn} title="Trang sau">
          Sau
        </Link>
      ) : (
        <span className={`${base} bg-[#25252b]/50 text-white/40 cursor-not-allowed`}>Sau</span>
      )}
    </nav>
  );
}
