# Implementation Plan: aGreend Skills Platform (24-Hour Hackathon Sprint)

## Overview

This is a "Two-Faced MVP" optimized for winning a 24-hour hackathon. It has two views accessible via a simple toggle:

1. **Admin View** (passes the rubric): Role creation, gap heatmaps, CSV export
2. **Employee View** (wins the hackathon): RPG skill tree, assessment flow, money saved gamification, leaderboards

Technical shortcuts: JWT sessions, Next.js API routes (auto-converted by Netlify), hardcoded seed data, UI-level view toggle (no complex RBAC middleware), focus on the 2-3 minute demo story.

## Tasks

- [x] 1. Project Setup and Database Schema
  - Initialize Next.js 14 project with App Router and TypeScript
  - Install dependencies: `next-auth`, `drizzle-orm`, `@neondatabase/serverless`, `tailwindcss`, `recharts`
  - Set up Neon Postgres connection
  - Create simplified schema: User, Account (for Auth.js), Company, Department, Role, Employee, EmployeeSkillAssessment, EmployeeXP, DepartmentScore
  - **NO RoleSkillRequirement table - use role-defaults.json instead**
  - Run initial migration
  - _Requirements: 18.1, 18.3, 18.4, 18.5_

- [x] 2. Google SSO Authentication - STOP WHEN LOGIN WORKS
  - [x] 2.1 Configure Auth.js with Google provider
    - Create `app/api/auth/[...nextauth]/route.ts`
    - Set up Google OAuth credentials in `.env.local`
    - Configure JWT strategy (no database sessions)
    - Test login: verify you can see user name/email using `useSession()`
    - **STOP HERE - Auth is 100% complete once login works**
    - _Requirements: 2.1, 2.2, 2.3, 2.4_

  - [x] 2.2 Create landing page with Google sign-in
    - Build landing page at `app/page.tsx` with aGreend branding and value prop
    - Add "Sign in with Google" button
    - Show user name after login to verify session works
    - _Requirements: 1.1, 1.2, 1.3_

- [x] 3. Company Onboarding (Minimal)
  - Create onboarding form at `app/onboarding/page.tsx`
  - Collect only: company name, industry (dropdown: Tech, Manufacturing, Retail, Healthcare, Other)
  - Create API route `app/api/company/route.ts` (POST)
  - On submit, create Company and update User.companyId, set role to 'Owner'
  - Redirect to `/dashboard`
  - _Requirements: 6.1, 6.2, 6.3_

- [x] 4. Hardcode Seed Data (NO DATABASE SEEDING)
  - [x] 4.1 Create JSON files with skills and questions
    - Create `lib/data/skills.json`: 40-60 skills across 4 families (Climate Action, Circular Economy, Sustainable Operations, Green Innovation)
    - Each skill: `{ id, name, familyId, familyName, functionTags: [] }`
    - Create `lib/data/questions.json`: 20 questions with `{ id, skillId, prompt }`
    - Create `lib/data/role-defaults.json`: function → skills mappings with required levels
    - _Requirements: 17.1, 17.2, 17.3, 17.4_

  - [x] 4.2 Create utility to load seed data
    - Create `lib/seed-data.ts` with `getSkills()`, `getQuestions()`, `getRoleDefaults()`
    - Export these functions for use throughout app
    - _Requirements: 17.5_

- [x] 5. Admin View: Department and Role Management
  - [x] 5.1 Create navigation with Admin/Employee toggle
    - Build `components/ViewToggle.tsx` with switch between Admin and Employee views
    - Store view preference in local state (no backend needed)
    - Add to main layout
    - _Requirements: (hackathon UX)_

  - [x] 5.2 Create departments page (Admin view)
    - Build `app/dashboard/admin/departments/page.tsx`
    - Simple form: department name
    - API route `app/api/departments/route.ts` (POST, GET)
    - List all departments
    - _Requirements: 6.3.1_

  - [x] 5.3 Create roles page with auto-assignment (Admin view)
    - Build `app/dashboard/admin/roles/page.tsx`
    - Form: select department, enter function (dropdown: Sustainability Manager, Operations Manager, Marketing Manager, etc.), enter title
    - API route `app/api/roles/route.ts` (POST, GET)
    - **JUST SAVE THE FUNCTION STRING - Don't write to RoleSkillRequirement table**
    - Display roles with skill count (calculated from role-defaults.json on the fly)
    - _Requirements: 9.1, 9.2, 9.3_

- [x] 6. Admin View: Employee Management
  - Build `app/dashboard/admin/employees/page.tsx`
  - Form: name, select department, select role
  - API route `app/api/employees/route.ts` (POST, GET, DELETE)
  - List employees with department and role
  - Add delete button (soft delete: set isActive = false)
  - _Requirements: 10.1, 10.2, 10.3, 10.5_

- [x] 7. Employee View: Assessment Flow (THE MONEY MAKER)
  - [x] 7.1 Create assessment page
    - Build `app/dashboard/employee/assessment/page.tsx`
    - Show employee selector (for demo, admin can assess any employee)
    - API route `app/api/assessment/questions/route.ts`: return 20 questions from `questions.json`, prioritize skills from employee's role
    - Display questions with 1-4 radio buttons (1=Curious Explorer, 2=Engaged Learner, 3=Practical Implementer, 4=Conscious Changemaker)
    - Make it visually engaging with progress bar
    - _Requirements: 11.1, 11.2_

  - [x] 7.2 Submit assessment and calculate XP
    - API route `app/api/assessment/submit/route.ts`
    - Save EmployeeSkillAssessment records (employeeId, skillId, currentLevel, assessmentDate, conductedBy)
    - Calculate XP: compare to previous assessment, award points for improvements
    - Update EmployeeXP table
    - Show success message with XP earned
    - _Requirements: 11.4, 11.5, 11.6, 16.1_

- [x] 8. Admin View: Gap Calculation and Dashboard
  - [x] 8.1 Implement gap calculator
    - Create `lib/gap-calculator.ts`
    - `calculateEmployeeGaps(employeeId)`: get employee's role.function, look up skills in role-defaults.json, get latest assessments, compute gap = required - current
    - `classifySeverity(gap)`: Critical if >= 2, Moderate if == 1, No Gap if <= 0
    - Handle missing assessments: treat as Critical
    - **NO DATABASE JOINS - Just read role-defaults.json in memory**
    - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5_

  - [x] 8.2 Create dashboard with ALL rubric requirements
    - Build `app/dashboard/admin/page.tsx`
    - API route `app/api/dashboard/route.ts`: calculate all dashboard data
    - **KPI Cards**: total employees, total gaps, critical count, moderate count
    - **Gap Distribution Bar Chart**: Use recharts to show Critical vs Moderate vs No Gap counts
    - **Role by Theme Heatmap**: roles (rows) × skill families (columns) showing gap counts, color-coded
    - **High Risk Roles Table**: Simple HTML table listing top 3 roles with most Critical gaps
    - _Requirements: 13.1, 13.2, 13.3, 13.4_

- [x] 9. Admin View: CSV Export (REQUIRED FOR RUBRIC)
  - Create API route `app/api/export/gaps/route.ts`
  - Generate CSV: employee, department, role, skill, required level, current level, severity
  - Return as downloadable file
  - Add "Export CSV" button on dashboard
  - _Requirements: 14.1, 14.2, 14.3, 14.4, 14.5_

- [ ] 10. Employee View: RPG Skill Tree (THE WOW FACTOR)
  - [ ] 10.1 Create skill tree visualization
    - Build `app/dashboard/employee/skill-tree/page.tsx`
    - API route `app/api/game/tree/[employeeId]/route.ts`
    - Group skills by family (4 columns or tabs)
    - For each skill: show icon, name, current level (filled circles), required level (empty circles), gap indicator
    - Use RPG-style visuals: locked/unlocked skills, progress bars, level-up animations
    - _Requirements: 15.1, 15.2, 15.3, 15.4_

  - [ ] 10.2 Add "Money Saved" gamification
    - Calculate estimated cost savings: gap closures × $500 per skill level (made-up but compelling)
    - Display prominently on skill tree: "Your team has saved $X,XXX in training costs!"
    - _Requirements: (hackathon wow factor)_

- [ ] 11. Employee View: Leaderboard
  - [ ] 11.1 Calculate department scores
    - Aggregate EmployeeXP by department
    - Update DepartmentScore table on assessment submission
    - _Requirements: 16.2, 16.5_

  - [ ] 11.2 Create leaderboard page
    - Build `app/dashboard/employee/leaderboard/page.tsx`
    - API route `app/api/game/leaderboard/route.ts`
    - Display departments ranked by score with medals (🥇🥈🥉)
    - Show XP totals and employee counts
    - Add fun animations for top 3
    - _Requirements: 16.3, 16.4_

- [ ] 12. Styling and Polish (MAKE IT PRETTY)
  - [ ] 12.1 Apply consistent design system
    - Use TailwindCSS with green/eco color palette
    - Add company logo placeholder (can be customized per company)
    - Ensure responsive design for desktop demo
    - _Requirements: 3.4_

  - [ ] 12.2 Add micro-interactions
    - Loading spinners during API calls
    - Success toasts after actions
    - Smooth transitions between views
    - Hover effects on buttons and cards
    - _Requirements: (hackathon polish)_

  - [ ] 12.3 Create "God Mode" demo data seeder
    - Create hidden API route `app/api/dev/seed-demo/route.ts`
    - When hit, it should:
      1. Delete all existing employees and assessments for the company
      2. Insert 15 fake employees across 3-4 departments
      3. Insert mathematically designed EmployeeSkillAssessment records that create:
         - Beautiful heatmap with varied gap distributions
         - Interesting leaderboard with competitive department scores
         - Mix of Critical, Moderate, and No Gap statuses
      4. Calculate and update EmployeeXP and DepartmentScore tables
    - Add hidden button in dev mode or just hit the URL before demo
    - **This is your insurance policy - perfect demo data in 1 click**
    - _Requirements: (demo preparation)_
- [ ] 13. Final Demo Preparation
  - Test complete flow: Admin creates role → Admin creates employee → Employee takes assessment → View skill tree → View leaderboard → Admin views dashboard → Admin exports CSV
  - Prepare 2-3 minute demo script highlighting:
    1. Problem: Companies struggle to track green skills
    2. Solution: aGreend makes it fun with RPG gamification
    3. Admin view: Role creation, gap analysis, CSV export (hits rubric)
    4. Employee view: Assessment, skill tree, money saved, leaderboard (wins hearts)
  - Record backup demo video in case of technical issues
  - Deploy to Netlify and test production URL

## Notes

- **NO OPTIONAL TESTS** - Focus 100% on working demo
- **Admin/Employee toggle** - Simple UI switch, no backend RBAC needed
- **Hardcoded skills** - JSON files, not database management UI
- **NO RoleSkillRequirement table** - Calculate skills from role-defaults.json on the fly (saves 1 hour)
- **God Mode seeder** - One-click perfect demo data (your insurance policy)
- **Gamification is key** - RPG skill tree and money saved will win this
- **Hit ALL rubric items** - KPI cards, bar chart, heatmap, high-risk table, CSV export
- **2-3 minute story** - Practice the demo flow until it's smooth
- Each task references requirements for traceability
- Checkpoints removed - just build and test as you go
