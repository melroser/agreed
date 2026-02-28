import { db } from "@/lib/db";
import { employees, roles, employeeSkillAssessments } from "@/lib/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { getRoleDefaults, getSkills } from "@/lib/seed-data";

export type Severity = "Critical" | "Moderate" | "No Gap";

export interface SkillGap {
  employeeId: string;
  employeeName: string;
  departmentId: string;
  roleId: string;
  roleTitle: string;
  roleFunction: string;
  skillId: string;
  skillName: string;
  familyId: string;
  familyName: string;
  requiredLevel: number;
  currentLevel: number | null;
  gapValue: number;
  severity: Severity;
}

export function classifySeverity(gapValue: number): Severity {
  if (gapValue >= 2) return "Critical";
  if (gapValue === 1) return "Moderate";
  return "No Gap";
}

export async function calculateEmployeeGaps(employeeId: string, companyId: string): Promise<SkillGap[]> {
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

  if (empResult.length === 0) return [];

  const emp = empResult[0];
  const roleDefaults = getRoleDefaults();
  const allSkills = getSkills();
  const skillMap = new Map(allSkills.map((s) => [s.id, s]));

  // Get required skills for this role function
  const requiredSkills = roleDefaults.filter((rd) => rd.function === emp.roleFunction);

  if (requiredSkills.length === 0) return [];

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

  // Calculate gaps
  return requiredSkills.map((rs) => {
    const currentLevel = latestLevels.get(rs.skillId) ?? null;
    const gapValue = currentLevel === null ? rs.requiredLevel : rs.requiredLevel - currentLevel;
    const skill = skillMap.get(rs.skillId);

    return {
      employeeId: emp.id,
      employeeName: emp.name,
      departmentId: emp.departmentId,
      roleId: emp.roleId,
      roleTitle: emp.roleTitle,
      roleFunction: emp.roleFunction,
      skillId: rs.skillId,
      skillName: rs.skillName,
      familyId: skill?.familyId ?? "",
      familyName: skill?.familyName ?? "",
      requiredLevel: rs.requiredLevel,
      currentLevel,
      gapValue,
      severity: classifySeverity(gapValue),
    };
  });
}

export async function calculateCompanyGaps(companyId: string): Promise<SkillGap[]> {
  // Get all active employees for this company
  const activeEmployees = await db
    .select({ id: employees.id })
    .from(employees)
    .where(
      and(
        eq(employees.companyId, companyId),
        eq(employees.isActive, true)
      )
    );

  const allGaps: SkillGap[] = [];
  for (const emp of activeEmployees) {
    const gaps = await calculateEmployeeGaps(emp.id, companyId);
    allGaps.push(...gaps);
  }

  return allGaps;
}
