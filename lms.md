# SayVeritas LMS Integration Sprint Plan

**Target Timeline:** 4 sprints (8-10 weeks)  
**Team:** Dev team + Eric (product validation)  
**Goal:** Transform SayVeritas from Google-centric to enterprise-ready EdTech platform with multi-LMS support

---

## Sprint 1: Foundation - Identity & Multi-Tenancy (Weeks 1-2)

### Objective
Abstract database from Google-specific IDs and establish district-level hierarchy for enterprise scalability.

### Critical Success Criteria
- [ ] Database supports district-level management
- [ ] All user entities have provider-agnostic identifiers
- [ ] Academic term support prevents summer rollover issues
- [ ] System can match users across multiple identity providers

---

### Task 1.1: Hierarchy Update

**What:** Create district-level structure in database

**Technical Requirements:**
```sql
-- New table
CREATE TABLE districts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  sourced_id TEXT UNIQUE NOT NULL,  -- External system identifier
  metadata JSONB,                    -- Flexible storage for district-specific config
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Update schools table
ALTER TABLE schools 
ADD COLUMN district_id UUID REFERENCES districts(id);

-- Index for performance
CREATE INDEX idx_schools_district ON schools(district_id);
```

**Why This Matters:**
- Enables district-wide admin dashboards (requested in PRD)
- Supports bulk licensing at district level (pricing model requirement)
- Allows district administrators to manage multiple schools
- Facilitates district-level reporting and analytics

**Acceptance Criteria:**
- [ ] Districts table created with all required fields
- [ ] Schools table updated with district_id foreign key
- [ ] Migration script handles existing schools (assign to default district)
- [ ] Database constraints prevent orphaned schools
- [ ] UI mockup approved for district admin dashboard (Eric review)

**Dev Notes:**
- Default district creation for existing schools: "Default District"
- Metadata field should store: timezone, locale, custom branding, feature flags
- Consider adding `is_active` field for future soft-deletion

---

### Task 1.2: The "Anchor ID" Migration

**What:** Add provider-agnostic identifiers to all user entities

**Technical Requirements:**
```sql
-- Update students table
ALTER TABLE students
ADD COLUMN sourced_id TEXT,           -- External system ID (Clever, Canvas, etc.)
ADD COLUMN provider TEXT,             -- Identity provider ('clever', 'canvas', 'google')
ADD COLUMN provider_metadata JSONB;   -- Additional provider-specific data

-- Same for teachers
ALTER TABLE teachers
ADD COLUMN sourced_id TEXT,
ADD COLUMN provider TEXT,
ADD COLUMN provider_metadata JSONB;

-- Same for classes
ALTER TABLE classes
ADD COLUMN sourced_id TEXT,
ADD COLUMN provider TEXT,
ADD COLUMN provider_metadata JSONB;

-- Composite unique constraint (one sourced_id per provider)
CREATE UNIQUE INDEX idx_students_sourced_provider 
ON students(sourced_id, provider) WHERE sourced_id IS NOT NULL;

CREATE UNIQUE INDEX idx_teachers_sourced_provider 
ON teachers(sourced_id, provider) WHERE sourced_id IS NOT NULL;

CREATE UNIQUE INDEX idx_classes_sourced_provider 
ON classes(sourced_id, provider) WHERE sourced_id IS NOT NULL;
```

**Critical Dev Note:**
> **DO NOT rely solely on email for matching users during login.** Schools frequently change email domains during provider transitions. Always prioritize `sourced_id` + `provider` combination for identity matching.

**Migration Strategy:**
1. **Existing Google users:** Set `provider = 'google'`, `sourced_id = google_user_id`
2. **Email-only users:** Set `provider = 'email'`, `sourced_id = email` (until they connect via SSO)
3. **Future imports:** Populate from external system's authoritative ID

**Acceptance Criteria:**
- [ ] All user tables have sourced_id, provider, provider_metadata columns
- [ ] Unique constraints prevent duplicate sourced_id per provider
- [ ] Migration script populates existing users with Google provider data
- [ ] Login flow updated to check sourced_id BEFORE email fallback
- [ ] Authentication service supports multiple providers
- [ ] Test cases cover email domain changes (user should still match)

**Why This Matters:**
- **Real-world scenario:** School district migrates from Google to Microsoft mid-year
  - Old: Student's email changes from `student@school.edu` to `student@newdomain.edu` → Lost account
  - New: Student's `sourced_id` stays constant → Seamless transition
- Supports multi-provider deployments (school uses Google + Canvas)
- Prevents duplicate accounts when users authenticate via different methods

---

### Task 1.3: Academic Terms Implementation

**What:** Add academic session support to prevent "summer rollover" and enable term-based reporting

**Technical Requirements:**
```sql
-- Academic sessions (terms/semesters)
CREATE TABLE academic_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID REFERENCES schools(id),
  name TEXT NOT NULL,                    -- "Fall 2025", "Spring 2026"
  type TEXT NOT NULL,                    -- 'semester', 'quarter', 'year'
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  is_current BOOLEAN DEFAULT FALSE,      -- Only one current per school
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Update classes table
ALTER TABLE classes
ADD COLUMN term_id UUID REFERENCES academic_sessions(id);

-- Index for performance
CREATE INDEX idx_sessions_school ON academic_sessions(school_id);
CREATE INDEX idx_sessions_current ON academic_sessions(is_current) WHERE is_current = TRUE;
CREATE INDEX idx_classes_term ON classes(term_id);
```

**Critical Business Logic:**
- Only ONE `is_current = TRUE` per school at any time
- When new term becomes current, automatically archive previous term's classes
- Teacher dashboard defaults to current term (with option to view historical)

**Acceptance Criteria:**
- [ ] Academic sessions table created with all constraints
- [ ] Classes table updated with term_id
- [ ] Migration script creates default terms for existing schools
  - Current term: Today's date ± 90 days
  - Future terms: Configurable by school admins
- [ ] Constraint enforces single current term per school
- [ ] Admin UI for creating/managing terms (Eric design review)
- [ ] Teacher dashboard filters by current term by default
- [ ] API endpoints for term management (CRUD operations)

**Why This Matters:**
- **Real-world scenario:** Teacher logs in on August 15th
  - Old: Sees last year's classes with 200 students from spring semester
  - New: Sees only current term classes (empty or rostered via LMS sync)
- Enables accurate reporting (students per term, growth over time)
- Prevents confusion during school breaks
- Supports year-over-year comparisons

**Dev Notes:**
- Default term creation: Start = Sept 1, End = June 30 (adjust for Southern Hemisphere)
- Consider adding `enrollment_status` to student-class relationship (active, dropped, withdrawn)
- Metadata field should store: grading periods, holidays, custom dates

---

### Sprint 1 Deliverables

**Database Migrations:**
- [ ] `001_create_districts.sql`
- [ ] `002_add_district_to_schools.sql`
- [ ] `003_add_sourced_id_to_users.sql`
- [ ] `004_create_academic_sessions.sql`
- [ ] `005_add_term_to_classes.sql`

**Code Changes:**
- [ ] Updated Supabase schema definitions
- [ ] Migration scripts with rollback support
- [ ] Seed data for testing (sample district, terms, users)

**Testing:**
- [ ] Unit tests for new database constraints
- [ ] Integration tests for multi-provider authentication
- [ ] E2E tests for term switching in teacher dashboard

**Documentation:**
- [ ] Updated ER diagram showing new relationships
- [ ] Migration runbook for production deployment
- [ ] API documentation for new endpoints

---

## Sprint 2: LTI 1.3 Advantage & Security (Weeks 3-5)

### Objective
Implement OIDC (OpenID Connect) handshake required by Canvas, Moodle, Blackboard, and other LMS platforms.

### Critical Success Criteria
- [ ] Secure OIDC authentication flow complete
- [ ] JWT validation service operational
- [ ] Just-In-Time provisioning creates users on first LMS launch
- [ ] Zero security vulnerabilities in token handling

---

### Task 2.1: OIDC Initiation Endpoint

**What:** Build the LTI 1.3 login initiation endpoint that LMS platforms call to start authentication

**Technical Requirements:**

**Endpoint:** `POST /auth/lti/login`

**Request Parameters (from LMS):**
```typescript
interface LTILoginRequest {
  iss: string;              // Issuer (e.g., "https://canvas.instructure.com")
  login_hint: string;       // Opaque user identifier
  target_link_uri: string;  // Where to send user after auth
  lti_message_hint?: string; // Optional context info
  client_id: string;        // Your app's client ID in their system
}
```

**Response:** HTTP 302 redirect to LMS authorization endpoint

**Redirect URL Structure:**
```
{LMS_AUTH_URL}?
  scope=openid
  &response_type=id_token
  &client_id={YOUR_CLIENT_ID}
  &redirect_uri={YOUR_REDIRECT_URI}
  &login_hint={LOGIN_HINT}
  &state={GENERATED_STATE}
  &nonce={GENERATED_NONCE}
  &prompt=none
```

**Implementation:**
```typescript
// /auth/lti/login endpoint
async function handleLTILogin(req: Request, res: Response) {
  const { iss, login_hint, target_link_uri, client_id } = req.body;
  
  // 1. Validate issuer is registered
  const platform = await getPlatformByIssuer(iss);
  if (!platform) {
    return res.status(400).json({ error: "Unknown issuer" });
  }
  
  // 2. Generate state and nonce
  const state = generateSecureToken(); // UUID v4
  const nonce = generateSecureToken();
  
  // 3. Store state/nonce in session (Redis or encrypted cookie)
  await storeOIDCSession({
    state,
    nonce,
    target_link_uri,
    login_hint,
    expires_at: Date.now() + 300000 // 5 minute expiry
  });
  
  // 4. Build redirect URL
  const redirectUrl = new URL(platform.auth_endpoint);
  redirectUrl.searchParams.set('scope', 'openid');
  redirectUrl.searchParams.set('response_type', 'id_token');
  redirectUrl.searchParams.set('client_id', client_id);
  redirectUrl.searchParams.set('redirect_uri', `${BASE_URL}/auth/lti/callback`);
  redirectUrl.searchParams.set('login_hint', login_hint);
  redirectUrl.searchParams.set('state', state);
  redirectUrl.searchParams.set('nonce', nonce);
  redirectUrl.searchParams.set('prompt', 'none');
  
  // 5. Redirect to LMS
  return res.redirect(302, redirectUrl.toString());
}
```

**Security Checklist:**
- [ ] State token is cryptographically secure (UUID v4 or equivalent)
- [ ] Nonce is unique per request and stored for validation
- [ ] State/nonce pairs expire after 5 minutes
- [ ] Issuer whitelist prevents unauthorized platforms
- [ ] HTTPS enforced on all endpoints (no HTTP)

**Acceptance Criteria:**
- [ ] Endpoint responds to POST requests with required parameters
- [ ] Generates secure state and nonce values
- [ ] Stores session data with expiration
- [ ] Redirects to LMS authorization endpoint with correct parameters
- [ ] Rejects requests from unregistered issuers
- [ ] Logs all initiation attempts for audit trail
- [ ] Works with Canvas, Moodle, Blackboard test environments

**Testing Scenarios:**
1. Valid LTI login from Canvas → Should redirect successfully
2. Unknown issuer → Should return 400 error
3. Missing required parameters → Should return validation error
4. Expired state → Should trigger re-authentication
5. Replay attack (reused nonce) → Should be rejected

---

### Task 2.2: JWT Validation Service

**What:** Implement secure JWT validation using LMS public keys (JWKS)

**Technical Requirements:**

**Endpoint:** `POST /auth/lti/callback`

**Request:** LMS posts ID Token as form parameter

**JWT Claims to Validate:**
```typescript
interface LTIIDToken {
  // Standard OIDC claims
  iss: string;           // Must match platform issuer
  aud: string;           // Must match your client_id
  sub: string;           // User's unique identifier
  exp: number;           // Token expiration (must be future)
  iat: number;           // Issued at time
  nonce: string;         // Must match stored nonce
  
  // LTI-specific claims
  "https://purl.imsglobal.org/spec/lti/claim/message_type": "LtiResourceLinkRequest";
  "https://purl.imsglobal.org/spec/lti/claim/version": "1.3.0";
  "https://purl.imsglobal.org/spec/lti/claim/deployment_id": string;
  "https://purl.imsglobal.org/spec/lti/claim/target_link_uri": string;
  "https://purl.imsglobal.org/spec/lti/claim/resource_link": {
    id: string;
    title?: string;
    description?: string;
  };
  "https://purl.imsglobal.org/spec/lti/claim/roles": string[]; // ["Instructor", "Learner"]
  "https://purl.imsglobal.org/spec/lti/claim/context": {
    id: string;         // Class/course ID
    label: string;      // Course code
    title: string;      // Course name
  };
  
  // User identity (optional but recommended)
  name?: string;
  email?: string;
  given_name?: string;
  family_name?: string;
  "https://purl.imsglobal.org/spec/lti/claim/lis": {
    person_sourcedid?: string;  // SIS user ID (THIS IS THE ANCHOR ID)
    course_section_sourcedid?: string;
  };
}
```

**Implementation:**
```typescript
import jwt from 'jsonwebtoken';
import jwksClient from 'jwks-rsa';

// JWKS client factory (caches public keys)
function createJWKSClient(platform: Platform) {
  return jwksClient({
    jwksUri: platform.jwks_uri,
    cache: true,
    cacheMaxAge: 86400000, // 24 hours
    rateLimit: true,
    jwksRequestsPerMinute: 10
  });
}

// Get signing key
async function getSigningKey(platform: Platform, kid: string) {
  const client = createJWKSClient(platform);
  const key = await client.getSigningKey(kid);
  return key.getPublicKey();
}

// Validate ID Token
async function validateIDToken(idToken: string, state: string) {
  // 1. Decode without verifying (to get header)
  const decoded = jwt.decode(idToken, { complete: true });
  if (!decoded) {
    throw new Error("Invalid JWT format");
  }
  
  // 2. Get platform by issuer
  const platform = await getPlatformByIssuer(decoded.payload.iss);
  if (!platform) {
    throw new Error("Unknown issuer");
  }
  
  // 3. Get public key from JWKS
  const signingKey = await getSigningKey(platform, decoded.header.kid);
  
  // 4. Verify signature and claims
  const payload = jwt.verify(idToken, signingKey, {
    algorithms: ['RS256'],
    audience: platform.client_id,
    issuer: platform.issuer
  }) as LTIIDToken;
  
  // 5. Validate nonce matches stored value
  const session = await getOIDCSession(state);
  if (!session || session.nonce !== payload.nonce) {
    throw new Error("Invalid nonce");
  }
  
  // 6. Validate expiration
  if (payload.exp * 1000 < Date.now()) {
    throw new Error("Token expired");
  }
  
  // 7. Validate LTI-specific claims
  if (payload["https://purl.imsglobal.org/spec/lti/claim/version"] !== "1.3.0") {
    throw new Error("Unsupported LTI version");
  }
  
  return payload;
}
```

**Security Checklist:**
- [ ] JWT signature verified using platform's public key
- [ ] Issuer claim matches registered platform
- [ ] Audience claim matches your client_id
- [ ] Expiration claim validated (token not expired)
- [ ] Nonce validated against stored session
- [ ] Only RS256 algorithm accepted (reject HS256)
- [ ] Key rotation supported (JWKS endpoint cached but refreshes)

**Acceptance Criteria:**
- [ ] Successfully validates tokens from Canvas, Moodle, Blackboard
- [ ] Rejects tokens with invalid signatures
- [ ] Rejects tokens with mismatched nonce
- [ ] Rejects expired tokens
- [ ] Handles JWKS key rotation gracefully
- [ ] Logs validation failures with details
- [ ] Performance: <100ms validation time (p95)

**Error Handling:**
```typescript
try {
  const payload = await validateIDToken(idToken, state);
  // Proceed to JIT provisioning
} catch (error) {
  if (error.name === 'TokenExpiredError') {
    return res.status(401).json({ error: "Token expired, please retry" });
  } else if (error.message.includes('nonce')) {
    return res.status(403).json({ error: "Invalid nonce (possible replay attack)" });
  } else {
    console.error("JWT validation failed:", error);
    return res.status(400).json({ error: "Authentication failed" });
  }
}
```

---

### Task 2.3: Just-In-Time (JIT) Provisioning

**What:** Automatically create user accounts when they first launch from LMS

**Technical Requirements:**

**User Matching Logic:**
```typescript
async function getOrCreateUser(payload: LTIIDToken) {
  const sourcedId = payload["https://purl.imsglobal.org/spec/lti/claim/lis"]?.person_sourcedid;
  const sub = payload.sub;
  const email = payload.email;
  
  // 1. Try to match by sourced_id + provider (most reliable)
  if (sourcedId) {
    const user = await findUserBySourcedId(sourcedId, payload.iss);
    if (user) return user;
  }
  
  // 2. Fall back to sub (LMS-specific user ID)
  const user = await findUserBySourcedId(sub, payload.iss);
  if (user) return user;
  
  // 3. Fall back to email (least reliable, but necessary)
  if (email) {
    const user = await findUserByEmail(email);
    if (user) {
      // Update user with sourced_id for future logins
      await updateUser(user.id, {
        sourced_id: sourcedId || sub,
        provider: payload.iss
      });
      return user;
    }
  }
  
  // 4. No match found - create new user
  return await createUserFromLTI(payload);
}
```

**User Creation Logic:**
```typescript
async function createUserFromLTI(payload: LTIIDToken) {
  const roles = payload["https://purl.imsglobal.org/spec/lti/claim/roles"];
  const isInstructor = roles.some(r => r.includes("Instructor"));
  
  const userData = {
    sourced_id: payload["https://purl.imsglobal.org/spec/lti/claim/lis"]?.person_sourcedid || payload.sub,
    provider: payload.iss,
    email: payload.email,
    name: payload.name || `${payload.given_name} ${payload.family_name}`,
    role: isInstructor ? 'teacher' : 'student',
    provider_metadata: {
      lti_sub: payload.sub,
      lti_roles: roles,
      created_via: 'lti_jit'
    }
  };
  
  if (isInstructor) {
    return await createTeacher(userData);
  } else {
    return await createStudent(userData);
  }
}
```

**Class/Context Provisioning:**
```typescript
async function enrollUserInContext(user: User, payload: LTIIDToken) {
  const context = payload["https://purl.imsglobal.org/spec/lti/claim/context"];
  if (!context) return; // No class context in this launch
  
  // 1. Find or create class
  let cls = await findClassBySourcedId(context.id, payload.iss);
  if (!cls) {
    cls = await createClass({
      sourced_id: context.id,
      provider: payload.iss,
      name: context.title,
      code: context.label,
      // TODO: Determine school_id and term_id from deployment_id
    });
  }
  
  // 2. Enroll user in class
  const enrollment = await findEnrollment(user.id, cls.id);
  if (!enrollment) {
    await createEnrollment({
      user_id: user.id,
      class_id: cls.id,
      role: user.role // 'teacher' or 'student'
    });
  }
}
```

**Acceptance Criteria:**
- [ ] New users created on first LTI launch
- [ ] Existing users matched by sourced_id (not email)
- [ ] Teachers vs. students determined by LTI roles
- [ ] Users enrolled in classes automatically
- [ ] Classes created if they don't exist
- [ ] Idempotent (multiple launches don't create duplicates)
- [ ] Handles missing optional claims gracefully (name, email)
- [ ] Logs all JIT provisions for audit trail

**Edge Cases to Handle:**
1. **User launches from different LMS platforms** (same person, different sourced_id)
   - Solution: Offer manual account linking UI
2. **User changes email in LMS** (common during district migrations)
   - Solution: Always match by sourced_id first, update email if changed
3. **User has multiple roles** (e.g., Teaching Assistant = both Instructor and Learner)
   - Solution: Default to highest privilege role (Instructor > Learner)
4. **Class name changes in LMS** (course renamed mid-term)
   - Solution: Update class name on every launch (use sourced_id as anchor)

**Dev Notes:**
- Store original LTI payload in `provider_metadata` for debugging
- Consider adding `last_lti_launch_at` timestamp to users table
- Flag JIT-provisioned users in admin dashboard for manual review

---

### Sprint 2 Deliverables

**Code Changes:**
- [ ] `/auth/lti/login` endpoint implementation
- [ ] `/auth/lti/callback` endpoint implementation
- [ ] JWT validation service with JWKS client
- [ ] JIT user provisioning logic
- [ ] JIT class enrollment logic

**Configuration:**
- [ ] Platform registration table/interface
  - Store: issuer, jwks_uri, auth_endpoint, client_id, deployment_id
- [ ] Environment variables for LTI secrets
- [ ] JWKS caching configuration (Redis recommended)

**Testing:**
- [ ] Unit tests for JWT validation
- [ ] Integration tests with Canvas sandbox
- [ ] Integration tests with Moodle sandbox
- [ ] E2E test: Student launches from LMS → lands in SayVeritas
- [ ] E2E test: Teacher launches from LMS → sees their classes

**Documentation:**
- [ ] LTI 1.3 integration guide for IT administrators
- [ ] Platform registration instructions (screenshots)
- [ ] Troubleshooting guide for common LTI errors
- [ ] API documentation for LTI endpoints

**Security Audit:**
- [ ] Penetration test for JWT handling
- [ ] Verify no secrets in client-side code
- [ ] Confirm all endpoints use HTTPS only
- [ ] Review nonce/state storage mechanism (must be server-side)

---

## Sprint 3: LTI Deep Linking (Content Selection) (Weeks 6-7)

### Objective
Enable teachers to select specific SayVeritas assessments from within their LMS without leaving the LMS interface.

### Critical Success Criteria
- [ ] Teachers can browse/search assessments in LMS assignment picker
- [ ] Selected assessments become LMS assignments with auto-created gradebook columns
- [ ] Deep link responses are correctly formatted and signed
- [ ] Works in Canvas, Moodle, Schoology

---

### Task 3.1: Deep Link Selection UI

**What:** Build the "picker" interface that appears when teachers click "Add External Tool" in their LMS

**User Flow:**
1. Teacher in Canvas clicks "Add External Tool" → "SayVeritas"
2. Canvas sends Deep Link Request to SayVeritas
3. SayVeritas displays assessment picker UI (iframe in Canvas)
4. Teacher selects assessment(s)
5. Teacher clicks "Add to Course"
6. SayVeritas sends Deep Link Response back to Canvas
7. Canvas creates assignment with link to selected assessment

**Technical Requirements:**

**Endpoint:** `POST /auth/lti/deep-link`

**Request:** LTI Deep Linking Request (JWT)

**Deep Link Request Claims:**
```typescript
interface DeepLinkRequest {
  // Standard LTI claims
  iss: string;
  aud: string;
  sub: string;
  
  // Deep Linking specific
  "https://purl.imsglobal.org/spec/lti/claim/message_type": "LtiDeepLinkingRequest";
  "https://purl.imsglobal.org/spec/lti-dl/claim/deep_linking_settings": {
    deep_link_return_url: string;  // Where to POST response
    accept_types: string[];         // ["link", "ltiResourceLink"]
    accept_presentation_document_targets: string[]; // ["iframe", "window"]
    accept_multiple: boolean;       // Can select multiple items?
    auto_create: boolean;           // Auto-create gradebook column?
    title?: string;
    text?: string;
  };
}
```

**UI Implementation:**
```typescript
// Deep Link Picker Component
function DeepLinkPicker({ contextId, returnUrl }: Props) {
  const [assessments, setAssessments] = useState([]);
  const [selected, setSelected] = useState([]);
  
  // Fetch teacher's assessments
  useEffect(() => {
    fetchAssessments(contextId).then(setAssessments);
  }, [contextId]);
  
  function handleSelect(assessment) {
    setSelected([...selected, assessment]);
  }
  
  async function handleSubmit() {
    // Create Deep Link Response (see Task 3.2)
    const response = await createDeepLinkResponse(selected, returnUrl);
    
    // POST to LMS
    submitDeepLinkResponse(response);
  }
  
  return (
    <div className="assessment-picker">
      <h2>Select Assessments to Add</h2>
      <SearchBar onSearch={handleSearch} />
      <AssessmentList 
        assessments={assessments}
        selected={selected}
        onSelect={handleSelect}
      />
      <button onClick={handleSubmit}>
        Add {selected.length} to Course
      </button>
    </div>
  );
}
```

**Assessment Display:**
```typescript
// Each assessment card shows:
interface AssessmentCard {
  title: string;          // "Unit 3: Civil War Causes"
  description: string;    // "Analyze primary sources..."
  bloomLevel: string;     // "Analyze/Evaluate"
  timeEstimate: string;   // "10-15 minutes"
  questionCount: number;  // 3
  thumbnail?: string;     // Optional preview image
}
```

**Acceptance Criteria:**
- [ ] Picker UI loads in LMS iframe
- [ ] Displays teacher's existing assessments
- [ ] Search and filter functionality works
- [ ] Multi-select enabled (if LMS supports it)
- [ ] Preview assessment details before selecting
- [ ] Loading states and error handling
- [ ] Responsive design (works in narrow iframe)
- [ ] Accessible (keyboard navigation, screen readers)

**UX Considerations:**
- Default to current term's assessments
- Show "Recently Used" section at top
- Filter by subject, grade level, Bloom's taxonomy
- Include "Create New Assessment" option (opens in new tab)

---

### Task 3.2: Deep Link Response

**What:** Generate signed JWT response with selected assessment details

**Technical Requirements:**

**Deep Link Response Claims:**
```typescript
interface DeepLinkResponse {
  iss: string;              // Your issuer (e.g., "sayveritas.com")
  aud: string;              // LMS client_id
  exp: number;              // Expiration (5 minutes)
  iat: number;              // Issued at
  nonce: string;            // Unique nonce
  
  "https://purl.imsglobal.org/spec/lti/claim/message_type": "LtiDeepLinkingResponse";
  "https://purl.imsglobal.org/spec/lti/claim/version": "1.3.0";
  "https://purl.imsglobal.org/spec/lti/claim/deployment_id": string;
  
  "https://purl.imsglobal.org/spec/lti-dl/claim/content_items": ContentItem[];
  "https://purl.imsglobal.org/spec/lti-dl/claim/data"?: string; // Return data from request
}

interface ContentItem {
  type: "ltiResourceLink";
  title: string;
  text?: string;
  url: string;  // Launch URL for this assessment
  
  // Optional: Auto-create gradebook column
  lineItem?: {
    scoreMaximum: number;           // 100
    label: string;                  // "Unit 3: Civil War"
    resourceId: string;             // assessment_id
    tag?: string;                   // For filtering
  };
  
  // Optional: Custom parameters
  custom?: {
    assessment_id: string;
    question_count: string;
    time_limit: string;
  };
}
```

**Implementation:**
```typescript
import jwt from 'jsonwebtoken';
import { readFileSync } from 'fs';

// Load your private key (RS256)
const privateKey = readFileSync('/path/to/private-key.pem');

async function createDeepLinkResponse(
  assessments: Assessment[], 
  deepLinkSettings: DeepLinkSettings
) {
  const contentItems: ContentItem[] = assessments.map(assessment => ({
    type: "ltiResourceLink",
    title: assessment.title,
    text: assessment.description,
    url: `${BASE_URL}/assessments/${assessment.id}/launch`,
    
    // Enable grade passback
    lineItem: deepLinkSettings.auto_create ? {
      scoreMaximum: 100,
      label: assessment.title,
      resourceId: assessment.id,
      tag: 'sayveritas'
    } : undefined,
    
    // Pass assessment metadata
    custom: {
      assessment_id: assessment.id,
      question_count: String(assessment.questions.length),
      time_limit: String(assessment.time_limit)
    }
  }));
  
  const payload: DeepLinkResponse = {
    iss: 'https://sayveritas.com',
    aud: deepLinkSettings.client_id,
    exp: Math.floor(Date.now() / 1000) + 300, // 5 min expiry
    iat: Math.floor(Date.now() / 1000),
    nonce: generateNonce(),
    
    "https://purl.imsglobal.org/spec/lti/claim/message_type": "LtiDeepLinkingResponse",
    "https://purl.imsglobal.org/spec/lti/claim/version": "1.3.0",
    "https://purl.imsglobal.org/spec/lti/claim/deployment_id": deepLinkSettings.deployment_id,
    
    "https://purl.imsglobal.org/spec/lti-dl/claim/content_items": contentItems,
    "https://purl.imsglobal.org/spec/lti-dl/claim/data": deepLinkSettings.data
  };
  
  // Sign with your private key
  const token = jwt.sign(payload, privateKey, {
    algorithm: 'RS256',
    keyid: 'your-key-id'
  });
  
  return token;
}
```

**Form Submission:**
```typescript
// Client-side: Auto-submit form to LMS
function submitDeepLinkResponse(jwt: string, returnUrl: string) {
  const form = document.createElement('form');
  form.method = 'POST';
  form.action = returnUrl;
  
  const input = document.createElement('input');
  input.type = 'hidden';
  input.name = 'JWT';
  input.value = jwt;
  
  form.appendChild(input);
  document.body.appendChild(form);
  form.submit();
}
```

**Acceptance Criteria:**
- [ ] Response JWT signed with your private key (RS256)
- [ ] Content items include all required fields
- [ ] lineItem included if auto_create is true
- [ ] Custom parameters passed for assessment context
- [ ] JWT expires in 5 minutes (not longer)
- [ ] Form auto-submits to deep_link_return_url
- [ ] LMS creates assignment with correct title/settings
- [ ] Clicking LMS assignment launches student into assessment

**Security Checklist:**
- [ ] Private key stored securely (environment variable, not in code)
- [ ] Response signed, not encrypted (LMS verifies signature)
- [ ] Nonce is unique per response
- [ ] Expiration enforced (5 minutes max)

**Testing Scenarios:**
1. Single assessment selection → LMS creates 1 assignment
2. Multiple assessments → LMS creates multiple assignments (if supported)
3. Auto-create gradebook → Gradebook column appears
4. Custom parameters → Available in subsequent LTI launches

---

### Sprint 3 Deliverables

**Code Changes:**
- [ ] `/auth/lti/deep-link` endpoint (receives request)
- [ ] Deep link picker UI component
- [ ] Deep link response generator
- [ ] Private key generation and storage setup

**Configuration:**
- [ ] Generate RS256 key pair for signing
- [ ] Store private key securely (AWS Secrets Manager, Vault, etc.)
- [ ] Publish public key at `/.well-known/jwks.json`
- [ ] Configure deep link URL in LMS platform registration

**Testing:**
- [ ] Unit tests for deep link response generation
- [ ] Integration tests with Canvas deep linking
- [ ] Integration tests with Schoology deep linking
- [ ] E2E test: Teacher adds assessment via deep link → assignment created
- [ ] E2E test: Student launches assignment → lands in correct assessment

**Documentation:**
- [ ] Deep linking setup guide for administrators
- [ ] Teacher user guide: "How to add SayVeritas to your course"
- [ ] Screenshots of picker UI in different LMS platforms

---

## Sprint 4: Automated Rostering (Clever/Secure Sync) (Weeks 8-10)

### Objective
Sync entire districts automatically so teachers don't manually create classes or add students.

### Critical Success Criteria
- [ ] Clever API v3.1 integration fully operational
- [ ] OneRoster CSV import pipeline functional
- [ ] Nightly sync keeps rosters up-to-date
- [ ] Handles student transfers, withdrawals, new enrollments
- [ ] Zero data loss during sync operations

---

### Task 4.1: Clever API v3.1 Integration

**What:** Connect to Clever's REST API to automatically sync districts, schools, teachers, students, classes, and enrollments

**Clever API Endpoints:**
```
GET /v3.0/districts
GET /v3.0/schools
GET /v3.0/teachers
GET /v3.0/students
GET /v3.0/sections (classes)
GET /v3.0/sections/{id}/students (enrollments)
GET /v3.0/sections/{id}/teachers
GET /v3.0/terms (academic sessions)
```

**Clever Data Model Mapping:**
| Clever Entity | SayVeritas Entity | Mapping Field |
|---------------|-------------------|---------------|
| District | `districts` | `sourced_id = district.id` |
| School | `schools` | `sourced_id = school.id` |
| Teacher | `teachers` | `sourced_id = teacher.id` |
| Student | `students` | `sourced_id = student.id` |
| Section | `classes` | `sourced_id = section.id` |
| Term | `academic_sessions` | `sourced_id = term.id` |
| Enrollment | `class_enrollments` | Relation via section.students |

**Implementation:**
```typescript
// Clever sync service
class CleverSyncService {
  private client: CleverAPIClient;
  
  async syncDistrict(districtId: string) {
    // 1. Sync district info
    const district = await this.client.getDistrict(districtId);
    await this.upsertDistrict(district);
    
    // 2. Sync schools
    const schools = await this.client.getSchools(districtId);
    await Promise.all(schools.map(school => 
      this.upsertSchool(school, districtId)
    ));
    
    // 3. Sync terms
    const terms = await this.client.getTerms(districtId);
    await Promise.all(terms.map(term => 
      this.upsertAcademicSession(term)
    ));
    
    // 4. Sync teachers
    const teachers = await this.client.getTeachers(districtId);
    await Promise.all(teachers.map(teacher => 
      this.upsertTeacher(teacher)
    ));
    
    // 5. Sync students
    const students = await this.client.getStudents(districtId);
    await Promise.all(students.map(student => 
      this.upsertStudent(student)
    ));
    
    // 6. Sync sections (classes)
    const sections = await this.client.getSections(districtId);
    await Promise.all(sections.map(section => 
      this.upsertSection(section)
    ));
    
    // 7. Sync enrollments
    for (const section of sections) {
      const students = await this.client.getSectionStudents(section.id);
      const teachers = await this.client.getSectionTeachers(section.id);
      await this.syncEnrollments(section.id, students, teachers);
    }
  }
  
  async upsertStudent(cleverStudent: CleverStudent) {
    const existing = await findStudentBySourcedId(
      cleverStudent.id, 
      'clever'
    );
    
    const studentData = {
      sourced_id: cleverStudent.id,
      provider: 'clever',
      email: cleverStudent.email,
      name: `${cleverStudent.name.first} ${cleverStudent.name.last}`,
      grade_level: cleverStudent.grade,
      school_id: cleverStudent.school, // Map to school
      provider_metadata: {
        clever_id: cleverStudent.id,
        sis_id: cleverStudent.sis_id,
        student_number: cleverStudent.student_number
      }
    };
    
    if (existing) {
      await updateStudent(existing.id, studentData);
    } else {
      await createStudent(studentData);
    }
  }
  
  async syncEnrollments(
    sectionId: string, 
    students: CleverStudent[], 
    teachers: CleverTeacher[]
  ) {
    const cls = await findClassBySourcedId(sectionId, 'clever');
    if (!cls) return;
    
    // Current enrollments in our system
    const existingEnrollments = await getClassEnrollments(cls.id);
    
    // Expected student enrollments from Clever
    const expectedStudents = new Set(students.map(s => s.id));
    
    // Add new students
    for (const student of students) {
      const user = await findStudentBySourcedId(student.id, 'clever');
      if (!user) continue;
      
      const enrollment = existingEnrollments.find(e => e.user_id === user.id);
      if (!enrollment) {
        await createEnrollment({
          user_id: user.id,
          class_id: cls.id,
          role: 'student',
          status: 'active'
        });
      }
    }
    
    // Remove students no longer in class (withdrawals)
    for (const enrollment of existingEnrollments) {
      if (enrollment.role !== 'student') continue;
      
      const user = await getUser(enrollment.user_id);
      if (!expectedStudents.has(user.sourced_id)) {
        await updateEnrollment(enrollment.id, { status: 'inactive' });
      }
    }
    
    // Same process for teachers...
  }
}
```

**Clever Authentication:**
```typescript
// OAuth 2.0 flow for Clever
class CleverAPIClient {
  private accessToken: string;
  
  async authenticate(districtId: string) {
    const credentials = await getCleverCredentials(districtId);
    
    const response = await fetch('https://clever.com/oauth/tokens', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${btoa(`${credentials.client_id}:${credentials.client_secret}`)}`
      },
      body: new URLSearchParams({
        grant_type: 'client_credentials',
        scope: 'read:districts read:schools read:teachers read:students read:sections'
      })
    });
    
    const { access_token } = await response.json();
    this.accessToken = access_token;
  }
  
  async makeRequest(endpoint: string) {
    const response = await fetch(`https://api.clever.com${endpoint}`, {
      headers: {
        'Authorization': `Bearer ${this.accessToken}`
      }
    });
    
    if (!response.ok) {
      throw new Error(`Clever API error: ${response.statusText}`);
    }
    
    return response.json();
  }
}
```

**Acceptance Criteria:**
- [ ] Syncs all Clever entities (districts, schools, teachers, students, sections)
- [ ] Uses `sourced_id` as anchor ID (not email)
- [ ] Handles student transfers between schools
- [ ] Detects and processes student withdrawals
- [ ] Adds new students/teachers automatically
- [ ] Maps Clever sections to classes correctly
- [ ] Associates classes with correct academic terms
- [ ] Runs incrementally (only syncs changes after initial sync)
- [ ] Logs all sync operations for audit
- [ ] Error handling for API rate limits

**Sync Schedule:**
```typescript
// Cron job: Daily at 2 AM (off-peak hours)
cron.schedule('0 2 * * *', async () => {
  const districts = await getAllCleverDistricts();
  
  for (const district of districts) {
    try {
      await cleverSyncService.syncDistrict(district.id);
      await logSyncSuccess(district.id, new Date());
    } catch (error) {
      await logSyncError(district.id, error);
      await notifyAdmins(district.id, error);
    }
  }
});
```

**Performance Optimization:**
- Use Clever's "events" API for incremental updates (not full sync every time)
- Batch database operations (upsert 100 students at once, not one-by-one)
- Implement request caching (cache teacher/student data for 24 hours)
- Respect Clever's rate limits (10 requests/second)

---

### Task 4.2: OneRoster CSV Ingestion

**What:** Build pipeline to import standard OneRoster 1.2 ZIP files as fallback for non-Clever districts

**OneRoster File Structure:**
```
roster.zip
├── manifest.csv        # List of included files
├── orgs.csv            # Districts and schools
├── users.csv           # Teachers and students
├── courses.csv         # Course catalog
├── classes.csv         # Class sections
├── enrollments.csv     # Student-class relationships
├── demographics.csv    # Optional
└── academicSessions.csv # Terms
```

**CSV Mapping:**

**orgs.csv:**
```csv
sourcedId,name,type,identifier,parentSourcedId
district_1,Springfield District,district,12345,
school_1,Springfield High,school,SHS,district_1
```

**users.csv:**
```csv
sourcedId,username,givenName,familyName,email,role,identifier
teacher_1,jsmith,Jane,Smith,jsmith@school.edu,teacher,T12345
student_1,mjones,Mike,Jones,mjones@school.edu,student,S67890
```

**classes.csv:**
```csv
sourcedId,title,courseSourcedId,schoolSourcedId,termSourcedIds
class_1,AP US History,course_1,school_1,term_1
```

**enrollments.csv:**
```csv
sourcedId,classSourcedId,userSourcedId,role,primary
enr_1,class_1,teacher_1,teacher,true
enr_2,class_1,student_1,student,false
```

**Implementation:**
```typescript
import csv from 'csv-parse';
import AdmZip from 'adm-zip';

class OneRosterImporter {
  async importZip(zipBuffer: Buffer, districtId: string) {
    const zip = new AdmZip(zipBuffer);
    
    // 1. Extract and parse manifest
    const manifest = await this.parseManifest(zip);
    
    // 2. Import in correct order (dependencies first)
    await this.importOrgs(zip, districtId);
    await this.importAcademicSessions(zip, districtId);
    await this.importCourses(zip, districtId);
    await this.importUsers(zip, districtId);
    await this.importClasses(zip, districtId);
    await this.importEnrollments(zip, districtId);
    
    // 3. Validate referential integrity
    await this.validateImport(districtId);
  }
  
  async importUsers(zip: AdmZip, districtId: string) {
    const usersFile = zip.getEntry('users.csv');
    if (!usersFile) throw new Error("users.csv not found");
    
    const records = await this.parseCSV(usersFile.getData().toString());
    
    for (const record of records) {
      if (record.role === 'teacher') {
        await this.upsertTeacher({
          sourced_id: record.sourcedId,
          provider: 'oneroster',
          email: record.email,
          name: `${record.givenName} ${record.familyName}`,
          provider_metadata: {
            username: record.username,
            identifier: record.identifier
          }
        });
      } else if (record.role === 'student') {
        await this.upsertStudent({
          sourced_id: record.sourcedId,
          provider: 'oneroster',
          email: record.email,
          name: `${record.givenName} ${record.familyName}`,
          provider_metadata: {
            username: record.username,
            identifier: record.identifier
          }
        });
      }
    }
  }
  
  async importEnrollments(zip: AdmZip, districtId: string) {
    const enrollmentsFile = zip.getEntry('enrollments.csv');
    if (!enrollmentsFile) throw new Error("enrollments.csv not found");
    
    const records = await this.parseCSV(enrollmentsFile.getData().toString());
    
    // Group by class for efficiency
    const enrollmentsByClass = _.groupBy(records, 'classSourcedId');
    
    for (const [classSourcedId, enrollments] of Object.entries(enrollmentsByClass)) {
      const cls = await findClassBySourcedId(classSourcedId, 'oneroster');
      if (!cls) continue;
      
      for (const enrollment of enrollments) {
        const user = await findUserBySourcedId(enrollment.userSourcedId, 'oneroster');
        if (!user) continue;
        
        await createEnrollment({
          user_id: user.id,
          class_id: cls.id,
          role: enrollment.role,
          is_primary: enrollment.primary === 'true'
        });
      }
    }
  }
  
  async validateImport(districtId: string) {
    // Check for orphaned records
    const orphanedClasses = await db.query(`
      SELECT * FROM classes 
      WHERE school_id NOT IN (SELECT id FROM schools)
      AND district_id = $1
    `, [districtId]);
    
    if (orphanedClasses.length > 0) {
      throw new Error(`Found ${orphanedClasses.length} classes with invalid school_id`);
    }
    
    // Check for duplicate sourced_ids
    const duplicates = await db.query(`
      SELECT sourced_id, COUNT(*) 
      FROM students 
      WHERE provider = 'oneroster' 
      GROUP BY sourced_id 
      HAVING COUNT(*) > 1
    `);
    
    if (duplicates.length > 0) {
      throw new Error(`Found duplicate sourced_ids: ${duplicates.map(d => d.sourced_id)}`);
    }
  }
}
```

**File Upload Interface:**
```typescript
// Admin UI for uploading OneRoster ZIP
function OneRosterUpload({ districtId }: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  
  async function handleUpload() {
    if (!file) return;
    
    setImporting(true);
    const formData = new FormData();
    formData.append('roster', file);
    formData.append('districtId', districtId);
    
    try {
      const res = await fetch('/api/admin/roster/import', {
        method: 'POST',
        body: formData
      });
      
      const result = await res.json();
      setResult(result);
    } catch (error) {
      console.error(error);
      alert("Import failed: " + error.message);
    } finally {
      setImporting(false);
    }
  }
  
  return (
    <div>
      <h2>Import OneRoster File</h2>
      <input 
        type="file" 
        accept=".zip"
        onChange={e => setFile(e.target.files?.[0] || null)}
      />
      <button onClick={handleUpload} disabled={!file || importing}>
        {importing ? "Importing..." : "Upload & Import"}
      </button>
      
      {result && (
        <div>
          <h3>Import Results</h3>
          <ul>
            <li>Teachers: {result.teachers_created} created, {result.teachers_updated} updated</li>
            <li>Students: {result.students_created} created, {result.students_updated} updated</li>
            <li>Classes: {result.classes_created} created, {result.classes_updated} updated</li>
            <li>Enrollments: {result.enrollments_created} created</li>
          </ul>
        </div>
      )}
    </div>
  );
}
```

**Acceptance Criteria:**
- [ ] Accepts standard OneRoster 1.2 ZIP files
- [ ] Parses all required CSV files correctly
- [ ] Imports entities in correct order (dependencies first)
- [ ] Detects and reports CSV format errors
- [ ] Validates referential integrity after import
- [ ] Shows detailed import results (created/updated counts)
- [ ] Handles missing optional files gracefully
- [ ] Supports incremental imports (delta updates)

**Error Handling:**
- Invalid CSV format → Show line number and error
- Missing required files → Clear error message
- Referential integrity violations → Rollback entire import
- Duplicate sourced_ids → Reject import, ask admin to fix

**Performance:**
- Import 10,000 students in <5 minutes
- Use database transactions (all-or-nothing)
- Batch insert operations (1000 records at a time)

---

### Sprint 4 Deliverables

**Code Changes:**
- [ ] Clever API client implementation
- [ ] Clever sync service (full and incremental)
- [ ] OneRoster CSV parser and importer
- [ ] Admin UI for OneRoster upload
- [ ] Cron job for scheduled syncs

**Configuration:**
- [ ] Clever OAuth credentials per district
- [ ] Sync schedule configuration (daily, weekly, on-demand)
- [ ] Error notification settings (email, Slack)

**Testing:**
- [ ] Unit tests for Clever API client
- [ ] Unit tests for OneRoster parser
- [ ] Integration test: Full Clever sync (sandbox district)
- [ ] Integration test: OneRoster import (sample ZIP file)
- [ ] E2E test: Student synced from Clever → appears in teacher's class roster
- [ ] E2E test: Student withdrawn in Clever → marked inactive in SayVeritas

**Documentation:**
- [ ] Clever integration setup guide (screenshots)
- [ ] OneRoster import instructions (template files)
- [ ] Sync troubleshooting guide (common errors)
- [ ] Data mapping documentation (Clever ↔ SayVeritas)
- [ ] API documentation for roster endpoints

**Data Migration:**
- [ ] Script to backfill existing schools with district_id
- [ ] Script to add provider = 'google' to existing users
- [ ] Script to create default academic sessions for existing schools

---

## Compliance & Testing Tools

### Required Certifications

**Clever Certification:**
- **What:** Code review of SSO flow and data privacy practices
- **When:** Before connecting to "Live" production districts
- **Process:** Submit app for review via Clever Developer Portal
- **Timeline:** 2-4 weeks
- **Requirements:**
  - [ ] SSO implementation passes automated tests
  - [ ] Data retention policy documented
  - [ ] Privacy policy published
  - [ ] Terms of service published
  - [ ] Support contact information provided

**1EdTech LTI Advantage Certification:**
- **What:** Official pass/fail test suite for LTI 1.3 Core, Deep Linking, Grades
- **When:** Before marketing "LTI 1.3 Certified" badge
- **Process:** Register at 1EdTech Certification site, run automated tests
- **Timeline:** 1-2 weeks
- **Requirements:**
  - [ ] All core LTI 1.3 tests pass (100%)
  - [ ] Deep Linking tests pass (100%)
  - [ ] Assignment & Grade Services tests pass (100%)
  - [ ] Security tests pass (nonce validation, JWT verification)

---

### Testing Tools by Provider

| Provider | Tool Name | Purpose | Access |
|----------|-----------|---------|--------|
| **Clever** | Developer Sandbox | Test SSO, roster sync, JIT provisioning | Free with Clever developer account |
| **1EdTech** | LTI Advantage Test Suite | Certify LTI 1.3 implementation | Free registration required |
| **Canvas** | Canvas LMS Connect (via Clever) | Simulate Canvas-specific behavior | Clever certification includes Canvas tests |
| **Schoology** | Schoology API Sandbox | Test Schoology LTI/rostering | Free with Schoology dev account |
| **General** | JWT.io | Manually inspect/debug JWT tokens | Free web tool |

---

### Pre-Launch Checklist

**Before Connecting to First Production District:**

**Security:**
- [ ] All endpoints use HTTPS (no HTTP)
- [ ] Private keys stored in secure vault (not environment variables)
- [ ] No secrets in client-side code
- [ ] Nonce/state stored server-side (not cookies)
- [ ] JWT expiration enforced (max 5 minutes)
- [ ] JWKS endpoint rate-limited
- [ ] SQL injection prevention (parameterized queries)
- [ ] XSS prevention (sanitize user input)

**Privacy:**
- [ ] Privacy policy published at /privacy
- [ ] Terms of service published at /terms
- [ ] Data retention policy documented
- [ ] FERPA compliance statement
- [ ] COPPA compliance statement (if K-12)
- [ ] Data Processing Agreement (DPA) template ready

**Functionality:**
- [ ] All Clever certification tests pass
- [ ] All 1EdTech LTI tests pass
- [ ] Manual testing with Canvas, Moodle, Schoology
- [ ] JIT provisioning works for new users
- [ ] Roster sync creates classes correctly
- [ ] Deep linking adds assignments to LMS
- [ ] Grade passback updates LMS gradebook

**Support:**
- [ ] Support email configured (support@sayveritas.com)
- [ ] Error logging sends alerts to team
- [ ] Status page for outages (status.sayveritas.com)
- [ ] Documentation site published (docs.sayveritas.com)

---

## Post-Implementation: Monitoring & Maintenance

### Ongoing Tasks

**Daily:**
- [ ] Monitor Clever sync job success rate
- [ ] Check error logs for LTI failures
- [ ] Review new JIT-provisioned users (anomaly detection)

**Weekly:**
- [ ] Analyze LTI launch metrics (success rate, latency)
- [ ] Review support tickets for integration issues
- [ ] Check for Clever/LMS platform updates

**Monthly:**
- [ ] Audit security logs (JWT validation failures)
- [ ] Review data sync accuracy (spot-check 10 random classes)
- [ ] Update integration documentation based on support patterns

**Quarterly:**
- [ ] Renew LTI certifications if standards updated
- [ ] Review and update privacy policy if needed
- [ ] Conduct security audit of integration code

---

## Success Metrics

### Sprint 1 Success:
- [ ] All existing users migrated with provider = 'google'
- [ ] Database supports district hierarchy
- [ ] Academic terms prevent summer rollover

### Sprint 2 Success:
- [ ] Teachers can log in via Canvas SSO
- [ ] JIT provisioning creates new users on first launch
- [ ] Zero security vulnerabilities in JWT handling

### Sprint 3 Success:
- [ ] Teachers add assessments via LMS assignment picker
- [ ] Deep link creates LMS assignment with gradebook column
- [ ] Student launches LMS assignment → lands in correct assessment

### Sprint 4 Success:
- [ ] Clever sync creates 1000+ students automatically
- [ ] OneRoster import processes district roster in <10 minutes
- [ ] Nightly sync keeps rosters up-to-date

### Overall Success:
- [ ] SayVeritas connects to 3+ LMS platforms (Canvas, Moodle, Schoology)
- [ ] Zero data loss during sync operations
- [ ] 95%+ teacher satisfaction with roster accuracy
- [ ] <5% support tickets related to integration issues

---

## Risk Mitigation

### Risk 1: Clever Sync Overwrites Manual Data
**Mitigation:**
- Flag manually-created classes (don't overwrite)
- Admin UI to "lock" entities from sync
- Sync logs show what would change before applying

### Risk 2: LMS Platform Changes Break Integration
**Mitigation:**
- Subscribe to LMS developer newsletters
- Monitor 1EdTech standards updates
- Maintain regression test suite
- Version API endpoints (/v1/lti/login, /v2/lti/login)

### Risk 3: School Changes Email Domains During Sync
**Mitigation:**
- Always match by sourced_id first, email second
- Admin tool to manually merge duplicate accounts
- Warning when email changes detected

### Risk 4: JIT Provisioning Creates Duplicate Accounts
**Mitigation:**
- Check all identifier combinations (sourced_id, sub, email)
- Admin dashboard shows "possible duplicates"
- Manual account linking UI for edge cases

---

## Final Notes for Dev Team

**Code Quality:**
- Follow existing coding standards (TypeScript, ESLint, Prettier)
- Write tests for all new endpoints (aim for 80%+ coverage)
- Document complex business logic (especially sync logic)

**Performance:**
- Optimize database queries (use indexes, avoid N+1)
- Cache JWKS keys (24-hour TTL)
- Batch database operations (1000 records at a time)

**Error Handling:**
- Log all errors with context (user ID, district ID, timestamp)
- Graceful degradation (if Clever fails, fall back to manual roster)
- User-friendly error messages (not raw exceptions)

**Communication:**
- Daily standups to surface blockers
- Weekly demos of completed features
- Eric available for product questions (Slack: @eric)

---

**Sprint Plan Version:** 1.0  
**Last Updated:** January 2026  
**Owner:** Eric Chamberlin  
**Review Cadence:** Weekly sprint retrospectives