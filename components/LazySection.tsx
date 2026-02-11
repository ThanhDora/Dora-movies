"use client";

import LazyWhenInView from "./LazyWhenInView";
import SectionThumb from "./SectionThumb";
import SectionSide from "./SectionSide";
import type { SectionData } from "@/types";

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
        showTemplate === "section_side" ? (
          <SectionSide item={item} />
        ) : (
          <SectionThumb item={item} />
        )
      }
    </LazyWhenInView>
  );
}
