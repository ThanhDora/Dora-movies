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

const isDevelopment = process.env.NODE_ENV === "development";

if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
}

const nextAuthUrl = process.env.NEXTAUTH_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");
const googleCallbackUrl = `${nextAuthUrl}/api/auth/callback/google`;

if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
  throw new Error("GOOGLE_CLIENT_ID và GOOGLE_CLIENT_SECRET phải được cấu hình trong environment variables");
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  secret,
  trustHost: true,
  debug: isDevelopment,
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
      if (user?.id) {
        token.userId = user.id;
        try {
          const dbUser = await getUserById(user.id);
          if (dbUser) {
            token.role = dbUser.role;
            token.vip_until = dbUser.vip_until;
          }
        } catch {
          //
        }
      } else if (token.email && !token.userId) {
        try {
          const dbUser = await getUserByEmail(token.email);
          if (dbUser) {
            token.userId = dbUser.id;
            token.role = dbUser.role;
            token.vip_until = dbUser.vip_until;
          }
        } catch {
          //
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        if (token.userId) {
          session.user.id = token.userId as string;
          session.user.role = (token.role as UserRole) ?? "free";
          session.user.vip_until = (token.vip_until as string | null) ?? null;
        } else if (token.email) {
          try {
            const dbUser = await getUserByEmail(token.email);
            if (dbUser) {
              session.user.id = dbUser.id;
              session.user.role = dbUser.role;
              session.user.vip_until = dbUser.vip_until;
            }
          } catch {
            //
          }
        }
        if (!session.user.id) {
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
