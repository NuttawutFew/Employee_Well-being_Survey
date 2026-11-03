# 09: Admin Internal Authentication & Session Shell

**What to build:** An isolated authentication and shell layout for the Admin Web application. HR/Admin users authenticate using internal username and password credentials. Passwords are verified against Argon2id hashes. The system enforces rate limiting and temporary lockout after 5 consecutive failed login attempts, sets a segregated HTTP-only admin session cookie (`__Host-admin-session`), and displays the desktop-first Admin Web navigation shell.

**Blocked by:** 01: Monorepo Baseline & Health Probe

**Status:** closed

- [x] Database schema stores `AdminAccount` with Argon2id password hash, failed attempt counter, and lockout timestamps
- [x] Admin login endpoint (`POST /api/admin/auth/login`) verifies credentials and returns a secure, HTTP-only cookie (`__Host-admin-session`)
- [x] Account is temporarily locked out after 5 consecutive failed login attempts
- [x] Admin Web displays a clean desktop-first login page with clear error messages for invalid credentials or lockout
- [x] Authenticated shell provides navigation between Individual Results and Dashboard views, with a sign-out action
- [x] Automated security tests verify Argon2id verification, lockout protection, and role separation from employee endpoints
