import Link from "next/link";

export default function NotFound() {
  return (
    <main className="min-h-[70vh] flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-[560px] text-center py-12 px-8 bg-linear-to-br from-[#1a1c1f]/95 to-[#121416]/98 border border-white/5 rounded-2xl shadow-2xl animate-[fadeIn_0.5s_ease-out]">
        <span className="inline-block px-3.5 py-1.5 text-[11px] font-semibold tracking-wider uppercase text-white/70 bg-white/10 rounded-full mb-7">
          Lỗi
        </span>
        <h1 className="mb-4 text-6xl sm:text-8xl font-extrabold tracking-tight">
          <span className="bg-linear-to-br from-white via-white/80 to-white/50 bg-clip-text text-transparent drop-shadow-[0_2px_20px_rgba(201,38,38,0.25)]">
            404
          </span>
        </h1>
        <p className="text-xl font-semibold text-white mb-3">Không tìm thấy trang</p>
        <p className="text-[15px] text-white/60 leading-relaxed max-w-[360px] mx-auto mb-9">
          Trang bạn truy cập không tồn tại hoặc đã bị xóa. Kiểm tra lại đường dẫn hoặc quay về trang chủ.
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <Link
            href="/"
            className="inline-flex items-center justify-center px-7 py-3.5 text-[15px] font-semibold text-white bg-linear-to-b from-[#c92626] to-[#a61f1f] rounded-xl shadow-lg shadow-red-500/40 hover:from-[#d92a2a] hover:to-[#b82222] hover:shadow-red-500/50 hover:-translate-y-0.5 transition-all"
          >
            Về trang chủ
          </Link>
          <Link
            href="/catalog"
            className="inline-flex items-center justify-center px-7 py-3.5 text-[15px] font-semibold text-white/90 bg-white/10 border border-white/20 rounded-xl hover:bg-white/20 hover:-translate-y-0.5 transition-all"
          >
            Khám phá phim
          </Link>
        </div>
      </div>
    </main>
  );
}
