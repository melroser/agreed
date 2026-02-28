"use client";

import { useState, useEffect } from "react";

interface Department {
  id: string;
  name: string;
}

interface Role {
  id: string;
  departmentId: string;
  title: string;
  function: string;
}

interface Employee {
  id: string;
  name: string;
  departmentId: string;
  roleId: string;
  departmentName: string;
  roleTitle: string;
  roleFunction: string;
  isActive: boolean;
  createdAt: string;
}

export default function EmployeesPage() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [allRoles, setAllRoles] = useState<Role[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [name, setName] = useState("");
  const [departmentId, setDepartmentId] = useState("");
  const [roleId, setRoleId] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [error, setError] = useState("");

  const fetchData = async () => {
    const [deptRes, rolesRes, empRes] = await Promise.all([
      fetch("/api/departments"),
      fetch("/api/roles"),
      fetch("/api/employees"),
    ]);
    if (deptRes.ok) {
      const d = await deptRes.json();
      setDepartments(d.departments);
    }
    if (rolesRes.ok) {
      const r = await rolesRes.json();
      setAllRoles(r.roles);
    }
    if (empRes.ok) {
      const e = await empRes.json();
      setEmployees(e.employees);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Filter roles by selected department
  const filteredRoles = departmentId
    ? allRoles.filter((r) => r.departmentId === departmentId)
    : [];

  // Reset role when department changes
  const handleDepartmentChange = (id: string) => {
    setDepartmentId(id);
    setRoleId("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!name.trim()) { setError("Enter employee name."); return; }
    if (!departmentId) { setError("Select a department."); return; }
    if (!roleId) { setError("Select a role."); return; }

    setSubmitting(true);
    try {
      const res = await fetch("/api/employees", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), departmentId, roleId }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to create employee.");
      } else {
        setName("");
        setDepartmentId("");
        setRoleId("");
        await fetchData();
      }
    } catch {
      setError("Network error.");
    }
    setSubmitting(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Remove this employee? Their assessment history will be preserved.")) return;
    setDeleting(id);
    try {
      const res = await fetch(`/api/employees?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        await fetchData();
      }
    } catch {
      // silent
    }
    setDeleting(null);
  };

  return (
    <div className="max-w-4xl">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Employees</h1>

      {/* Create form */}
      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200 p-6 mb-8 space-y-4">
        <h2 className="text-lg font-semibold text-gray-700">Add Employee</h2>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label htmlFor="emp-name" className="block text-sm font-medium text-gray-600 mb-1">Name</label>
            <input
              id="emp-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Employee name"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none text-sm"
            />
          </div>

          <div>
            <label htmlFor="emp-dept" className="block text-sm font-medium text-gray-600 mb-1">Department</label>
            <select
              id="emp-dept"
              value={departmentId}
              onChange={(e) => handleDepartmentChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none bg-white text-sm"
            >
              <option value="">Select...</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="emp-role" className="block text-sm font-medium text-gray-600 mb-1">Role</label>
            <select
              id="emp-role"
              value={roleId}
              onChange={(e) => setRoleId(e.target.value)}
              disabled={!departmentId}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none bg-white text-sm disabled:opacity-50"
            >
              <option value="">{departmentId ? "Select..." : "Pick department first"}</option>
              {filteredRoles.map((r) => (
                <option key={r.id} value={r.id}>{r.title} ({r.function})</option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={submitting}
            className="px-6 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors disabled:opacity-50 text-sm"
          >
            {submitting ? "Adding..." : "Add Employee"}
          </button>
          {error && <p className="text-red-600 text-sm">{error}</p>}
        </div>
      </form>

      {/* List */}
      {loading ? (
        <p className="text-gray-400">Loading employees...</p>
      ) : employees.length === 0 ? (
        <p className="text-gray-400">No employees yet. Add one above.</p>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Name</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Department</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Role</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Function</th>
                <th className="text-right px-4 py-3 font-medium text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {employees.map((emp) => (
                <tr key={emp.id} className="border-b border-gray-100 last:border-0">
                  <td className="px-4 py-3 font-medium text-gray-800">{emp.name}</td>
                  <td className="px-4 py-3 text-gray-600">{emp.departmentName}</td>
                  <td className="px-4 py-3 text-gray-600">{emp.roleTitle}</td>
                  <td className="px-4 py-3 text-gray-500">{emp.roleFunction}</td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => handleDelete(emp.id)}
                      disabled={deleting === emp.id}
                      className="text-red-500 hover:text-red-700 text-xs font-medium transition-colors disabled:opacity-50"
                    >
                      {deleting === emp.id ? "Removing..." : "Remove"}
                    </button>
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
