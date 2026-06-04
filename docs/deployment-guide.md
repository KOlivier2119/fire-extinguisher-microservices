# Deployment Guide — TZW LTD FEMS

## Prerequisites

- Docker & Docker Compose
- Node.js 20+ (for local development)
- PostgreSQL 16 (if not using Docker)
- SMTP credentials (Ethereal Email for testing: https://ethereal.email)

## Docker Deployment

```bash
cp .env.example .env
# Edit SMTP_USER and SMTP_PASS in .env
docker compose up --build -d
```

Services:
- Frontend: http://localhost:3100
- API Gateway: http://localhost:3000
- Swagger: http://localhost:3000/api/docs
- Health: http://localhost:3000/health

## Local Development

1. Start PostgreSQL and run `scripts/init-databases.sql`
2. Install dependencies in each service: `npm install`
3. Run migrations:
   ```bash
   cd auth-service && npm run migrate
   cd ../notification-service && npm run migrate
   cd ../extinguisher-service && npm run migrate
   ```
4. Start services (separate terminals):
   ```bash
   cd notification-service && npm run dev
   cd auth-service && npm run dev
   cd extinguisher-service && npm run dev
   cd reporting-service && npm run dev
   cd api-gateway && npm run dev
   cd frontend && npm run dev
   ```
5. Seed data: `node scripts/seed.js`
6. Promote first user to ADMIN via admin UI or API

## Environment Variables

See `.env.example` for all required variables.

## Database Backup

```bash
bash scripts/db-backup.sh
```

## Troubleshooting

- **401 errors**: Ensure JWT_SECRET matches across auth, extinguisher, reporting, and gateway services
- **Email not sending**: Configure SMTP credentials; dev mode logs emails to console when SMTP_USER is empty
- **Report errors**: Ensure extinguisher-service is running and SERVICE_API_KEY matches
