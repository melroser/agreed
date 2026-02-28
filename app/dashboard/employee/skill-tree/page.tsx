"use client";

import { useState, useEffect } from "react";
import {
  TreePine, Flame, Recycle, Settings, Lightbulb, Leaf,
  Lock, Unlock, Star, BarChart3, DollarSign, Sprout,
} from "lucide-react";

interface SkillNode {
  skillId: string;
  skillName: string;
  currentLevel: number | null;
  requiredLevel: number;
  gapValue: number;
  severity: string;
  unlocked: boolean;
}

interface SkillFamily {
  familyId: string;
  familyName: string;
  skills: SkillNode[];
}

interface EmployeeInfo {
  id: string;
  name: string;
  roleFunction: string;
  roleTitle: string;
}

interface TreeData {
  employee: EmployeeInfo;
  xpTotal: number;
  moneySaved: number;
  totalSkills: number;
  unlockedSkills: number;
  families: SkillFamily[];
}

interface Employee {
  id: string;
  name: string;
  departmentName: string;
  roleTitle: string;
  roleFunction: string;
}

const FAMILY_ICONS: Record<string, React.ReactNode> = {
  "Climate Action": <Flame className="w-6 h-6" />,
  "Circular Economy": <Recycle className="w-6 h-6" />,
  "Sustainable Operations": <Settings className="w-6 h-6" />,
  "Green Innovation": <Lightbulb className="w-6 h-6" />,
};

const FAMILY_COLORS: Record<string, { bg: string; border: string; accent: string; badge: string }> = {
  "Climate Action": { bg: "bg-orange-50", border: "border-orange-200", accent: "text-orange-700", badge: "bg-orange-100 text-orange-700" },
  "Circular Economy": { bg: "bg-emerald-50", border: "border-emerald-200", accent: "text-emerald-700", badge: "bg-emerald-100 text-emerald-700" },
  "Sustainable Operations": { bg: "bg-blue-50", border: "border-blue-200", accent: "text-blue-700", badge: "bg-blue-100 text-blue-700" },
  "Green Innovation": { bg: "bg-purple-50", border: "border-purple-200", accent: "text-purple-700", badge: "bg-purple-100 text-purple-700" },
};

const SEVERITY_STYLES: Record<string, string> = {
  Critical: "bg-red-100 text-red-700 border-red-200",
  Moderate: "bg-yellow-100 text-yellow-700 border-yellow-200",
  "No Gap": "bg-green-100 text-green-700 border-green-200",
};

function LevelDots({ current, required }: { current: number | null; required: number }) {
  return (
    <div className="flex gap-1.5 items-center">
      {[1, 2, 3, 4].map((level) => {
        const isFilled = current !== null && level <= current;
        const isRequired = level <= required;
        return (
          <div
            key={level}
            className={`w-5 h-5 rounded-full border-2 transition-all ${
              isFilled
                ? "bg-green-500 border-green-500 shadow-sm shadow-green-200"
                : isRequired
                ? "border-gray-300 bg-white"
                : "border-gray-200 bg-gray-50"
            }`}
            title={`Level ${level}${isFilled ? " (achieved)" : isRequired ? " (required)" : ""}`}
          />
        );
      })}
    </div>
  );
}

function SkillCard({ skill, familyColor }: { skill: SkillNode; familyColor: typeof FAMILY_COLORS[string] }) {
  const isLocked = !skill.unlocked;

  return (
    <div
      className={`relative rounded-xl border-2 p-4 transition-all ${
        isLocked
          ? "border-gray-200 bg-gray-50 opacity-70"
          : skill.severity === "No Gap"
          ? "border-green-300 bg-white shadow-sm"
          : skill.severity === "Critical"
          ? "border-red-200 bg-white shadow-sm"
          : "border-yellow-200 bg-white shadow-sm"
      }`}
    >
      {/* Lock/unlock indicator */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-lg">{isLocked ? <Lock className="w-5 h-5 text-gray-400" /> : skill.severity === "No Gap" ? <Star className="w-5 h-5 text-yellow-500" /> : <Unlock className="w-5 h-5 text-green-500" />}</span>
          <h4 className="text-sm font-semibold text-gray-800 leading-tight">{skill.skillName}</h4>
        </div>
        <span className={`text-xs px-2 py-0.5 rounded-full border ${SEVERITY_STYLES[skill.severity]}`}>
          {skill.severity}
        </span>
      </div>

      {/* Level dots */}
      <div className="mb-3">
        <LevelDots current={skill.currentLevel} required={skill.requiredLevel} />
      </div>

      {/* Progress bar */}
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className={`h-2 rounded-full transition-all duration-500 ${
            skill.severity === "No Gap"
              ? "bg-green-500"
              : skill.severity === "Critical"
              ? "bg-red-400"
              : "bg-yellow-400"
          }`}
          style={{ width: `${((skill.currentLevel ?? 0) / skill.requiredLevel) * 100}%` }}
        />
      </div>
      <div className="flex justify-between mt-1">
        <span className="text-xs text-gray-400">
          {skill.currentLevel ?? 0}/{skill.requiredLevel}
        </span>
        {skill.gapValue > 0 && (
          <span className="text-xs text-red-500 font-medium">-{skill.gapValue} gap</span>
        )}
      </div>
    </div>
  );
}

export default function SkillTreePage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState("");
  const [treeData, setTreeData] = useState<TreeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [treeLoading, setTreeLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/employees")
      .then((r) => r.json())
      .then((d) => setEmployees(d.employees || []))
      .finally(() => setLoading(false));
  }, []);

  const loadTree = async (empId: string) => {
    setSelectedEmployeeId(empId);
    setTreeLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/game/tree/${empId}`);
      if (!res.ok) {
        const d = await res.json();
        setError(d.error || "Failed to load skill tree");
        setTreeData(null);
        return;
      }
      setTreeData(await res.json());
    } catch {
      setError("Network error");
    } finally {
      setTreeLoading(false);
    }
  };

  // Employee selector
  if (!treeData && !treeLoading) {
    return (
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2"><TreePine className="w-6 h-6" /> Skill Tree</h1>
        <p className="text-gray-500 mb-8">Select an employee to view their RPG skill tree.</p>

        {loading ? (
          <p className="text-gray-400">Loading employees...</p>
        ) : employees.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
            <p className="text-gray-400">No employees found. Add employees in the Admin view first.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {employees.map((emp) => (
              <button
                key={emp.id}
                onClick={() => loadTree(emp.id)}
                className="w-full flex items-center justify-between px-5 py-4 rounded-xl border-2 border-gray-200 bg-white hover:border-green-400 hover:shadow-sm transition-all text-left"
              >
                <div>
                  <div className="font-semibold text-gray-800">{emp.name}</div>
                  <div className="text-sm text-gray-500">
                    {emp.departmentName} &middot; {emp.roleTitle}
                  </div>
                </div>
                <div className="text-xs text-gray-400">{emp.roleFunction}</div>
              </button>
            ))}
          </div>
        )}
        {error && <p className="text-red-600 text-sm mt-4">{error}</p>}
      </div>
    );
  }

  if (treeLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <TreePine className="w-10 h-10 text-green-400 mx-auto mb-3 animate-pulse" />
          <p className="text-gray-400">Loading skill tree...</p>
        </div>
      </div>
    );
  }

  if (!treeData) return null;

  const completionPct = treeData.totalSkills > 0
    ? Math.round((treeData.unlockedSkills / treeData.totalSkills) * 100)
    : 0;

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <button
            onClick={() => { setTreeData(null); setSelectedEmployeeId(""); }}
            className="text-sm text-gray-400 hover:text-gray-600 mb-1 transition-colors"
          >
            ← Back to employees
          </button>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <TreePine className="w-6 h-6" /> {treeData.employee.name}&apos;s Skill Tree
          </h1>
          <p className="text-sm text-gray-500">
            {treeData.employee.roleTitle} &middot; {treeData.employee.roleFunction}
          </p>
        </div>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
          <div className="text-2xl font-bold text-green-600">{treeData.xpTotal}</div>
          <div className="text-xs text-gray-500 mt-1 flex items-center justify-center gap-1"><Star className="w-3 h-3" /> Total XP</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
          <div className="text-2xl font-bold text-emerald-600">
            {treeData.unlockedSkills}/{treeData.totalSkills}
          </div>
          <div className="text-xs text-gray-500 mt-1 flex items-center justify-center gap-1"><Unlock className="w-3 h-3" /> Skills Unlocked</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
          <div className="text-2xl font-bold text-blue-600">{completionPct}%</div>
          <div className="text-xs text-gray-500 mt-1 flex items-center justify-center gap-1"><BarChart3 className="w-3 h-3" /> Completion</div>
        </div>
        <div className="bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl p-4 text-center text-white shadow-md">
          <div className="text-2xl font-bold">
            ${treeData.moneySaved.toLocaleString()}
          </div>
          <div className="text-xs mt-1 opacity-90 flex items-center justify-center gap-1"><DollarSign className="w-3 h-3" /> Training Value</div>
        </div>
      </div>

      {/* Overall progress */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-8">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">Overall Progress</span>
          <span className="text-sm text-gray-500">{completionPct}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div
            className="bg-gradient-to-r from-green-400 to-emerald-500 h-3 rounded-full transition-all duration-700"
            style={{ width: `${completionPct}%` }}
          />
        </div>
      </div>

      {/* Money saved banner */}
      {treeData.moneySaved > 0 && (
        <div className="bg-gradient-to-r from-green-600 via-emerald-500 to-teal-500 rounded-2xl p-6 mb-8 text-white shadow-lg relative overflow-hidden">
          <div className="absolute inset-0 opacity-10">
            <DollarSign className="absolute top-4 left-10 w-14 h-14" />
            <Sprout className="absolute bottom-4 right-14 w-12 h-12" />
            <Star className="absolute top-6 right-44 w-10 h-10" />
          </div>
          <div className="relative text-center">
            <p className="text-sm opacity-90 mb-1">Estimated training cost savings</p>
            <p className="text-4xl font-extrabold tracking-tight mb-1">
              ${treeData.moneySaved.toLocaleString()}
            </p>
            <p className="text-sm opacity-80">
              {treeData.employee.name} has saved the team an estimated ${treeData.moneySaved.toLocaleString()} in training costs through skill development!
            </p>
          </div>
        </div>
      )}

      {/* Skill families grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {treeData.families.map((family) => {
          const colors = FAMILY_COLORS[family.familyName] || FAMILY_COLORS["Climate Action"];
          const icon = FAMILY_ICONS[family.familyName] || <Leaf className="w-6 h-6" />;
          const familyUnlocked = family.skills.filter((s) => s.unlocked).length;
          const familyNoGap = family.skills.filter((s) => s.severity === "No Gap").length;

          return (
            <div key={family.familyId} className={`rounded-2xl border-2 ${colors.border} ${colors.bg} p-5`}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <span>{icon}</span>
                  <h3 className={`text-lg font-bold ${colors.accent}`}>{family.familyName}</h3>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full font-medium ${colors.badge}`}>
                  {familyUnlocked}/{family.skills.length} unlocked
                </span>
              </div>

              {/* Family progress */}
              <div className="mb-4">
                <div className="w-full bg-white/60 rounded-full h-2">
                  <div
                    className="bg-green-500 h-2 rounded-full transition-all duration-500"
                    style={{
                      width: `${family.skills.length > 0 ? (familyNoGap / family.skills.length) * 100 : 0}%`,
                    }}
                  />
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {familyNoGap} of {family.skills.length} skills mastered
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3">
                {family.skills.map((skill) => (
                  <SkillCard key={skill.skillId} skill={skill} familyColor={colors} />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
