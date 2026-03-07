-- Create a table for public profiles
create table profiles (
  id uuid references auth.users on delete cascade not null primary key,
  updated_at timestamp with time zone,
  username text unique,
  full_name text,
  avatar_url text,
  website text,
  role text default 'user',

  constraint username_length check (char_length(username) >= 3)
);

-- Set up Row Level Security (RLS)
-- See https://supabase.com/docs/guides/auth/row-level-security for more details.
alter table profiles enable row level security;

create policy "Public profiles are viewable by everyone." on profiles
  for select using (true);

create policy "Users can insert their own profile." on profiles
  for insert with check ((select auth.uid()) = id);

create policy "Users can update own profile." on profiles
  for update using ((select auth.uid()) = id);

-- This triggers a function every time a user is created
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, avatar_url, username, updated_at)
  values (
    new.id,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url',
    new.raw_user_meta_data->>'username',
    now()
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Subscriptions table
create table subscriptions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references profiles(id) on delete cascade not null,
  plan_type text not null, -- 'free', 'pro', 'enterprise'
  status text not null, -- 'active', 'canceled', 'expired'
  current_period_end timestamp with time zone,
  updated_at timestamp with time zone default now()
);

alter table subscriptions enable row level security;

create policy "Users can view own subscription." on subscriptions
  for select using (auth.uid() = user_id);

create policy "Users can insert own subscription." on subscriptions
  for insert with check (auth.uid() = user_id);

create policy "Users can update own subscription." on subscriptions
  for update using (auth.uid() = user_id);

-- Transactions table
create table transactions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references profiles(id) on delete cascade not null,
  amount numeric not null,
  currency text default 'USD',
  status text not null, -- 'pending', 'completed', 'failed'
  payment_method text,
  items jsonb, -- array of purchased items
  created_at timestamp with time zone default now()
);

alter table transactions enable row level security;

create policy "Users can view own transactions." on transactions
  for select using (auth.uid() = user_id);

create policy "Users can insert own transactions." on transactions
  for insert with check (auth.uid() = user_id);

-- Purchased workflows table
create table purchased_workflows (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references profiles(id) on delete cascade not null,
  workflow_id text not null,
  purchase_date timestamp with time zone default now(),
  
  unique(user_id, workflow_id)
);

alter table purchased_workflows enable row level security;

create policy "Users can view own purchased workflows." on purchased_workflows
  for select using (auth.uid() = user_id);

create policy "Users can insert own purchased workflows." on purchased_workflows
  for insert with check (auth.uid() = user_id);

-- Workflows table
create table workflows (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  description text,
  author_name text,
  author_avatar text,
  category text,
  integrations text[], -- array of integration names
  views integer default 0,
  featured boolean default false,
  is_pro boolean default false,
  price numeric(10, 2),
  cover_image text,
  workflow_json text, -- n8n workflow JSON string for embedded demo
  video_url text,
  instructions text,
  created_at timestamp with time zone default now()
);

alter table workflows enable row level security;

create policy "Workflows are viewable by everyone." on workflows
  for select using (true);

create policy "Admins can insert workflows." on workflows
  for insert with check (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid()
      and profiles.role = 'admin'
    )
  );

create policy "Admins can update workflows." on workflows
  for update using (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid()
      and profiles.role = 'admin'
    )
  );

create policy "Admins can delete workflows." on workflows
  for delete using (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid()
      and profiles.role = 'admin'
    )
  );

-- Documents table
create table documents (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  slug text unique not null,
  content text,
  section text,
  "order" integer default 0,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

alter table documents enable row level security;

create policy "Documents are viewable by everyone." on documents
  for select using (true);

create policy "Admins can manage documents." on documents
  for all using (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid()
      and profiles.role = 'admin'
    )
  );

-- Subscription plans table
create table subscription_plans (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  price numeric(10, 2) not null,
  features text[],
  is_popular boolean default false,
  created_at timestamp with time zone default now()
);

alter table subscription_plans enable row level security;

create policy "Plans are viewable by everyone." on subscription_plans
  for select using (true);

create policy "Admins can manage plans." on subscription_plans
  for all using (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid()
      and profiles.role = 'admin'
    )
  );

-- Payment types table
create table payment_types (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  description text,
  is_enabled boolean default true,
  created_at timestamp with time zone default now()
);

alter table payment_types enable row level security;

create policy "Payment types are viewable by everyone." on payment_types
  for select using (true);

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'payment_types'
      and policyname = 'Admins can manage payment types.'
  ) then
    create policy "Admins can manage payment types." on payment_types
      for all using (
        exists (
          select 1 from profiles
          where profiles.id = auth.uid()
          and profiles.role = 'admin'
        )
      );
  end if;
end;
$$;


-- System settings table (for global feature flags, e.g. subscriptions)
create table system_settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamp with time zone default now()
);

alter table system_settings enable row level security;

create policy "System settings are viewable by everyone." on system_settings
  for select using (true);

create policy "Admins can manage system settings." on system_settings
  for all using (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid()
      and profiles.role = 'admin'
    )
  );

-- Activity logs table
create table activity_logs (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references profiles(id) on delete cascade,
  action text not null,
  entity_type text, -- 'workflow', 'document', 'profile', etc.
  entity_id text,
  description text,
  metadata jsonb,
  created_at timestamp with time zone default now()
);

alter table activity_logs enable row level security;

create policy "Users can view own activity logs." on activity_logs
  for select using (auth.uid() = user_id);

create policy "Admins can view all activity logs." on activity_logs
  for select using (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid()
      and profiles.role = 'admin'
    )
  );

create policy "Users can insert own activity logs." on activity_logs
  for insert with check (auth.uid() = user_id);

-- Optional: if workflows table already exists without workflow_json, run:
-- alter table workflows add column if not exists workflow_json text;
-- alter table workflows add column if not exists video_url text;
-- alter table workflows add column if not exists instructions text;

-- Seed default system setting for subscriptions (enabled by default)
insert into system_settings (key, value)
values ('subscriptions_enabled', 'true'::jsonb)
on conflict (key) do nothing;
