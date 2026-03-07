-- Move all application tables from public to dedicated schema "app".
-- After this migration: expose "app" in Supabase Dashboard → Settings → API → Schema (if not auto-exposed).

create schema if not exists app;

-- Profiles (no FK to other app tables)
create table if not exists app.profiles (
  id uuid references auth.users on delete cascade not null primary key,
  updated_at timestamp with time zone,
  username text unique,
  full_name text,
  avatar_url text,
  website text,
  role text default 'user',
  constraint profiles_username_length check (char_length(username) >= 3)
);

alter table app.profiles enable row level security;

drop policy if exists "Public profiles are viewable by everyone." on app.profiles;
create policy "Public profiles are viewable by everyone." on app.profiles
  for select using (true);
drop policy if exists "Users can insert their own profile." on app.profiles;
create policy "Users can insert their own profile." on app.profiles
  for insert with check ((select auth.uid()) = id);
drop policy if exists "Users can update own profile." on app.profiles;
create policy "Users can update own profile." on app.profiles
  for update using ((select auth.uid()) = id);

-- Trigger: new auth user -> app.profiles
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into app.profiles (id, full_name, avatar_url, username, updated_at)
  values (
    new.id,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url',
    new.raw_user_meta_data->>'username',
    now()
  )
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Subscriptions
create table if not exists app.subscriptions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references app.profiles(id) on delete cascade not null,
  plan_type text not null,
  status text not null,
  current_period_end timestamp with time zone,
  updated_at timestamp with time zone default now()
);

alter table app.subscriptions enable row level security;

drop policy if exists "Users can view own subscription." on app.subscriptions;
create policy "Users can view own subscription." on app.subscriptions
  for select using (auth.uid() = user_id);
drop policy if exists "Users can insert own subscription." on app.subscriptions;
create policy "Users can insert own subscription." on app.subscriptions
  for insert with check (auth.uid() = user_id);
drop policy if exists "Users can update own subscription." on app.subscriptions;
create policy "Users can update own subscription." on app.subscriptions
  for update using (auth.uid() = user_id);

-- Transactions
create table if not exists app.transactions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references app.profiles(id) on delete cascade not null,
  amount numeric not null,
  currency text default 'USD',
  status text not null,
  payment_method text,
  items jsonb,
  created_at timestamp with time zone default now()
);

alter table app.transactions enable row level security;

drop policy if exists "Users can view own transactions." on app.transactions;
create policy "Users can view own transactions." on app.transactions
  for select using (auth.uid() = user_id);
drop policy if exists "Users can insert own transactions." on app.transactions;
create policy "Users can insert own transactions." on app.transactions
  for insert with check (auth.uid() = user_id);

-- Purchased workflows
create table if not exists app.purchased_workflows (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references app.profiles(id) on delete cascade not null,
  workflow_id text not null,
  purchase_date timestamp with time zone default now(),
  unique(user_id, workflow_id)
);

alter table app.purchased_workflows enable row level security;

drop policy if exists "Users can view own purchased workflows." on app.purchased_workflows;
create policy "Users can view own purchased workflows." on app.purchased_workflows
  for select using (auth.uid() = user_id);
drop policy if exists "Users can insert own purchased workflows." on app.purchased_workflows;
create policy "Users can insert own purchased workflows." on app.purchased_workflows
  for insert with check (auth.uid() = user_id);

-- Workflows
create table if not exists app.workflows (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  description text,
  author_name text,
  author_avatar text,
  category text,
  integrations text[],
  views integer default 0,
  featured boolean default false,
  is_pro boolean default false,
  price numeric(10, 2),
  cover_image text,
  workflow_json text,
  video_url text,
  instructions text,
  created_at timestamp with time zone default now()
);

alter table app.workflows enable row level security;

drop policy if exists "Workflows are viewable by everyone." on app.workflows;
create policy "Workflows are viewable by everyone." on app.workflows
  for select using (true);
drop policy if exists "Admins can insert workflows." on app.workflows;
create policy "Admins can insert workflows." on app.workflows
  for insert with check (
    exists (
      select 1 from app.profiles
      where app.profiles.id = auth.uid()
      and app.profiles.role = 'admin'
    )
  );
drop policy if exists "Admins can update workflows." on app.workflows;
create policy "Admins can update workflows." on app.workflows
  for update using (
    exists (
      select 1 from app.profiles
      where app.profiles.id = auth.uid()
      and app.profiles.role = 'admin'
    )
  );
drop policy if exists "Admins can delete workflows." on app.workflows;
create policy "Admins can delete workflows." on app.workflows
  for delete using (
    exists (
      select 1 from app.profiles
      where app.profiles.id = auth.uid()
      and app.profiles.role = 'admin'
    )
  );

-- Documents
create table if not exists app.documents (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  slug text unique not null,
  content text,
  section text,
  "order" integer default 0,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

alter table app.documents enable row level security;

drop policy if exists "Documents are viewable by everyone." on app.documents;
create policy "Documents are viewable by everyone." on app.documents
  for select using (true);
drop policy if exists "Admins can manage documents." on app.documents;
create policy "Admins can manage documents." on app.documents
  for all using (
    exists (
      select 1 from app.profiles
      where app.profiles.id = auth.uid()
      and app.profiles.role = 'admin'
    )
  );

-- Subscription plans
create table if not exists app.subscription_plans (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  price numeric(10, 2) not null,
  features text[],
  is_popular boolean default false,
  created_at timestamp with time zone default now()
);

alter table app.subscription_plans enable row level security;

drop policy if exists "Plans are viewable by everyone." on app.subscription_plans;
create policy "Plans are viewable by everyone." on app.subscription_plans
  for select using (true);
drop policy if exists "Admins can manage plans." on app.subscription_plans;
create policy "Admins can manage plans." on app.subscription_plans
  for all using (
    exists (
      select 1 from app.profiles
      where app.profiles.id = auth.uid()
      and app.profiles.role = 'admin'
    )
  );

-- Payment types
create table if not exists app.payment_types (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  description text,
  is_enabled boolean default true,
  created_at timestamp with time zone default now()
);

alter table app.payment_types enable row level security;

drop policy if exists "Payment types are viewable by everyone." on app.payment_types;
create policy "Payment types are viewable by everyone." on app.payment_types
  for select using (true);
drop policy if exists "Admins can manage payment types." on app.payment_types;
create policy "Admins can manage payment types." on app.payment_types
  for all using (
    exists (
      select 1 from app.profiles
      where app.profiles.id = auth.uid()
      and app.profiles.role = 'admin'
    )
  );

-- System settings
create table if not exists app.system_settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamp with time zone default now()
);

alter table app.system_settings enable row level security;

drop policy if exists "System settings are viewable by everyone." on app.system_settings;
create policy "System settings are viewable by everyone." on app.system_settings
  for select using (true);
drop policy if exists "Admins can manage system settings." on app.system_settings;
create policy "Admins can manage system settings." on app.system_settings
  for all using (
    exists (
      select 1 from app.profiles
      where app.profiles.id = auth.uid()
      and app.profiles.role = 'admin'
    )
  );

-- Activity logs
create table if not exists app.activity_logs (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references app.profiles(id) on delete cascade,
  action text not null,
  entity_type text,
  entity_id text,
  description text,
  metadata jsonb,
  created_at timestamp with time zone default now()
);

alter table app.activity_logs enable row level security;

drop policy if exists "Users can view own activity logs." on app.activity_logs;
create policy "Users can view own activity logs." on app.activity_logs
  for select using (auth.uid() = user_id);
drop policy if exists "Admins can view all activity logs." on app.activity_logs;
create policy "Admins can view all activity logs." on app.activity_logs
  for select using (
    exists (
      select 1 from app.profiles
      where app.profiles.id = auth.uid()
      and app.profiles.role = 'admin'
    )
  );
drop policy if exists "Users can insert own activity logs." on app.activity_logs;
create policy "Users can insert own activity logs." on app.activity_logs
  for insert with check (auth.uid() = user_id);

-- Seed default system setting
insert into app.system_settings (key, value)
values ('subscriptions_enabled', 'true'::jsonb)
on conflict (key) do nothing;

-- Migrate existing data from public to app (if tables exist)
do $$
begin
  if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'profiles') then
    insert into app.profiles select * from public.profiles on conflict (id) do nothing;
  end if;
  if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'subscriptions') then
    insert into app.subscriptions select * from public.subscriptions on conflict (id) do nothing;
  end if;
  if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'transactions') then
    insert into app.transactions select * from public.transactions on conflict (id) do nothing;
  end if;
  if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'purchased_workflows') then
    insert into app.purchased_workflows select * from public.purchased_workflows on conflict (id) do nothing;
  end if;
  if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'workflows') then
    insert into app.workflows select * from public.workflows on conflict (id) do nothing;
  end if;
  if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'documents') then
    insert into app.documents select * from public.documents on conflict (id) do nothing;
  end if;
  if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'subscription_plans') then
    insert into app.subscription_plans select * from public.subscription_plans on conflict (id) do nothing;
  end if;
  if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'payment_types') then
    insert into app.payment_types select * from public.payment_types on conflict (id) do nothing;
  end if;
  if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'system_settings') then
    insert into app.system_settings select * from public.system_settings on conflict (key) do nothing;
  end if;
  if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'activity_logs') then
    insert into app.activity_logs select * from public.activity_logs on conflict (id) do nothing;
  end if;
end;
$$;

-- Drop public application tables (order respects FKs)
drop table if exists public.activity_logs;
drop table if exists public.documents;
drop table if exists public.subscription_plans;
drop table if exists public.payment_types;
drop table if exists public.system_settings;
drop table if exists public.workflows;
drop table if exists public.purchased_workflows;
drop table if exists public.transactions;
drop table if exists public.subscriptions;
drop table if exists public.profiles;

-- Allow API roles to use the app schema (required for Supabase PostgREST)
grant usage on schema app to anon, authenticated, service_role;
grant all on all tables in schema app to anon, authenticated, service_role;
grant all on all sequences in schema app to anon, authenticated, service_role;
alter default privileges in schema app grant all on tables to anon, authenticated, service_role;
alter default privileges in schema app grant all on sequences to anon, authenticated, service_role;
