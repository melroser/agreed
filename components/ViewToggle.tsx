"use client";

import { useState } from "react";
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
      className="flex items-center gap-2 px-4 py-2 rounded-lg border border-green-200 bg-white hover:bg-green-50 transition-colors text-sm font-medium"
      aria-label={`Switch to ${current === "admin" ? "Employee" : "Admin"} view`}
    >
      <span className={current === "admin" ? "text-green-700 font-semibold" : "text-gray-400"}>
        Admin
      </span>
      <div className="relative w-10 h-5 bg-green-100 rounded-full">
        <div
          className={`absolute top-0.5 w-4 h-4 rounded-full bg-green-600 transition-transform ${
            current === "employee" ? "translate-x-5" : "translate-x-0.5"
          }`}
        />
      </div>
      <span className={current === "employee" ? "text-green-700 font-semibold" : "text-gray-400"}>
        Employee
      </span>
    </button>
  );
}
