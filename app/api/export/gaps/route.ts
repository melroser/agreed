import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { departments } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { calculateCompanyGaps } from "@/lib/gap-calculator";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || !session.user.companyId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const companyId = session.user.companyId;

  // Get department names for the CSV
  const deptRows = await db
    .select({ id: departments.id, name: departments.name })
    .from(departments)
    .where(eq(departments.companyId, companyId));

  const deptNameMap = new Map(deptRows.map((d) => [d.id, d.name]));

  // Calculate all gaps
  const allGaps = await calculateCompanyGaps(companyId);

  // Build CSV
  const header = "Employee,Department,Role,Skill,Required Level,Current Level,Severity";
  const rows = allGaps.map((g) => {
    const deptName = deptNameMap.get(g.departmentId) ?? "Unknown";
    const currentLevel = g.currentLevel !== null ? String(g.currentLevel) : "N/A";
    return [
      csvEscape(g.employeeName),
      csvEscape(deptName),
      csvEscape(g.roleTitle),
      csvEscape(g.skillName),
      String(g.requiredLevel),
      currentLevel,
      g.severity,
    ].join(",");
  });

  const csv = [header, ...rows].join("\n");

  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": 'attachment; filename="skills-gap-report.csv"',
    },
  });
}

function csvEscape(value: string): string {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}
