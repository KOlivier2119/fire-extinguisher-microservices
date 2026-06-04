-- Seed data for TZW LTD FEMS (run after migrations)
-- Password hashes: Admin@123, Inspector@123, User@123 (bcrypt cost 12)

-- AUTH DB (connect to auth_db)
-- INSERT INTO "User" (id, email, "firstName", "lastName", "passwordHash", role, "createdAt", "updatedAt")
-- Use auth-service register API or run seed script via Node for proper hashing.

-- Sample extinguishers (extinguisher_db) - run via API after services start
-- See scripts/seed.js for programmatic seeding
