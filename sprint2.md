# Veritas — Sprint 2 Build Plan  
## School · Workspace · Class · Student  
*(Identity-safe, K–12 compatible, Higher-Ed ready)*

**Sprint Goal**  
Introduce a **School layer** above Workspace while preserving:
- fast v1 execution
- unique per-student code → password activation
- no-email schools
- clean evolution to email + SSO later

No assignment builder in this sprint.

---

## 1. Final Mental Model (Locked)

```text
School
  └── Workspace
        └── Class
              └── Student (identity-first)

Why this matters
	•	Schools are the real institutional boundary (contracts, compliance, SSO)
	•	Workspaces are operational containers
	•	Classes are instructional units
	•	Students are identities, not just roster rows

This avoids painful refactors later.

⸻

2. School (Institution Layer)

Purpose

The School represents the real-world institution:
	•	K–12 school
	•	district school
	•	university department
	•	language school

Even if v1 uses only one school per teacher, this layer must exist now.

⸻

Table: schools

create table schools (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  country text,
  school_type text,        -- elementary / middle / secondary / higher_ed / other
  created_at timestamptz default now()
);

Creation Rule (v1)
	•	School is created during teacher onboarding
	•	One school per teacher in v1
	•	No UI to manage multiple schools yet

⸻

3. Workspace (Operational Container)

Purpose

Workspace groups day-to-day activity inside a school:
	•	future billing units
	•	co-teachers
	•	program separation

⸻

Table: workspaces

create table workspaces (
  id uuid primary key default gen_random_uuid(),
  school_id uuid references schools(id) on delete cascade,
  name text not null,
  created_at timestamptz default now()
);

Creation Rule
	•	Workspace auto-created after onboarding
	•	Default name:
	•	"Main Workspace" or
	•	"English Department"

No UI choice yet.

⸻

4. Class (Instructional Unit)

Definition

A Class is where assignments will live.
All students in a class:
	•	receive the same assignments
	•	follow the same access rules

⸻

Table: classes

create table classes (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid references workspaces(id) on delete cascade,
  name text not null,
  description text,
  access_mode text default 'code', -- 'code' | 'email' | 'sso' (future)
  created_at timestamptz default now()
);

Access Mode (Critical)
	•	code → unique student code + password (upper elementary / middle school)
	•	email → email login (high school / higher ed)
	•	sso → future

Access mode is set by the teacher per class.

⸻

5. Student (Identity-First, Not Just Roster)

Core Principle

Students are real identities, even without email.

We avoid a join table for now, but design for it later.

⸻

Table: students (v1-safe, v2-ready)

create table students (
  id uuid primary key default gen_random_uuid(),

  -- instructional placement (v1)
  class_id uuid references classes(id) on delete cascade,

  -- identity
  first_name text not null,
  last_name text not null,
  email text,                 -- nullable (required later for higher ed)
  student_code text unique,   -- per-student activation code
  auth_user_id uuid,          -- nullable, links to auth.users after activation

  -- audit
  code_claimed_at timestamptz,
  created_at timestamptz default now()
);


⸻

6. Student Lifecycle (Sprint 2 Scope)

6.1 Student Creation (Teacher)

Methods:
	•	Manual add
	•	CSV upload

CSV format:

first_name,last_name,email

System behavior:
	•	Generate unique student_code
	•	auth_user_id = NULL
	•	Student is inactive until activation

⸻

6.2 Student Activation (Unique Code → Password)

This is not a shared code and not temporary access.

Step 1 — Enter Code
Route:

/activate

Backend:
	•	Validate student_code
	•	Ensure auth_user_id IS NULL
	•	Block reused codes

⸻

Step 2 — Create Password
Backend:
	•	Create Supabase auth.users
	•	Link students.auth_user_id
	•	Set code_claimed_at = now()

Result:
	•	Student now has a persistent account
	•	No email required

⸻

6.3 Student Login (After Activation)

Students log in with:
	•	student_code + password
or
	•	email + password (if email exists)

⸻

7. Why There Is NO Join Table (Yet)

Current Reality
	•	One student → one class
	•	Join table adds complexity without immediate value

Planned Evolution

When needed:

create table enrollments (
  student_id uuid references students(id),
  class_id uuid references classes(id),
  primary key (student_id, class_id)
);

Migration path:
	•	Move students.class_id → enrollments
	•	Drop class_id from students
	•	No auth, identity, or submission rewrites

This is why identity fields exist now.

⸻

8. Navigation Updates (Sprint 2)

Top navigation:
	•	Dashboard
	•	Classes
	•	Settings
	•	Logout

School and Workspace are implicit in v1.

⸻

9. Dashboard Behavior (Sprint 2)

If No Classes Exist

Message:

“Create your first class to begin preparing assessments.”

CTA:

+ Create Class

Assignments remain hidden until Sprint 3.

⸻

10. Access & Security (v1)
	•	Teacher access scoped by school_id
	•	Students only access activation + login
	•	No student dashboard yet
	•	RLS optional if queries are server-side only

⸻

11. Sprint 2 Deliverables Checklist

Backend
	•	schools table
	•	workspaces table
	•	classes table (with access_mode)
	•	students table (identity-first)
	•	student code generation
	•	activation endpoint (code → password)

Frontend
	•	School creation during onboarding
	•	Classes list
	•	Create class flow
	•	Class detail page
	•	Add students (manual + CSV)
	•	Student activation flow

⸻

12. What Sprint 3 Unlocks

Assignment
  └── Class
        └── Students
              └── Submissions

Built on a structure that:
	•	supports K–12 realities
	•	satisfies higher-ed expectations
	•	survives SSO and LMS integration later

⸻

13. One-Line Instruction to Dev Team

“Sprint 2 builds the institutional spine: School → Workspace → Class → Student.
Students are real accounts, even without email.”

If you want next, I can:
- convert this into **Jira/Linear tickets**
- add **API route contracts**
- or extend directly into **Sprint 3: Assignment schema + builder flow**
