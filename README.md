# aGreend - Green Skills Gap Intelligence Platform
*Built for the Velric Miami Hackathon (Sustainability Track)*

## What we built
aGreend is an enterprise-grade MVP designed to assess, track, and close sustainability skill gaps across a modern workforce. While traditional HR tools use static, boring dashboards, aGreend introduces gamification (RPG-style skill trees and competitive department leaderboards) to incentivize employees to upskill in critical climate action areas.

## Why it matters
Enterprises cannot execute on their climate pledges if their workforce lacks the necessary green skills. aGreend gives HR and ESG leaders instant, actionable intelligence on exactly where their organization is exposed (e.g., Procurement lacking Circular Economy knowledge), allowing them to deploy targeted training.

## How the gap scoring works
Our calculation engine is strictly mathematical:
1. **Required Level:** Roles are mapped to specific skills with a required maturity level (1-4).
2. **Current Level:** Employees self-assess on a 4-point scale (Curious Explorer to Conscious Changemaker).
3. **Gap Formula:** `Required Level - Current Level = Gap Value`
   - **Critical Gap:** Difference of 2+ (or if no assessment has been taken).
   - **Moderate Gap:** Difference of 1.
   - **No Gap:** Current level meets or exceeds required level.

## Data Architecture
- **Auth:** NextAuth (Auth.js) via Google SSO (JWT Strategy).
- **Database:** Serverless Postgres via Neon (`neon-http` driver) + Drizzle ORM.
- **Data Source:** To ensure a realistic demo, the core Skills Directory and Role mappings are strictly typed from a pre-seeded JSON dataset, while all Employee, Assessment, and Gamification data (XP/Scores) are stored and calculated dynamically in Neon Postgres.

## 🚀 How to Run the Demo (For Judges)

We built a 2-minute "Golden Path" for judges to evaluate the platform:

1. **Onboard:** Click "Sign in with Google" and create your company profile.
2. **Explore Admin View:** Navigate to `/dashboard/admin`. Notice the KPI cards, Gap Distribution Bar Chart, and Role by Theme Heatmap.
3. **Create a Role:** Go to the Roles tab. Create a new role (e.g., "Operations Manager") and watch the system automatically assign the required Green Skills based on that function.
4. **Take an Assessment:** Toggle to the **Employee View**. Go to the Assessment tab and complete the 4-point maturity questionnaire.
5. **The Gamification Wow-Factor:** Go to the **Skill Tree** tab to see your RPG-style progression and the estimated "Money Saved in Training." Finally, check the **Leaderboard** to see your department's rank increase from your newly earned XP!
6. **Export:** Go back to the Admin Dashboard and click "Export CSV" to pull the raw compliance data.

---
### Local Setup Instructions
1. Clone the repo: `git clone https://github.com/your-username/agreend`
2. Install dependencies: `npm install`
3. Set up `.env.local` with `DATABASE_URL` (Neon Postgres), `NEXTAUTH_SECRET`, and Google OAuth credentials.
4. Push schema: `npx drizzle-kit push`
5. Run server: `npm run dev`
