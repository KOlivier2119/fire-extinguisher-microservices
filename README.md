# TZW LTD — Fire Extinguisher Management System (FEMS)

RESTful microservices-based system for managing fire extinguisher inventory, inspections, maintenance, compliance, and reporting.

## Architecture

| Service | Port | Description |
|---------|------|-------------|
| **api-gateway** | 3000 | Single entry point, JWT validation, Swagger UI |
| **auth-service** | 3001 | User registration, login, JWT, RBAC, profiles |
| **extinguisher-service** | 3002 | Extinguisher CRUD, inspections, maintenance |
| **reporting-service** | 3003 | Real-time reports with PDF/CSV export |
| **notification-service** | 3004 | SMTP email notifications |
| **frontend** | 3100 | Next.js web application |

## Quick Start (Docker)

```bash
cp .env.example .env
# Edit .env with SMTP credentials (Ethereal Email recommended for dev)
docker compose up --build
```

- Frontend: http://localhost:3100
- API Gateway: http://localhost:3000
- Swagger UI: http://localhost:3000/api/docs

## Quick Start (Local Development)

1. Start PostgreSQL and create databases (see `scripts/init-databases.sql`)
2. Copy `.env.example` to each service directory as `.env`
3. Run migrations in each service: `npm run migrate`
4. Start services: `npm run dev` in each folder
5. Start frontend: `cd frontend && npm run dev`

## Default Seed Users

After running `node scripts/seed.js` (with services up):

| Email | Password | Role |
|-------|----------|------|
| admin@tzw-ltd.com | Admin@123 | ADMIN |
| inspector@tzw-ltd.com | Inspector@123 | INSPECTOR |
| user@tzw-ltd.com | User@123 | USER |

Verify RBAC: `node scripts/verify-rbac.js`

## Documentation

- [ERD](docs/erd.md)
- [Deployment Guide](docs/deployment-guide.md)
- [User Manual](docs/user-manual.md)
- [Test Results](docs/test-results.md)
- [OpenAPI Specs](docs/api/)

## Tech Stack

- **Backend:** Node.js, Express 5, TypeScript, Prisma 7, PostgreSQL
- **Frontend:** Next.js 16, React 19, Tailwind CSS 4
- **Auth:** JWT + bcrypt, RBAC (Admin, Inspector, User)
- **Notifications:** Nodemailer (SMTP)
