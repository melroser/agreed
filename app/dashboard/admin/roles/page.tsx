"use client";

import { useState, useEffect } from "react";

interface Department { id: string; name: string; }
interface Role {
  id: string;
  departmentId: string;
  function: string;
  title: string;
  skillCount: number;
  createdAt: string;
}

const FUNCTIONS = [
  "Sustainability Manager", "Operations Manager", "Marketing Manager",
  "Supply Chain Manager", "Innovation Manager", "Compliance Manager",
  "Environmental Analyst", "Facilities Manager",
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
  const [toast, setToast] = useState("");

  const fetchData = async () => {
    const [deptRes, rolesRes] = await Promise.all([
      fetch("/api/departments"), fetch("/api/roles"),
    ]);
    if (deptRes.ok) setDepartments((await deptRes.json()).departments);
    if (rolesRes.ok) setRoles((await rolesRes.json()).roles);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(""), 3000);
  };

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
        showToast("Role created!");
      }
    } catch { setError("Network error."); }
    setSubmitting(false);
  };

  const deptName = (id: string) => departments.find((d) => d.id === id)?.name ?? "—";

  return (
    <div className="max-w-3xl animate-fade-in">
      <h1 className="page-title mb-6">👔 Roles</h1>

      <form onSubmit={handleSubmit} className="section-card mb-8 space-y-4">
        <h2 className="section-title">Add Role</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label htmlFor="dept" className="block text-sm font-medium text-gray-600 mb-1.5">Department</label>
            <select id="dept" value={departmentId} onChange={(e) => setDepartmentId(e.target.value)} className="select">
              <option value="">Select...</option>
              {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="fn" className="block text-sm font-medium text-gray-600 mb-1.5">Function</label>
            <select id="fn" value={fn} onChange={(e) => setFn(e.target.value)} className="select">
              <option value="">Select...</option>
              {FUNCTIONS.map((f) => <option key={f} value={f}>{f}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-600 mb-1.5">Title</label>
            <input id="title" type="text" value={title} onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Senior Sustainability Lead" className="input" />
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button type="submit" disabled={submitting} className="btn-primary">
            {submitting ? (
              <span className="inline-flex items-center gap-2">
                <span className="spinner !border-white/30 !border-t-white !w-4 !h-4" />
                Creating...
              </span>
            ) : "Create Role"}
          </button>
          {error && <p className="text-red-600 text-sm animate-fade-in">{error}</p>}
        </div>
      </form>

      {loading ? (
        <div className="flex items-center gap-2 text-gray-400 py-8 justify-center">
          <div className="spinner" /><span className="text-sm">Loading roles...</span>
        </div>
      ) : roles.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <div className="text-4xl mb-2">👔</div>
          <p>No roles yet. Create one above.</p>
        </div>
      ) : (
        <div className="table-container">
          <table className="w-full text-sm">
            <thead className="table-header">
              <tr>
                <th>Title</th><th>Function</th><th>Department</th><th>Skills</th>
              </tr>
            </thead>
            <tbody>
              {roles.map((role) => (
                <tr key={role.id} className="table-row">
                  <td className="font-medium text-gray-800">{role.title}</td>
                  <td className="text-gray-600">{role.function}</td>
                  <td className="text-gray-500">{deptName(role.departmentId)}</td>
                  <td><span className="badge-green">{role.skillCount} skills</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {toast && <div className="toast-success">✓ {toast}</div>}
    </div>
  );
}
