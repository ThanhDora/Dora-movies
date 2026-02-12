"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { loginWithCredentials, signInWithGoogle } from "@/app/(main)/login/actions";

const DURATION_MS = 200;

function EnvelopeIcon() {
  return (
    <svg className="w-5 h-5 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
  );
}

function EyeIcon({ open }: { open: boolean }) {
  return open ? (
    <svg className="w-5 h-5 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
    </svg>
  ) : (
    <svg className="w-5 h-5 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
  );
}

function UserIcon() {
  return (
    <svg className="w-5 h-5 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  );
}

function GoogleIcon() {
  return (
    <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
  );
}

const inputBase =
  "w-full h-12 pl-4 pr-11 rounded-xl bg-white/5 text-white placeholder:text-white/40 border border-white/10 outline-none focus:border-[#e6b800] focus:ring-2 focus:ring-[#e6b800]/20 transition-colors";

export default function AuthDialog({
  open,
  onClose,
  initialTab = "login",
}: {
  open: boolean;
  onClose: () => void;
  initialTab?: "login" | "register";
}) {
  const [tab, setTab] = useState<"login" | "register">(initialTab);
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState("");
  const [registerLoading, setRegisterLoading] = useState(false);
  const [registerError, setRegisterError] = useState("");
  const [registerDone, setRegisterDone] = useState(false);
  const [emailSent, setEmailSent] = useState(true);
  const [loginShowPassword, setLoginShowPassword] = useState(false);
  const [registerShowPassword, setRegisterShowPassword] = useState(false);
  const [confirmShowPassword, setConfirmShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);
  const [contentOpacity, setContentOpacity] = useState(1);
  const [googleLoading, setGoogleLoading] = useState(false);
  const tabTransitionRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setTab(initialTab);
  }, [initialTab, open]);

  function switchTab(next: "login" | "register") {
    if (next === tab) return;
    if (tabTransitionRef.current) clearTimeout(tabTransitionRef.current);
    setContentOpacity(0);
    tabTransitionRef.current = setTimeout(() => {
      tabTransitionRef.current = null;
      setTab(next);
      setContentOpacity(1);
    }, 180);
  }

  useEffect(() => {
    if (open) {
      setMounted(true);
      const raf = requestAnimationFrame(() => {
        requestAnimationFrame(() => setVisible(true));
      });
      return () => cancelAnimationFrame(raf);
    }
    setVisible(false);
    if (tabTransitionRef.current) clearTimeout(tabTransitionRef.current);
    const t = setTimeout(() => setMounted(false), DURATION_MS);
    return () => clearTimeout(t);
  }, [open]);

  async function handleLoginSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoginError("");
    setLoginLoading(true);
    const form = e.currentTarget;
    const formData = new FormData(form);
    const result = await loginWithCredentials(formData);
    setLoginLoading(false);
    if (result.error) {
      setLoginError(result.error);
    } else if ("ok" in result && result.ok && result.url) {
      onClose();
      window.location.href = result.url;
    }
  }

  async function handleRegisterSubmit(e: React.FormEvent) {
    e.preventDefault();
    setRegisterError("");
    if (password !== confirmPassword) {
      setRegisterError("Mật khẩu xác nhận không khớp.");
      return;
    }
    if (password.length < 6 || password.length > 15) {
      setRegisterError("Mật khẩu phải từ 6 đến 15 ký tự.");
      return;
    }
    setRegisterLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password, name: name.trim() || undefined }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setRegisterError(data.error || "Đăng ký thất bại.");
        setRegisterLoading(false);
        return;
      }
      setEmailSent(data.emailSent !== false);
      setRegisterDone(true);
    } catch {
      setRegisterError("Không kết nối được. Kiểm tra mạng hoặc thử lại.");
    }
    setRegisterLoading(false);
  }

  if (!mounted) return null;

  return (
    <div className="fixed inset-0 z-200 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label="Đăng nhập / Đăng ký">
      <div
        className={`absolute inset-0 bg-black/70 backdrop-blur-md transition-opacity duration-200 ease-out ${visible ? "opacity-100" : "opacity-0"}`}
        onClick={onClose}
        aria-hidden
      />
      <div
        className={`relative z-10 w-full max-w-[400px] overflow-hidden rounded-2xl transition-all duration-200 ease-out ${visible ? "opacity-100 scale-100 translate-y-0" : "opacity-0 scale-95 translate-y-3"}`}
      >
        <div className="border border-white/10 shadow-2xl max-h-[90vh] overflow-y-auto rounded-2xl overflow-hidden">
          <div className="relative flex items-center justify-center px-6 pt-5 pb-5 bg-[#151518] border-b border-white/10 min-h-[88px]">
            <button
              type="button"
              onClick={onClose}
              className="absolute right-3 top-3 p-2 rounded-xl text-white/50 hover:text-white hover:bg-white/10 transition-colors z-10"
              aria-label="Đóng"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <div className="flex flex-col items-center justify-center gap-2 text-center">
              <Image src="/anime.png" alt="Dora Movies" width={48} height={32} className="h-8 w-auto shrink-0 object-contain" />
              <h2 className="text-lg font-bold text-white leading-tight">Dora Movies</h2>
            </div>
          </div>
          <div className="px-6 pt-5 pb-5 bg-[#1a1a1e]">
            <div className="relative flex rounded-xl bg-white/5 p-1 border border-white/10 mb-6">
              <div
                className="absolute top-1 left-1 bottom-1 w-[calc(50%-4px)] rounded-lg bg-[#e6b800] transition-[transform] duration-300 ease-out"
                style={{ transform: tab === "register" ? "translateX(calc(100% + 4px))" : "translateX(0)" }}
              />
              <button
                type="button"
                onClick={() => switchTab("login")}
                className={`relative z-10 flex-1 py-2.5 rounded-lg text-sm font-semibold transition-colors duration-200 ${tab === "login" ? "text-[#0a0a0c]" : "text-white/70 hover:text-white"}`}
              >
                Đăng nhập
              </button>
              <button
                type="button"
                onClick={() => switchTab("register")}
                className={`relative z-10 flex-1 py-2.5 rounded-lg text-sm font-semibold transition-colors duration-200 ${tab === "register" ? "text-[#0a0a0c]" : "text-white/70 hover:text-white"}`}
              >
                Đăng ký
              </button>
            </div>

            <div className="transition-opacity duration-200 ease-out" style={{ opacity: contentOpacity }}>
            {tab === "login" && !registerDone && (
              <>
                <div className="text-center mb-6">
                  <h2 className="text-xl font-bold text-white">Chào mừng trở lại</h2>
                  <p className="text-white/60 text-sm mt-1">Tiếp tục để trải nghiệm phim tốt nhất</p>
                </div>
                {loginError ? (
                  <div className="mb-4 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                    {loginError}
                  </div>
                ) : null}
                <form onSubmit={handleLoginSubmit} className="space-y-4">
                  <div className="relative">
                    <label htmlFor="auth-email" className="sr-only">Email</label>
                    <input
                      id="auth-email"
                      name="email"
                      type="email"
                      placeholder="Email hoặc Username"
                      autoComplete="email"
                      className={inputBase}
                      required
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                      <EnvelopeIcon />
                    </span>
                  </div>
                  <div className="relative">
                    <label htmlFor="auth-password" className="sr-only">Mật khẩu</label>
                    <input
                      id="auth-password"
                      name="password"
                      type={loginShowPassword ? "text" : "password"}
                      placeholder="Mật khẩu"
                      autoComplete="current-password"
                      className={inputBase}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setLoginShowPassword((p) => !p)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-white/40 hover:text-white/70"
                      aria-label={loginShowPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                    >
                      <EyeIcon open={loginShowPassword} />
                    </button>
                  </div>
                  <div className="flex justify-end">
                    <Link href="/forgot-password" className="text-sm text-white/60 hover:text-[#e6b800] transition-colors" onClick={onClose}>
                      Quên mật khẩu?
                    </Link>
                  </div>
                  <button
                    type="submit"
                    disabled={loginLoading}
                    className="w-full h-12 rounded-xl bg-[#e6b800] text-[#0a0a0c] font-semibold hover:bg-[#d4a800] active:scale-[0.99] disabled:opacity-50 disabled:active:scale-100 transition-all"
                  >
                    {loginLoading ? "Đang đăng nhập..." : "Đăng nhập"}
                  </button>
                </form>
                <div className="relative my-6">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-white/10" />
                  </div>
                  <div className="relative flex justify-center">
                    <span className="bg-[#1a1a1e] px-3 text-xs text-white/50 uppercase tracking-wider">Hoặc</span>
                  </div>
                </div>
                <form
                  action={async () => {
                    setGoogleLoading(true);
                    try {
                      await signInWithGoogle();
                    } catch (e) {
                      setGoogleLoading(false);
                      setLoginError("Không thể kết nối với Google. Vui lòng thử lại.");
                    }
                  }}
                  className="flex"
                >
                  <button
                    type="submit"
                    disabled={googleLoading}
                    className="w-full flex items-center justify-center gap-2 h-12 rounded-xl bg-white/5 border border-white/10 text-white/90 hover:bg-white/10 hover:border-white/15 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
                  >
                    {googleLoading ? (
                      <>
                        <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        Đang chuyển hướng...
                      </>
                    ) : (
                      <>
                        <GoogleIcon />
                        Đăng nhập bằng Google
                      </>
                    )}
                  </button>
                </form>
              </>
            )}

            {tab === "register" && !registerDone && (
              <>
                <div className="text-center mb-6">
                  <h2 className="text-xl font-bold text-white">Tạo tài khoản mới</h2>
                  <p className="text-white/60 text-sm mt-1">Tham gia cộng đồng Rạp Phim ngay hôm nay</p>
                </div>
                {registerError ? (
                  <div className="mb-4 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                    {registerError}
                  </div>
                ) : null}
                <form onSubmit={handleRegisterSubmit} className="space-y-4">
                  <div className="relative">
                    <label htmlFor="auth-name" className="sr-only">Tên người dùng</label>
                    <input
                      id="auth-name"
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Tên người dùng"
                      autoComplete="username"
                      className={inputBase}
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                      <UserIcon />
                    </span>
                  </div>
                  <div className="relative">
                    <label htmlFor="auth-reg-email" className="sr-only">Email</label>
                    <input
                      id="auth-reg-email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Email"
                      autoComplete="email"
                      className={inputBase}
                      required
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                      <EnvelopeIcon />
                    </span>
                  </div>
                  <div className="relative">
                    <label htmlFor="auth-reg-password" className="sr-only">Mật khẩu</label>
                    <input
                      id="auth-reg-password"
                      type={registerShowPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Mật khẩu (6-15 ký tự)"
                      autoComplete="new-password"
                      minLength={6}
                      maxLength={15}
                      className={inputBase}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setRegisterShowPassword((p) => !p)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-white/40 hover:text-white/70"
                      aria-label={registerShowPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                    >
                      <EyeIcon open={registerShowPassword} />
                    </button>
                  </div>
                  <div className="relative">
                    <label htmlFor="auth-reg-confirm" className="sr-only">Xác nhận mật khẩu</label>
                    <input
                      id="auth-reg-confirm"
                      type={confirmShowPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Xác nhận mật khẩu"
                      autoComplete="new-password"
                      minLength={6}
                      maxLength={15}
                      className={inputBase}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setConfirmShowPassword((p) => !p)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-white/40 hover:text-white/70"
                      aria-label={confirmShowPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                    >
                      <EyeIcon open={confirmShowPassword} />
                    </button>
                  </div>
                  <button
                    type="submit"
                    disabled={registerLoading}
                    className="w-full h-12 rounded-xl bg-[#e6b800] text-[#0a0a0c] font-semibold hover:bg-[#d4a800] active:scale-[0.99] disabled:opacity-50 disabled:active:scale-100 transition-all"
                  >
                    {registerLoading ? "Đang đăng ký..." : "Đăng ký"}
                  </button>
                </form>
                <div className="relative my-6">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-white/10" />
                  </div>
                  <div className="relative flex justify-center">
                    <span className="bg-[#1a1a1e] px-3 text-xs text-white/50 uppercase tracking-wider">Hoặc</span>
                  </div>
                </div>
                <form
                  action={async () => {
                    setGoogleLoading(true);
                    try {
                      await signInWithGoogle();
                    } catch (e) {
                      setGoogleLoading(false);
                      setRegisterError("Không thể kết nối với Google. Vui lòng thử lại.");
                    }
                  }}
                  className="flex"
                >
                  <button
                    type="submit"
                    disabled={googleLoading}
                    className="w-full flex items-center justify-center gap-2 h-12 rounded-xl bg-white/5 border border-white/10 text-white/90 hover:bg-white/10 hover:border-white/15 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
                  >
                    {googleLoading ? (
                      <>
                        <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        Đang chuyển hướng...
                      </>
                    ) : (
                      <>
                        <GoogleIcon />
                        Đăng ký bằng Google
                      </>
                    )}
                  </button>
                </form>
              </>
            )}

            {tab === "register" && registerDone && (
              <div className="text-center pt-2">
                <span className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-green-500/15 text-green-400 mb-4">
                  <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 13l4 4L19 7" />
                  </svg>
                </span>
                <h2 className="text-xl font-bold text-white mb-2">Đăng ký thành công</h2>
                {emailSent ? (
                  <>
                    <p className="text-white/90 text-sm mb-1">Chúng tôi đã gửi email xác minh đến hộp thư của bạn.</p>
                    <p className="text-white/60 text-sm mb-2">Vui lòng mở email và nhấn link xác minh. Chỉ khi xác minh xong bạn mới có thể đăng nhập.</p>
                    <p className="text-white/50 text-xs mb-6">Nếu không thấy email, hãy kiểm tra thư mục spam.</p>
                  </>
                ) : (
                  <p className="text-amber-400 text-sm mb-6">Không gửi được email. Vui lòng kiểm tra cấu hình server hoặc RESEND_API_KEY.</p>
                )}
                <button
                  type="button"
                  onClick={() => { setRegisterDone(false); setTab("login"); }}
                  className="w-full h-12 rounded-xl bg-[#e6b800] text-[#0a0a0c] font-semibold hover:bg-[#d4a800] active:scale-[0.99] transition-all"
                >
                  Đi tới đăng nhập
                </button>
              </div>
            )}
            </div>
            <p className="mt-6 pt-4 border-t border-white/10 text-center text-xs text-white/50">
              Bằng việc đăng nhập/đăng ký, bạn đồng ý với{" "}
              <Link href="/dieu-khoan" className="text-white/70 hover:text-[#e6b800] transition-colors" onClick={onClose}>
                Điều khoản sử dụng
              </Link>
              {" và "}
              <Link href="/chinh-sach-bao-mat" className="text-white/70 hover:text-[#e6b800] transition-colors" onClick={onClose}>
                Chính sách bảo mật
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
