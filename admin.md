# Sprint Plan: Admin Consoles (School + Platform)
**Product:** SayVeritas  
**Sprint Duration:** 2 weeks  
**Target Completion:** January 2026 (before institutional pilots)

---

## Epic 1: School Admin Console
**Goal:** Enable IT/EdTech departments to manage teachers and students at their institution without individual account creation.

**Success Metrics:**
- School admins can bulk upload 50+ teachers in < 5 minutes
- Teachers receive auto-generated credentials and onboarding email
- Zero support tickets for "how do I add teachers to my school"
- 90% of bulk uploads succeed without errors

---

## Epic 2: Platform Admin Console (Super Admin)
**Goal:** Give platform owner (Eric) visibility and control over entire SayVeritas system.

**Success Metrics:**
- Can view all institutions and their usage in one dashboard
- Can diagnose customer issues without accessing their data directly
- Revenue and growth metrics visible in real-time
- System health monitored (API errors, costs, performance)

---

# PART 1: SCHOOL ADMIN CONSOLE

## User Stories

### SA-101: School Admin Registration & Setup
**As a** school IT administrator  
**I want** to create my school's SayVeritas account  
**So that** I can manage teachers and students for my institution

**Acceptance Criteria:**
- [ ] School admin registration page: `/schools/register`
- [ ] Form fields:
  - School/institution name (required)
  - Admin first name (required)
  - Admin last name (required)
  - Admin email (required, validated)
  - Admin phone (optional)
  - School address (required for billing)
  - Student count estimate (dropdown: <100, 100-500, 500-1000, 1000+)
  - License type (dropdown: pilot, departmental, school, district)
- [ ] Email verification required before activation
- [ ] Auto-generates school_id (UUID)
- [ ] Creates first admin user with role: `school_admin`
- [ ] Welcome email sent with login link + setup checklist
- [ ] School dashboard accessible immediately after verification

**Story Points:** 8

---

### SA-102: School Admin Dashboard Overview
**As a** school admin  
**I want** to see key metrics about my institution's usage  
**So that** I can monitor adoption and identify issues

**Acceptance Criteria:**
- [ ] Dashboard displays:
```
┌─────────────────────────────────────────────┐
│ [School Name] Dashboard                     │
├─────────────────────────────────────────────┤
│                                             │
│ Quick Stats                                 │
│ ┌─────────┐ ┌─────────┐ ┌─────────┐       │
│ │ 12      │ │ 450     │ │ 127     │       │
│ │ Teachers│ │ Students│ │ Assessments│    │
│ └─────────┘ └─────────┘ └─────────┘       │
│                                             │
│ Recent Activity                             │
│ • Prof. Johnson created "Civil War" assess │
│ • 23 students completed submissions today  │
│ • Prof. Martinez uploaded 45 new students  │
│                                             │
│ License Status                              │
│ Plan: School License (500 students)        │
│ Used: 450/500 students (90%)               │
│ Renewal: June 1, 2026                      │
│ [Upgrade Plan] [View Billing]              │
│                                             │
│ Quick Actions                               │
│ [+ Add Teachers] [+ Add Students]          │
│ [Bulk Upload] [View Reports]               │
└─────────────────────────────────────────────┘
```
- [ ] Metrics update in real-time
- [ ] Click teacher/student count to see list
- [ ] Activity feed shows last 10 events
- [ ] License warning when 80%+ capacity used

**Story Points:** 8

---

### SA-103: Bulk Teacher Upload (CSV)
**As a** school admin  
**I want** to upload multiple teachers at once via CSV  
**So that** I don't have to create accounts one-by-one

**Acceptance Criteria:**
- [ ] Bulk upload page: `/schools/[id]/teachers/bulk-upload`
- [ ] Download CSV template button provides example file:
```csv
first_name,last_name,email,department,title
Jane,Smith,jsmith@endicott.edu,History,Professor
John,Doe,jdoe@endicott.edu,Biology,Assistant Professor
```
- [ ] CSV upload accepts drag-and-drop or file picker
- [ ] File size limit: 5MB (supports ~5,000 teachers)
- [ ] Validation before processing:
  - Required fields present (first_name, last_name, email)
  - Email format valid
  - No duplicate emails within file
  - No duplicate emails with existing teachers
- [ ] Preview screen shows:
  - Total rows to import
  - Valid rows (green)
  - Invalid rows with error messages (red)
  - [Fix Errors] or [Proceed with Valid Only] options
- [ ] Processing creates:
  - Teacher accounts with auto-generated usernames/passwords
  - Email sent to each teacher with credentials + welcome message
  - Teachers assigned to school automatically
- [ ] Success summary:
  - "Successfully created 45 teacher accounts"
  - "3 rows skipped due to errors (download error report)"
  - [View Teachers] [Upload More]
- [ ] Error report downloadable as CSV

**Story Points:** 13

---

### SA-104: Manual Teacher Account Creation
**As a** school admin  
**I want** to create individual teacher accounts  
**So that** I can add teachers who weren't in bulk upload

**Acceptance Criteria:**
- [ ] "Add Teacher" button on teachers list page
- [ ] Modal form with fields:
  - First name (required)
  - Last name (required)
  - Email (required, unique validation)
  - Department (optional)
  - Title (optional, e.g., "Professor", "Instructor")
  - Send welcome email (checkbox, default: ON)
- [ ] Auto-generates username: `{first_initial}{last_name}{random_3_digits}@{school_domain}`
  - Example: jsmith847@endicott.sayveritas.com
- [ ] Auto-generates temporary password (8 chars, alphanumeric + special)
- [ ] Create button:
  - Saves teacher to database
  - Links to school via school_id
  - Sends welcome email if checkbox ON
  - Shows success message with credentials
  - Option to copy credentials to clipboard
- [ ] Teacher immediately appears in teachers list

**Story Points:** 5

---

### SA-105: Teacher Management (View, Edit, Disable)
**As a** school admin  
**I want** to manage teacher accounts  
**So that** I can update info or remove teachers who leave

**Acceptance Criteria:**
- [ ] Teachers list page shows table:
```
Name          | Email                  | Department | Status   | Actions
Jane Smith    | jsmith@endicott.edu   | History    | Active   | [Edit] [Disable]
John Doe      | jdoe@endicott.edu     | Biology    | Active   | [Edit] [Disable]
Mary Johnson  | mjohnson@endicott.edu | Math       | Disabled | [Enable]
```
- [ ] Search box filters by name or email (real-time)
- [ ] Sort columns (name, email, department, status)
- [ ] Pagination (25 per page)
- [ ] Edit action opens modal to update:
  - Name, email, department, title
  - Cannot change username (immutable)
  - Can reset password (sends reset email)
- [ ] Disable action:
  - Confirmation modal: "Disable [name]? They will lose access immediately."
  - Sets status to `disabled`
  - Teacher cannot login
  - Their assessments remain visible (read-only)
- [ ] Enable action restores access
- [ ] Bulk actions:
  - Select multiple teachers (checkboxes)
  - Bulk disable or bulk enable

**Story Points:** 8

---

### SA-106: Bulk Student Upload (CSV)
**As a** school admin  
**I want** to upload students in bulk and assign to teachers  
**So that** teachers don't have to manually add students

**Acceptance Criteria:**
- [ ] Bulk upload page: `/schools/[id]/students/bulk-upload`
- [ ] CSV template:
```csv
first_name,last_name,email,student_id,grade_level,teacher_email
Alice,Johnson,ajohnson@endicott.edu,ENS123456,Sophomore,jsmith@endicott.edu
Bob,Williams,bwilliams@endicott.edu,ENS123457,Junior,jsmith@endicott.edu
```
- [ ] Validation:
  - Required: first_name, last_name, teacher_email
  - Optional: email, student_id, grade_level
  - teacher_email must match existing teacher in school
- [ ] Preview shows students grouped by teacher:
  - "Prof. Smith will receive 23 students"
  - "Prof. Doe will receive 18 students"
- [ ] Processing creates:
  - Student accounts with auto-generated usernames/passwords
  - Students assigned to specified teacher's default class
  - Optional: send credentials to student email (checkbox)
- [ ] Success summary:
  - "Successfully added 41 students"
  - "Students distributed across 2 teachers"
  - "Credentials sent to student emails" (if selected)
- [ ] Teachers notified via email: "X students added to your class"

**Story Points:** 13

---

### SA-107: School-Level Reporting
**As a** school admin  
**I want** to see aggregate data across all teachers  
**So that** I can measure adoption and ROI

**Acceptance Criteria:**
- [ ] Reports page: `/schools/[id]/reports`
- [ ] Date range selector (last 7 days, last 30 days, this semester, custom)
- [ ] Key metrics displayed:
  - Total assessments created
  - Total student submissions
  - Average assessments per teacher
  - Active teachers (created ≥1 assessment)
  - Active students (completed ≥1 assessment)
  - Most active departments
- [ ] Charts/graphs:
  - Assessments created over time (line graph)
  - Submissions per department (bar chart)
  - Teacher adoption rate (% using platform)
- [ ] Exportable to CSV/PDF
- [ ] Privacy: No access to individual student responses or grades
  - Can see aggregates only
  - Cannot drill down to specific assessment content

**Story Points:** 13

---

### SA-108: License Management & Limits
**As a** school admin  
**I want** to see my license limits and usage  
**So that** I know when to upgrade or add capacity

**Acceptance Criteria:**
- [ ] License page shows:
  - Current plan (Pilot, Departmental, School, District)
  - Student limit (e.g., 500)
  - Students currently enrolled (e.g., 450)
  - Usage percentage (90%)
  - Renewal date
  - Cost per year
- [ ] Warning indicators:
  - Yellow: 80-90% capacity ("Consider upgrading soon")
  - Red: 90-100% capacity ("Approaching limit")
  - Block: 100% ("Cannot add more students")
- [ ] Upgrade options:
  - [Upgrade to next tier] button
  - Shows pricing for available tiers
  - Request quote for custom/district licenses
- [ ] System enforcement:
  - If at 100% capacity, bulk upload blocked with message
  - Teachers cannot add students beyond limit
  - Contact support to upgrade or remove inactive students

**Story Points:** 8

---

### SA-109: School Admin User Management
**As a** school admin  
**I want** to add additional admins for my school  
**So that** multiple IT staff can manage accounts

**Acceptance Criteria:**
- [ ] School admins can invite other admins via email
- [ ] Invitation email contains registration link (expires in 7 days)
- [ ] New admin creates password and joins school
- [ ] Multiple admins can coexist (no limit)
- [ ] Admin roles:
  - `school_admin`: Full access (default)
  - `school_viewer`: Read-only access to reports (future)
- [ ] Admins list shows:
  - Name, email, role, last login
  - [Remove] button (cannot remove self)
- [ ] Remove admin:
  - Confirmation required
  - Immediate access revocation
  - Email notification sent

**Story Points:** 8

---

## Database Schema Changes

```sql
-- New table: schools (institutions)
CREATE TABLE schools (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  domain VARCHAR(255), -- e.g., "endicott.edu" for email matching
  address TEXT,
  city VARCHAR(100),
  state VARCHAR(50),
  country VARCHAR(50),
  postal_code VARCHAR(20),
  
  -- License info
  license_type VARCHAR(50), -- 'pilot', 'departmental', 'school', 'district'
  student_limit INT DEFAULT 500,
  license_start_date DATE,
  license_end_date DATE,
  
  -- Billing
  billing_email VARCHAR(255),
  billing_status VARCHAR(50) DEFAULT 'trial', -- 'trial', 'active', 'past_due', 'cancelled'
  
  -- Metadata
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  INDEX idx_schools_domain (domain)
);

-- New table: school_admins (join table)
CREATE TABLE school_admins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID REFERENCES schools(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  role VARCHAR(50) DEFAULT 'school_admin', -- 'school_admin', 'school_viewer'
  created_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(school_id, user_id),
  INDEX idx_school_admins_school (school_id),
  INDEX idx_school_admins_user (user_id)
);

-- Modify existing tables
ALTER TABLE users ADD COLUMN school_id UUID REFERENCES schools(id);
ALTER TABLE users ADD COLUMN username VARCHAR(100) UNIQUE;
ALTER TABLE users ADD COLUMN department VARCHAR(100);
ALTER TABLE users ADD COLUMN title VARCHAR(100);
ALTER TABLE users ADD COLUMN status VARCHAR(20) DEFAULT 'active'; -- 'active', 'disabled', 'pending'

-- Track bulk uploads
CREATE TABLE bulk_uploads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID REFERENCES schools(id),
  uploaded_by UUID REFERENCES users(id),
  type VARCHAR(50), -- 'teachers', 'students'
  filename VARCHAR(255),
  total_rows INT,
  successful_rows INT,
  failed_rows INT,
  error_report JSONB, -- Array of {row, error}
  created_at TIMESTAMP DEFAULT NOW(),
  
  INDEX idx_bulk_uploads_school (school_id)
);
```

---

# PART 2: PLATFORM ADMIN CONSOLE (SUPER ADMIN)

## User Stories

### PA-201: Super Admin Dashboard
**As a** platform admin (Eric)  
**I want** to see system-wide metrics  
**So that** I can monitor business health and growth

**Acceptance Criteria:**
- [ ] Super admin dashboard: `/admin` (protected route, requires `super_admin` role)
- [ ] Key metrics displayed:
```
┌────────────────────────────────────────────────┐
│ SayVeritas Platform Admin                     │
├────────────────────────────────────────────────┤
│                                                │
│ Business Metrics                               │
│ ┌──────────┐ ┌──────────┐ ┌──────────┐       │
│ │ 15       │ │ €47,997  │ │ €143,991 │       │
│ │ Schools  │ │ MRR      │ │ ARR      │       │
│ └──────────┘ └──────────┘ └──────────┘       │
│                                                │
│ Usage Metrics                                  │
│ ┌──────────┐ ┌──────────┐ ┌──────────┐       │
│ │ 147      │ │ 4,523    │ │ 1,847    │       │
│ │ Teachers │ │ Students │ │ Assessments│     │
│ └──────────┘ └──────────┘ └──────────┘       │
│                                                │
│ Activity (Last 24h)                            │
│ • 234 student submissions                      │
│ • 12 new teachers added                        │
│ • 3 assessments created                        │
│ • API uptime: 99.8%                           │
│                                                │
│ Revenue Growth (Last 30 Days)                  │
│ [Line chart showing MRR trend]                 │
│                                                │
│ Top Schools by Usage                           │
│ 1. Endicott College - 45 teachers, 1,203 students│
│ 2. CVA - 12 teachers, 350 students            │
│ 3. Salem High School - 23 teachers, 890 students│
└────────────────────────────────────────────────┘
```
- [ ] Graphs show trends over time (7 day, 30 day, 90 day, 1 year)
- [ ] Refresh button updates metrics
- [ ] Export button downloads CSV with detailed data

**Story Points:** 13

---

### PA-202: School Management (View All)
**As a** platform admin  
**I want** to see all schools and their status  
**So that** I can manage accounts and troubleshoot issues

**Acceptance Criteria:**
- [ ] Schools list page: `/admin/schools`
- [ ] Table showing all schools:
```
School Name       | Status  | Students | Teachers | License | Renewal    | Actions
Endicott College  | Active  | 1,203    | 45       | School  | 2026-06-01 | [View] [Edit]
CVA              | Active  | 350      | 12       | School  | 2026-08-15 | [View] [Edit]
Salem High       | Trial   | 890      | 23       | Pilot   | 2026-02-28 | [View] [Edit]
```
- [ ] Search by school name
- [ ] Filter by:
  - Status (Active, Trial, Past Due, Cancelled)
  - License type (Pilot, Departmental, School, District)
  - Renewal date (Expiring soon, This month, This quarter)
- [ ] Sort by any column
- [ ] Click school name to view detailed page
- [ ] Actions:
  - View: School detail page
  - Edit: Modify license, billing, status
  - Login As: Impersonate school admin (for support)

**Story Points:** 8

---

### PA-203: School Detail View
**As a** platform admin  
**I want** to see detailed information about a specific school  
**So that** I can diagnose issues and understand usage

**Acceptance Criteria:**
- [ ] School detail page: `/admin/schools/[id]`
- [ ] Sections displayed:

**1. School Information**
- Name, address, domain
- Primary admin name and email
- License type, student limit, usage
- Billing status, renewal date

**2. Usage Statistics**
- Teachers: Active vs. total
- Students: Enrolled vs. limit
- Assessments created (total)
- Submissions completed (total)
- Last activity date

**3. Teachers List** (truncated, top 10)
- Name, email, department, assessments created
- [View All Teachers] link

**4. Activity Log** (last 20 events)
- Timestamp, event type, description
- Examples:
  - "2025-12-24 14:32 - Teacher Jane Smith created assessment 'Civil War'"
  - "2025-12-24 15:15 - Bulk upload: 45 students added"

**5. Billing & Payments**
- Payment method on file
- Invoice history (last 5 invoices)
- [View All Invoices] link

**6. Support Actions**
- [Extend Trial] button (adds 30 days to license)
- [Upgrade License] button (change tier)
- [Reset Admin Password] button (sends reset email)
- [Disable School] button (emergency - blocks all access)
- [Login As School Admin] button (impersonation for support)

**Story Points:** 13

---

### PA-204: User Management (Global Search)
**As a** platform admin  
**I want** to search for any user across all schools  
**So that** I can help with support tickets quickly

**Acceptance Criteria:**
- [ ] User search page: `/admin/users`
- [ ] Search bar accepts:
  - Email (exact or partial match)
  - Name (first or last)
  - Username
  - Student ID
- [ ] Results show:
  - Name, email, role (teacher/student/admin), school, status
  - Last login date
  - Account created date
- [ ] Click user to see detail page:
  - Full profile info
  - School affiliation
  - Activity history (assessments created/completed)
  - Support actions:
    - Reset password
    - Change email
    - Disable/enable account
    - Delete account (with confirmation)
- [ ] Filter by:
  - Role (Teacher, Student, School Admin)
  - Status (Active, Disabled, Pending)
  - School
  - Last login (Active last 7 days, Inactive 30+ days)

**Story Points:** 13

---

### PA-205: System Analytics & Monitoring
**As a** platform admin  
**I want** to monitor system health and performance  
**So that** I can catch issues before they impact customers

**Acceptance Criteria:**
- [ ] Analytics page: `/admin/analytics`
- [ ] Real-time metrics:

**1. API Performance**
- Request volume (last 24h)
- Average response time
- Error rate (%)
- Slowest endpoints

**2. Cost Tracking**
- OpenAI API spend (today, this month)
- Storage costs (current month)
- Infrastructure costs (Vercel, Supabase, etc.)
- Cost per assessment (calculated)
- Projected monthly total

**3. Feature Usage**
- Socratic mode adoption (% of assessments)
- Visual assets usage (% of assessments)
- Artifact upload usage (% of assessments)
- Average questions per assessment
- Average students per assessment

**4. Error Logs** (last 100 errors)
- Timestamp, error type, message, user_id, school_id
- Click to see full stack trace
- [Mark Resolved] button

**5. Alerts Configuration**
- Email alerts when:
  - API error rate > 5%
  - Monthly costs exceed $X
  - System downtime > 5 minutes
  - New school signup (notification)

**Story Points:** 13

---

### PA-206: Revenue & Billing Management
**As a** platform admin  
**I want** to track revenue and manage billing  
**So that** I understand financial health and can collect payments

**Acceptance Criteria:**
- [ ] Revenue page: `/admin/revenue`
- [ ] Financial overview:
  - MRR (Monthly Recurring Revenue)
  - ARR (Annual Recurring Revenue)
  - Growth rate (% change vs. last month)
  - Churn rate (schools cancelled)
  - Average revenue per school

**Invoices & Payments**
- Table of all invoices:
  - School name, invoice date, amount, status (paid/unpaid/overdue), due date
- Filter by status, date range
- [Send Reminder] button for overdue invoices
- [Mark Paid] button (manual payment recorded)
- [Generate Invoice] button (create for school)

**Subscription Management**
- List of all active subscriptions
- Upcoming renewals (next 30 days)
- Trials ending soon (auto-notification)
- [Send Renewal Reminder] button

**Payment Methods**
- Schools using Lemon Squeezy (automated billing)
- Schools on invoicing (manual payment)
- Update payment method for school (admin action)

**Story Points:** 13

---

### PA-207: Content Moderation & Safety
**As a** platform admin  
**I want** to review flagged content  
**So that** I can ensure platform safety and compliance

**Acceptance Criteria:**
- [ ] Moderation page: `/admin/moderation`
- [ ] Flagged content queue:
  - Assessment questions flagged by AI (inappropriate language detection)
  - Student submissions flagged (profanity, concerning content)
  - Images flagged by content moderation API
- [ ] Each flagged item shows:
  - School name (anonymized to admin unless viewing details)
  - Content preview (text or image thumbnail)
  - Flag reason (profanity, violence, inappropriate, other)
  - Timestamp
  - Actions: [Review] [Approve] [Remove] [Contact School]
- [ ] Review action opens detail view:
  - Full content visible
  - Context (what assessment, which student, which teacher)
  - Decision options:
    - Approve (false positive)
    - Remove (delete content, notify school admin)
    - Warn (notify school admin, keep content)
    - Suspend (temporarily disable school pending investigation)
- [ ] Auto-moderation settings:
  - Enable/disable content moderation API
  - Sensitivity level (low/medium/high)
  - Auto-remove or flag for review

**Story Points:** 13

---

### PA-208: Platform Announcements
**As a** platform admin  
**I want** to send announcements to all or specific schools  
**So that** I can communicate updates, downtime, or promotions

**Acceptance Criteria:**
- [ ] Announcements page: `/admin/announcements`
- [ ] Create announcement form:
  - Title (required)
  - Message (rich text editor)
  - Target audience:
    - All schools
    - Specific schools (multi-select)
    - All teachers
    - All school admins
  - Delivery method:
    - Email (sends immediately)
    - In-app banner (shows at top of dashboard)
    - Both
  - Schedule: Send now or schedule for later
- [ ] Preview before sending
- [ ] Announcement history:
  - Past announcements sent
  - Delivery stats (emails sent, opened, clicked)
- [ ] Examples:
  - "System maintenance scheduled Dec 26, 10pm-2am EST"
  - "New feature released: Artifact Evidence Upload"
  - "Your trial ends in 7 days - upgrade now"

**Story Points:** 8

---

### PA-209: Export & Reporting Tools
**As a** platform admin  
**I want** to export data for analysis and record-keeping  
**So that** I can make data-driven decisions

**Acceptance Criteria:**
- [ ] Export page: `/admin/exports`
- [ ] Available exports:

**1. Schools List**
- All schools with: name, status, license, students, teachers, MRR
- Filterable by status, license type
- Format: CSV or Excel

**2. Revenue Report**
- All invoices with: school, date, amount, status
- Filterable by date range, status
- Format: CSV or PDF

**3. Usage Report**
- All schools with: assessments created, submissions, active teachers
- Filterable by date range
- Format: CSV

**4. User Export**
- All users (or filtered) with: name, email, role, school, status
- GDPR-compliant (must justify export reason)
- Format: CSV

**5. Activity Log**
- System events for audit trail
- Filterable by date, school, event type
- Format: CSV

- [ ] Each export:
  - Generated on-demand (click button)
  - Download link provided (expires in 24 hours)
  - Logged for audit (who exported what, when)

**Story Points:** 8

---

## Database Schema Changes

```sql
-- Add super admin role
ALTER TABLE users ADD COLUMN role VARCHAR(50) DEFAULT 'teacher';
-- Possible values: 'super_admin', 'school_admin', 'teacher', 'student'

-- Platform admin audit log
CREATE TABLE admin_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID REFERENCES users(id),
  action_type VARCHAR(100), -- 'login_as_school', 'extend_trial', 'disable_school', etc.
  target_type VARCHAR(50), -- 'school', 'user', 'system'
  target_id UUID, -- ID of affected entity
  description TEXT,
  metadata JSONB, -- Additional context
  created_at TIMESTAMP DEFAULT NOW(),
  
  INDEX idx_admin_actions_admin (admin_id),
  INDEX idx_admin_actions_created (created_at)
);

-- System metrics (cached aggregates for performance)
CREATE TABLE system_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  metric_date DATE NOT NULL,
  total_schools INT,
  active_schools INT,
  total_teachers INT,
  total_students INT,
  assessments_created INT,
  submissions_completed INT,
  mrr DECIMAL(10,2),
  arr DECIMAL(10,2),
  api_cost DECIMAL(10,2),
  storage_cost DECIMAL(10,2),
  created_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(metric_date)
);

-- Flagged content for moderation
CREATE TABLE flagged_content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_type VARCHAR(50), -- 'assessment_question', 'submission', 'image'
  content_id UUID, -- ID of flagged item
  school_id UUID REFERENCES schools(id),
  flag_reason VARCHAR(100), -- 'profanity', 'inappropriate', 'violence', etc.
  status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'approved', 'removed', 'warned'
  reviewed_by UUID REFERENCES users(id),
  reviewed_at TIMESTAMP,
  admin_notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  
  INDEX idx_flagged_content_status (status),
  INDEX idx_flagged_content_school (school_id)
);
```

---

## API Endpoints

### School Admin Endpoints

```typescript
// Bulk upload teachers
POST /api/schools/:schoolId/teachers/bulk-upload
Request (multipart/form-data): { file: CSV }
Response: { 
  successful: number,
  failed: number,
  errors: Array<{row, error}>
}

// Bulk upload students
POST /api/schools/:schoolId/students/bulk-upload
Request (multipart/form-data): { file: CSV }
Response: {
  successful: number,
  failed: number,
  errors: Array<{row, error}>
}

// School dashboard metrics
GET /api/schools/:schoolId/metrics
Response: {
  teachers_count: number,
  students_count: number,
  assessments_count: number,
  license_usage: number,
  recent_activity: Array<Event>
}

// Generate school report
GET /api/schools/:schoolId/reports?start_date=X&end_date=Y
Response: CSV file download
```

### Platform Admin Endpoints

```typescript
// Platform dashboard metrics
GET /api/admin/metrics
Response: {
  schools_count: number,
  mrr: number,
  arr: number,
  teachers_count: number,
  students_count: number,
  // ... all dashboard metrics
}

// Search users globally
GET /api/admin/users/search?q={query}
Response: Array<User>

// Impersonate school admin (for support)
POST /api/admin/impersonate
Request: { school_id: UUID }
Response: { auth_token: string, redirect_url: string }

// Get system costs
GET /api/admin/costs?start_date=X&end_date=Y
Response: {
  openai_cost: number,
  storage_cost: number,
  infrastructure_cost: number,
  total_cost: number
}

// Flag content for review
POST /api/admin/moderation/flag
Request: {
  content_type: string,
  content_id: UUID,
  reason: string
}

// Send announcement
POST /api/admin/announcements
Request: {
  title: string,
  message: string,
  target_audience: Array<UUID>,
  delivery_method: 'email' | 'banner' | 'both',
  schedule_at: string? // ISO timestamp
}
```

---

## Definition of Done

### School Admin Console

**Functionality:**
- [ ] School admin can register and set up institution
- [ ] Bulk upload teachers via CSV (>50 at once)
- [ ] Bulk upload students via CSV (>100 at once)
- [ ] Manual teacher/student creation works
- [ ] Teacher accounts have auto-generated usernames/passwords
- [ ] Welcome emails sent to new teachers
- [ ] Can view/edit/disable teacher accounts
- [ ] School dashboard shows accurate metrics
- [ ] Reports export to CSV/PDF
- [ ] License limits enforced (cannot exceed capacity)

**UX:**
- [ ] CSV upload has clear instructions and template
- [ ] Validation errors are specific and actionable
- [ ] Success messages confirm operations
- [ ] Dashboard is scannable (key metrics prominent)
- [ ] Bulk operations complete in <30 seconds for 100 rows

**Security:**
- [ ] School admins can only access their school's data
- [ ] Cannot view other schools
- [ ] Cannot elevate their own permissions
- [ ] Bulk uploads validated for injection attacks
- [ ] Rate limiting on API endpoints

**Performance:**
- [ ] Dashboard loads in <2 seconds
- [ ] Bulk upload processes 100 rows in <10 seconds
- [ ] Teachers list with 200+ rows loads in <1 second
- [ ] Reports generate in <5 seconds

**Documentation:**
- [ ] School admin onboarding guide written
- [ ] CSV template documented with examples
- [ ] FAQ covers common questions
- [ ] Video walkthrough recorded (5 minutes)

---

### Platform Admin Console

**Functionality:**
- [ ] Super admin dashboard shows all system metrics
- [ ] Can view all schools and their status
- [ ] Can search any user across platform
- [ ] Can impersonate school admin for support
- [ ] System analytics track API costs and performance
- [ ] Revenue dashboard shows MRR/ARR accurately
- [ ] Can send announcements to all or specific schools
- [ ] Content moderation queue functional
- [ ] Exports generate correctly

**Analytics:**
- [ ] MRR/ARR calculated correctly
- [ ] Growth rates accurate (vs. last period)
- [ ] API costs tracked in real-time
- [ ] Error logs captured with full context
- [ ] All admin actions logged for audit

**Security:**
- [ ] Super admin role properly restricted
- [ ] Impersonation logged with timestamp and reason
- [ ] Cannot accidentally delete schools/data
- [ ] Sensitive actions require confirmation
- [ ] Exports only accessible to super admins

**Performance:**
- [ ] Admin dashboard loads in <3 seconds
- [ ] Global user search returns results in <1 second
- [ ] Revenue calculations cached (not computed on every page load)
- [ ] System handles 1,000+ schools without degradation

**Monitoring:**
- [ ] Email alerts configured for critical events
- [ ] Error rate monitoring active
- [ ] Cost tracking alerts when thresholds exceeded
- [ ] Uptime monitoring integrated

---

## Implementation Priority

### Phase 1: School Admin Core (Week 1)
- [ ] School registration and setup
- [ ] Manual teacher/student creation
- [ ] Basic dashboard
**Goal:** School admins can create accounts and add users individually

### Phase 2: Bulk Upload (Week 1)
- [ ] CSV upload for teachers
- [ ] CSV upload for students
- [ ] Validation and error reporting
**Goal:** Can onboard entire school in <30 minutes

### Phase 3: Platform Admin Basics (Week 2)
- [ ] Super admin dashboard
- [ ] School management (view all)
- [ ] User search
**Goal:** Eric can see what's happening across platform

### Phase 4: Advanced Admin (Week 2)
- [ ] Analytics and monitoring
- [ ] Revenue tracking
- [ ] Announcements
**Goal:** Eric can run business decisions from admin console

---

## Testing Scenarios

### School Admin Testing

**Scenario 1: Bulk Upload Success**
- Upload CSV with 50 teachers
- All rows valid
- 50 accounts created
- 50 welcome emails sent
- Teachers appear in list immediately

**Scenario 2: Bulk Upload with Errors**
- Upload CSV with 50 teachers
- 5 rows have invalid emails
- System shows 45 successful, 5 failed
- Error report downloadable
- Can fix errors and re-upload

**Scenario 3: Student Assignment**
- Upload 100 students assigned to 5 teachers
- Each teacher receives 20 students
- Students appear in teacher's class
- Teachers notified via email

**Scenario 4: License Limit**
- School license limit: 500 students
- Currently enrolled: 490 students
- Attempt to upload 20 more students
- System blocks: "Exceeds license limit"
- Contact support message shown

### Platform Admin Testing

**Scenario 1: Support Ticket**
- Teacher emails: "Can't login"
- Eric searches teacher email in admin console
- Finds user, sees "Last login: Never"
- Resets password, sends email
- Follows up with teacher

**Scenario 2: School Investigation**
- School reports high costs
- Eric views school detail page
- Sees: 50 teachers, 1,200 students, 847 assessments last month
- Usage is normal, not an issue
- Responds to school with explanation

**Scenario 3: Trial Extension**
- School trial expires Dec 31
- School requests extension to evaluate
- Eric clicks "Extend Trial" (+30 days)
- School's license_end_date updated to Jan 31
- School admin notified via email

---

## Launch Checklist

### Before Endicott Pilot (January 20)

**School Admin:**
- [ ] School registration live
- [ ] Bulk upload tested with 100+ rows
- [ ] Welcome emails sending correctly
- [ ] Dashboard shows accurate metrics
- [ ] CSV templates downloadable
- [ ] Onboarding guide published

**Platform Admin:**
- [ ] Super admin dashboard functional
- [ ] Can view all schools
- [ ] Can search users
- [ ] Cost tracking active
- [ ] Error monitoring configured

### Before General Availability (March 2026)

**School Admin:**
- [ ] School-level reporting complete
- [ ] License management enforced
- [ ] Multi-admin support working

**Platform Admin:**
- [ ] Revenue tracking accurate
- [ ] Announcements system live
- [ ] Content moderation active
- [ ] Export tools functional

---

## Cost Impact

**Development Time:** 2 weeks full-time (or 4 weeks part-time)

**Ongoing Costs:**
- Storage for CSV files: ~$5/month (1GB)
- Email sending (welcome emails): ~$10/month (1,000 emails)
- Additional database load: negligible

**Revenue Impact:**
- Removes friction for institutional sales (bulk setup)
- Enables self-service onboarding (reduces support burden)
- Platform admin tools reduce time spent on support by 50%+

**ROI:** High. Required for any institutional customer (Endicott, CVA, Salem, etc.)

---

**Document Version:** 1.0  
**Created:** December 24, 2025  
**Target Delivery:** January 15, 2026 (before Endicott pilot launches)