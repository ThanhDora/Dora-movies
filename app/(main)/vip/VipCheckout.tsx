"use client";

import { useState } from "react";

export default function VipCheckout({ planId, planName }: { planId: string; planName: string }) {
  const [loading, setLoading] = useState(false);

  async function handlePay() {
    setLoading(true);
    try {
      const res = await fetch("/api/vip/create-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId, gateway: "vnpay" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      if (data.url) window.location.href = data.url;
      else throw new Error("No redirect URL");
    } catch {
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handlePay}
      disabled={loading}
      className="px-4 py-2 rounded-lg bg-[#ff2a14] text-white font-medium hover:bg-[#ff2a14]/90 disabled:opacity-50"
    >
      {loading ? "Đang chuyển hướng..." : "Thanh toán VNPay"}
    </button>
  );
}
