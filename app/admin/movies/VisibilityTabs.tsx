"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";

export default function VisibilityTabs({ currentFilter }: { currentFilter: string }) {
  const searchParams = useSearchParams();
  const page = searchParams.get("page") || "1";

  const tabs = [
    { id: "all", label: "Tất cả", count: null },
    { id: "visible", label: "Đang hiện", count: null },
    { id: "hidden", label: "Đang ẩn", count: null },
  ];

  return (
    <div className="flex gap-2 mb-6 border-b border-white/10">
      {tabs.map((tab) => {
        const params = new URLSearchParams();
        params.set("page", "1");
        if (tab.id !== "all") {
          params.set("filter", tab.id);
        }
        const search = searchParams.get("search");
        if (search) {
          params.set("search", search);
        }
        const isActive = currentFilter === tab.id;

        return (
          <Link
            key={tab.id}
            href={`?${params.toString()}`}
            className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 ${
              isActive
                ? "border-[#ff2a14] text-[#ff2a14]"
                : "border-transparent text-white/60 hover:text-white/90 hover:border-white/20"
            }`}
          >
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
}
