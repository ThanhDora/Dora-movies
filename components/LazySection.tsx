"use client";

import LazyWhenInView from "./LazyWhenInView";
import SectionThumb from "./SectionThumb";
import SectionSide from "./SectionSide";
import SectionNewUpdates from "./SectionNewUpdates";
import type { SectionData } from "@/types";

function isNewUpdatesSection(item: SectionData): boolean {
  const label = (item.label || "").toLowerCase();
  return label.includes("cập nhật") || label.includes("moi cap nhat");
}

export default function LazySection({
  item,
  showTemplate,
}: {
  item: SectionData;
  showTemplate: string;
}) {
  const placeholder = (
    <section className="mb-10 min-h-[280px] rounded-lg bg-[#25252b]/40 animate-pulse" aria-hidden />
  );

  return (
    <LazyWhenInView placeholder={placeholder}>
      {() =>
        isNewUpdatesSection(item) ? (
          <SectionNewUpdates item={item} />
        ) : showTemplate === "section_side" ? (
          <SectionSide item={item} />
        ) : (
          <SectionThumb item={item} />
        )
      }
    </LazyWhenInView>
  );
}
