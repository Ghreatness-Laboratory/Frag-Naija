-- Add featured_on_home column to wagers table for admin-controlled homepage display
ALTER TABLE wagers ADD COLUMN IF NOT EXISTS featured_on_home BOOLEAN DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_wagers_featured_on_home ON wagers(featured_on_home, status, closes_at);

NOTIFY pgrst, 'reload schema';
