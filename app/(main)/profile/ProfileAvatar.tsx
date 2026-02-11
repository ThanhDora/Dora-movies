"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";

const SIZE = 200;
const MAX_FILE = 2 * 1024 * 1024;

function resizeToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = document.createElement("img");
    const oc = document.createElement("canvas");
    const ctx = oc.getContext("2d");
    const reader = new FileReader();
    reader.onload = (e) => {
      img.src = e.target?.result as string;
      img.onload = () => {
        let w = img.width;
        let h = img.height;
        if (w > SIZE || h > SIZE) {
          if (w > h) {
            h = (h * SIZE) / w;
            w = SIZE;
          } else {
            w = (w * SIZE) / h;
            h = SIZE;
          }
        }
        oc.width = w;
        oc.height = h;
        ctx?.drawImage(img, 0, 0, w, h);
        const dataUrl = oc.toDataURL("image/jpeg", 0.85);
        resolve(dataUrl);
      };
      img.onerror = () => reject(new Error("Invalid image"));
    };
    reader.readAsDataURL(file);
  });
}

export default function ProfileAvatar({
  image,
  name,
  email,
}: {
  image: string | null;
  name?: string | null;
  email?: string | null;
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError("");
    if (!file.type.startsWith("image/")) {
      setError("Chọn file ảnh (JPG, PNG).");
      return;
    }
    if (file.size > MAX_FILE) {
      setError("Ảnh tối đa 2MB.");
      return;
    }
    setLoading(true);
    try {
      const dataUrl = await resizeToDataUrl(file);
      const res = await fetch("/api/profile/avatar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: dataUrl }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Lỗi tải ảnh.");
        return;
      }
      router.refresh();
    } catch {
      setError("Lỗi tải ảnh.");
    } finally {
      setLoading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  const initial = (name || email || "?").charAt(0).toUpperCase();
  const isDataUrl = image?.startsWith("data:");

  return (
    <div className="relative inline-block">
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={loading}
        className="w-20 h-20 rounded-full bg-white/10 border-2 border-white/20 overflow-hidden flex items-center justify-center hover:border-[#ff2a14] transition-colors disabled:opacity-50"
        aria-label="Đổi ảnh đại diện"
      >
        {image ? (
          isDataUrl ? (
            <img src={image} alt="" className="w-full h-full object-cover" />
          ) : (
            <Image src={image} alt="" width={80} height={80} className="w-full h-full object-cover" />
          )
        ) : (
          <span className="text-3xl font-bold text-white/60">{initial}</span>
        )}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={handleChange}
      />
      <span className="absolute bottom-0 right-0 w-6 h-6 rounded-full bg-[#ff2a14] flex items-center justify-center text-white text-xs">
        {loading ? "..." : "✎"}
      </span>
      {error ? <p className="text-red-400 text-xs mt-1 text-center">{error}</p> : null}
    </div>
  );
}
