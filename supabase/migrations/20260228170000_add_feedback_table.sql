-- Create app.feedback table for customer-submitted feedback.
-- Submissions are open to guests (anon) and authenticated users alike.
-- Admin reads are performed via the backend service role; no select policy is needed for the frontend.

CREATE TABLE IF NOT EXISTS app.feedback (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid        REFERENCES app.profiles(id),
  email      text        NOT NULL,
  name       text,
  subject    text,
  message    text        NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE app.feedback ENABLE ROW LEVEL SECURITY;

-- Allow anyone (anon and authenticated) to insert feedback.
CREATE POLICY "Anyone can insert feedback"
  ON app.feedback
  FOR INSERT
  WITH CHECK (true);
