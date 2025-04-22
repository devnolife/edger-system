-- Migration to remove the status column from budgets table
-- First, update all existing budgets to 'active' status
UPDATE budgets SET status = 'active' WHERE status != 'active';

-- Then remove the status column
ALTER TABLE budgets DROP COLUMN IF EXISTS status;

-- Add a comment to the table for documentation
COMMENT ON TABLE budgets IS 'Budget records - all budgets are active by default';
