import { handlers } from "@/lib/auth";
import { NextRequest } from "next/server";

export const { GET, POST } = handlers;

export async function GET_DEBUG(req: NextRequest) {
  const url = new URL(req.url);
  if (url.searchParams.get("debug") === "true" && process.env.NODE_ENV === "development") {
    return Response.json({
      googleClientId: process.env.GOOGLE_CLIENT_ID ? `${process.env.GOOGLE_CLIENT_ID.substring(0, 30)}...` : "MISSING",
      googleClientSecret: process.env.GOOGLE_CLIENT_SECRET ? "SET" : "MISSING",
      nextAuthUrl: process.env.NEXTAUTH_URL,
      vercelUrl: process.env.VERCEL_URL,
      callbackUrl: `${process.env.NEXTAUTH_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000")}/api/auth/callback/google`,
    });
  }
  return handlers.GET(req);
}
