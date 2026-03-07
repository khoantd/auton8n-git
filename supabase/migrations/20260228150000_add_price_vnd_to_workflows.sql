-- Add optional VND price column to workflows table.
-- VND has no decimal places, so numeric(12, 0) is the right type.
ALTER TABLE app.workflows
  ADD COLUMN IF NOT EXISTS price_vnd numeric(12, 0) null;
