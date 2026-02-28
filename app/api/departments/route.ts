import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { departments } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || !session.user.companyId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await db
    .select()
    .from(departments)
    .where(eq(departments.companyId, session.user.companyId))
    .orderBy(departments.name);

  return NextResponse.json({ departments: result });
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || !session.user.companyId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { name } = body;

  if (!name || typeof name !== "string" || name.trim().length < 1) {
    return NextResponse.json({ error: "Department name is required" }, { status: 400 });
  }

  const [dept] = await db
    .insert(departments)
    .values({ name: name.trim(), companyId: session.user.companyId })
    .returning();

  return NextResponse.json({ department: dept }, { status: 201 });
}
