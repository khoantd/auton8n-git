-- Add optional metadata column to transactions table.
-- Used by QR payments to store { qr_transaction_id, sender_name } for admin approval.
ALTER TABLE app.transactions
  ADD COLUMN IF NOT EXISTS metadata jsonb DEFAULT NULL;
