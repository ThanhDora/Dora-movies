import Link from "next/link";

export default function Footer({ html }: { html: string }) {
  if (!html) {
    return (
      <footer id="footer" className="w-full max-w-[1600px] mx-auto px-3 sm:px-4 py-8 sm:py-12 text-center text-white/70 text-sm">
        <p>
          <Link href="/" className="hover:text-[#ff2a14] transition-colors">Trang chủ</Link>
          <span className="mx-2">|</span>
          <Link href="/catalog" className="hover:text-[#ff2a14] transition-colors">Danh sách phim</Link>
        </p>
        <p className="mt-2">Copyright © {new Date().getFullYear()}</p>
      </footer>
    );
  }
  return (
    <div
      id="footer"
      className="w-full max-w-[1600px] mx-auto px-3 sm:px-4 py-8 sm:py-12 text-white/70 text-sm [&_a]:text-white/70 [&_a:hover]:text-[#ff2a14]"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
