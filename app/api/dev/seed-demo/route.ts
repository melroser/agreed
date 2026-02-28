import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  departments,
  roles,
  employees,
  employeeSkillAssessments,
  employeeXP,
  departmentScores,
} from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { getRoleDefaults } from "@/lib/seed-data";

// Demo departments with their roles and employees
const DEMO_DEPARTMENTS = [
  {
    name: "Sustainability & ESG",
    roles: [
      {
        function: "Sustainability Manager",
        title: "Head of Sustainability",
        employees: [
          { name: "Elena Vasquez", profile: "strong" },
          { name: "Marcus Chen", profile: "growing" },
          { name: "Priya Sharma", profile: "new" },
        ],
      },
      {
        function: "Environmental Analyst",
        title: "Senior Environmental Analyst",
        employees: [
          { name: "James Okafor", profile: "strong" },
          { name: "Sophie Laurent", profile: "moderate" },
        ],
      },
    ],
  },
  {
    name: "Operations",
    roles: [
      {
        function: "Operations Manager",
        title: "VP of Operations",
        employees: [
          { name: "David Kim", profile: "moderate" },
          { name: "Anna Petrov", profile: "growing" },
          { name: "Carlos Rivera", profile: "new" },
        ],
      },
      {
        function: "Facilities Manager",
        title: "Facilities Director",
        employees: [{ name: "Lisa Nakamura", profile: "strong" }],
      },
    ],
  },
  {
    name: "Innovation & R&D",
    roles: [
      {
        function: "Innovation Manager",
        title: "Innovation Lead",
        employees: [
          { name: "Tom Andersen", profile: "moderate" },
          { name: "Fatima Al-Rashid", profile: "growing" },
        ],
      },
    ],
  },
  {
    name: "Compliance & Legal",
    roles: [
      {
        function: "Compliance Manager",
        title: "Chief Compliance Officer",
        employees: [
          { name: "Rachel Goldstein", profile: "strong" },
          { name: "Kenji Watanabe", profile: "moderate" },
        ],
      },
    ],
  },
];

// Generate assessment level based on employee profile and required level
function generateLevel(
  requiredLevel: number,
  profile: string
): number {
  switch (profile) {
    case "strong":
      // Mostly at or above required, occasional small gap
      return Math.min(4, Math.max(1, requiredLevel + randomInt(-1, 1)));
    case "moderate":
      // Mix of gaps: some met, some 1 below
      return Math.min(4, Math.max(1, requiredLevel + randomInt(-2, 0)));
    case "growing":
      // Noticeable gaps: 1-2 below required
      return Math.min(4, Math.max(1, requiredLevel + randomInt(-2, -1)));
    case "new":
      // Significant gaps: mostly level 1-2
      return Math.min(4, Math.max(1, Math.min(requiredLevel - 1, randomInt(1, 2))));
    default:
      return 1;
  }
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || !session.user.companyId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const companyId = session.user.companyId;
  const conductedBy = session.user.id;
  const roleDefaults = getRoleDefaults();
  const now = new Date();

  try {
    // 1. Delete existing demo data for this company
    // Delete assessments, XP, dept scores, employees, roles, departments
    await db
      .delete(employeeSkillAssessments)
      .where(eq(employeeSkillAssessments.companyId, companyId));
    await db.delete(employeeXP).where(eq(employeeXP.companyId, companyId));
    await db
      .delete(departmentScores)
      .where(eq(departmentScores.companyId, companyId));
    await db.delete(employees).where(eq(employees.companyId, companyId));
    await db.delete(roles).where(eq(roles.companyId, companyId));
    await db.delete(departments).where(eq(departments.companyId, companyId));

    let totalEmployees = 0;
    let totalAssessments = 0;
    const deptScoreMap = new Map<string, number>();

    // 2. Create departments, roles, employees, and assessments
    for (const deptDef of DEMO_DEPARTMENTS) {
      const [dept] = await db
        .insert(departments)
        .values({ companyId, name: deptDef.name })
        .returning();

      let deptTotalXP = 0;

      for (const roleDef of deptDef.roles) {
        const [role] = await db
          .insert(roles)
          .values({
            companyId,
            departmentId: dept.id,
            function: roleDef.function,
            title: roleDef.title,
          })
          .returning();

        // Get required skills for this function
        const requiredSkills = roleDefaults.filter(
          (rd) => rd.function === roleDef.function
        );

        for (const empDef of roleDef.employees) {
          const [emp] = await db
            .insert(employees)
            .values({
              companyId,
              departmentId: dept.id,
              roleId: role.id,
              name: empDef.name,
            })
            .returning();

          totalEmployees++;

          // Generate assessment data
          const assessmentRecords = requiredSkills.map((rs) => {
            const level = generateLevel(rs.requiredLevel, empDef.profile);
            return {
              companyId,
              employeeId: emp.id,
              skillId: rs.skillId,
              currentLevel: level,
              assessmentDate: now,
              conductedBy,
            };
          });

          if (assessmentRecords.length > 0) {
            await db
              .insert(employeeSkillAssessments)
              .values(assessmentRecords);
            totalAssessments += assessmentRecords.length;
          }

          // Calculate XP based on profile
          const xpBase =
            empDef.profile === "strong"
              ? randomInt(800, 1500)
              : empDef.profile === "moderate"
              ? randomInt(400, 800)
              : empDef.profile === "growing"
              ? randomInt(200, 500)
              : randomInt(0, 150);

          await db.insert(employeeXP).values({
            companyId,
            employeeId: emp.id,
            xpTotal: xpBase,
            lastUpdated: now,
          });

          deptTotalXP += xpBase;
        }
      }

      // 3. Set department score
      await db.insert(departmentScores).values({
        companyId,
        departmentId: dept.id,
        score: deptTotalXP,
        lastUpdated: now,
      });

      deptScoreMap.set(deptDef.name, deptTotalXP);
    }

    return NextResponse.json({
      success: true,
      summary: {
        departments: DEMO_DEPARTMENTS.length,
        employees: totalEmployees,
        assessments: totalAssessments,
        departmentScores: Object.fromEntries(deptScoreMap),
      },
    });
  } catch (error) {
    console.error("Seed demo error:", error);
    return NextResponse.json(
      { error: "Failed to seed demo data" },
      { status: 500 }
    );
  }
}
