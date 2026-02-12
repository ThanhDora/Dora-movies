import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { isAdmin } from "@/lib/vip";
import { sendNewMovieNotification } from "@/lib/telegram";
import { getMovie } from "@/lib/api";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id || !isAdmin(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { slugs } = body;
    
    if (!Array.isArray(slugs) || slugs.length === 0) {
      return NextResponse.json({ error: "Invalid slugs" }, { status: 400 });
    }

    const maxNotifications = 10;
    const slugsToNotify = slugs.slice(0, maxNotifications);

    for (const slug of slugsToNotify) {
      try {
        const { currentMovie } = await getMovie(slug);
        await sendNewMovieNotification({
          name: currentMovie.name || slug,
          origin_name: currentMovie.origin_name || undefined,
          slug: currentMovie.slug,
          image: currentMovie.poster_url || currentMovie.thumb_url || undefined,
          year: currentMovie.publish_year,
          description: currentMovie.content || undefined,
        });
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch {
      }
    }

    return NextResponse.json({ 
      ok: true, 
      notified: slugsToNotify.length,
      total: slugs.length 
    });
  } catch (e) {
    return NextResponse.json({ error: "Failed to send notifications" }, { status: 500 });
  }
}
