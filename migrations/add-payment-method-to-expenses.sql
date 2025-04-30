-- Add payment_method column to expenses table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'expenses'
        AND column_name = 'payment_method'
    ) THEN
        ALTER TABLE expenses ADD COLUMN payment_method VARCHAR(100) DEFAULT 'Transfer Bank';
        
        -- Update existing records to have a default payment method
        UPDATE expenses SET payment_method = 'Transfer Bank' WHERE payment_method IS NULL;
    END IF;
END $$;
