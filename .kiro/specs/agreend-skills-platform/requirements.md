# Requirements Document

## Introduction

aGreend is a green skills gap intelligence platform that helps organizations assess, track, and close sustainability skills gaps across their workforce. The system provides role-based skill assessments, gap analysis dashboards, and gamification features to encourage skill development. The platform uses Google SSO for authentication and enforces strict tenant isolation to ensure data security across companies. Each company can customize the platform branding to reflect their organizational identity.

## Glossary

- **System**: The aGreend platform including frontend, backend functions, and database
- **User**: An authenticated person with a Google account who has access to the platform
- **Company**: A tenant organization using the platform (also referred to as tenant)
- **Employee**: A person within a company whose skills are being assessed (may or may not have a User account)
- **Employee_User_Link**: Optional association between an Employee record and a User account for self-service access
- **Role**: A job function within a department with associated skill requirements
- **Department**: An organizational unit within a company
- **Skill**: A specific green/sustainability competency that can be assessed
- **Skill_Family**: A grouping of related skills
- **Gap**: The difference between required skill level and current skill level
- **Maturity_Level**: A 1-4 scale representing skill proficiency (1=Curious Explorer, 2=Engaged Learner, 3=Practical Implementer, 4=Conscious Changemaker)
- **Severity**: Classification of gap urgency (Critical, Moderate, No Gap)
- **Assessment**: A questionnaire that measures an employee's current skill levels
- **Session**: An authenticated user session stored in an HttpOnly cookie
- **Active_Department**: The department context a user is currently operating within
- **Baseline_Skills**: Company-wide skill requirements that apply to all employees
- **Department_Skills**: Additional skill requirements specific to a department
- **Role_Skills**: Specific skill requirements for a particular role within a department
- **User_Role**: The permission level assigned to a user within a company (Owner, Admin, Manager, Employee)
- **Owner**: User who created the company with full administrative privileges
- **Admin**: User with company-wide administrative privileges
- **Manager**: User with department-level administrative privileges
- **Employee**: User with read-only access to their own data
- **Invitation**: A pending membership offer sent to an email address
- **Department_Assignment**: The mapping of a Manager to specific departments they can access

## Requirements

### Requirement 1: Landing Page and Authentication Entry

**User Story:** As a visitor, I want to see a landing page explaining aGreend, so that I understand what the platform offers before signing in.

#### Acceptance Criteria

1. WHEN a user visits the homepage, THE System SHALL display a landing page with information about aGreend
2. THE System SHALL display a login button on the landing page
3. WHEN a user clicks the login button, THE System SHALL navigate to the authentication flow
4. THE System SHALL provide clear messaging about the platform's purpose and features on the landing page
5. THE System SHALL make the login button prominently visible on the landing page

### Requirement 2: Google SSO Authentication

**User Story:** As a user, I want to sign in with my Google account, so that I can access the platform securely without creating a new password.

#### Acceptance Criteria

1. WHEN a user initiates login, THE System SHALL display a "Sign in with Google" option
2. WHEN a user clicks "Sign in with Google", THE System SHALL redirect to Google OAuth authorization
3. WHEN Google returns with authorization, THE System SHALL create a session and set an HttpOnly cookie
4. WHEN a session is created, THE System SHALL persist user information (email, name) in the database
5. THE System SHALL use Auth.js running inside a Netlify Function with Google as the only provider

### Requirement 3: Company Branding Customization

**User Story:** As a company administrator, I want to customize the platform branding for my organization, so that the interface reflects our company identity.

#### Acceptance Criteria

1. WHEN a company is created, THE System SHALL allow configuration of company-specific branding
2. THE System SHALL support customization of company logo
3. THE System SHALL support customization of primary brand colors
4. WHEN a user accesses the platform, THE System SHALL display the branding for their associated company
5. THE System SHALL store branding configuration in the Company record

### Requirement 4: Session Management and Authorization

**User Story:** As a system administrator, I want all API requests to validate user sessions, so that unauthorized users cannot access protected data.

#### Acceptance Criteria

1. WHEN a user makes a request to a protected endpoint, THE System SHALL validate the session cookie
2. IF the session is invalid or missing, THEN THE System SHALL return an authentication error
3. WHEN a valid session exists, THE System SHALL resolve the user's active department context
4. THE System SHALL provide a logout endpoint that clears the session cookie
5. THE System SHALL provide a "me" endpoint that returns the current user and active department information

### Requirement 5: Multi-Tenant Data Isolation

**User Story:** As a company administrator, I want my company's data to be completely isolated from other companies, so that our sensitive skills data remains private.

#### Acceptance Criteria

1. THE System SHALL store a companyId on every tenant-scoped database record
2. WHEN a user accesses any protected endpoint, THE System SHALL verify the user is a member of the requested company
3. IF a user is not a member of a company, THEN THE System SHALL reject the request
4. WHEN querying data, THE System SHALL filter all results by the user's companyId
5. WHEN writing data, THE System SHALL automatically include the user's companyId

### Requirement 6: Company Onboarding

**User Story:** As a new user, I want to create a company profile after signing in, so that I can start using the platform for my organization.

#### Acceptance Criteria

1. WHEN a user signs in for the first time with no company membership, THE System SHALL prompt them to create a company profile
2. WHEN a user submits company information (industry, size, location, branding), THE System SHALL create a Company record
3. WHEN a Company is created, THE System SHALL create a CompanyUser membership linking the user to the company with Owner role
4. WHEN a Company is created, THE System SHALL initialize baseline skill requirements for the company
5. THE System SHALL allow users to retrieve their company information

### Requirement 6.1: Company Invitation and Membership

**User Story:** As a company owner or admin, I want to invite users to join my company, so that I can build my team on the platform.

#### Acceptance Criteria

1. WHEN an owner or admin sends an invitation, THE System SHALL create an invitation record with email, assigned role, and expiration timestamp of 7 days
2. WHEN an invited user signs in with the matching email before expiration, THE System SHALL automatically create CompanyUser membership with the assigned role
3. IF an invitation expires, THEN THE System SHALL mark it as expired and prevent acceptance
4. THE System SHALL allow owners and admins to revoke pending invitations
5. THE System SHALL allow owners and admins to resend invitations
6. IF a user belongs to multiple companies, THEN THE System SHALL display a company selector on login
7. WHEN a user selects a company, THE System SHALL set that company as their active context for the session
8. THE System SHALL allow users to switch between companies they are members of

### Requirement 6.2: Role-Based Access Control

**User Story:** As a company owner, I want to control what different users can do in the platform, so that I can maintain appropriate access levels.

#### Acceptance Criteria

1. THE System SHALL support four user roles: Owner, Admin, Manager, Employee
2. WHEN a user attempts an action, THE System SHALL verify the user has the required role for that action
3. IF a user lacks the required role, THEN THE System SHALL reject the request with an authorization error
4. THE System SHALL store the user's role in the CompanyUser record
5. THE System SHALL allow owners and admins to change user roles

### Requirement 6.3: Permission Matrix

**User Story:** As a system, I need to enforce consistent permissions across all actions, so that access control is predictable and secure.

#### Acceptance Criteria

1. THE System SHALL allow only Owners and Admins to create departments
2. THE System SHALL allow only Owners and Admins to create roles
3. THE System SHALL allow Owners, Admins, and Managers to create employees in their accessible departments
4. THE System SHALL allow Owners, Admins, and Managers to conduct assessments in their accessible departments
5. THE System SHALL allow Owners and Admins to view company-wide dashboards and analytics
6. THE System SHALL allow Managers to view dashboards filtered to their assigned departments
7. THE System SHALL allow Employees to view only their own skill tree and assessment history
8. THE System SHALL allow Owners, Admins, and Managers to export CSV data for their accessible scope
9. THE System SHALL allow all authenticated users to view the leaderboard
10. THE System SHALL allow Owners to invite users with any role and Admins to invite users with Manager or Employee roles

### Requirement 7: Hierarchical Skills Management

**User Story:** As a company administrator, I want skills to be organized hierarchically from company baseline to department to role, so that skill requirements inherit appropriately across the organization.

#### Acceptance Criteria

1. WHEN a company is created, THE System SHALL establish baseline skills that apply to all employees
2. WHEN a department is created, THE System SHALL allow assignment of department-specific skills in addition to company baseline
3. WHEN a role is created within a department, THE System SHALL allow assignment of role-specific skills in addition to department and company skills
4. WHEN calculating skill requirements for an employee, THE System SHALL combine company baseline, department-specific, and role-specific skills
5. THE System SHALL prevent duplicate skills across hierarchy levels for the same employee

### Requirement 8: Department Context Management

**User Story:** As a user, I want to work within a specific department context, so that I can focus on the relevant employees and skills for that part of the organization.

#### Acceptance Criteria

1. WHEN a Manager accesses the platform, THE System SHALL determine their assigned departments
2. WHEN an Owner or Admin accesses the platform, THE System SHALL provide access to all departments
3. THE System SHALL allow users to switch between departments they have access to
4. WHEN a user's active department changes, THE System SHALL update their UI context preference
5. THE System SHALL require explicit departmentId parameter for all department-scoped API endpoints

### Requirement 8.1: Department Scoping Strategy

**User Story:** As a system, I need a clear scoping strategy for department-filtered data, so that API behavior is predictable and secure.

#### Acceptance Criteria

1. WHEN an API endpoint requires department-scoped data, THE System SHALL require departmentId as an explicit parameter
2. WHEN a Manager requests data, THE System SHALL verify they have access to the specified departmentId
3. WHEN an Owner or Admin requests data without departmentId, THE System SHALL return company-wide aggregated data
4. WHEN an Owner or Admin requests data with departmentId, THE System SHALL return data filtered to that department
5. THE System SHALL reject requests where a Manager attempts to access a department they are not assigned to

### Requirement 9: Role Management with Auto-Assigned Skills

**User Story:** As a company administrator, I want to create roles with automatically assigned skill requirements, so that I can quickly define what skills are needed for each position.

#### Acceptance Criteria

1. WHEN a user creates a role with a job function, THE System SHALL automatically assign relevant role-specific skills based on function defaults
2. WHEN skills are assigned to a role, THE System SHALL include a required maturity level (1-4) for each skill
3. THE System SHALL store role information including function, title, and departmentId
4. WHEN a user requests role details, THE System SHALL return the role with all required skills (company baseline + department + role-specific) and their levels
5. THE System SHALL list all roles within the active department

### Requirement 10: Employee Lifecycle Management

**User Story:** As a company administrator, I want to manage employee records including adding and removing employees, so that the system reflects current workforce composition.

#### Acceptance Criteria

1. WHEN a user creates an employee, THE System SHALL require name, department, and role assignment
2. THE System SHALL store employee records with companyId, departmentId, and roleId
3. WHEN an employee leaves the organization, THE System SHALL allow soft deletion of the employee record while preserving historical assessment data
4. WHEN a removed employee rejoins, THE System SHALL allow reactivation of the existing employee record or creation of a new record
5. THE System SHALL list all active employees within the accessible departments

### Requirement 10.1: Employee Self-Service Access

**User Story:** As an employee, I want to link my user account to my employee record, so that I can view my own skills and assessments.

#### Acceptance Criteria

1. WHEN an employee has a User account with matching email, THE System SHALL allow linking the User to the Employee record
2. WHEN a User is linked to an Employee record, THE System SHALL grant that User access to view their own skill tree and assessment history
3. THE System SHALL allow Employees to view their own current skill levels and gaps
4. THE System SHALL prevent Employees from editing their own assessment data
5. THE System SHALL allow Employees to view their XP and position on the leaderboard

### Requirement 11: Skills Assessment

**User Story:** As a company administrator, I want to assess an employee's current skill levels, so that I can identify gaps between their abilities and role requirements.

#### Acceptance Criteria

1. WHEN a user starts an assessment for an employee, THE System SHALL provide exactly 20 questions selected from the seeded question dataset
2. WHEN selecting questions, THE System SHALL prioritize questions mapped to skills required by the employee's role
3. WHEN displaying questions, THE System SHALL show a 1-4 maturity level scale for each question
4. WHEN a user submits assessment responses, THE System SHALL map answers to skills and store current levels
5. THE System SHALL persist EmployeeSkillAssessment records with companyId, employeeId, skillId, currentLevel, assessmentDate, and conductedBy userId
6. WHEN an assessment is submitted, THE System SHALL create a new assessment record without overwriting previous assessments
7. THE System SHALL allow multiple assessments per employee to track skill progression over time
8. IF an assessment is abandoned before completion, THEN THE System SHALL discard the partial data

### Requirement 11.1: Assessment History and Versioning

**User Story:** As a company administrator, I want to track skill assessment history over time, so that I can measure employee development progress.

#### Acceptance Criteria

1. THE System SHALL retain all historical assessment records for each employee
2. WHEN displaying current skill levels, THE System SHALL use the most recent assessment for each skill
3. THE System SHALL allow users to view assessment history showing skill level changes over time
4. WHEN an employee's role changes, THE System SHALL preserve all previous assessments
5. THE System SHALL calculate gap values using the most recent assessment data for each skill

### Requirement 12: Gap Calculation and Severity Classification

**User Story:** As a company administrator, I want the system to calculate skills gaps and classify their severity, so that I can prioritize training and development efforts.

#### Acceptance Criteria

1. WHEN calculating a gap, THE System SHALL compute gapValue as requiredLevel minus currentLevel
2. IF gapValue is 2 or more, THEN THE System SHALL classify the gap as Critical
3. IF gapValue is 1, THEN THE System SHALL classify the gap as Moderate
4. IF gapValue is 0 or less, THEN THE System SHALL classify as No Gap
5. IF a required skill has no assessment data, THEN THE System SHALL classify it as Critical with gapValue equal to requiredLevel
6. THE System SHALL calculate gaps for all employees with role assignments

### Requirement 13: Dashboard Analytics

**User Story:** As a company administrator, I want to view a dashboard with skills gap analytics, so that I can understand the overall skills health of my organization.

#### Acceptance Criteria

1. WHEN a user accesses the dashboard, THE System SHALL display KPI cards showing total gaps by severity
2. WHEN displaying analytics, THE System SHALL show severity distribution across the company
3. THE System SHALL provide a role heatmap showing gap concentrations by role
4. THE System SHALL identify and display high-risk roles with the most critical gaps
5. THE System SHALL filter all dashboard data by the user's companyId

### Requirement 14: CSV Export

**User Story:** As a company administrator, I want to export skills gap data as CSV, so that I can analyze it in external tools or share it with stakeholders.

#### Acceptance Criteria

1. WHEN a user requests a CSV export, THE System SHALL generate a file with columns: employee, department, role, skill, required level, current level, severity
2. THE System SHALL include all employees with assessment data in the export
3. THE System SHALL filter export data by the user's companyId
4. WHEN the export is ready, THE System SHALL trigger a file download in the browser
5. THE System SHALL format the CSV with proper headers and comma-separated values

### Requirement 15: Skill Tree Visualization

**User Story:** As an employee, I want to view a skill tree showing my progress across skill families, so that I can visualize my development journey.

#### Acceptance Criteria

1. WHEN a user accesses the skill tree, THE System SHALL group skills by skill family
2. WHEN displaying skills, THE System SHALL show the employee's current level and required level for each skill
3. THE System SHALL visually indicate gaps using color coding or progress indicators
4. THE System SHALL display all skills from the seeded dataset organized by family
5. THE System SHALL filter skill tree data by the selected employee within the active department

### Requirement 16: Gamification and Leaderboard

**User Story:** As a company administrator, I want to see department rankings based on skills progress, so that I can encourage healthy competition and engagement.

#### Acceptance Criteria

1. WHEN calculating XP, THE System SHALL award points based on gap closures (skill level improvements)
2. THE System SHALL aggregate employee XP by department to create department scores
3. WHEN a user accesses the leaderboard, THE System SHALL display departments ranked by total score
4. THE System SHALL filter leaderboard data by the user's companyId
5. THE System SHALL update department scores when new assessments are submitted

### Requirement 17: Seeded Data Management

**User Story:** As a system, I need pre-populated skills and assessment data, so that users can immediately start creating roles and conducting assessments.

#### Acceptance Criteria

1. THE System SHALL include 40-60 pre-seeded skills organized into 4 skill families
2. THE System SHALL include 15-20 pre-seeded assessment questions, each mapped to a skillId
3. THE System SHALL include default role-to-skill mappings with required levels for common job functions
4. WHEN a skill is seeded, THE System SHALL include function tags to enable auto-assignment to roles
5. THE System SHALL make seeded data available to all companies without duplication

### Requirement 18: Database and Hosting Infrastructure

**User Story:** As a system, I need reliable hosted database infrastructure, so that the application can run in production without local dependencies.

#### Acceptance Criteria

1. THE System SHALL use hosted Postgres (Neon or Supabase) for data storage
2. THE System SHALL NOT use SQLite for deployed environments
3. THE System SHALL use Drizzle ORM or Prisma for database access
4. THE System SHALL run all backend logic in Netlify Functions
5. THE System SHALL host the frontend on Netlify with Next.js App Router

### Requirement 19: Error Handling and Validation

**User Story:** As a user, I want clear error messages when something goes wrong, so that I understand what happened and how to fix it.

#### Acceptance Criteria

1. WHEN Google SSO authentication fails, THE System SHALL display a user-friendly error message and provide a retry option
2. WHEN a user submits invalid data, THE System SHALL return specific validation errors for each field
3. WHEN a network error occurs during assessment submission, THE System SHALL preserve the user's answers and allow retry
4. WHEN an authorization error occurs, THE System SHALL display a message explaining the required permission level
5. THE System SHALL validate all email addresses using standard email format rules
6. THE System SHALL validate that required skill levels are between 1 and 4
7. THE System SHALL validate that company names are between 2 and 100 characters
8. WHEN an unexpected server error occurs, THE System SHALL log the error details and display a generic error message to the user

### Requirement 20: Seeded Data Management and Updates

**User Story:** As a system administrator, I want to update seeded skills when sustainability standards evolve, so that the platform remains current with industry best practices.

#### Acceptance Criteria

1. THE System SHALL version all seeded skill definitions with a version number and effective date
2. WHEN seeded skills are updated, THE System SHALL create a new version without deleting previous versions
3. THE System SHALL allow companies to opt-in to new skill versions
4. WHEN a company updates to a new skill version, THE System SHALL preserve all historical assessment data linked to previous versions
5. THE System SHALL allow companies to add custom skills beyond the seeded dataset
6. WHEN displaying skills, THE System SHALL indicate whether a skill is seeded or custom
7. THE System SHALL prevent deletion of skills that have associated assessment data

### Requirement 21: Non-Functional Performance Requirements

**User Story:** As a user, I want the platform to respond quickly, so that I can work efficiently without delays.

#### Acceptance Criteria

1. WHEN a user loads the dashboard, THE System SHALL render the page within 2 seconds under normal network conditions
2. WHEN a user submits an assessment, THE System SHALL process and confirm submission within 1 second
3. THE System SHALL support at least 100 concurrent users per company without performance degradation
4. THE System SHALL support companies with up to 10,000 employee records
5. WHEN generating CSV exports, THE System SHALL complete exports of up to 1,000 employees within 5 seconds

### Requirement 22: System Availability and Reliability

**User Story:** As a company administrator, I want the platform to be available when my team needs it, so that assessments and reporting are not disrupted.

#### Acceptance Criteria

1. THE System SHALL maintain 99.5% uptime during business hours (6 AM to 10 PM in all time zones)
2. WHEN scheduled maintenance is required, THE System SHALL provide 48 hours advance notice
3. THE System SHALL automatically backup all data daily
4. THE System SHALL retain backups for 30 days
5. WHEN a database connection fails, THE System SHALL retry the connection up to 3 times before returning an error

### Requirement 23: Audit Logging

**User Story:** As a company owner, I want to track who performed assessments and made changes, so that I can maintain accountability and compliance.

#### Acceptance Criteria

1. WHEN an assessment is conducted, THE System SHALL log the conductedBy userId and timestamp
2. WHEN role skill requirements are modified, THE System SHALL log the userId who made the change and timestamp
3. WHEN a user's role is changed, THE System SHALL log the change with userId of who made the change and timestamp
4. THE System SHALL allow owners and admins to view audit logs for their company
5. THE System SHALL retain audit logs for 1 year
