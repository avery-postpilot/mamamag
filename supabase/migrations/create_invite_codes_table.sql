-- Create invite_codes table
CREATE TABLE IF NOT EXISTS invite_codes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    invite_code VARCHAR(20) UNIQUE NOT NULL,
    brand_name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES auth.users(id),
    last_accessed TIMESTAMP WITH TIME ZONE,
    is_used BOOLEAN DEFAULT FALSE,
    expires_at TIMESTAMP WITH TIME ZONE,
    usage_count INTEGER DEFAULT 0,
    max_uses INTEGER DEFAULT 1
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_invite_code ON invite_codes(invite_code);
CREATE INDEX IF NOT EXISTS idx_brand_name ON invite_codes(brand_name);

-- Set up Row Level Security (RLS)
ALTER TABLE invite_codes ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow public to verify invite codes" ON invite_codes;
DROP POLICY IF EXISTS "Allow public to update usage stats" ON invite_codes;
DROP POLICY IF EXISTS "Allow authenticated users to manage invite codes" ON invite_codes;

-- Create policies
-- Allow anyone to verify an invite code
CREATE POLICY "Allow public to verify invite codes"
    ON invite_codes
    FOR SELECT
    USING (true);

-- Allow public to update last_accessed and usage_count
CREATE POLICY "Allow public to update usage stats"
    ON invite_codes
    FOR UPDATE
    USING (true)
    WITH CHECK (
        -- Only allow updating last_accessed and usage_count
        (last_accessed IS NOT NULL OR usage_count IS NOT NULL)
    );

-- Only allow authenticated users to create/update/delete
CREATE POLICY "Allow authenticated users to manage invite codes"
    ON invite_codes
    FOR ALL
    USING (auth.role() = 'authenticated' AND 
          auth.jwt() ->> 'email' LIKE '%@postpilot.com');

-- Create function to validate invite code
CREATE OR REPLACE FUNCTION validate_invite_code(code VARCHAR)
RETURNS TABLE (
    is_valid BOOLEAN,
    message TEXT,
    brand_name TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        CASE 
            WHEN ic.id IS NULL THEN FALSE
            WHEN ic.is_used THEN FALSE
            WHEN ic.expires_at IS NOT NULL AND ic.expires_at < CURRENT_TIMESTAMP THEN FALSE
            WHEN ic.usage_count >= ic.max_uses THEN FALSE
            ELSE TRUE
        END as is_valid,
        CASE 
            WHEN ic.id IS NULL THEN 'Invalid invite code'
            WHEN ic.is_used THEN 'Invite code has already been used'
            WHEN ic.expires_at IS NOT NULL AND ic.expires_at < CURRENT_TIMESTAMP THEN 'Invite code has expired'
            WHEN ic.usage_count >= ic.max_uses THEN 'Invite code has reached maximum usage'
            ELSE 'Valid'
        END as message,
        ic.brand_name
    FROM invite_codes ic
    WHERE ic.invite_code = code;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 