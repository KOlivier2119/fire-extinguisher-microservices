# Test Results — TZW LTD FEMS

## Summary

| Service | Test Suites | Tests | Status |
|---------|-------------|-------|--------|
| auth-service | 1 | 4 | PASS |
| extinguisher-service | 1 | 5 | PASS |
| reporting-service | 2 | 6 | PASS |
| notification-service | 1 | 4 | PASS |
| **Total** | **5** | **19** | **PASS** |

Run all tests:
```bash
cd auth-service && npm test
cd ../extinguisher-service && npm test
cd ../reporting-service && npm test
cd ../notification-service && npm test
```

## auth-service

- Password hash and verify
- Register schema validation (invalid email, valid input)
- Logout schema requires refreshToken

## extinguisher-service

- Inspection IDOR: ADMIN access any, USER own only, INSPECTOR assigned only

## reporting-service

- CSV export: arrays, objects, primitives
- Format query parsing (json/csv/pdf)
- RBAC: USER denied admin routes, INSPECTOR allowed

## notification-service

- Service key validation on internal send endpoint
- ADMIN role required for audit log routes

## RBAC Verification Checklist

- [x] USER cannot access inventory summary, maintenance frequency, compliance status reports (403)
- [x] USER cannot access other users' inspections by ID (403)
- [x] ADMIN-only notification audit log enforced at service layer
- [x] Logout requires JWT + refreshToken
- [x] PUT extinguisher validated with partial schema
- [x] CSV export works for object-shaped reports (inventory summary, compliance status)
- [x] Gateway protects logout; public forgot/reset on /auth and /users paths

## Manual API Testing

Use Swagger at http://localhost:3000/api/docs or test via gateway:

1. Register users with different roles (promote via ADMIN)
2. Verify 403 responses for unauthorized role actions
3. Test report export: `GET /api/reports/inventory/summary?format=csv` as INSPECTOR
4. Test logout: `POST /api/auth/logout` with Bearer token + refreshToken body
