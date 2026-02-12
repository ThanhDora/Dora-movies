"use client";

import { useSearchParams, usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Toast from "@/components/Toast";

export default function LoginSuccessToast() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const [showLoginToast, setShowLoginToast] = useState(false);
  const [showLogoutToast, setShowLogoutToast] = useState(false);

  useEffect(() => {
    if (searchParams.get("login") === "success") {
      setShowLoginToast(true);
      const t = setTimeout(() => {
        router.replace(pathname || "/");
      }, 3000);
      return () => clearTimeout(t);
    }
    if (searchParams.get("logout") === "success") {
      setShowLogoutToast(true);
      const t = setTimeout(() => {
        router.replace(pathname || "/");
      }, 3000);
      return () => clearTimeout(t);
    }
  }, [searchParams, pathname, router]);

  return (
    <>
      {showLoginToast && (
        <Toast
          message="Đăng nhập thành công!"
          type="success"
          duration={3000}
          onClose={() => setShowLoginToast(false)}
        />
      )}
      {showLogoutToast && (
        <Toast
          message="Đăng xuất thành công!"
          type="success"
          duration={3000}
          onClose={() => setShowLogoutToast(false)}
        />
      )}
    </>
  );
}
