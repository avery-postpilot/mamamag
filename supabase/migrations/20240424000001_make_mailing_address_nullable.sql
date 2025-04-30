-- Make mailing_address column nullable
ALTER TABLE campaign_submissions ALTER COLUMN mailing_address DROP NOT NULL; 