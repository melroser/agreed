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
      <div className="flex min-h-screen items-center justify-center bg-eco-50">
        <div className="text-center animate-fade-in">
          <div className="spinner-lg mx-auto mb-3" />
          <p className="text-gray-400 text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  if (!session?.user?.companyId) return null;

  const isEmployee = pathname.startsWith("/dashboard/employee");
  const links = isEmployee ? employeeLinks : adminLinks;

  return (
    <div className="flex min-h-screen bg-gray-50/50">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200/80 flex flex-col shadow-sm">
        {/* Logo area with company branding placeholder */}
        <div className="p-5 border-b border-gray-100">
          <Link href="/dashboard/admin" className="flex items-center gap-3 group">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center text-white text-lg shadow-sm group-hover:shadow-md transition-shadow">
              🌱
            </div>
            <div>
              <span className="text-lg font-bold text-green-700 tracking-tight">aGreend</span>
              <p className="text-[10px] text-gray-400 -mt-0.5 uppercase tracking-wider">Skills Platform</p>
            </div>
          </Link>
        </div>

        <nav className="flex-1 p-3 space-y-0.5">
          {links.map((link) => {
            const active = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-150 ${
                  active
                    ? "bg-green-50 text-green-700 font-semibold shadow-sm border border-green-100"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-800"
                }`}
              >
                <span className="text-base">{link.icon}</span>
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-gray-100 space-y-3">
          <ViewToggle />
          <div className="flex items-center gap-2 px-1">
            <div className="w-7 h-7 rounded-full bg-green-100 flex items-center justify-center text-green-700 text-xs font-bold">
              {session.user.name?.charAt(0)?.toUpperCase() || "?"}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-medium text-gray-700 truncate">{session.user.name}</div>
              <div className="text-[10px] text-gray-400 truncate">{session.user.email}</div>
            </div>
          </div>
          <button
            onClick={() => signOut({ callbackUrl: "/" })}
            className="w-full text-xs text-gray-400 hover:text-red-500 transition-colors py-1 text-left px-1"
          >
            Sign out →
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 p-8 overflow-auto animate-fade-in">{children}</main>
    </div>
  );
}
