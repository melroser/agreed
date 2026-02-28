import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";

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
    async signIn({ user }) {
      if (!user.email || !user.name) return false;
      return true; // Just let them in! No DB needed for login.
    },
    async jwt({ token, user }) {
      // On initial sign-in, grab the Google ID
      if (user) {
        token.userId = user.id;
        
        // HACKATHON SHORTCUT: Hardcode these for now so you can build the UI!
        // We will fix the DB connection later.
        token.companyId = "demo-company-123"; 
        token.role = "Owner";
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
  // I removed your custom error page temporarily. 
  // If it crashes now, NextAuth will show us exactly why instead of silently bouncing you!
};
