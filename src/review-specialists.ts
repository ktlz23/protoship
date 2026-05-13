export const SECURITY_CHECKLIST = `## Security Specialist Checklist

You are reviewing code for security vulnerabilities. Be specific — cite the exact file and describe the issue concisely.

### What to check

**Secrets & Credentials**
- API keys, tokens, passwords hardcoded in source files (even in comments)
- Credentials committed in .env files (not just .env.example)
- Sensitive values in error messages or logs returned to the user

**Injection Vulnerabilities**
- SQL injection: string concatenation or template literals used to build queries instead of parameterized queries
- Command injection: user-controlled values passed to exec/spawn/shell commands
- Path traversal: user-controlled file paths without sanitization (../../etc/passwd)
- SSRF: user-supplied URLs fetched server-side without allowlist validation

**Authentication & Authorization**
- API routes or pages that should require authentication but have no auth guard
- Authorization checks that default to "allow" instead of "deny"
- User A can access User B's data by changing an ID in the URL or request body
- JWT/session tokens validated only for existence, not for validity/expiry

**Frontend Security**
- dangerouslySetInnerHTML / v-html / innerHTML used with user-controlled content (XSS)
- Forms with no CSRF protection on state-changing endpoints
- Sensitive data (tokens, PII) stored in localStorage instead of httpOnly cookies

**Configuration**
- CORS configured to allow all origins (*)
- No rate limiting on auth endpoints or public APIs
- Debug mode or verbose errors enabled in production config

### Output format
Return a JSON array. If no issues found, return [].
Each finding: {"specialist":"security","severity":"critical|high|medium|low","description":"...","file":"optional/path","fix":"concrete suggestion"}`;

export const ARCHITECTURE_CHECKLIST = `## Architecture Specialist Checklist

You are reviewing code for structural and architectural problems. Focus on issues that will cause real pain at scale.

### What to check

**Configuration & Environment**
- Values that should be environment variables but are hardcoded (URLs, ports, feature flags, service names)
- Missing environment variable validation at startup (app starts without required vars, fails mysteriously later)
- .env.example missing variables that the code actually uses

**Separation of Concerns**
- Business logic directly in route handlers / API endpoints (should be in a service layer)
- Database queries scattered across UI components instead of in a data access layer
- Large files doing too many things (>200 lines is a signal; >500 lines is a problem)

**Error Handling**
- Unhandled promise rejections (async functions called without try/catch or .catch())
- Errors swallowed silently (catch block with no logging or rethrow)
- No error boundaries in the frontend (one crash takes down the whole UI)
- Generic "something went wrong" errors with no actionable information for the user

**Database & API Patterns**
- N+1 query patterns (query inside a loop, fetching one record at a time)
- No pagination on endpoints that return lists (will break with real data volumes)
- No database indexes on columns used in WHERE clauses or foreign keys
- Mutations performed inside GET request handlers

**Scalability Red Flags**
- In-memory state (global variables, module-level arrays) used to store user data
- No input size limits (file uploads, request body size, query result sets)
- Synchronous blocking operations in async request handlers

### Output format
Return a JSON array. If no issues found, return [].
Each finding: {"specialist":"architecture","severity":"critical|high|medium|low","description":"...","file":"optional/path","fix":"concrete suggestion"}`;

export const CODE_QUALITY_CHECKLIST = `## Code Quality Specialist Checklist

You are reviewing code for maintainability and best practice issues. Focus on what will slow down development or cause bugs.

### What to check

**TypeScript Type Safety**
- Use of \`any\` type (signals missing type definition — find what type it should be)
- Functions with no return type annotation on non-trivial logic
- \`as\` type assertions that paper over a real type mismatch
- \`// @ts-ignore\` or \`// @ts-nocheck\` comments

**Input Validation**
- User input used without validation at API/form boundaries (missing schema validation e.g. zod, yup, joi)
- No validation of required fields, string lengths, numeric ranges, or enum values
- File uploads accepted without type or size validation

**UI State Management**
- Loading states missing — async operations with no spinner or disabled button
- Error states missing — failed requests with no user-facing message
- Optimistic updates without rollback on failure

**Code Clarity**
- Magic numbers/strings used directly instead of named constants
- TODO / FIXME comments left in code (list them — they represent known debt)
- Copy-pasted blocks of code that should be extracted into a function (DRY violations)
- Functions longer than 50 lines (likely doing too much)

**Dependencies & Configuration**
- package.json missing \`engines\` field (Node version requirement)
- Dev dependencies listed under \`dependencies\` (bloats production bundle)
- Unused imports that weren't cleaned up

### Output format
Return a JSON array. If no issues found, return [].
Each finding: {"specialist":"code_quality","severity":"critical|high|medium|low","description":"...","file":"optional/path","fix":"concrete suggestion"}`;

export const REVIEW_DISPATCH_INSTRUCTIONS = `Spawn 3 Agent subagents IN PARALLEL (single message, 3 tool calls).

Each subagent receives ONLY:
1. The project files (below)
2. Its specialist checklist
NO conversation history, NO knowledge of the HTML prototype, NO stack recommendation context.

Each subagent returns a JSON array of findings (or [] if none).

After all 3 return, merge the arrays and compute scores:
- Per specialist score: start at 100, subtract (critical×20 + high×10 + medium×5 + low×2), minimum 0
- Composite score: (security_score × 0.40) + (architecture_score × 0.35) + (quality_score × 0.25)

Present the report as:
## Quality Review — Score: X/100

| Category | Score | Issues |
|----------|-------|--------|
| Security | X/100 | N |
| Architecture | X/100 | N |
| Code Quality | X/100 | N |

### 🔴 Critical (fix before deploying)
[findings with severity=critical]

### 🟡 High Priority
[findings with severity=high]

### 🟢 Good to fix when possible
[findings with severity=medium or low]

### ✅ Strengths
[what the code does well — at least 2-3 observations]

### Top 3 priorities before launch
1. [most critical fix]
2. [second most critical]
3. [third most critical]`;
