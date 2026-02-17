# Admin Portal Separation & Issue Reporting Enhancement

## Changes Made

### 1. Database Migration (20260215000000_admin_portal_separation.sql)

**Admin Portal Separation:**
- Updated RLS policies for `ledger_notes` table to be admin-specific
  - Each admin can only view, create, update, and delete their own ledger notes
  - Ledger notes are now filtered by `created_by = auth.uid()`
  
- Updated RLS policies for `calendar_events` table to be admin-specific
  - Each admin can only view, create, update, and delete their own calendar events
  - Calendar events are now filtered by `created_by = auth.uid()`

**Issue Reporting Enhancement:**
- Added `department` column to `issue_reports` table
  - Allows admins to specify which department an issue belongs to when reporting on behalf of users
  
- Added new RLS policy: "Admins can create issues for users"
  - Allows admins to report issues on behalf of users who cannot do it themselves

**What Remains Shared:**
- `invoices` table - All admins can see and manage all invoices (as requested)
- `issue_reports` table - All admins can see all reported issues (as requested)

### 2. New Component: AdminReportIssue.tsx

Created a new component that allows admins to report issues on behalf of users with:
- Issue title and detailed description
- Department selection (dropdown with all departments)
- Category selection (hardware, software, network, general)
- Priority selection (low, medium, high, critical)

### 3. Updated AdminIssues.tsx

Enhanced the admin issues page with tabs:
- **View Issues Tab**: Shows all reported issues (existing functionality)
- **Report Issue Tab**: New tab with the AdminReportIssue component

The issue display now shows:
- Department information from either the reporter's profile OR the department field (for admin-reported issues)

### 4. Updated AuthPage.tsx

Fixed mobile layout:
- Sign In/Sign Up form now appears first on mobile
- Hero text and features appear below the form on mobile
- Desktop layout remains unchanged (text left, form right)

## How It Works

### Admin Portal Separation
1. Each admin has their own private ledger (notes, reminders, plans, documents)
2. Each admin has their own private calendar events
3. All admins can still see and manage:
   - All invoices
   - All issue reports from all users and admins

### Issue Reporting by Admins
1. Admins can switch to the "Report Issue" tab
2. Fill in the issue details and select the department
3. The issue is created with the admin as the reporter
4. The department field stores which department the issue is for
5. All admins can see this issue in the "View Issues" tab

## Database Schema Changes

```sql
-- New column
ALTER TABLE public.issue_reports ADD COLUMN department TEXT;

-- New RLS policies ensure admin-specific access to ledger and calendar
-- while maintaining shared access to invoices and issues
```

## Testing Checklist

- [ ] Each admin can only see their own ledger notes
- [ ] Each admin can only see their own calendar events
- [ ] All admins can see all invoices
- [ ] All admins can see all issue reports
- [ ] Admins can report issues with department selection
- [ ] Mobile layout shows form before text
- [ ] Desktop layout remains unchanged
