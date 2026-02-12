import Link from "next/link";
import Image from "next/image";

function HomeIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
    </svg>
  );
}

function FilmIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" />
    </svg>
  );
}

function CategoryIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
    </svg>
  );
}

function GlobeIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 2 2 2 0 012 2V15M8 21a2 2 0 002-2v-1a2 2 0 012-2h6a2 2 0 012 2v1a2 2 0 002 2M8 21h8m-8 0a2 2 0 01-2-2v-1a2 2 0 012-2h8a2 2 0 012 2v1a2 2 0 01-2 2" />
    </svg>
  );
}

function FireIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
    </svg>
  );
}

function UpdateIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
    </svg>
  );
}

function MailIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
  );
}

function FacebookIcon() {
  return (
    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  );
}

function TwitterIcon() {
  return (
    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
      <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" />
    </svg>
  );
}

function UserIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  );
}

export default function Footer({ html }: { html: string }) {
  if (html) {
    return (
      <div
        id="footer"
        className="w-full bg-linear-to-b from-[#0a0a0d] to-[#050507] border-t border-white/10 mt-auto"
      >
        <div className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 text-white/70 text-sm [&_a]:text-white/70 [&_a:hover]:text-[#ff2a14] [&_a]:transition-colors"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      </div>
    );
  }

  return (
    <footer id="footer" className="w-full bg-[#0a0a0d] border-t border-white/10 mt-auto">
      <div className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-10 lg:py-14">
        <div className="flex flex-col sm:grid sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-8 lg:gap-10 mb-4 sm:mb-8 lg:mb-10">
          <div className="space-y-2 sm:space-y-3">
            <Link href="/" className="flex items-center gap-2.5 mb-2 sm:mb-3 group">
              <Image
                src="/anime.png"
                alt="Dora Movies"
                width={200}
                height={60}
                className="h-8 sm:h-12 lg:h-14 w-auto object-contain"
                priority
              />
              <h3 className="text-white font-bold text-sm sm:text-lg lg:text-xl">
                Dora Movies
              </h3>
            </Link>
            <p className="hidden sm:block text-white/70 text-xs sm:text-sm leading-relaxed">
              Xem phim online miễn phí chất lượng cao. Cập nhật phim mới mỗi ngày với đầy đủ thể loại phong phú.
            </p>
            <div className="hidden sm:flex items-center gap-2 pt-1">
              <a href="#" className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/15 flex items-center justify-center text-white/80 hover:text-[#ff2a14] transition-colors">
                <FacebookIcon />
              </a>
              <a href="#" className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/15 flex items-center justify-center text-white/80 hover:text-[#ff2a14] transition-colors">
                <TwitterIcon />
              </a>
            </div>
          </div>

          <div className="space-y-2 sm:space-y-2.5">
            <h4 className="text-white font-semibold text-xs sm:text-sm mb-2 sm:mb-2.5 flex items-center gap-1.5 sm:gap-2">
              <span className="w-0.5 h-3 sm:h-4 bg-[#ff2a14] rounded-full" />
              <span className="hidden sm:inline">Danh mục</span>
              <span className="sm:hidden">Danh mục</span>
            </h4>
            <ul className="grid grid-cols-2 sm:grid-cols-1 gap-2 sm:space-y-2 sm:space-y-2.5">
              <li>
                <Link href="/" className="flex items-center gap-1.5 sm:gap-2 text-white/80 hover:text-[#ff2a14] transition-colors text-xs sm:text-sm">
                  <HomeIcon />
                  <span>Trang chủ</span>
                </Link>
              </li>
              <li>
                <Link href="/catalog" className="flex items-center gap-1.5 sm:gap-2 text-white/80 hover:text-[#ff2a14] transition-colors text-xs sm:text-sm">
                  <FilmIcon />
                  <span>Danh sách phim</span>
                </Link>
              </li>
              <li>
                <Link href="/catalog?types=series" className="flex items-center gap-1.5 sm:gap-2 text-white/80 hover:text-[#ff2a14] transition-colors text-xs sm:text-sm">
                  <FilmIcon />
                  <span>Phim bộ</span>
                </Link>
              </li>
              <li>
                <Link href="/catalog?types=single" className="flex items-center gap-1.5 sm:gap-2 text-white/80 hover:text-[#ff2a14] transition-colors text-xs sm:text-sm">
                  <FilmIcon />
                  <span>Phim lẻ</span>
                </Link>
              </li>
            </ul>
          </div>

          <div className="space-y-2 sm:space-y-2.5">
            <h4 className="text-white font-semibold text-xs sm:text-sm mb-2 sm:mb-2.5 flex items-center gap-1.5 sm:gap-2">
              <span className="w-0.5 h-3 sm:h-4 bg-[#ff2a14] rounded-full" />
              Thông tin
            </h4>
            <ul className="grid grid-cols-2 sm:grid-cols-1 gap-2 sm:space-y-2 sm:space-y-2.5">
              <li>
                <Link href="/the-loai" className="flex items-center gap-1.5 sm:gap-2 text-white/80 hover:text-[#ff2a14] transition-colors text-xs sm:text-sm">
                  <CategoryIcon />
                  <span>Thể loại</span>
                </Link>
              </li>
              <li>
                <Link href="/quoc-gia" className="flex items-center gap-1.5 sm:gap-2 text-white/80 hover:text-[#ff2a14] transition-colors text-xs sm:text-sm">
                  <GlobeIcon />
                  <span>Quốc gia</span>
                </Link>
              </li>
              <li>
                <Link href="/catalog?sorts=view" className="flex items-center gap-1.5 sm:gap-2 text-white/80 hover:text-[#ff2a14] transition-colors text-xs sm:text-sm">
                  <FireIcon />
                  <span>Phim hot</span>
                </Link>
              </li>
              <li>
                <Link href="/catalog?sorts=update" className="flex items-center gap-1.5 sm:gap-2 text-white/80 hover:text-[#ff2a14] transition-colors text-xs sm:text-sm">
                  <UpdateIcon />
                  <span>Mới cập nhật</span>
                </Link>
              </li>
            </ul>
          </div>

          <div className="space-y-2 sm:space-y-2.5">
            <h4 className="text-white font-semibold text-xs sm:text-sm mb-2 sm:mb-2.5 flex items-center gap-1.5 sm:gap-2">
              <span className="w-0.5 h-3 sm:h-4 bg-[#ff2a14] rounded-full" />
              Liên hệ
            </h4>
            <ul className="grid grid-cols-2 sm:grid-cols-1 gap-2 sm:space-y-2 sm:space-y-2.5">
              <li>
                <a href="mailto:support@doramovies.com" className="flex items-center gap-1.5 sm:gap-2 text-white/80 hover:text-[#ff2a14] transition-colors text-xs sm:text-sm">
                  <MailIcon />
                  <span>Email hỗ trợ</span>
                </a>
              </li>
              <li>
                <a href="#" className="flex items-center gap-1.5 sm:gap-2 text-white/80 hover:text-[#ff2a14] transition-colors text-xs sm:text-sm">
                  <FacebookIcon />
                  <span>Facebook</span>
                </a>
              </li>
              <li>
                <a href="#" className="flex items-center gap-1.5 sm:gap-2 text-white/80 hover:text-[#ff2a14] transition-colors text-xs sm:text-sm">
                  <TwitterIcon />
                  <span>Twitter</span>
                </a>
              </li>
              <li>
                <Link href="/profile" className="flex items-center gap-1.5 sm:gap-2 text-white/80 hover:text-[#ff2a14] transition-colors text-xs sm:text-sm">
                  <UserIcon />
                  <span>Tài khoản</span>
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-white/10 pt-3 sm:pt-6">
          <div className="flex flex-col gap-2 sm:flex-row sm:justify-between sm:items-center">
            <p className="text-white/60 text-xs text-center sm:text-left">
              Copyright © {new Date().getFullYear()} <span className="text-white/80 font-medium">Dora Movies</span>
            </p>
            <div className="flex items-center justify-center gap-2 sm:gap-3 text-xs">
              <Link href="#" className="text-white/60 hover:text-[#ff2a14] transition-colors">
                Điều khoản
              </Link>
              <span className="text-white/20">•</span>
              <Link href="#" className="text-white/60 hover:text-[#ff2a14] transition-colors">
                Chính sách
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
