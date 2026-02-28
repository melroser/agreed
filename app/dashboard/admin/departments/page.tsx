"use client";

import { useState, useEffect } from "react";

interface Department {
  id: string;
  name: string;
  createdAt: string;
}

export default function DepartmentsPage() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");

  const fetchDepartments = async () => {
    const res = await fetch("/api/departments");
    if (res.ok) {
      const data = await res.json();
      setDepartments(data.departments);
    }
    setLoading(false);
  };

  useEffect(() => { fetchDepartments(); }, []);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(""), 3000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!name.trim()) { setError("Department name is required."); return; }
    setSubmitting(true);
    try {
      const res = await fetch("/api/departments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim() }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to create department.");
      } else {
        setName("");
        await fetchDepartments();
        showToast("Department created!");
      }
    } catch {
      setError("Network error.");
    }
    setSubmitting(false);
  };

  return (
    <div className="max-w-2xl animate-fade-in">
      <h1 className="page-title mb-6">🏢 Departments</h1>

      {/* Create form */}
      <form onSubmit={handleSubmit} className="section-card mb-8">
        <h2 className="section-title">Add Department</h2>
        <div className="flex gap-3">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Department name"
            className="input flex-1"
          />
          <button type="submit" disabled={submitting} className="btn-primary">
            {submitting ? (
              <span className="inline-flex items-center gap-2">
                <span className="spinner !border-white/30 !border-t-white !w-4 !h-4" />
                Adding...
              </span>
            ) : "Add"}
          </button>
        </div>
        {error && <p className="text-red-600 text-sm mt-2 animate-fade-in">{error}</p>}
      </form>

      {/* List */}
      {loading ? (
        <div className="flex items-center gap-2 text-gray-400 py-8 justify-center">
          <div className="spinner" />
          <span className="text-sm">Loading departments...</span>
        </div>
      ) : departments.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <div className="text-4xl mb-2">🏢</div>
          <p>No departments yet. Create one above.</p>
        </div>
      ) : (
        <div className="table-container">
          <table className="w-full text-sm">
            <thead className="table-header">
              <tr>
                <th>Name</th>
                <th>Created</th>
              </tr>
            </thead>
            <tbody>
              {departments.map((dept, i) => (
                <tr key={dept.id} className="table-row" style={{ animationDelay: `${i * 50}ms` }}>
                  <td className="font-medium text-gray-800">{dept.name}</td>
                  <td className="text-gray-500">
                    {new Date(dept.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Toast */}
      {toast && <div className="toast-success">✓ {toast}</div>}
    </div>
  );
}
