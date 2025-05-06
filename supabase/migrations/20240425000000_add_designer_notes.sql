-- Add designer_notes column to campaign_submissions table
ALTER TABLE campaign_submissions ADD COLUMN IF NOT EXISTS designer_notes TEXT;

-- Update RLS policies to allow access to designer_notes
ALTER POLICY "Submissions are viewable by authenticated users" ON campaign_submissions USING (auth.role() = 'authenticated');
ALTER POLICY "Submissions are insertable by everyone" ON campaign_submissions WITH CHECK (true);
ALTER POLICY "Submissions are updatable by authenticated users" ON campaign_submissions USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated'); 