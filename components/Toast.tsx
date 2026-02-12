/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import { useEffect, useState } from "react";

type ToastType = "success" | "error";

interface ToastProps {
  message: string;
  type: ToastType;
  duration?: number;
  onClose?: () => void;
}

export default function Toast({ message, type, duration = 3000, onClose }: ToastProps) {
  const [visible, setVisible] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    setTimeout(() => {
      setMounted(true);
    }, 0);
    const raf = requestAnimationFrame(() => {
      requestAnimationFrame(() => setVisible(true));
    });
    return () => cancelAnimationFrame(raf);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    const startTime = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, 100 - (elapsed / duration) * 100);
      setProgress(remaining);
    }, 16);

    const timer = setTimeout(() => {
      clearInterval(interval);
      setVisible(false);
      setTimeout(() => {
        onClose?.();
      }, 300);
    }, duration);
    return () => {
      clearTimeout(timer);
      clearInterval(interval);
    };
  }, [mounted, duration, onClose]);

  if (!mounted) return null;

  const isSuccess = type === "success";
  const accentColor = isSuccess ? "#e6b800" : "#ff2a14";
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const accentColorHover = isSuccess ? "#d4a800" : "#e02512";
  const iconBg = isSuccess ? "bg-[#e6b800]/10" : "bg-[#ff2a14]/10";
  const iconColor = isSuccess ? "text-[#e6b800]" : "text-[#ff2a14]";
  const borderColor = isSuccess ? "border-[#e6b800]/30" : "border-[#ff2a14]/30";
  const progressBg = isSuccess ? "bg-[#e6b800]" : "bg-[#ff2a14]";

  return (
    <div
      className={`fixed top-4 right-4 z-9999 pointer-events-none ${visible ? "opacity-100 translate-x-0" : "opacity-0 translate-x-full"
        } transition-all duration-300 ease-out`}
      role="alert"
      aria-live="assertive"
    >
      <div
        className="relative flex items-center gap-3 px-4 py-3.5 rounded-xl bg-[#1a1a1e] border border-white/10 shadow-2xl shadow-black/50 min-w-[300px] max-w-[400px] pointer-events-auto overflow-hidden"
        style={{
          boxShadow: `0 10px 40px rgba(0,0,0,0.5), 0 0 0 1px ${isSuccess ? "rgba(230,184,0,0.1)" : "rgba(255,42,20,0.1)"}`,
        }}
      >
        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-black/40">
          <div
            className="h-full transition-all duration-75 ease-linear"
            style={{ width: `${progress}%`, backgroundColor: accentColor }}
          />
        </div>
        <div className={`shrink-0 w-10 h-10 rounded-lg ${iconBg} flex items-center justify-center border ${borderColor}`}>
          {isSuccess ? (
            <svg className={`w-5 h-5 ${iconColor} animate-[scaleIn_0.3s_ease-out]`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            </svg>
          ) : (
            <svg className={`w-5 h-5 ${iconColor} animate-[scaleIn_0.3s_ease-out]`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
          )}
        </div>
        <p className="text-white font-medium text-sm flex-1 leading-relaxed pr-1">{message}</p>
        <button
          onClick={() => {
            setVisible(false);
            setTimeout(() => onClose?.(), 300);
          }}
          className="shrink-0 w-7 h-7 rounded-lg hover:bg-white/10 active:bg-white/15 flex items-center justify-center transition-all duration-200"
          aria-label="Đóng"
        >
          <svg className="w-4 h-4 text-white/60 hover:text-white/90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}
