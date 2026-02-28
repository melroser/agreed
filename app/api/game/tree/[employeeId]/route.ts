import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { employees, roles, employeeSkillAssessments, employeeXP } from "@/lib/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { getRoleDefaults, getSkills } from "@/lib/seed-data";

export async function GET(
  _request: Request,
  { params }: { params: { employeeId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || !(session.user as any).companyId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const companyId = (session.user as any).companyId;
  const { employeeId } = params;

  // Get employee with role info
  const empResult = await db
    .select({
      id: employees.id,
      name: employees.name,
      departmentId: employees.departmentId,
      roleId: employees.roleId,
      roleFunction: roles.function,
      roleTitle: roles.title,
    })
    .from(employees)
    .innerJoin(roles, eq(employees.roleId, roles.id))
    .where(
      and(
        eq(employees.id, employeeId),
        eq(employees.companyId, companyId),
        eq(employees.isActive, true)
      )
    )
    .limit(1);

  if (empResult.length === 0) {
    return NextResponse.json({ error: "Employee not found" }, { status: 404 });
  }

  const emp = empResult[0];
  const roleDefaults = getRoleDefaults();
  const allSkills = getSkills();
  const skillMap = new Map(allSkills.map((s) => [s.id, s]));

  // Get required skills for this role function
  const requiredSkills = roleDefaults.filter((rd) => rd.function === emp.roleFunction);

  // Get latest assessments for this employee
  const assessments = await db
    .select({
      skillId: employeeSkillAssessments.skillId,
      currentLevel: employeeSkillAssessments.currentLevel,
      assessmentDate: employeeSkillAssessments.assessmentDate,
    })
    .from(employeeSkillAssessments)
    .where(
      and(
        eq(employeeSkillAssessments.employeeId, employeeId),
        eq(employeeSkillAssessments.companyId, companyId)
      )
    )
    .orderBy(desc(employeeSkillAssessments.assessmentDate));

  // Build map of latest level per skill
  const latestLevels = new Map<string, number>();
  for (const a of assessments) {
    if (!latestLevels.has(a.skillId)) {
      latestLevels.set(a.skillId, a.currentLevel);
    }
  }

  // Get employee XP
  const xpResult = await db
    .select({ xpTotal: employeeXP.xpTotal })
    .from(employeeXP)
    .where(
      and(
        eq(employeeXP.employeeId, employeeId),
        eq(employeeXP.companyId, companyId)
      )
    )
    .limit(1);

  const xpTotal = xpResult.length > 0 ? xpResult[0].xpTotal : 0;

  // Build skill tree grouped by family
  const familyMap = new Map<string, {
    familyId: string;
    familyName: string;
    skills: Array<{
      skillId: string;
      skillName: string;
      currentLevel: number | null;
      requiredLevel: number;
      gapValue: number;
      severity: string;
      unlocked: boolean;
    }>;
  }>();

  for (const rs of requiredSkills) {
    const skill = skillMap.get(rs.skillId);
    if (!skill) continue;

    if (!familyMap.has(skill.familyId)) {
      familyMap.set(skill.familyId, {
        familyId: skill.familyId,
        familyName: skill.familyName,
        skills: [],
      });
    }

    const currentLevel = latestLevels.get(rs.skillId) ?? null;
    const gapValue = currentLevel === null ? rs.requiredLevel : rs.requiredLevel - currentLevel;
    const severity = gapValue >= 2 ? "Critical" : gapValue === 1 ? "Moderate" : "No Gap";

    familyMap.get(skill.familyId)!.skills.push({
      skillId: rs.skillId,
      skillName: rs.skillName,
      currentLevel,
      requiredLevel: rs.requiredLevel,
      gapValue,
      severity,
      unlocked: currentLevel !== null,
    });
  }

  // Calculate money saved: each level gained = $500
  let totalLevelsGained = 0;
  for (const rs of requiredSkills) {
    const currentLevel = latestLevels.get(rs.skillId);
    if (currentLevel !== null && currentLevel !== undefined) {
      totalLevelsGained += currentLevel;
    }
  }
  const moneySaved = totalLevelsGained * 500;

  const families = Array.from(familyMap.values()).sort((a, b) =>
    a.familyName.localeCompare(b.familyName)
  );

  return NextResponse.json({
    employee: {
      id: emp.id,
      name: emp.name,
      roleFunction: emp.roleFunction,
      roleTitle: emp.roleTitle,
    },
    xpTotal,
    moneySaved,
    totalSkills: requiredSkills.length,
    unlockedSkills: requiredSkills.filter((rs) => latestLevels.has(rs.skillId)).length,
    families,
  });
}
