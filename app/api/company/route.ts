import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { companies, users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { name, industry } = body;

  // Validate inputs
  if (!name || typeof name !== "string" || name.trim().length < 2 || name.trim().length > 100) {
    return NextResponse.json(
      { error: "Company name must be between 2 and 100 characters" },
      { status: 400 }
    );
  }

  const validIndustries = ["Tech", "Manufacturing", "Retail", "Healthcare", "Other"];
  if (!industry || !validIndustries.includes(industry)) {
    return NextResponse.json(
      { error: "Invalid industry selection" },
      { status: 400 }
    );
  }

  // Check if user already has a company
  const userId = session.user.id;
  const existingUser = await db
    .select({ companyId: users.companyId })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (existingUser.length > 0 && existingUser[0].companyId) {
    return NextResponse.json(
      { error: "User already belongs to a company" },
      { status: 409 }
    );
  }

  // Create company and update user in a single flow
  const [company] = await db
    .insert(companies)
    .values({ name: name.trim(), industry })
    .returning();

  await db
    .update(users)
    .set({ companyId: company.id, role: "Owner" })
    .where(eq(users.id, userId));

  return NextResponse.json({ company }, { status: 201 });
}
