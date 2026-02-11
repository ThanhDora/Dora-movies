import { NextResponse } from "next/server";
import { getPrisma } from "@/lib/prisma";
import {
  getVerificationTokenByToken,
  deleteVerificationToken,
  setEmailVerified,
} from "@/lib/db";

function getLoginRedirect(req: Request, query: string): string {
  try {
    const u = new URL(req.url);
    return `${u.origin}/login?${query}`;
  } catch {
    const base = process.env.NEXTAUTH_URL || "http://localhost:3000";
    return `${base}/login?${query}`;
  }
}

export async function GET(req: Request) {
  try {
    if (!getPrisma()) {
      if (process.env.NODE_ENV === "development") {
        console.error("[verify-email] DATABASE_URL not set");
      }
      return NextResponse.redirect(getLoginRedirect(req, "error=verify_failed"));
    }
    const { searchParams } = new URL(req.url);
    const token = searchParams.get("token")?.trim();
    if (!token) {
      return NextResponse.redirect(getLoginRedirect(req, "error=missing_token"));
    }
    const row = await getVerificationTokenByToken(token);
    if (!row) {
      if (process.env.NODE_ENV === "development") {
        console.warn("[verify-email] Token not found in DB. Token length:", token.length);
      }
      return NextResponse.redirect(getLoginRedirect(req, "error=invalid_token"));
    }
    if (new Date() > row.expires) {
      await deleteVerificationToken(token);
      return NextResponse.redirect(getLoginRedirect(req, "error=expired_token"));
    }
    const email = row.email.trim().toLowerCase();
    await setEmailVerified(email);
    await deleteVerificationToken(token);
    if (process.env.NODE_ENV === "development") {
      console.log("[verify-email] Verified:", email);
    }
    return NextResponse.redirect(getLoginRedirect(req, "verified=1"));
  } catch (e) {
    if (process.env.NODE_ENV === "development") {
      console.error("[verify-email]", e);
    }
    return NextResponse.redirect(getLoginRedirect(req, "error=verify_failed"));
  }
}
