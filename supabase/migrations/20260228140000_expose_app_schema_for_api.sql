-- Expose schema "app" to the PostgREST API so the frontend/backend can query it.
-- Fixes PGRST106: "Invalid schema: app" / "Only the following schemas are exposed: public, graphql_public"
-- See: https://supabase.com/docs/guides/troubleshooting/pgrst106-the-schema-must-be-one-of-the-following-error-when-querying-an-exposed-schema
--
-- If you still get 500s from /api/admin/dashboard/* after running this migration:
-- 1. In Supabase Dashboard → Project → Settings → API, add "app" to "Exposed schemas".
-- 2. Reload the schema cache (same API settings page or restart the project).

ALTER ROLE authenticator SET pgrst.db_schemas = 'public, graphql_public, app';
