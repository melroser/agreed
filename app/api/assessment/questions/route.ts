import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { employees, roles } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { getQuestions, getRoleDefaults } from "@/lib/seed-data";

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || !session.user.companyId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const employeeId = searchParams.get("employeeId");

  if (!employeeId) {
    return NextResponse.json({ error: "employeeId is required" }, { status: 400 });
  }

  // Get employee and their role
  const empResult = await db
    .select({
      id: employees.id,
      roleId: employees.roleId,
      roleFunction: roles.function,
    })
    .from(employees)
    .innerJoin(roles, eq(employees.roleId, roles.id))
    .where(
      and(
        eq(employees.id, employeeId),
        eq(employees.companyId, session.user.companyId),
        eq(employees.isActive, true)
      )
    )
    .limit(1);

  if (empResult.length === 0) {
    return NextResponse.json({ error: "Employee not found" }, { status: 404 });
  }

  const roleFunction = empResult[0].roleFunction;

  // Get skills required by this role from role-defaults.json
  const roleDefaults = getRoleDefaults();
  const roleSkillIds = new Set(
    roleDefaults
      .filter((rd) => rd.function === roleFunction)
      .map((rd) => rd.skillId)
  );

  // Get all questions and prioritize by role skills
  const allQuestions = getQuestions();
  const roleQuestions = allQuestions.filter((q) => roleSkillIds.has(q.skillId));
  const otherQuestions = allQuestions.filter((q) => !roleSkillIds.has(q.skillId));

  // Take role-relevant questions first, then fill up to 20
  const selected = [...roleQuestions, ...otherQuestions].slice(0, 20);

  return NextResponse.json({ questions: selected, roleFunction });
}
