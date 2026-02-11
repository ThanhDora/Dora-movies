"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Category, Region } from "@/types";

interface CatalogFilterProps {
  search?: string;
  categorys?: string;
  regions?: string;
  years?: string;
  types?: string;
  sorts?: string;
  categories: Category[];
  regionsList: Region[];
  yearsList: number[];
  basePath?: string;
}

function buildQuery(
  overrides: Record<string, string | undefined>,
  current: Record<string, string | undefined>,
  basePath: string
): string {
  const q = new URLSearchParams();
  const merged = { ...current, ...overrides };
  Object.entries(merged).forEach(([k, v]) => {
    if (v) q.set(k, v);
  });
  const query = q.toString();
  return query ? `${basePath}?${query}` : basePath;
}

export default function CatalogFilter({
  search,
  categorys,
  regions,
  years,
  types,
  sorts,
  categories,
  regionsList,
  yearsList,
  basePath = "/catalog",
}: CatalogFilterProps) {
  const router = useRouter();
  const [filterOpen, setFilterOpen] = useState(false);
  const current = { search, categorys, regions, years, types, sorts };
  const selectClass = "w-full mt-1 min-h-[44px] px-3 py-2.5 bg-[#232328] text-[#ededed] border border-[#3a3a3f] rounded-lg text-sm cursor-pointer focus:outline-none focus:border-[#0a5c6f] touch-manipulation";

  const handleChange = (key: keyof typeof current, value: string) => {
    router.push(buildQuery({ [key]: value || undefined }, current, basePath));
  };

  const field = (id: string, label: string, children: React.ReactNode) => (
    <div className="flex flex-col gap-1">
      <label className="text-white/80 text-sm font-medium shrink-0" htmlFor={id}>
        {label}
      </label>
      {children}
    </div>
  );

  return (
    <div className="flex flex-col gap-2 w-full">
      <button
        type="button"
        onClick={() => setFilterOpen((v) => !v)}
        className="inline-flex items-center justify-center gap-2 min-h-[44px] px-4 py-2.5 bg-[#232328] hover:bg-[#2a2a32] text-white text-sm font-medium rounded-lg border border-[#3a3a3f] touch-manipulation shrink-0"
        aria-expanded={filterOpen}
        aria-label={filterOpen ? "Đóng bộ lọc" : "Mở bộ lọc"}
      >
        <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
        </svg>
        Bộ lọc
      </button>
      {filterOpen && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-white/10">
          <div className="sm:col-span-2">
            {field(
              "filter-regions",
              "Quốc gia",
              <select
                id="filter-regions"
                className={selectClass}
                value={regions ?? ""}
                onChange={(e) => handleChange("regions", e.target.value)}
                aria-label="Chọn quốc gia"
              >
                <option value="">Tất cả</option>
                {regionsList.map((item) => (
                  <option key={item.id} value={String(item.id)}>
                    {item.name}
                  </option>
                ))}
              </select>
            )}
          </div>
          <div>
            {field(
              "filter-categorys",
              "Thể loại",
              <select
                id="filter-categorys"
                className={selectClass}
                value={categorys ?? ""}
                onChange={(e) => handleChange("categorys", e.target.value)}
                aria-label="Chọn thể loại"
              >
                <option value="">Tất cả</option>
                {categories.map((item) => (
                  <option key={item.id} value={String(item.id)}>
                    {item.name}
                  </option>
                ))}
              </select>
            )}
          </div>
          <div>
            {field(
              "filter-years",
              "Năm",
              <select
                id="filter-years"
                className={selectClass}
                value={years ?? ""}
                onChange={(e) => handleChange("years", e.target.value)}
                aria-label="Chọn năm"
              >
                <option value="">Tất cả</option>
                {yearsList.map((year) => (
                  <option key={year} value={String(year)}>
                    {year}
                  </option>
                ))}
              </select>
            )}
          </div>
          <div className="sm:col-span-2">
            {field(
              "filter-types",
              "Định dạng",
              <select
                id="filter-types"
                className={selectClass}
                value={types ?? ""}
                onChange={(e) => handleChange("types", e.target.value)}
                aria-label="Chọn định dạng"
              >
                <option value="">Tất cả</option>
                <option value="series">Phim bộ</option>
                <option value="single">Phim lẻ</option>
              </select>
            )}
          </div>
          <div className="sm:col-span-2">
            {field(
              "filter-sorts",
              "Sắp xếp",
              <select
                id="filter-sorts"
                className={selectClass}
                value={sorts ?? ""}
                onChange={(e) => handleChange("sorts", e.target.value)}
                aria-label="Chọn sắp xếp"
              >
                <option value="">Mặc định</option>
                <option value="update">Thời gian cập nhật</option>
                <option value="create">Thời gian đăng</option>
                <option value="year">Năm sản xuất</option>
                <option value="view">Lượt xem</option>
              </select>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
