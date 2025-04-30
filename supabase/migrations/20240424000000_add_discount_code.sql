-- Add discount_code column to campaign_submissions table
ALTER TABLE campaign_submissions ADD COLUMN IF NOT EXISTS discount_code VARCHAR(50);

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_campaign_submissions_discount_code ON campaign_submissions(discount_code);

-- Update RLS policies to allow access to discount_code
ALTER POLICY "Submissions are viewable by authenticated users" ON campaign_submissions USING (auth.role() = 'authenticated');
ALTER POLICY "Submissions are insertable by everyone" ON campaign_submissions WITH CHECK (true);
ALTER POLICY "Submissions are updatable by authenticated users" ON campaign_submissions USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated'); 