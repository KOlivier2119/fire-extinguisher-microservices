/**
 * Seed script — run after all services are up:
 *   node scripts/seed.js
 *
 * Creates default users, promotes roles via DB, and seeds sample extinguishers.
 */
const path = require('path');
const { Client } = require(path.join(__dirname, '../auth-service/node_modules/pg'));

const API = process.env.API_URL || 'http://localhost:3000/api';
const AUTH_DB_URL = process.env.AUTH_DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/auth_db';

async function request(path, method, body, token) {
  const res = await fetch(`${API}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(JSON.stringify(data));
  return data;
}

async function promoteRoles() {
  const client = new Client({ connectionString: AUTH_DB_URL });
  await client.connect();
  const roles = [
    { email: 'admin@tzw-ltd.com', role: 'ADMIN' },
    { email: 'inspector@tzw-ltd.com', role: 'INSPECTOR' },
    { email: 'user@tzw-ltd.com', role: 'USER' },
  ];
  for (const { email, role } of roles) {
    const result = await client.query(
      'UPDATE "User" SET role = $1::"Role", "updatedAt" = NOW() WHERE email = $2 RETURNING email, role',
      [role, email]
    );
    if (result.rowCount) {
      console.log(`Role ${role} assigned to ${email}`);
    } else {
      console.log(`User not found for role promotion: ${email}`);
    }
  }
  await client.end();
}

async function main() {
  const users = [
    { firstName: 'Admin', lastName: 'User', email: 'admin@tzw-ltd.com', password: 'Admin@123' },
    { firstName: 'John', lastName: 'Inspector', email: 'inspector@tzw-ltd.com', password: 'Inspector@123' },
    { firstName: 'Jane', lastName: 'Client', email: 'user@tzw-ltd.com', password: 'User@123' },
  ];

  for (const u of users) {
    try {
      await request('/auth/register', 'POST', u);
      console.log(`Registered ${u.email}`);
    } catch (e) {
      console.log(`Skip ${u.email}:`, e.message);
    }
  }

  await promoteRoles();

  const adminLogin = await request('/auth/login', 'POST', {
    email: 'admin@tzw-ltd.com',
    password: 'Admin@123',
  });
  const token = adminLogin.data.accessToken;

  const extinguishers = [
    { serialNumber: 'FE-001', location: 'Building A - Floor 1', type: 'CO2', size: 'LB_5', installationDate: '2024-01-15', expiryDate: '2026-01-15', status: 'ACTIVE' },
    { serialNumber: 'FE-002', location: 'Building A - Floor 2', type: 'FOAM', size: 'LB_9', installationDate: '2023-06-01', expiryDate: '2025-06-01', status: 'ACTIVE' },
    { serialNumber: 'FE-003', location: 'Warehouse B', type: 'DRY_CHEMICAL', size: 'LB_12', installationDate: '2022-03-10', expiryDate: '2024-03-10', status: 'EXPIRED' },
  ];

  for (const ex of extinguishers) {
    try {
      await request('/extinguishers', 'POST', ex, token);
      console.log(`Created ${ex.serialNumber}`);
    } catch (e) {
      console.log(`Skip ${ex.serialNumber}:`, e.message);
    }
  }

  console.log('\nSeed complete. Login credentials:');
  console.log('  admin@tzw-ltd.com / Admin@123 (ADMIN)');
  console.log('  inspector@tzw-ltd.com / Inspector@123 (INSPECTOR)');
  console.log('  user@tzw-ltd.com / User@123 (USER)');
}

main().catch((err) => {
  console.error('Seed failed:', err.message);
  process.exit(1);
});
