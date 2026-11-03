# 02: Employee SSO Authentication & Session

**What to build:** An end-to-end authentication flow for employees accessing the Employee Assessment Web via OnePlatform SSO. The application extracts the `shareToken` from the URL, calls the backend to verify the token via the OnePlatform adapter contract, establishes a secure HTTP-only employee session cookie (`__Host-emp-session`), and displays the authenticated employee's name and profile on the landing screen.

**Blocked by:** 01: Monorepo Baseline & Health Probe

**Status:** skipped (waiting for OnePlatform specification; bypassed via mock session for development)

- [ ] Employee Web captures `shareToken` parameter upon arrival from OnePlatform
- [ ] Backend OnePlatform adapter verifies `shareToken`, retrieves employee profile (including stable `employeeId`), and rejects invalid or expired tokens with user-friendly errors
- [ ] Backend issues a secure, HTTP-only, SameSite session cookie (`__Host-emp-session`) containing an encrypted employee session
- [ ] Employee Web establishes session state and greets the authenticated employee by name
- [ ] Integration test verifies successful login with valid token and rejection with invalid/expired token
