-- Add file_url column to ledger_notes table
ALTER TABLE public.ledger_notes ADD COLUMN IF NOT EXISTS file_url TEXT;
ALTER TABLE public.ledger_notes ADD COLUMN IF NOT EXISTS file_name TEXT;

-- Create storage bucket for documents
INSERT INTO storage.buckets (id, name, public) 
VALUES ('documents', 'documents', true)
ON CONFLICT (id) DO NOTHING;

-- Set up storage policies
CREATE POLICY "Allow authenticated users to upload documents"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'documents');

CREATE POLICY "Allow public to view documents"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'documents');

CREATE POLICY "Allow admins to delete documents"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'documents' AND auth.uid() IN (
  SELECT user_id FROM public.user_roles WHERE role = 'admin'
));
