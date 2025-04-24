-- Check if the status column exists and has a NOT NULL constraint
DO $$
BEGIN
  IF EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_name = 'budgets' AND column_name = 'status' AND is_nullable = 'NO'
  ) THEN
    -- First, update all existing budgets to 'active' status if they don't have one
    UPDATE budgets SET status = 'active' WHERE status IS NULL OR status = '';
    
    -- If we want to remove the column (as per previous migration), we need to:
    -- 1. Remove the NOT NULL constraint first
    ALTER TABLE budgets ALTER COLUMN status DROP NOT NULL;
    
    -- 2. Then we can safely drop the column if needed
    -- Uncomment the line below if you want to completely remove the status column
    -- ALTER TABLE budgets DROP COLUMN status;
  END IF;
END
$$;

-- Add a comment to document the change
COMMENT ON TABLE budgets IS 'Budget records - all budgets are active by default';
