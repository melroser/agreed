# aGreend - Green Skills Platform

A green skills gap intelligence platform built for the 24-hour hackathon.

## Tech Stack

- **Frontend**: Next.js 14 with App Router, React, TailwindCSS
- **Backend**: Netlify Functions (Next.js API routes)
- **Authentication**: Auth.js (NextAuth.js) with Google OAuth
- **Database**: Neon Postgres
- **ORM**: Drizzle ORM

## Setup

1. Install dependencies:
```bash
npm install
```

2. Set up your environment variables:
   - Copy `.env.example` to `.env.local`
   - Add your Neon database URL
   - Add your Google OAuth credentials

3. Push the schema to your database:
```bash
npm run db:push
```

4. Run the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

## Database Schema

The platform uses a simplified schema optimized for the hackathon:

- **User** - Authenticated users with Google SSO
- **Account** - Auth.js account linking
- **Company** - Tenant organizations
- **Department** - Organizational units
- **Role** - Job functions (skills loaded from role-defaults.json)
- **Employee** - People being assessed
- **EmployeeSkillAssessment** - Assessment results
- **EmployeeXP** - Gamification points
- **DepartmentScore** - Leaderboard scores

## Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run db:generate` - Generate migrations
- `npm run db:push` - Push schema to database
- `npm run db:studio` - Open Drizzle Studio

## Project Structure

```
agreend/
├── app/                    # Next.js App Router
│   ├── api/               # API routes (auto-converted to Netlify Functions)
│   ├── dashboard/         # Dashboard pages
│   └── page.tsx           # Landing page
├── components/            # React components
├── lib/
│   ├── db/               # Database schema and connection
│   └── data/             # Seeded data (skills.json, questions.json, role-defaults.json)
└── drizzle/              # Database migrations
```

## Hackathon Shortcuts

- JWT sessions (no database session table)
- Skills stored in JSON files (no skill management UI)
- No RoleSkillRequirement table (calculated on-the-fly)
- Simplified RBAC (role stored on User)
- No invitation system (users create companies on first login)
