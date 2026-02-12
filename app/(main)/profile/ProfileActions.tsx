"use client";

import { signOut } from "next-auth/react";
import Link from "next/link";
import { useState } from "react";
import Toast from "@/components/Toast";

export default function ProfileActions({ isVip, isAdmin }: { isVip: boolean; isAdmin?: boolean }) {
  const [showToast, setShowToast] = useState(false);

  const handleSignOut = async () => {
    setShowToast(true);
    setTimeout(() => {
      signOut({ callbackUrl: "/?logout=success" });
    }, 500);
  };

  return (
    <>
      {showToast && (
        <Toast
          message="Đang đăng xuất..."
          type="success"
          duration={2000}
          onClose={() => setShowToast(false)}
        />
      )}
      <div className="flex flex-col gap-3 mt-6">
        {!isVip && !isAdmin && (
          <Link
            href="/vip"
            className="w-full h-11 rounded-lg bg-[#ff2a14] text-white font-medium flex items-center justify-center hover:bg-[#e02512]"
          >
            Nâng cấp VIP
          </Link>
        )}
        {isAdmin && (
          <Link
            href="/admin"
            className="w-full h-11 rounded-lg bg-emerald-600 text-white font-medium flex items-center justify-center hover:bg-emerald-500"
          >
            Vào khu vực quản trị
          </Link>
        )}
        <button
          type="button"
          onClick={handleSignOut}
          className="w-full h-11 rounded-lg bg-white/10 text-white font-medium border border-white/15 hover:bg-white/15"
        >
          Đăng xuất
        </button>
      </div>
    </>
  );
}
