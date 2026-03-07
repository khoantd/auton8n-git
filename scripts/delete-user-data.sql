-- =============================================================================
-- Delete all data for a user in Supabase (run in SQL Editor)
-- =============================================================================
-- DESTRUCTIVE: This removes the user's auth account and/or all app data.
-- Confirm the target user and take backups if needed before running.
-- =============================================================================
-- Set the target user by editing ONE of the two lines below (comment out the other):
-- =============================================================================

DO $$
DECLARE
  -- Option A: identify by user ID (UUID from auth.users.id / profiles.id)
  target_user_id uuid := '00000000-0000-0000-0000-000000000000';

  -- Option B: identify by email (set email and set target_user_id to NULL above)
  target_user_email text := NULL;  -- e.g. 'user@example.com'

  uid uuid;
BEGIN
  IF target_user_email IS NOT NULL AND target_user_email <> '' THEN
    SELECT id INTO uid FROM auth.users WHERE email = target_user_email;
    IF uid IS NULL THEN
      RAISE EXCEPTION 'User not found for email: %', target_user_email;
    END IF;
  ELSIF target_user_id IS NOT NULL AND target_user_id <> '00000000-0000-0000-0000-000000000000'::uuid THEN
    uid := target_user_id;
  ELSE
    RAISE EXCEPTION 'Set either target_user_id (valid UUID) or target_user_email in the DECLARE block above';
  END IF;

  -- Full account deletion: removes auth row and cascades to profiles, then
  -- subscriptions, transactions, purchased_workflows, activity_logs
  DELETE FROM auth.users WHERE id = uid;

  RAISE NOTICE 'Deleted user account and all related data for id: %', uid;
END;
$$;

-- =============================================================================
-- ALTERNATIVE: App data only (keep auth account, remove all app schema data)
-- =============================================================================
-- To only delete public data and keep the user in auth.users (e.g. anonymize),
-- comment out the DO $$ block above and uncomment the block below.
--
-- DO $$
-- DECLARE
--   target_user_id uuid := '00000000-0000-0000-0000-000000000000';
--   target_user_email text := NULL;  -- e.g. 'user@example.com'
--   uid uuid;
-- BEGIN
--   IF target_user_email IS NOT NULL AND target_user_email <> '' THEN
--     SELECT id INTO uid FROM auth.users WHERE email = target_user_email;
--     IF uid IS NULL THEN
--       RAISE EXCEPTION 'User not found for email: %', target_user_email;
--     END IF;
--   ELSIF target_user_id IS NOT NULL AND target_user_id <> '00000000-0000-0000-0000-000000000000'::uuid THEN
--     uid := target_user_id;
--   ELSE
--     RAISE EXCEPTION 'Set either target_user_id (valid UUID) or target_user_email in the DECLARE block above';
--   END IF;
--
--   DELETE FROM app.activity_logs        WHERE user_id = uid;
--   DELETE FROM app.purchased_workflows   WHERE user_id = uid;
--   DELETE FROM app.transactions         WHERE user_id = uid;
--   DELETE FROM app.subscriptions        WHERE user_id = uid;
--   DELETE FROM app.profiles             WHERE id = uid;
--
--   RAISE NOTICE 'Deleted app data only for user id: % (auth account kept)', uid;
-- END;
-- $$;
