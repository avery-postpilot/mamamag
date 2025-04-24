-- Drop existing tables if they exist
DROP TABLE IF EXISTS campaign_submissions CASCADE;
DROP TABLE IF EXISTS campaigns CASCADE;

-- Create campaigns table
CREATE TABLE campaigns (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    in_home_date DATE NOT NULL,
    asset_due_date DATE NOT NULL,
    volume INTEGER NOT NULL,
    audience VARCHAR(255) NOT NULL,
    page_count INTEGER NOT NULL,
    pricing JSONB,
    existing_brands JSONB,
    status VARCHAR(50) DEFAULT 'draft',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create campaign_submissions table
CREATE TABLE campaign_submissions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    campaign_id UUID REFERENCES campaigns(id) ON DELETE CASCADE,
    brand_name VARCHAR(255) NOT NULL,
    contact_name VARCHAR(255) NOT NULL,
    contact_email VARCHAR(255) NOT NULL,
    mailing_address TEXT NOT NULL,
    brand_logo_url TEXT,
    brand_url TEXT,
    selected_pages JSONB NOT NULL, -- Stores array of selected pages with their layouts
    total_price DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_submissions ENABLE ROW LEVEL SECURITY;

-- Create policies for campaigns table
CREATE POLICY "Campaigns are viewable by everyone"
    ON campaigns FOR SELECT
    USING (true);

CREATE POLICY "Campaigns are editable by authenticated users"
    ON campaigns FOR ALL
    USING (auth.role() = 'authenticated')
    WITH CHECK (auth.role() = 'authenticated');

-- Create policies for campaign_submissions table
CREATE POLICY "Submissions are viewable by authenticated users"
    ON campaign_submissions FOR SELECT
    USING (auth.role() = 'authenticated');

CREATE POLICY "Submissions are insertable by everyone"
    ON campaign_submissions FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Submissions are updatable by authenticated users"
    ON campaign_submissions FOR UPDATE
    USING (auth.role() = 'authenticated')
    WITH CHECK (auth.role() = 'authenticated');

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_campaigns_updated_at
    BEFORE UPDATE ON campaigns
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_campaign_submissions_updated_at
    BEFORE UPDATE ON campaign_submissions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column(); 