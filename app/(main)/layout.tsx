import { Suspense } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import LoginSuccessToast from "@/components/LoginSuccessToast";
import { getHome } from "@/lib/api";
import { auth } from "@/lib/auth";
import { isVip } from "@/lib/vip";

export const dynamic = "force-dynamic";

export default async function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  const showAds =
    !session?.user || !isVip(session.user.role, session.user.vip_until ?? null);

  let menu: { name: string; link: string; children?: { name: string; link: string }[] }[] = [];
  let title = "Dora Movies";
  let footerHtml = "";
  let adsHeader = "";
  let adsCatfish = "";
  try {
    const home = await getHome();
    menu = home.menu || [];
    title = home.title || title;
    footerHtml = home.settings?.footer || "";
    adsHeader = home.settings?.ads_header || "";
    adsCatfish = home.settings?.ads_catfish || "";
  } catch {
    menu = [];
  }

  return (
    <>
      <Header menu={menu} siteTitle={title} />
      <Suspense fallback={null}><LoginSuccessToast /></Suspense>
      {showAds && adsHeader ? (
        <div className="w-full max-w-[1600px] mx-auto px-4" dangerouslySetInnerHTML={{ __html: adsHeader }} />
      ) : null}
      <div className="pt-14 md:pt-[70px] min-h-screen flex flex-col">
        {children}
        <Footer html={footerHtml} />
      </div>
      {showAds && adsCatfish ? (
        <div className="w-full max-w-[1600px] mx-auto px-4" dangerouslySetInnerHTML={{ __html: adsCatfish }} />
      ) : null}
    </>
  );
}
