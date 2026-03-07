-- Temporary cache for PayPal order data so the webhook can look up items
-- associated with a captured order and record purchased workflows correctly.
-- Access is backend-only via supabaseAdmin (service role); no RLS is applied.

create table if not exists app.paypal_order_cache (
  order_id   text        primary key,
  user_id    uuid        not null,
  items      jsonb       not null,
  created_at timestamptz not null default now()
);
