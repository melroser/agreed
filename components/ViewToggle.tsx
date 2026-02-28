"use client";

import { useRouter, usePathname } from "next/navigation";

export type ViewMode = "admin" | "employee";

export default function ViewToggle() {
  const router = useRouter();
  const pathname = usePathname();

  const current: ViewMode = pathname.startsWith("/dashboard/employee")
    ? "employee"
    : "admin";

  const toggle = () => {
    if (current === "admin") {
      router.push("/dashboard/employee/skill-tree");
    } else {
      router.push("/dashboard/admin");
    }
  };

  return (
    <button
      onClick={toggle}
      className="flex items-center gap-2 w-full px-3 py-2 rounded-lg border border-gray-200 bg-gray-50 hover:bg-white transition-all duration-150 text-sm"
      aria-label={`Switch to ${current === "admin" ? "Employee" : "Admin"} view`}
    >
      <span className={`transition-colors duration-150 ${current === "admin" ? "text-green-700 font-semibold" : "text-gray-400"}`}>
        Admin
      </span>
      <div className="relative w-10 h-5 bg-green-100 rounded-full mx-auto flex-shrink-0">
        <div
          className={`absolute top-0.5 w-4 h-4 rounded-full bg-green-600 transition-all duration-200 ease-out shadow-sm ${
            current === "employee" ? "translate-x-5" : "translate-x-0.5"
          }`}
        />
      </div>
      <span className={`transition-colors duration-150 ${current === "employee" ? "text-green-700 font-semibold" : "text-gray-400"}`}>
        Employee
      </span>
    </button>
  );
}
