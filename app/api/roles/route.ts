import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { roles, departments } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { getRoleDefaults } from "@/lib/seed-data";

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || !session.user.companyId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const departmentId = searchParams.get("departmentId");

  const conditions = [eq(roles.companyId, session.user.companyId)];
  if (departmentId) {
    conditions.push(eq(roles.departmentId, departmentId));
  }

  const result = await db
    .select()
    .from(roles)
    .where(and(...conditions))
    .orderBy(roles.title);

  // Enrich with skill count from role-defaults.json
  const defaults = getRoleDefaults();
  const enriched = result.map((role) => {
    const skillCount = defaults.filter((d) => d.function === role.function).length;
    return { ...role, skillCount };
  });

  return NextResponse.json({ roles: enriched });
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || !session.user.companyId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { departmentId, function: fn, title } = body;

  if (!departmentId || !fn || !title) {
    return NextResponse.json(
      { error: "departmentId, function, and title are required" },
      { status: 400 }
    );
  }

  // Verify department belongs to user's company
  const dept = await db
    .select()
    .from(departments)
    .where(
      and(
        eq(departments.id, departmentId),
        eq(departments.companyId, session.user.companyId)
      )
    )
    .limit(1);

  if (dept.length === 0) {
    return NextResponse.json({ error: "Department not found" }, { status: 404 });
  }

  const [role] = await db
    .insert(roles)
    .values({
      companyId: session.user.companyId,
      departmentId,
      function: fn.trim(),
      title: title.trim(),
    })
    .returning();

  // Return with skill count
  const defaults = getRoleDefaults();
  const skillCount = defaults.filter((d) => d.function === role.function).length;

  return NextResponse.json({ role: { ...role, skillCount } }, { status: 201 });
}
