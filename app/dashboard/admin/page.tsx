"use client";

import { useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from "recharts";

interface KPI {
  totalEmployees: number;
  totalGaps: number;
  criticalCount: number;
  moderateCount: number;
}

interface HeatmapFamily {
  family: string;
  critical: number;
  moderate: number;
  noGap: number;
  total: number;
}

interface HeatmapRow {
  role: string;
  families: HeatmapFamily[];
}

interface HighRiskRole {
  role: string;
  criticalGaps: number;
  employeeCount: number;
}

interface DashboardData {
  kpi: KPI;
  severityDistribution: Record<string, number>;
  heatmap: HeatmapRow[];
  skillFamilies: string[];
  highRiskRoles: HighRiskRole[];
}

const SEVERITY_COLORS: Record<string, string> = {
  Critical: "#ef4444",
  Moderate: "#f59e0b",
  "No Gap": "#22c55e",
};

function heatColor(critical: number, moderate: number, total: number): string {
  if (critical > 0) {
    const intensity = Math.min(critical / 5, 1);
    return `rgba(239, 68, 68, ${0.15 + intensity * 0.6})`;
  }
  if (moderate > 0) {
    const intensity = Math.min(moderate / 5, 1);
    return `rgba(245, 158, 11, ${0.15 + intensity * 0.5})`;
  }
  if (total === 0) return "rgba(34, 197, 94, 0.15)";
  return "#f9fafb";
}

export default function AdminDashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/dashboard")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load dashboard");
        return res.json();
      })
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-400">Loading dashboard...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-red-500">{error ?? "No data available"}</p>
      </div>
    );
  }

  const barData = Object.entries(data.severityDistribution).map(([name, value]) => ({
    name,
    count: value,
  }));

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">Skills Gap Dashboard</h1>
        <button
          onClick={() => {
            window.location.href = "/api/export/gaps";
          }}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
        >
          📥 Export CSV
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard label="Total Employees" value={data.kpi.totalEmployees} icon="👥" color="bg-blue-50 text-blue-700" />
        <KPICard label="Total Gaps" value={data.kpi.totalGaps} icon="⚠️" color="bg-yellow-50 text-yellow-700" />
        <KPICard label="Critical Gaps" value={data.kpi.criticalCount} icon="🔴" color="bg-red-50 text-red-700" />
        <KPICard label="Moderate Gaps" value={data.kpi.moderateCount} icon="🟡" color="bg-amber-50 text-amber-700" />
      </div>

      {/* Gap Distribution Bar Chart */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-700 mb-4">Gap Severity Distribution</h2>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={barData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis allowDecimals={false} />
            <Tooltip />
            <Legend />
            <Bar dataKey="count" name="Count">
              {barData.map((entry) => (
                <Cell key={entry.name} fill={SEVERITY_COLORS[entry.name] ?? "#6b7280"} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Role × Skill Family Heatmap */}
      {data.heatmap.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 overflow-x-auto">
          <h2 className="text-lg font-semibold text-gray-700 mb-4">Role by Theme Heatmap</h2>
          <table className="w-full text-sm">
            <thead>
              <tr>
                <th className="text-left py-2 px-3 font-medium text-gray-600 border-b">Role</th>
                {data.skillFamilies.map((fam) => (
                  <th key={fam} className="text-center py-2 px-3 font-medium text-gray-600 border-b">
                    {fam}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.heatmap.map((row) => (
                <tr key={row.role}>
                  <td className="py-2 px-3 font-medium text-gray-700 border-b">{row.role}</td>
                  {row.families.map((f) => (
                    <td
                      key={f.family}
                      className="text-center py-2 px-3 border-b"
                      style={{ backgroundColor: heatColor(f.critical, f.moderate, f.total) }}
                    >
                      <span className="text-xs font-semibold">
                        {f.critical > 0 && <span className="text-red-700">{f.critical}C </span>}
                        {f.moderate > 0 && <span className="text-amber-700">{f.moderate}M</span>}
                        {f.critical === 0 && f.moderate === 0 && (
                          <span className="text-green-600">✓</span>
                        )}
                      </span>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* High Risk Roles Table */}
      {data.highRiskRoles.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-700 mb-4">High Risk Roles</h2>
          <table className="w-full text-sm">
            <thead>
              <tr>
                <th className="text-left py-2 px-3 font-medium text-gray-600 border-b">Rank</th>
                <th className="text-left py-2 px-3 font-medium text-gray-600 border-b">Role</th>
                <th className="text-center py-2 px-3 font-medium text-gray-600 border-b">Critical Gaps</th>
                <th className="text-center py-2 px-3 font-medium text-gray-600 border-b">Employees Affected</th>
              </tr>
            </thead>
            <tbody>
              {data.highRiskRoles.map((r, i) => (
                <tr key={r.role} className={i === 0 ? "bg-red-50" : ""}>
                  <td className="py-2 px-3 border-b font-bold text-gray-500">
                    {i === 0 ? "🥇" : i === 1 ? "🥈" : "🥉"}
                  </td>
                  <td className="py-2 px-3 border-b font-medium text-gray-700">{r.role}</td>
                  <td className="text-center py-2 px-3 border-b text-red-600 font-semibold">{r.criticalGaps}</td>
                  <td className="text-center py-2 px-3 border-b text-gray-600">{r.employeeCount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Empty state */}
      {data.kpi.totalEmployees === 0 && (
        <div className="text-center py-12 text-gray-400">
          <p className="text-lg">No employees yet.</p>
          <p className="text-sm mt-1">Add departments, roles, and employees to see gap analytics.</p>
        </div>
      )}
    </div>
  );
}

function KPICard({ label, value, icon, color }: { label: string; value: number; icon: string; color: string }) {
  return (
    <div className={`rounded-xl border border-gray-200 p-5 ${color}`}>
      <div className="flex items-center justify-between">
        <span className="text-2xl">{icon}</span>
        <span className="text-3xl font-bold">{value}</span>
      </div>
      <p className="mt-2 text-sm font-medium opacity-80">{label}</p>
    </div>
  );
}
