-- Add career_status column to athletes table
-- This is a separate field from the existing "status" field
-- Options: 'free_agent', 'retired' (nullable)

ALTER TABLE athletes
  ADD COLUMN IF NOT EXISTS career_status TEXT CHECK (career_status IN ('free_agent', 'retired'));

-- Migrate any athlete currently incorrectly set to team = 'Retired'
-- Clear their team field and set career_status = 'retired' instead
UPDATE athletes
SET 
  team = NULL,
  career_status = 'retired'
WHERE team = 'Retired';

-- Note: The fake "Retired" row in the teams table should be removed manually via admin panel
-- or with: DELETE FROM teams WHERE name = 'Retired';
