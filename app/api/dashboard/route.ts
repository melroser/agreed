import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { employees } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { calculateCompanyGaps, type SkillGap, type Severity } from "@/lib/gap-calculator";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || !(session.user as any).companyId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const companyId = (session.user as any).companyId;

  // Get total active employees
  const activeEmployees = await db
    .select({ id: employees.id })
    .from(employees)
    .where(and(eq(employees.companyId, companyId), eq(employees.isActive, true)));

  const totalEmployees = activeEmployees.length;

  // Calculate all gaps
  const allGaps = await calculateCompanyGaps(companyId);

  // KPI counts
  const criticalCount = allGaps.filter((g) => g.severity === "Critical").length;
  const moderateCount = allGaps.filter((g) => g.severity === "Moderate").length;
  const noGapCount = allGaps.filter((g) => g.severity === "No Gap").length;
  const totalGaps = criticalCount + moderateCount;

  // Severity distribution for bar chart
  const severityDistribution = { Critical: criticalCount, Moderate: moderateCount, "No Gap": noGapCount };

  // Role × Skill Family heatmap
  const heatmapMap = new Map<string, Map<string, { critical: number; moderate: number; noGap: number }>>();
  const allFamilies = new Set<string>();

  for (const gap of allGaps) {
    allFamilies.add(gap.familyName);
    const roleKey = gap.roleFunction;
    if (!heatmapMap.has(roleKey)) heatmapMap.set(roleKey, new Map());
    const familyMap = heatmapMap.get(roleKey)!;
    if (!familyMap.has(gap.familyName)) {
      familyMap.set(gap.familyName, { critical: 0, moderate: 0, noGap: 0 });
    }
    const counts = familyMap.get(gap.familyName)!;
    if (gap.severity === "Critical") counts.critical++;
    else if (gap.severity === "Moderate") counts.moderate++;
    else counts.noGap++;
  }

  const skillFamilies = Array.from(allFamilies).sort();
  const heatmap = Array.from(heatmapMap.entries()).map(([role, familyMap]) => ({
    role,
    families: skillFamilies.map((fam) => {
      const c = familyMap.get(fam) ?? { critical: 0, moderate: 0, noGap: 0 };
      return { family: fam, ...c, total: c.critical + c.moderate };
    }),
  }));

  // High-risk roles: top 3 by critical gap count
  const roleCriticalCounts = new Map<string, { criticalCount: number; employeeIds: Set<string> }>();
  for (const gap of allGaps) {
    if (gap.severity === "Critical") {
      if (!roleCriticalCounts.has(gap.roleFunction)) {
        roleCriticalCounts.set(gap.roleFunction, { criticalCount: 0, employeeIds: new Set() });
      }
      const entry = roleCriticalCounts.get(gap.roleFunction)!;
      entry.criticalCount++;
      entry.employeeIds.add(gap.employeeId);
    }
  }

  const highRiskRoles = Array.from(roleCriticalCounts.entries())
    .map(([role, data]) => ({
      role,
      criticalGaps: data.criticalCount,
      employeeCount: data.employeeIds.size,
    }))
    .sort((a, b) => b.criticalGaps - a.criticalGaps)
    .slice(0, 3);

  return NextResponse.json({
    kpi: { totalEmployees, totalGaps, criticalCount, moderateCount },
    severityDistribution,
    heatmap,
    skillFamilies,
    highRiskRoles,
  });
}
