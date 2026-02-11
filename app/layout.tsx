import type { Metadata, Viewport } from "next";
import "./globals.css";
import SessionProvider from "@/components/SessionProvider";

const siteName = process.env.NEXT_PUBLIC_SITE_NAME;
export const metadata: Metadata = {
  title: `${siteName} - Xem phim online`,
  description: "Xem phim online miễn phí",
  icons: { icon: "/logo.png", apple: "/logo.png" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#0a0d0e",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" suppressHydrationWarning>
      <body className="bg-[#0a0d0e] text-[#ededed] antialiased">
        <SessionProvider>{children}</SessionProvider>
      </body>
    </html>
  );
}
