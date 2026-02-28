"use client";

import { useSession, signOut } from "next-auth/react";
import { useRouter, usePathname } from "next/navigation";
import { useEffect } from "react";
import ViewToggle from "@/components/ViewToggle";
import Link from "next/link";

const adminLinks = [
  { href: "/dashboard/admin", label: "Dashboard", icon: "📊" },
  { href: "/dashboard/admin/departments", label: "Departments", icon: "🏢" },
  { href: "/dashboard/admin/roles", label: "Roles", icon: "👔" },
  { href: "/dashboard/admin/employees", label: "Employees", icon: "👥" },
];

const employeeLinks = [
  { href: "/dashboard/employee/skill-tree", label: "Skill Tree", icon: "🌳" },
  { href: "/dashboard/employee/assessment", label: "Assessment", icon: "📝" },
  { href: "/dashboard/employee/leaderboard", label: "Leaderboard", icon: "🏆" },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (status === "unauthenticated") router.replace("/");
    if (status === "authenticated" && !session?.user?.companyId) router.replace("/onboarding");
  }, [status, session, router]);

  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-green-50">
        <p className="text-gray-400">Loading...</p>
      </div>
    );
  }

  if (!session?.user?.companyId) return null;

  const isEmployee = pathname.startsWith("/dashboard/employee");
  const links = isEmployee ? employeeLinks : adminLinks;

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-60 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-100">
          <Link href="/dashboard/admin" className="text-2xl font-bold text-green-700">
            🌱 aGreend
          </Link>
        </div>

        <nav className="flex-1 p-3 space-y-1">
          {links.map((link) => {
            const active = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                  active
                    ? "bg-green-50 text-green-700 font-semibold"
                    : "text-gray-600 hover:bg-gray-50"
                }`}
              >
                <span>{link.icon}</span>
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-gray-100 space-y-3">
          <ViewToggle />
          <div className="text-xs text-gray-400 truncate">{session.user.name}</div>
          <button
            onClick={() => signOut({ callbackUrl: "/" })}
            className="text-xs text-red-500 hover:text-red-700 transition-colors"
          >
            Sign out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 p-8">{children}</main>
    </div>
  );
}
