-- Check if budgets table exists, if not create it
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'budgets') THEN
        CREATE TABLE budgets (
            id VARCHAR(255) PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            amount DECIMAL(15, 2) NOT NULL,
            start_date DATE NOT NULL,
            description TEXT,
            created_by VARCHAR(255) NOT NULL,
            created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP
        );
        
        COMMENT ON TABLE budgets IS 'Budget records - all budgets are active by default';
    END IF;
END
$$;

-- Add any missing columns that might be needed
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.columns 
                   WHERE table_name = 'budgets' AND column_name = 'updated_at') THEN
        ALTER TABLE budgets ADD COLUMN updated_at TIMESTAMP;
    END IF;
END
$$;
