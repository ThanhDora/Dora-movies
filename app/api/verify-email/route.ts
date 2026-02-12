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
      return NextResponse.redirect(getLoginRedirect(req, "error=verify_failed"));
    }
    const { searchParams } = new URL(req.url);
    const token = searchParams.get("token")?.trim();
    if (!token) {
      return NextResponse.redirect(getLoginRedirect(req, "error=missing_token"));
    }
    const row = await getVerificationTokenByToken(token);
    if (!row) {
      return NextResponse.redirect(getLoginRedirect(req, "error=invalid_token"));
    }
    if (new Date() > row.expires) {
      await deleteVerificationToken(token);
      return NextResponse.redirect(getLoginRedirect(req, "error=expired_token"));
    }
    const email = row.email.trim().toLowerCase();
    await setEmailVerified(email);
    await deleteVerificationToken(token);
    return NextResponse.redirect(getLoginRedirect(req, "verified=1"));
  } catch (e) {
    return NextResponse.redirect(getLoginRedirect(req, "error=verify_failed"));
  }
}
