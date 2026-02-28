"use client";

import { useEffect, useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, Cell,
} from "recharts";
import {
  BarChart3,
  Users,
  AlertTriangle,
  AlertCircle,
  CircleDot,
  Zap,
  Download,
  ShieldAlert,
  CheckCircle2,
  CircleCheck,
  Trophy,
} from "lucide-react";

interface KPI {
  totalEmployees: number;
  totalGaps: number;
  criticalCount: number;
  moderateCount: number;
}
interface HeatmapFamily { family: string; critical: number; moderate: number; noGap: number; total: number; }
interface HeatmapRow { role: string; families: HeatmapFamily[]; }
interface HighRiskRole { role: string; criticalGaps: number; employeeCount: number; }
interface DashboardData {
  kpi: KPI;
  severityDistribution: Record<string, number>;
  heatmap: HeatmapRow[];
  skillFamilies: string[];
  highRiskRoles: HighRiskRole[];
}

const SEVERITY_COLORS: Record<string, string> = {
  Critical: "#ef4444", Moderate: "#f59e0b", "No Gap": "#22c55e",
};

function heatColor(critical: number, moderate: number, total: number): string {
  if (critical > 0) return `rgba(239, 68, 68, ${0.15 + Math.min(critical / 5, 1) * 0.6})`;
  if (moderate > 0) return `rgba(245, 158, 11, ${0.15 + Math.min(moderate / 5, 1) * 0.5})`;
  if (total === 0) return "rgba(34, 197, 94, 0.15)";
  return "#f9fafb";
}

export default function AdminDashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [seeding, setSeeding] = useState(false);
  const [toast, setToast] = useState("");

  const loadDashboard = () => {
    setLoading(true);
    fetch("/api/dashboard")
      .then((res) => { if (!res.ok) throw new Error("Failed to load dashboard"); return res.json(); })
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadDashboard(); }, []);

  const seedDemo = async () => {
    if (!confirm("This will replace ALL existing data with demo data. Continue?")) return;
    setSeeding(true);
    try {
      const res = await fetch("/api/dev/seed-demo", { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        setToast(`Seeded ${data.summary.employees} employees across ${data.summary.departments} departments!`);
        setTimeout(() => setToast(""), 4000);
        loadDashboard();
      } else {
        setToast("Failed to seed demo data");
        setTimeout(() => setToast(""), 3000);
      }
    } catch {
      setToast("Network error");
      setTimeout(() => setToast(""), 3000);
    }
    setSeeding(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center animate-fade-in">
          <div className="spinner-lg mx-auto mb-3" />
          <p className="text-gray-400 text-sm">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="space-y-8 animate-fade-in">
        <div className="flex items-center justify-between">
          <h1 className="page-title flex items-center gap-2"><BarChart3 className="w-6 h-6" /> Skills Gap Dashboard</h1>
          <div className="flex items-center gap-2">
            <button
              onClick={seedDemo}
              disabled={seeding}
              className="btn-secondary flex items-center gap-2 text-xs opacity-60 hover:opacity-100"
              title="God Mode: Seed perfect demo data"
            >
              {seeding ? (
                <><span className="spinner !w-3 !h-3" /> Seeding...</>
              ) : (
                <><Zap className="w-4 h-4" /> Demo Data</>
              )}
            </button>
          </div>
        </div>
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <BarChart3 className="w-12 h-12 text-gray-300 mb-4" />
          <p className="text-red-500 mb-2">{error ?? "No data available"}</p>
          <p className="text-gray-400 text-sm">Try signing out and back in, or click Demo Data above.</p>
        </div>
        {toast && (
          <div className="fixed bottom-6 right-6 z-50 animate-fade-in">
            <div className="bg-gray-900 text-white px-5 py-3 rounded-xl shadow-lg text-sm flex items-center gap-2">
              <CircleCheck className="w-4 h-4 text-green-400" /> {toast}
            </div>
          </div>
        )}
      </div>
    );
  }

  const barData = Object.entries(data.severityDistribution).map(([name, value]) => ({ name, count: value }));

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="page-title flex items-center gap-2"><BarChart3 className="w-6 h-6" /> Skills Gap Dashboard</h1>
        <div className="flex items-center gap-2">
          <button
            onClick={seedDemo}
            disabled={seeding}
            className="btn-secondary flex items-center gap-2 text-xs opacity-60 hover:opacity-100"
            title="God Mode: Seed perfect demo data"
          >
            {seeding ? (
              <><span className="spinner !w-3 !h-3" /> Seeding...</>
            ) : (
              <><Zap className="w-4 h-4" /> Demo Data</>
            )}
          </button>
          <button
            onClick={() => { window.location.href = "/api/export/gaps"; }}
            className="btn-primary flex items-center gap-2"
          >
            <Download className="w-4 h-4" /> Export CSV
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard label="Total Employees" value={data.kpi.totalEmployees} icon={<Users className="w-5 h-5" />} color="bg-blue-50 text-blue-700 border-blue-100" />
        <KPICard label="Total Gaps" value={data.kpi.totalGaps} icon={<AlertTriangle className="w-5 h-5" />} color="bg-yellow-50 text-yellow-700 border-yellow-100" />
        <KPICard label="Critical Gaps" value={data.kpi.criticalCount} icon={<AlertCircle className="w-5 h-5" />} color="bg-red-50 text-red-700 border-red-100" />
        <KPICard label="Moderate Gaps" value={data.kpi.moderateCount} icon={<CircleDot className="w-5 h-5" />} color="bg-amber-50 text-amber-700 border-amber-100" />
      </div>

      {/* Gap Distribution Bar Chart */}
      <div className="section-card">
        <h2 className="section-title">Gap Severity Distribution</h2>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={barData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="name" tick={{ fontSize: 13 }} />
            <YAxis allowDecimals={false} tick={{ fontSize: 13 }} />
            <Tooltip contentStyle={{ borderRadius: "12px", border: "1px solid #e5e7eb", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.05)" }} />
            <Legend />
            <Bar dataKey="count" name="Count" radius={[6, 6, 0, 0]}>
              {barData.map((entry) => (
                <Cell key={entry.name} fill={SEVERITY_COLORS[entry.name] ?? "#6b7280"} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Role × Skill Family Heatmap */}
      {data.heatmap.length > 0 && (
        <div className="section-card overflow-x-auto">
          <h2 className="section-title">Role by Theme Heatmap</h2>
          <table className="w-full text-sm">
            <thead>
              <tr>
                <th className="text-left py-2.5 px-3 font-medium text-gray-500 text-xs uppercase tracking-wider border-b">Role</th>
                {data.skillFamilies.map((fam) => (
                  <th key={fam} className="text-center py-2.5 px-3 font-medium text-gray-500 text-xs uppercase tracking-wider border-b">{fam}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.heatmap.map((row) => (
                <tr key={row.role} className="hover:bg-gray-50/50 transition-colors">
                  <td className="py-2.5 px-3 font-medium text-gray-700 border-b">{row.role}</td>
                  {row.families.map((f) => (
                    <td key={f.family} className="text-center py-2.5 px-3 border-b rounded"
                      style={{ backgroundColor: heatColor(f.critical, f.moderate, f.total) }}>
                      <span className="text-xs font-semibold">
                        {f.critical > 0 && <span className="text-red-700">{f.critical}C </span>}
                        {f.moderate > 0 && <span className="text-amber-700">{f.moderate}M</span>}
                        {f.critical === 0 && f.moderate === 0 && <span className="text-green-600"><CheckCircle2 className="w-4 h-4 inline" /></span>}
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
        <div className="section-card">
          <h2 className="section-title flex items-center gap-2"><ShieldAlert className="w-5 h-5 text-red-500" /> High Risk Roles</h2>
          <div className="table-container border-0 shadow-none">
            <table className="w-full text-sm">
              <thead className="table-header">
                <tr>
                  <th>Rank</th><th>Role</th><th className="text-center">Critical Gaps</th><th className="text-center">Employees Affected</th>
                </tr>
              </thead>
              <tbody>
                {data.highRiskRoles.map((r, i) => (
                  <tr key={r.role} className={`table-row ${i === 0 ? "bg-red-50/50" : ""}`}>
                    <td className="font-bold text-gray-400 text-lg">{i === 0 ? <Trophy className="w-5 h-5 text-yellow-500 inline" /> : i === 1 ? <Trophy className="w-5 h-5 text-gray-400 inline" /> : <Trophy className="w-5 h-5 text-orange-400 inline" />}</td>
                    <td className="font-medium text-gray-700">{r.role}</td>
                    <td className="text-center"><span className="badge-red">{r.criticalGaps}</span></td>
                    <td className="text-center text-gray-600">{r.employeeCount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Toast notification */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 animate-fade-in">
          <div className="bg-gray-900 text-white px-5 py-3 rounded-xl shadow-lg text-sm flex items-center gap-2">
            <CircleCheck className="w-4 h-4 text-green-400" /> {toast}
          </div>
        </div>
      )}

      {data.kpi.totalEmployees === 0 && (
        <div className="text-center py-12 text-gray-400">
          <BarChart3 className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p className="text-lg">No employees yet.</p>
          <p className="text-sm mt-1">Add departments, roles, and employees to see gap analytics.</p>
        </div>
      )}
    </div>
  );
}

function KPICard({ label, value, icon, color }: { label: string; value: number; icon: React.ReactNode; color: string }) {
  return (
    <div className={`rounded-xl border p-5 transition-all duration-200 hover:shadow-md ${color}`}>
      <div className="flex items-center justify-between">
        <span>{icon}</span>
        <span className="text-3xl font-bold">{value}</span>
      </div>
      <p className="mt-2 text-sm font-medium opacity-80">{label}</p>
    </div>
  );
}
