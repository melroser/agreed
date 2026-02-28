"use client";

import { signIn, signOut, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function Home() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "authenticated" && session?.user) {
      if (session.user.companyId) {
        router.replace("/dashboard");
      } else {
        router.replace("/onboarding");
      }
    }
  }, [status, session, router]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-green-50 to-white">
      <div className="text-center max-w-2xl px-6">
        {/* Logo / Brand */}
        <div className="mb-8">
          <h1 className="text-5xl font-bold text-green-700 tracking-tight">
            🌱 aGreend
          </h1>
          <p className="mt-3 text-lg text-gray-600">
            Green Skills Gap Intelligence Platform
          </p>
        </div>

        {/* Value Prop */}
        <p className="text-gray-500 mb-10 leading-relaxed">
          Assess, track, and close sustainability skills gaps across your
          workforce. Gamified skill trees, gap analytics, and actionable
          insights — all in one place.
        </p>

        {status === "loading" && (
          <div className="text-gray-400">Loading...</div>
        )}

        {status === "authenticated" && session?.user && (
          <div className="space-y-4">
            <div className="bg-white rounded-xl shadow-sm border border-green-100 p-6">
              <p className="text-sm text-gray-500">Signed in as</p>
              <p className="text-xl font-semibold text-gray-800 mt-1">
                {session.user.name}
              </p>
              <p className="text-sm text-gray-500">{session.user.email}</p>
            </div>
            <p className="text-gray-400 text-sm">Redirecting...</p>
          </div>
        )}

        {status === "unauthenticated" && (
          <button
            onClick={() => signIn("google")}
            className="inline-flex items-center gap-3 px-8 py-4 bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-all text-gray-700 font-medium text-lg"
          >
            <svg className="w-6 h-6" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Sign in with Google
          </button>
        )}
      </div>
    </main>
  );
}
