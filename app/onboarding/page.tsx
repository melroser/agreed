"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";

const INDUSTRIES = ["Tech", "Manufacturing", "Retail", "Healthcare", "Other"];

export default function OnboardingPage() {
  const { data: session, status, update } = useSession();
  const router = useRouter();
  const [name, setName] = useState("");
  const [industry, setIndustry] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") router.replace("/");
    if (status === "authenticated" && session?.user?.companyId) router.replace("/dashboard");
  }, [status, session, router]);

  if (status === "loading") {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-eco-50 via-white to-emerald-50/30">
        <div className="text-center animate-fade-in">
          <div className="spinner-lg mx-auto mb-3" />
          <p className="text-gray-400 text-sm">Loading...</p>
        </div>
      </main>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!name.trim() || name.trim().length < 2) {
      setError("Company name must be at least 2 characters.");
      return;
    }
    if (!industry) {
      setError("Please select an industry.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/company", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), industry }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Something went wrong.");
        setSubmitting(false);
        return;
      }

      await update();
      router.push("/dashboard");
    } catch {
      setError("Network error. Please try again.");
      setSubmitting(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-eco-50 via-white to-emerald-50/30 relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-green-200/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-emerald-200/20 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-md px-6 relative z-10 animate-slide-up">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600 text-2xl shadow-lg shadow-green-200/50 mb-4">
            🌱
          </div>
          <h1 className="text-3xl font-bold text-green-800 tracking-tight">Welcome to aGreend</h1>
          <p className="mt-2 text-gray-500">Set up your company to get started</p>
        </div>

        <form onSubmit={handleSubmit} className="card p-8 space-y-6">
          <div>
            <label htmlFor="company-name" className="block text-sm font-medium text-gray-700 mb-1.5">
              Company Name
            </label>
            <input
              id="company-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. GreenCorp"
              maxLength={100}
              className="input"
            />
          </div>

          <div>
            <label htmlFor="industry" className="block text-sm font-medium text-gray-700 mb-1.5">
              Industry
            </label>
            <select
              id="industry"
              value={industry}
              onChange={(e) => setIndustry(e.target.value)}
              className="select"
            >
              <option value="">Select an industry</option>
              {INDUSTRIES.map((ind) => (
                <option key={ind} value={ind}>{ind}</option>
              ))}
            </select>
          </div>

          {error && (
            <p className="text-red-600 text-sm animate-fade-in" role="alert">{error}</p>
          )}

          <button type="submit" disabled={submitting} className="btn-primary w-full py-3 text-base">
            {submitting ? (
              <span className="inline-flex items-center gap-2">
                <span className="spinner !border-white/30 !border-t-white !w-4 !h-4" />
                Creating...
              </span>
            ) : (
              "Create Company →"
            )}
          </button>
        </form>
      </div>
    </main>
  );
}
