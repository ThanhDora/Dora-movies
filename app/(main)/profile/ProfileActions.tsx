"use client";

import { signOut } from "next-auth/react";
import Link from "next/link";

export default function ProfileActions({ isVip }: { isVip: boolean }) {
  return (
    <div className="flex flex-col gap-3 mt-6">
      {!isVip && (
        <Link
          href="/vip"
          className="w-full h-11 rounded-lg bg-[#ff2a14] text-white font-medium flex items-center justify-center hover:bg-[#e02512]"
        >
          Nâng cấp VIP
        </Link>
      )}
      <button
        type="button"
        onClick={() => signOut({ callbackUrl: "/" })}
        className="w-full h-11 rounded-lg bg-white/10 text-white font-medium border border-white/15 hover:bg-white/15"
      >
        Đăng xuất
      </button>
    </div>
  );
}
