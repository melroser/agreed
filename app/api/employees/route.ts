import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { employees, departments, roles } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || !session.user.companyId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await db
    .select({
      id: employees.id,
      name: employees.name,
      departmentId: employees.departmentId,
      roleId: employees.roleId,
      isActive: employees.isActive,
      createdAt: employees.createdAt,
      departmentName: departments.name,
      roleTitle: roles.title,
      roleFunction: roles.function,
    })
    .from(employees)
    .innerJoin(departments, eq(employees.departmentId, departments.id))
    .innerJoin(roles, eq(employees.roleId, roles.id))
    .where(
      and(
        eq(employees.companyId, session.user.companyId),
        eq(employees.isActive, true)
      )
    )
    .orderBy(employees.name);

  return NextResponse.json({ employees: result });
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || !session.user.companyId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { name, departmentId, roleId } = body;

  if (!name || typeof name !== "string" || name.trim().length < 1) {
    return NextResponse.json({ error: "Employee name is required" }, { status: 400 });
  }
  if (!departmentId) {
    return NextResponse.json({ error: "Department is required" }, { status: 400 });
  }
  if (!roleId) {
    return NextResponse.json({ error: "Role is required" }, { status: 400 });
  }

  // Verify department belongs to user's company
  const dept = await db
    .select()
    .from(departments)
    .where(
      and(eq(departments.id, departmentId), eq(departments.companyId, session.user.companyId))
    )
    .limit(1);

  if (dept.length === 0) {
    return NextResponse.json({ error: "Department not found" }, { status: 404 });
  }

  // Verify role belongs to the selected department and company
  const role = await db
    .select()
    .from(roles)
    .where(
      and(
        eq(roles.id, roleId),
        eq(roles.companyId, session.user.companyId),
        eq(roles.departmentId, departmentId)
      )
    )
    .limit(1);

  if (role.length === 0) {
    return NextResponse.json({ error: "Role not found in selected department" }, { status: 404 });
  }

  const [employee] = await db
    .insert(employees)
    .values({
      name: name.trim(),
      companyId: session.user.companyId,
      departmentId,
      roleId,
    })
    .returning();

  return NextResponse.json(
    {
      employee: {
        ...employee,
        departmentName: dept[0].name,
        roleTitle: role[0].title,
        roleFunction: role[0].function,
      },
    },
    { status: 201 }
  );
}

export async function DELETE(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || !session.user.companyId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const employeeId = searchParams.get("id");

  if (!employeeId) {
    return NextResponse.json({ error: "Employee id is required" }, { status: 400 });
  }

  // Verify employee belongs to user's company
  const existing = await db
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

  if (existing.length === 0) {
    return NextResponse.json({ error: "Employee not found" }, { status: 404 });
  }

  // Soft delete: set isActive = false, record deactivatedAt
  await db
    .update(employees)
    .set({ isActive: false, deactivatedAt: new Date() })
    .where(eq(employees.id, employeeId));

  return NextResponse.json({ success: true });
}
