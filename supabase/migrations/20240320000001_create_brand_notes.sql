-- Drop the table if it exists
DROP TABLE IF EXISTS brand_notes CASCADE;

-- Create brand_notes table
CREATE TABLE brand_notes (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  brand_id UUID NOT NULL,
  content TEXT NOT NULL,
  category TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE brand_notes ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (temporary until auth is implemented)
CREATE POLICY "Brand notes are viewable by everyone"
  ON brand_notes FOR SELECT
  USING (true);

CREATE POLICY "Brand notes are insertable by everyone"
  ON brand_notes FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Brand notes are updatable by everyone"
  ON brand_notes FOR UPDATE
  USING (true);

CREATE POLICY "Brand notes are deletable by everyone"
  ON brand_notes FOR DELETE
  USING (true);

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_brand_notes_updated_at
  BEFORE UPDATE ON brand_notes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column(); 