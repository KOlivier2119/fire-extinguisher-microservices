/**
 * RBAC verification script — run against a live gateway:
 *   node scripts/verify-rbac.js
 */
const API = process.env.API_URL || 'http://localhost:3000/api';

async function request(path, method, body, token) {
  const res = await fetch(`${API}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const contentType = res.headers.get('content-type') || '';
  const data = contentType.includes('json') ? await res.json().catch(() => ({})) : null;
  return { status: res.status, data, contentType: res.headers.get('content-type') };
}

async function login(email, password) {
  const res = await request('/auth/login', 'POST', { email, password });
  if (res.status !== 200) throw new Error(`Login failed for ${email}: ${JSON.stringify(res.data)}`);
  return res.data.data;
}

function assert(label, condition) {
  const ok = condition;
  console.log(`${ok ? 'PASS' : 'FAIL'} — ${label}`);
  if (!ok) process.exitCode = 1;
  return ok;
}

const sampleExtinguisher = {
  serialNumber: `RBAC-${Date.now()}`,
  location: 'Test Floor',
  type: 'CO2',
  size: 'LB_5',
  installationDate: '2024-01-01',
  expiryDate: '2026-01-01',
};

const sampleMaintenance = {
  extinguisherId: '',
  actionTaken: 'Pressure check',
  maintenanceDate: '2024-06-01',
  issuesIdentified: 'None',
  notes: 'RBAC test',
  recommendations: 'None',
};

async function main() {
  console.log('Verifying RBAC via', API, '\n');

  const user = await login('user@tzw-ltd.com', 'User@123');
  const inspector = await login('inspector@tzw-ltd.com', 'Inspector@123');
  const admin = await login('admin@tzw-ltd.com', 'Admin@123');

  assert('USER role is USER', user.user.role === 'USER');
  assert('INSPECTOR role is INSPECTOR', inspector.user.role === 'INSPECTOR');
  assert('ADMIN role is ADMIN', admin.user.role === 'ADMIN');

  // USER restrictions
  const userPostEx = await request('/extinguishers', 'POST', sampleExtinguisher, user.accessToken);
  assert('USER cannot POST /extinguishers (403)', userPostEx.status === 403);

  const userMaintGet = await request('/maintenance', 'GET', null, user.accessToken);
  assert('USER cannot GET /maintenance (403)', userMaintGet.status === 403);

  const userMaintPost = await request('/maintenance', 'POST', sampleMaintenance, user.accessToken);
  assert('USER cannot POST /maintenance (403)', userMaintPost.status === 403);

  const userInventory = await request('/reports/inventory/summary', 'GET', null, user.accessToken);
  assert('USER cannot GET inventory summary (403)', userInventory.status === 403);

  const userPendingReport = await request('/reports/inspections/pending', 'GET', null, user.accessToken);
  assert('USER cannot GET pending inspections report (403)', userPendingReport.status === 403);

  const userListUsers = await request('/users', 'GET', null, user.accessToken);
  assert('USER cannot list users (403)', userListUsers.status === 403);

  // INSPECTOR restrictions
  const inspPostEx = await request('/extinguishers', 'POST', sampleExtinguisher, inspector.accessToken);
  assert('INSPECTOR cannot POST /extinguishers (403)', inspPostEx.status === 403);

  const inspSchedule = await request('/inspections', 'POST', {
    extinguisherId: 'x',
    scheduledDate: '2025-12-01',
    scheduledTime: '09:00',
    assignedInspectorId: inspector.user.id,
    assignedInspectorEmail: inspector.user.email,
  }, inspector.accessToken);
  assert('INSPECTOR cannot POST /inspections (403)', inspSchedule.status === 403);

  const inspInventory = await request('/reports/inventory/summary?format=json', 'GET', null, inspector.accessToken);
  assert('INSPECTOR cannot GET inventory summary (403)', inspInventory.status === 403);

  const inspMaintGet = await request('/maintenance', 'GET', null, inspector.accessToken);
  assert('INSPECTOR can GET /maintenance (200)', inspMaintGet.status === 200);

  // ADMIN capabilities
  const adminUsers = await request('/users', 'GET', null, admin.accessToken);
  assert('ADMIN can list users (200)', adminUsers.status === 200);

  const adminInventory = await request('/reports/inventory/summary?format=json', 'GET', null, admin.accessToken);
  assert('ADMIN can GET inventory summary (200)', adminInventory.status === 200);

  const adminMaintGet = await request('/maintenance', 'GET', null, admin.accessToken);
  assert('ADMIN can GET /maintenance (200)', adminMaintGet.status === 200);

  const adminMaintPost = await request('/maintenance', 'POST', sampleMaintenance, admin.accessToken);
  assert('ADMIN cannot POST /maintenance (403)', adminMaintPost.status === 403);

  const adminComplete = await request('/inspections/nonexistent-id/complete', 'PATCH', null, admin.accessToken);
  assert('ADMIN cannot PATCH complete inspection (403)', adminComplete.status === 403);

  // Auth / gateway
  const logoutNoAuth = await request('/auth/logout', 'POST', { refreshToken: 'x' });
  assert('Logout without JWT returns 401', logoutNoAuth.status === 401);

  const freshUser = await login('user@tzw-ltd.com', 'User@123');
  const logoutAuth = await request('/auth/logout', 'POST', { refreshToken: freshUser.refreshToken }, freshUser.accessToken);
  assert('Logout with JWT + refreshToken returns 200', logoutAuth.status === 200);

  const swagger = await fetch(`${API.replace(/\/api$/, '')}/api/docs/openapi.json`);
  assert('Gateway OpenAPI spec available', swagger.status === 200);

  console.log(process.exitCode ? '\nSome checks failed.' : '\nAll checks passed.');
}

main().catch((err) => {
  console.error('Verification error:', err.message);
  process.exit(1);
});
