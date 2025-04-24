-- Add image_url column to expenses table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.columns 
                   WHERE table_name = 'expenses' AND column_name = 'image_url') THEN
        ALTER TABLE expenses ADD COLUMN image_url TEXT;
        
        -- Set a default placeholder for existing records
        UPDATE expenses SET image_url = '/placeholder.svg?height=300&width=300' WHERE image_url IS NULL;
    END IF;
END
$$;

-- Add a comment to document the column
COMMENT ON COLUMN expenses.image_url IS 'URL to the receipt image for this expense';
