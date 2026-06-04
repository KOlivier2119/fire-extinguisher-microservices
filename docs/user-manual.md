# User Manual — TZW LTD FEMS

## Roles

### Admin
- Manage users and assign roles
- Full CRUD on fire extinguisher inventory (data integrity)
- Oversight of all inspections and maintenance records (read-only)
- System-wide reports and compliance analytics

### Inspector
- View extinguisher inventory (read-only, for field reference)
- Conduct assigned inspections and mark them complete
- Log maintenance activities and schedule follow-up work
- View maintenance history

### User (Client)
- View extinguisher status
- Schedule inspection requests (assigns an inspector and date)
- Track and cancel own pending inspection requests
- Manage own profile and password

## Getting Started

1. Open http://localhost:3100
2. Register a new account or use seeded credentials (see README)
3. Admin must assign INSPECTOR/ADMIN roles via Users page

## Common Tasks

### Register a Fire Extinguisher (Admin only)
1. Navigate to **Extinguishers** → **Add New**
2. Fill serial number, location, type, size, dates, and status
3. Click **Register**

### Schedule an Inspection (User only)
1. Go to **Schedule** under Inspections
2. Select extinguisher, date, time, and assigned inspector
3. Inspector receives email notification

### Complete an Inspection (Inspector only)
1. Go to **Inspections**
2. Find a pending or overdue assigned inspection
3. Click **Complete** after conducting the field inspection

### Log Maintenance (Inspector only)
1. Go to **Maintenance** → **Log Maintenance**
2. Select extinguisher and enter action details
3. Submit the form

### Generate Reports (Admin only)
1. Navigate to **Reports**
2. Choose a report category: **Extinguisher Stock**, **Inspection Status**, **Expired Extinguishers**, or **Maintenance History**
3. Click **Refresh** for real-time data
4. Click **Download CSV** or **Download PDF** to export the active report

### Manage Profile (All roles)
1. Open **Profile** from the sidebar (or click your name/avatar at the bottom)
2. **Personal information** — update first name, last name, or email, then click **Save changes**
3. Changing your email requires your **current password**; both your old and new addresses receive a security notification email
4. **Security** — enter current password, new password, and confirm new password, then click **Change password**
5. After a password change you are signed out on all devices and must sign in again

### Change Password
1. Go to **Profile** → **Security**
2. Enter current password, new password, and confirm new password
3. Click **Change password**
4. You will be signed out automatically; sign in again with your new password

### Forgot Password
1. Click **Forgot password** on the login page (or from Profile → Security)
2. Enter your email and click **Send verification code**
3. Check your email for a 6-digit verification code (expires in 10 minutes)
4. Enter the code on the verification page, then set a new password — a confirmation email is sent when complete

## Email notifications

The system sends email for security and operational events:

| Event | Email sent? |
|-------|-------------|
| Forgot password | Yes — 6-digit verification code |
| Account registration | Yes — welcome email |
| Password changed (logged in) | Yes — security alert |
| Password reset completed | Yes — confirmation |
| Email address changed | Yes — alert to old and new addresses |
| Profile name only updated | No |
| Login / logout | No |
| Inspection scheduled | Yes — to assigned inspector |
| Inspection overdue | Yes — to assigned inspector |

## Support

Contact TZW LTD IT support for system issues.
