import { headers } from "next/headers";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";
export const dynamic = "force-dynamic";

export default async function Icon() {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? "http";
  const base = host.startsWith("localhost") ? "http://localhost:3000" : `${proto}://${host}`;
  try {
    const res = await fetch(`${base}/logo.png`, { cache: "no-store" });
    if (!res.ok) return fallbackIcon();
    const blob = await res.blob();
    return new Response(blob, {
      headers: { "Content-Type": res.headers.get("Content-Type") ?? "image/png" },
    });
  } catch {
    return fallbackIcon();
  }
}

function fallbackIcon() {
  const tiny =
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";
  const bin = atob(tiny);
  const arr = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
  return new Response(arr, { headers: { "Content-Type": "image/png" } });
}
