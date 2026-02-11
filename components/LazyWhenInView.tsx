"use client";

import { useState, useEffect, useRef, type ReactNode } from "react";

interface LazyWhenInViewProps {
  children: ReactNode | (() => ReactNode);
  placeholder?: ReactNode;
  rootMargin?: string;
  once?: boolean;
  className?: string;
}

export default function LazyWhenInView({
  children,
  placeholder = null,
  rootMargin = "120px 0px",
  once = true,
  className = "",
}: LazyWhenInViewProps) {
  const [inView, setInView] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry?.isIntersecting) {
          setInView(true);
          if (once && el) observer.unobserve(el);
        }
      },
      { rootMargin, threshold: 0.01 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [rootMargin, once]);

  const content = inView ? (typeof children === "function" ? children() : children) : placeholder;

  return (
    <div ref={ref} className={className}>
      {content}
    </div>
  );
}
