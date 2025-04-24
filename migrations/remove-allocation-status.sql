-- Migration to remove the status column from additional_allocations table
-- First, update all existing allocations to be considered as approved
UPDATE additional_allocations 
SET 
  approved_by = COALESCE(approved_by, requested_by),
  approved_at = COALESCE(approved_at, requested_at)
WHERE status != 'approved';

-- Then remove the status column
ALTER TABLE additional_allocations DROP COLUMN IF EXISTS status;

-- Add a comment to the table for documentation
COMMENT ON TABLE additional_allocations IS 'Additional budget allocations - all allocations are automatically approved';
