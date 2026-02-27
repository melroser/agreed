import { pgTable, text, timestamp, uuid, boolean, integer, pgEnum } from "drizzle-orm/pg-core";

// Enums
export const userRoleEnum = pgEnum("user_role", ["Owner", "Admin", "Manager", "Employee"]);
export const maturityLevelEnum = pgEnum("maturity_level", ["1", "2", "3", "4"]);

// User table
export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  companyId: uuid("company_id").references(() => companies.id),
  role: userRoleEnum("role").default("Employee"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Account table (required by Auth.js)
export const accounts = pgTable("accounts", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  type: text("type").notNull(),
  provider: text("provider").notNull(),
  providerAccountId: text("provider_account_id").notNull(),
  refresh_token: text("refresh_token"),
  access_token: text("access_token"),
  expires_at: integer("expires_at"),
  token_type: text("token_type"),
  scope: text("scope"),
  id_token: text("id_token"),
  session_state: text("session_state"),
});

// Company table
export const companies = pgTable("companies", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  industry: text("industry").notNull(),
  size: text("size"),
  location: text("location"),
  logoUrl: text("logo_url"),
  primaryColor: text("primary_color"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Department table
export const departments = pgTable("departments", {
  id: uuid("id").defaultRandom().primaryKey(),
  companyId: uuid("company_id").notNull().references(() => companies.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Role table
export const roles = pgTable("roles", {
  id: uuid("id").defaultRandom().primaryKey(),
  companyId: uuid("company_id").notNull().references(() => companies.id, { onDelete: "cascade" }),
  departmentId: uuid("department_id").notNull().references(() => departments.id, { onDelete: "cascade" }),
  function: text("function").notNull(), // Used to lookup skills in role-defaults.json
  title: text("title").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Employee table
export const employees = pgTable("employees", {
  id: uuid("id").defaultRandom().primaryKey(),
  companyId: uuid("company_id").notNull().references(() => companies.id, { onDelete: "cascade" }),
  departmentId: uuid("department_id").notNull().references(() => departments.id, { onDelete: "cascade" }),
  roleId: uuid("role_id").notNull().references(() => roles.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  deactivatedAt: timestamp("deactivated_at"),
});

// EmployeeSkillAssessment table
export const employeeSkillAssessments = pgTable("employee_skill_assessments", {
  id: uuid("id").defaultRandom().primaryKey(),
  companyId: uuid("company_id").notNull().references(() => companies.id, { onDelete: "cascade" }),
  employeeId: uuid("employee_id").notNull().references(() => employees.id, { onDelete: "cascade" }),
  skillId: text("skill_id").notNull(), // References skill in JSON file
  currentLevel: integer("current_level").notNull(), // 1-4
  assessmentDate: timestamp("assessment_date").defaultNow().notNull(),
  conductedBy: uuid("conducted_by").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// EmployeeXP table
export const employeeXP = pgTable("employee_xp", {
  id: uuid("id").defaultRandom().primaryKey(),
  companyId: uuid("company_id").notNull().references(() => companies.id, { onDelete: "cascade" }),
  employeeId: uuid("employee_id").notNull().references(() => employees.id, { onDelete: "cascade" }),
  xpTotal: integer("xp_total").default(0).notNull(),
  lastUpdated: timestamp("last_updated").defaultNow().notNull(),
});

// DepartmentScore table
export const departmentScores = pgTable("department_scores", {
  id: uuid("id").defaultRandom().primaryKey(),
  companyId: uuid("company_id").notNull().references(() => companies.id, { onDelete: "cascade" }),
  departmentId: uuid("department_id").notNull().references(() => departments.id, { onDelete: "cascade" }),
  score: integer("score").default(0).notNull(),
  lastUpdated: timestamp("last_updated").defaultNow().notNull(),
});
