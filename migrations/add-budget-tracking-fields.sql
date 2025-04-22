-- Add fields to track the last expense and create a budget usage history table

-- Add tracking fields to budgets table
ALTER TABLE budgets 
ADD COLUMN IF NOT EXISTS last_expense_amount DECIMAL(15, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_expense_date TIMESTAMP;

-- Create budget usage history table
CREATE TABLE IF NOT EXISTS budget_usage_history (
  id SERIAL PRIMARY KEY,
  budget_id VARCHAR(255) NOT NULL,
  expense_id VARCHAR(255) NOT NULL,
  amount DECIMAL(15, 2) NOT NULL,
  recorded_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (budget_id) REFERENCES budgets(id),
  FOREIGN KEY (expense_id) REFERENCES expenses(id)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_budget_usage_budget_id ON budget_usage_history(budget_id);
