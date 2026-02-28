"use client";

import { useState, useEffect } from "react";

interface Department {
  id: string;
  name: string;
}

interface Role {
  id: string;
  departmentId: string;
  function: string;
  title: string;
  skillCount: number;
  createdAt: string;
}

const FUNCTIONS = [
  "Sustainability Manager",
  "Operations Manager",
  "Marketing Manager",
  "Supply Chain Manager",
  "Innovation Manager",
  "Compliance Manager",
  "Environmental Analyst",
  "Facilities Manager",
];

export default function RolesPage() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [departmentId, setDepartmentId] = useState("");
  const [fn, setFn] = useState("");
  const [title, setTitle] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const fetchData = async () => {
    const [deptRes, rolesRes] = await Promise.all([
      fetch("/api/departments"),
      fetch("/api/roles"),
    ]);
    if (deptRes.ok) {
      const d = await deptRes.json();
      setDepartments(d.departments);
    }
    if (rolesRes.ok) {
      const r = await rolesRes.json();
      setRoles(r.roles);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!departmentId) { setError("Select a department."); return; }
    if (!fn) { setError("Select a function."); return; }
    if (!title.trim()) { setError("Enter a title."); return; }

    setSubmitting(true);
    try {
      const res = await fetch("/api/roles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ departmentId, function: fn, title: title.trim() }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to create role.");
      } else {
        setTitle("");
        await fetchData();
      }
    } catch {
      setError("Network error.");
    }
    setSubmitting(false);
  };

  const deptName = (id: string) => departments.find((d) => d.id === id)?.name ?? "—";

  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Roles</h1>

      {/* Create form */}
      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200 p-6 mb-8 space-y-4">
        <h2 className="text-lg font-semibold text-gray-700">Add Role</h2>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label htmlFor="dept" className="block text-sm font-medium text-gray-600 mb-1">Department</label>
            <select
              id="dept"
              value={departmentId}
              onChange={(e) => setDepartmentId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none bg-white text-sm"
            >
              <option value="">Select...</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="fn" className="block text-sm font-medium text-gray-600 mb-1">Function</label>
            <select
              id="fn"
              value={fn}
              onChange={(e) => setFn(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none bg-white text-sm"
            >
              <option value="">Select...</option>
              {FUNCTIONS.map((f) => (
                <option key={f} value={f}>{f}</option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-600 mb-1">Title</label>
            <input
              id="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Senior Sustainability Lead"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none text-sm"
            />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={submitting}
            className="px-6 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors disabled:opacity-50 text-sm"
          >
            {submitting ? "Creating..." : "Create Role"}
          </button>
          {error && <p className="text-red-600 text-sm">{error}</p>}
        </div>
      </form>

      {/* List */}
      {loading ? (
        <p className="text-gray-400">Loading roles...</p>
      ) : roles.length === 0 ? (
        <p className="text-gray-400">No roles yet. Create one above.</p>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Title</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Function</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Department</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Skills</th>
              </tr>
            </thead>
            <tbody>
              {roles.map((role) => (
                <tr key={role.id} className="border-b border-gray-100 last:border-0">
                  <td className="px-4 py-3 font-medium text-gray-800">{role.title}</td>
                  <td className="px-4 py-3 text-gray-600">{role.function}</td>
                  <td className="px-4 py-3 text-gray-500">{deptName(role.departmentId)}</td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
                      {role.skillCount} skills
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
