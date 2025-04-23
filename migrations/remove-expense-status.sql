-- Migration to remove the status column from expenses table
-- First, update all existing expenses to be considered as approved
DO $$
BEGIN
  IF EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_name = 'expenses' AND column_name = 'status'
  ) THEN
    UPDATE expenses SET status = 'approved' WHERE status != 'approved';
  END IF;
END $$;

-- Then remove the status column
DO $$
BEGIN
  IF EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_name = 'expenses' AND column_name = 'status'
  ) THEN
    ALTER TABLE expenses DROP COLUMN status;
  END IF;
  
  IF EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_name = 'expenses' AND column_name = 'approved_by'
  ) THEN
    ALTER TABLE expenses DROP COLUMN approved_by;
  END IF;
  
  IF EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_name = 'expenses' AND column_name = 'approved_at'
  ) THEN
    ALTER TABLE expenses DROP COLUMN approved_at;
  END IF;
END $$;

-- Add a comment to the table for documentation
COMMENT ON TABLE expenses IS 'Expense records - all expenses are automatically approved';
