"use client";

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
}

function buildQuery(
  overrides: Record<string, string | undefined>,
  current: Record<string, string | undefined>
): string {
  const q = new URLSearchParams();
  const merged = { ...current, ...overrides };
  Object.entries(merged).forEach(([k, v]) => {
    if (v) q.set(k, v);
  });
  return `/catalog?${q.toString()}`;
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
}: CatalogFilterProps) {
  const router = useRouter();
  const current = { search, categorys, regions, years, types, sorts };
  const selectClass = "w-full mt-1 min-h-[44px] px-3 py-2.5 bg-[#232328] text-[#ededed] border border-[#3a3a3f] rounded text-sm cursor-pointer focus:outline-none focus:border-[#0a5c6f] touch-manipulation";

  const handleChange = (key: keyof typeof current, value: string) => {
    router.push(buildQuery({ [key]: value || undefined }, current));
  };

  const box = (id: string, label: string, children: React.ReactNode) => (
    <div className="flex flex-wrap items-center gap-2 overflow-x-auto py-2">
      <label className="text-white/80 text-sm font-medium shrink-0" htmlFor={id}>
        {label}
      </label>
      {children}
    </div>
  );

  return (
    <>
      {box(
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
      {box(
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
      {box(
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
      {box(
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
      {box(
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
    </>
  );
}
