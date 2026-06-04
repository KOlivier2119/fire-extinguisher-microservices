# Backend Services

All backend microservices live at the **repository root** (there is no nested `backend/` package folder for source code).

| Service | Folder | Port | Entry point |
|---------|--------|------|-------------|
| API Gateway | [`../api-gateway`](../api-gateway) | 3000 | `src/index.ts` |
| Auth | [`../auth-service`](../auth-service) | 3001 | `src/index.ts` |
| Extinguisher | [`../extinguisher-service`](../extinguisher-service) | 3002 | `src/index.ts` |
| Reporting | [`../reporting-service`](../reporting-service) | 3003 | `src/index.ts` |
| Notification | [`../notification-service`](../notification-service) | 3004 | `src/index.ts` |

## Auth service layout

```
auth-service/
├── src/
│   ├── index.ts                 # Express app, mounts /auth and /users
│   ├── routes/
│   │   ├── auth.routes.ts       # register, login, logout, refresh, me, forgot/reset
│   │   └── user.routes.ts       # profile, change-password, admin users, forgot/reset aliases
│   ├── controllers/
│   │   ├── auth.controller.ts
│   │   └── user.controller.ts
│   ├── services/
│   │   ├── auth.service.ts      # JWT, refresh tokens, password reset
│   │   ├── user.service.ts
│   │   └── notification.client.ts
│   ├── middleware/auth.ts       # JWT authenticate + requireRole
│   ├── validators/auth.validator.ts
│   └── prisma/schema.prisma
└── .env
```

## Run locally

```bash
# From each service folder
npm run dev
```

Or use Docker: `docker compose up --build` from the repo root (requires Docker Desktop running).
