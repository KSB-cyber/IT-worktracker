-- Add department field to issue_reports so admins can report on behalf of users
ALTER TABLE public.issue_reports ADD COLUMN IF NOT EXISTS department TEXT;

-- Update RLS policies for ledger_notes to be admin-specific
DROP POLICY IF EXISTS "Admins can manage ledger" ON public.ledger_notes;
DROP POLICY IF EXISTS "Admins can view own ledger" ON public.ledger_notes;
DROP POLICY IF EXISTS "Admins can insert own ledger" ON public.ledger_notes;
DROP POLICY IF EXISTS "Admins can update own ledger" ON public.ledger_notes;
DROP POLICY IF EXISTS "Admins can delete own ledger" ON public.ledger_notes;

-- Each admin can only see and manage their own ledger notes
CREATE POLICY "Admins can view own ledger" ON public.ledger_notes 
  FOR SELECT USING (
    public.has_role(auth.uid(), 'admin') AND created_by = auth.uid()
  );

CREATE POLICY "Admins can insert own ledger" ON public.ledger_notes 
  FOR INSERT WITH CHECK (
    public.has_role(auth.uid(), 'admin') AND created_by = auth.uid()
  );

CREATE POLICY "Admins can update own ledger" ON public.ledger_notes 
  FOR UPDATE USING (
    public.has_role(auth.uid(), 'admin') AND created_by = auth.uid()
  );

CREATE POLICY "Admins can delete own ledger" ON public.ledger_notes 
  FOR DELETE USING (
    public.has_role(auth.uid(), 'admin') AND created_by = auth.uid()
  );

-- Update RLS policies for calendar_events to be admin-specific
DROP POLICY IF EXISTS "Admins can manage calendar" ON public.calendar_events;
DROP POLICY IF EXISTS "Admins can view own calendar" ON public.calendar_events;
DROP POLICY IF EXISTS "Admins can insert own calendar" ON public.calendar_events;
DROP POLICY IF EXISTS "Admins can update own calendar" ON public.calendar_events;
DROP POLICY IF EXISTS "Admins can delete own calendar" ON public.calendar_events;

CREATE POLICY "Admins can view own calendar" ON public.calendar_events 
  FOR SELECT USING (
    public.has_role(auth.uid(), 'admin') AND created_by = auth.uid()
  );

CREATE POLICY "Admins can insert own calendar" ON public.calendar_events 
  FOR INSERT WITH CHECK (
    public.has_role(auth.uid(), 'admin') AND created_by = auth.uid()
  );

CREATE POLICY "Admins can update own calendar" ON public.calendar_events 
  FOR UPDATE USING (
    public.has_role(auth.uid(), 'admin') AND created_by = auth.uid()
  );

CREATE POLICY "Admins can delete own calendar" ON public.calendar_events 
  FOR DELETE USING (
    public.has_role(auth.uid(), 'admin') AND created_by = auth.uid()
  );

-- Allow admins to create issues on behalf of users (for issue reporting tab)
DROP POLICY IF EXISTS "Admins can create issues for users" ON public.issue_reports;

CREATE POLICY "Admins can create issues for users" ON public.issue_reports 
  FOR INSERT WITH CHECK (
    public.has_role(auth.uid(), 'admin')
  );
