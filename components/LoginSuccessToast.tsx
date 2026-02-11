"use client";

import { useSearchParams, usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function LoginSuccessToast() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (searchParams.get("login") === "success") {
      setVisible(true);
      const t = setTimeout(() => {
        setVisible(false);
        router.replace(pathname || "/");
      }, 3000);
      return () => clearTimeout(t);
    }
  }, [searchParams, pathname, router]);

  if (!visible) return null;

  return (
    <div
      className="fixed top-20 left-1/2 -translate-x-1/2 z-50 px-4 py-3 rounded-lg bg-green-600 text-white text-sm font-medium shadow-lg"
      role="alert"
    >
      Đăng nhập thành công
    </div>
  );
}
