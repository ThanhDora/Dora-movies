import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import Facebook from "next-auth/providers/facebook";
import Credentials from "next-auth/providers/credentials";
import { compare } from "bcryptjs";
import { getUserByEmail, upsertUserFromAuth } from "@/lib/db";
import type { UserRole } from "@/types/db";

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

const secret = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET || (process.env.NODE_ENV === "development" ? "dev-secret-min-32-chars-long" : undefined);

export const { handlers, auth, signIn, signOut } = NextAuth({
  secret,
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
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
        const user = await getUserByEmail(credentials.email);
        if (!user?.password_hash) return null;
        const pass = credentials.password;
        if (typeof pass !== "string") return null;
        const ok = await compare(pass, user.password_hash);
        if (!ok) return null;
        return { id: user.id, email: user.email, name: user.name, image: user.image };
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider === "credentials") return true;
      if (!user.email || !account?.providerAccountId) return false;
      const authId = `${account.provider}_${account.providerAccountId}`;
      const name = user.name ?? (profile as { name?: string })?.name ?? null;
      const image = user.image ?? (profile as { picture?: string })?.picture ?? null;
      await upsertUserFromAuth({ authId, email: user.email, name, image });
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
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
  session: { strategy: "jwt", maxAge: 30 * 24 * 60 * 60 },
});
