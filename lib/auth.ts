import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export const authOptions: NextAuthOptions = {
  debug: true,
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  session: { strategy: "jwt" },
  callbacks: {
    async signIn({ user }) {
      if (!user.email || !user.name) return false;

      try {
        // ACTUAL DATABASE MAGIC: Check if user exists, if not, create them in Neon
        const existing = await db.select().from(users).where(eq(users.email, user.email)).limit(1);

        if (existing.length === 0) {
          const [created] = await db.insert(users).values({ email: user.email, name: user.name }).returning();
          user.id = created.id; // This gives you the real UUID!
        } else {
          user.id = existing[0].id;
        }
      } catch (error) {
        console.error("DB error during sign-in:", error);
      }
      return true;
    },
    async jwt({ token, user }) {
      if (user) token.userId = user.id;

      // Keep token synced with real database values
      if (token.userId) {
        try {
          const dbUser = await db.select({ companyId: users.companyId, role: users.role })
            .from(users).where(eq(users.id, token.userId as string)).limit(1);

          if (dbUser.length > 0) {
            token.companyId = dbUser[0].companyId;
            token.role = dbUser[0].role;
          }
        } catch (error) {
          console.error("DB error during JWT refresh:", error);
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
