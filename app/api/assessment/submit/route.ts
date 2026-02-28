import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { employees, employeeSkillAssessments, employeeXP } from "@/lib/db/schema";
import { eq, and, desc } from "drizzle-orm";

interface ResponseItem {
  questionId: string;
  skillId: string;
  level: number;
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || !session.user.companyId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { employeeId, responses } = body as {
    employeeId: string;
    responses: ResponseItem[];
  };

  if (!employeeId) {
    return NextResponse.json({ error: "employeeId is required" }, { status: 400 });
  }
  if (!responses || !Array.isArray(responses) || responses.length === 0) {
    return NextResponse.json({ error: "responses are required" }, { status: 400 });
  }

  // Verify employee belongs to user's company
  const emp = await db
    .select()
    .from(employees)
    .where(
      and(
        eq(employees.id, employeeId),
        eq(employees.companyId, session.user.companyId),
        eq(employees.isActive, true)
      )
    )
    .limit(1);

  if (emp.length === 0) {
    return NextResponse.json({ error: "Employee not found" }, { status: 404 });
  }

  const companyId = session.user.companyId;
  const conductedBy = session.user.id;
  const now = new Date();

  // Get previous assessments for XP calculation
  const previousAssessments = await db
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
  for (const a of previousAssessments) {
    if (!latestLevels.has(a.skillId)) {
      latestLevels.set(a.skillId, a.currentLevel);
    }
  }

  // Insert new assessment records
  const assessmentRecords = responses.map((r) => ({
    companyId,
    employeeId,
    skillId: r.skillId,
    currentLevel: Math.min(4, Math.max(1, r.level)),
    assessmentDate: now,
    conductedBy,
  }));

  await db.insert(employeeSkillAssessments).values(assessmentRecords);

  // Calculate XP: 100 points per level improvement
  let xpEarned = 0;
  for (const r of responses) {
    const prevLevel = latestLevels.get(r.skillId);
    if (prevLevel !== undefined) {
      const improvement = r.level - prevLevel;
      if (improvement > 0) {
        xpEarned += improvement * 100;
      }
    }
  }

  // Upsert EmployeeXP
  const existingXP = await db
    .select()
    .from(employeeXP)
    .where(
      and(
        eq(employeeXP.employeeId, employeeId),
        eq(employeeXP.companyId, companyId)
      )
    )
    .limit(1);

  if (existingXP.length > 0) {
    await db
      .update(employeeXP)
      .set({
        xpTotal: existingXP[0].xpTotal + xpEarned,
        lastUpdated: now,
      })
      .where(eq(employeeXP.id, existingXP[0].id));
  } else {
    await db.insert(employeeXP).values({
      companyId,
      employeeId,
      xpTotal: xpEarned,
      lastUpdated: now,
    });
  }

  return NextResponse.json({
    success: true,
    assessmentCount: responses.length,
    xpEarned,
  });
}
