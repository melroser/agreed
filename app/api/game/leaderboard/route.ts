import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { departmentScores, departments, employees, employeeXP } from "@/lib/db/schema";
import { eq, and, sql, desc } from "drizzle-orm";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || !session.user.companyId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const companyId = session.user.companyId;

  // Get all departments for this company
  const depts = await db
    .select({ id: departments.id, name: departments.name })
    .from(departments)
    .where(eq(departments.companyId, companyId));

  // Get department scores
  const scores = await db
    .select({
      departmentId: departmentScores.departmentId,
      score: departmentScores.score,
      lastUpdated: departmentScores.lastUpdated,
    })
    .from(departmentScores)
    .where(eq(departmentScores.companyId, companyId));

  const scoreMap = new Map(scores.map((s) => [s.departmentId, s]));

  // Get employee counts per department
  const empCounts = await db
    .select({
      departmentId: employees.departmentId,
      count: sql<number>`COUNT(*)`,
    })
    .from(employees)
    .where(and(eq(employees.companyId, companyId), eq(employees.isActive, true)))
    .groupBy(employees.departmentId);

  const countMap = new Map(empCounts.map((e) => [e.departmentId, Number(e.count)]));

  // Get total XP per department (sum of all employee XP)
  const deptXP = await db
    .select({
      departmentId: employees.departmentId,
      totalXP: sql<number>`COALESCE(SUM(${employeeXP.xpTotal}), 0)`,
    })
    .from(employeeXP)
    .innerJoin(employees, and(
      eq(employeeXP.employeeId, employees.id),
      eq(employees.isActive, true)
    ))
    .where(eq(employeeXP.companyId, companyId))
    .groupBy(employees.departmentId);

  const xpMap = new Map(deptXP.map((d) => [d.departmentId, Number(d.totalXP)]));

  // Build leaderboard entries
  const leaderboard = depts.map((dept) => ({
    departmentId: dept.id,
    departmentName: dept.name,
    score: scoreMap.get(dept.id)?.score ?? xpMap.get(dept.id) ?? 0,
    totalXP: xpMap.get(dept.id) ?? 0,
    employeeCount: countMap.get(dept.id) ?? 0,
    averageXP: countMap.get(dept.id)
      ? Math.round((xpMap.get(dept.id) ?? 0) / countMap.get(dept.id)!)
      : 0,
  }));

  // Sort by score descending
  leaderboard.sort((a, b) => b.score - a.score);

  // Add ranks
  const ranked = leaderboard.map((entry, i) => ({
    rank: i + 1,
    ...entry,
  }));

  return NextResponse.json({ leaderboard: ranked });
}
