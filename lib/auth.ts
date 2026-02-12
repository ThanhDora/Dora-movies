import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import Facebook from "next-auth/providers/facebook";
import Credentials from "next-auth/providers/credentials";
import { CredentialsSignin } from "next-auth";
import { compare } from "bcryptjs";
import { getUserByEmail, getUserById, upsertUserFromAuth } from "@/lib/db";
import { sendLoginNotificationEmail } from "@/lib/email";
import type { UserRole } from "@/types/db";

class EmailNotVerifiedError extends CredentialsSignin {
  code = "email_not_verified";
}

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      name?: string | null;
      image?: string | null;
      role: UserRole;
      vip_until: string | null;
    };
  }
}

const secret =
  process.env.AUTH_SECRET ||
  process.env.NEXTAUTH_SECRET ||
  (process.env.NODE_ENV === "development" ? "dev-secret-min-32-chars-long" : undefined) ||
  (typeof process.env.NEXTAUTH_URL === "string" && process.env.NEXTAUTH_URL
    ? Buffer.from(process.env.NEXTAUTH_URL + "fallback-secret-salt", "utf8").toString("base64").slice(0, 32)
    : "production-fallback-secret-min-32-chars");

if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
  console.warn("[NextAuth] GOOGLE_CLIENT_ID hoặc GOOGLE_CLIENT_SECRET chưa được cấu hình");
}

const nextAuthUrl = process.env.NEXTAUTH_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");
const googleCallbackUrl = `${nextAuthUrl}/api/auth/callback/google`;

console.log("[NextAuth] Google OAuth Config:", {
  clientId: process.env.GOOGLE_CLIENT_ID ? `${process.env.GOOGLE_CLIENT_ID.substring(0, 30)}...` : "MISSING",
  callbackUrl: googleCallbackUrl,
  nextAuthUrl,
  envNextAuthUrl: process.env.NEXTAUTH_URL,
  vercelUrl: process.env.VERCEL_URL,
  nodeEnv: process.env.NODE_ENV,
});

if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
  throw new Error("GOOGLE_CLIENT_ID và GOOGLE_CLIENT_SECRET phải được cấu hình trong environment variables");
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  secret,
  trustHost: true,
  debug: process.env.NODE_ENV === "development",
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      allowDangerousEmailAccountLinking: true,
    }),
    Facebook({
      clientId: process.env.FACEBOOK_CLIENT_ID!,
      clientSecret: process.env.FACEBOOK_CLIENT_SECRET!,
      allowDangerousEmailAccountLinking: true,
    }),
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Mật khẩu", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || typeof credentials.email !== "string") return null;
        let user;
        try {
          user = await getUserByEmail(credentials.email);
        } catch (e) {
          const msg = e instanceof Error ? e.message : "";
          if (msg.includes("Can't reach database") || msg.includes("host:5432") || msg.includes("DATABASE_URL")) {
            throw new CredentialsSignin("Chưa kết nối được database. Trên Vercel: cấu hình DATABASE_URL (postgresql://...) trong Environment Variables.");
          }
          throw e;
        }
        if (!user?.password_hash) return null;
        const pass = credentials.password;
        if (typeof pass !== "string") return null;
        const ok = await compare(pass, user.password_hash);
        if (!ok) return null;
        if (!user.email_verified_at) throw new EmailNotVerifiedError();
        return { id: user.id, email: user.email, name: user.name, image: user.image };
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider === "credentials") {
        if (user?.email) sendLoginNotificationEmail(user.email).catch(() => {});
        return true;
      }
      if (account?.provider === "google") {
        if (!user.email || !account?.providerAccountId) {
          console.error("[NextAuth] Google signIn: missing email or providerAccountId", { email: user.email, providerAccountId: account?.providerAccountId });
          return false;
        }
        try {
          const authId = `${account.provider}_${account.providerAccountId}`;
          const name = user.name ?? (profile as { name?: string })?.name ?? null;
          const image = user.image ?? (profile as { picture?: string })?.picture ?? null;
          await upsertUserFromAuth({ authId, email: user.email, name, image });
          if (user.email) sendLoginNotificationEmail(user.email).catch(() => {});
          return true;
        } catch (e) {
          console.error("[NextAuth] Google signIn callback error:", e);
          throw e;
        }
      }
      if (!user.email || !account?.providerAccountId) return false;
      const authId = `${account.provider}_${account.providerAccountId}`;
      const name = user.name ?? (profile as { name?: string })?.name ?? null;
      const image = user.image ?? (profile as { picture?: string })?.picture ?? null;
      await upsertUserFromAuth({ authId, email: user.email, name, image });
      if (user.email) sendLoginNotificationEmail(user.email).catch(() => {});
      return true;
    },
    async jwt({ token, user }) {
      if (token.email) {
        const dbUser = await getUserByEmail(token.email);
        if (dbUser) {
          token.userId = dbUser.id;
          token.role = dbUser.role;
          token.vip_until = dbUser.vip_until;
        }
      }
      if (user?.id) token.userId = user.id;
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = (token.userId as string) ?? "";
        session.user.role = (token.role as UserRole) ?? "free";
        session.user.vip_until = (token.vip_until as string | null) ?? null;
        const userId = session.user.id;
        if (userId) {
          const dbUser = await getUserById(userId);
          if (dbUser) {
            if (dbUser.image != null) session.user.image = dbUser.image;
            session.user.name = dbUser.name ?? session.user.name;
          }
        }
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60,
    updateAge: 24 * 60 * 60,
  },
});
