# 01: Monorepo Baseline & Health Probe

**What to build:** An integrated modular monorepo workspace containing the backend API, Employee Assessment Web, Admin Web, and shared contract packages. When started locally or in a containerized environment, the backend connects to PostgreSQL, exposes an automated `/health` endpoint, and client applications load cleanly with end-to-end smoke verification passing.

**Blocked by:** None (can start immediately)

**Status:** closed

- [x] Monorepo workspace configuration manages `apps/api`, `apps/employee-web`, `apps/admin-web`, and `packages/shared-contracts`
- [x] Containerized local development environment (Docker Compose) initializes PostgreSQL and backend dependencies cleanly
- [x] Backend API connects to PostgreSQL and exposes a `/health` endpoint reporting database connectivity and application status
- [x] Shared contracts package exports core TypeScript types and error interfaces consumable by API and web apps
- [x] Automated smoke test verifies that both web frontends and the backend API run and communicate successfully in CI
