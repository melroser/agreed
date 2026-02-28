import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async signIn({ user, account }) {
      if (!user.email || !user.name) return false;

      try {
        // Upsert user in DB on every sign-in
        const existing = await db
          .select()
          .from(users)
          .where(eq(users.email, user.email))
          .limit(1);

        if (existing.length === 0) {
          const [created] = await db
            .insert(users)
            .values({ email: user.email, name: user.name })
            .returning();
          user.id = created.id;
        } else {
          user.id = existing[0].id;
        }
      } catch (error) {
        console.error("DB error during sign-in (continuing anyway):", error);
        // Don't block sign-in if DB is down — let them in with JWT
      }

      return true;
    },
    async jwt({ token, user, trigger }) {
      // On initial sign-in, set userId from the DB record
      if (user) {
        token.userId = user.id;
      }

      // Refresh companyId/role from DB on every token refresh
      // This ensures the token stays in sync after onboarding
      if (token.userId) {
        try {
          const dbUser = await db
            .select({ companyId: users.companyId, role: users.role })
            .from(users)
            .where(eq(users.id, token.userId as string))
            .limit(1);

          if (dbUser.length > 0) {
            token.companyId = dbUser[0].companyId;
            token.role = dbUser[0].role;
          }
        } catch (error) {
          console.error("DB error during JWT refresh (using cached token):", error);
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.userId ?? token.sub;
        (session.user as any).companyId = token.companyId ?? null;
        (session.user as any).role = token.role ?? null;
      }
      return session;
    },
  },
  pages: {
    signIn: "/",
    error: "/",
  },
};
