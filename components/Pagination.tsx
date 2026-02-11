import Link from "next/link";
import type { PaginatedResponse } from "@/types";

interface PaginationProps {
  paginator: PaginatedResponse<unknown>;
  basePath?: string;
  query?: Record<string, string>;
}

export default function Pagination({
  paginator,
  basePath = "/catalog",
  query = {},
}: PaginationProps) {
  const { current_page, last_page, links } = paginator;
  if (last_page <= 1) return null;

  const makeUrl = (page: number) => {
    const q = new URLSearchParams(query);
    q.set("page", String(page));
    return `${basePath}?${q.toString()}`;
  };

  const base = "min-h-[44px] min-w-[44px] inline-flex items-center justify-center px-3 py-2.5 text-sm rounded transition-colors touch-manipulation";
  const normal = `${base} bg-[#25252b] text-white/80 hover:bg-[#1C1C20] active:bg-[#1C1C20]`;
  const active = `${base} bg-[#ff2a14] text-white`;

  return (
    <div className="flex flex-wrap justify-center gap-2 py-6 sm:py-8">
      {current_page > 1 && (
        <Link href={makeUrl(current_page - 1)} className={normal} title="Trang trước">
          Trang trước
        </Link>
      )}
      {links
        ?.filter((l) => l.label && !["&laquo; Previous", "Next &raquo;", "..."].includes(l.label))
        .map((link) => {
          if (link.active) {
            return (
              <span key={link.label} className={active}>
                {link.label}
              </span>
            );
          }
          const pageNum = Number(link.label);
          const url =
            link.url && !link.url.startsWith("javascript")
              ? link.url
              : !Number.isNaN(pageNum)
                ? makeUrl(pageNum)
                : "#";
          return (
            <Link key={link.label} href={url} className={normal} title={link.label}>
              {link.label}
            </Link>
          );
        })}
      {current_page < last_page && (
        <Link href={makeUrl(current_page + 1)} className={normal} title="Trang sau">
          Trang sau
        </Link>
      )}
    </div>
  );
}
