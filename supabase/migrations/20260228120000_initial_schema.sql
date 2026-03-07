-- Create a table for public profiles
create table if not exists profiles (
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
alter table profiles enable row level security;

drop policy if exists "Public profiles are viewable by everyone." on profiles;
create policy "Public profiles are viewable by everyone." on profiles
  for select using (true);

drop policy if exists "Users can insert their own profile." on profiles;
create policy "Users can insert their own profile." on profiles
  for insert with check ((select auth.uid()) = id);

drop policy if exists "Users can update own profile." on profiles;
create policy "Users can update own profile." on profiles
  for update using ((select auth.uid()) = id);

-- Trigger for new user -> profile
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
  )
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Subscriptions table
create table if not exists subscriptions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references profiles(id) on delete cascade not null,
  plan_type text not null,
  status text not null,
  current_period_end timestamp with time zone,
  updated_at timestamp with time zone default now()
);

alter table subscriptions enable row level security;

drop policy if exists "Users can view own subscription." on subscriptions;
create policy "Users can view own subscription." on subscriptions
  for select using (auth.uid() = user_id);
drop policy if exists "Users can insert own subscription." on subscriptions;
create policy "Users can insert own subscription." on subscriptions
  for insert with check (auth.uid() = user_id);
drop policy if exists "Users can update own subscription." on subscriptions;
create policy "Users can update own subscription." on subscriptions
  for update using (auth.uid() = user_id);

-- Transactions table
create table if not exists transactions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references profiles(id) on delete cascade not null,
  amount numeric not null,
  currency text default 'USD',
  status text not null,
  payment_method text,
  items jsonb,
  created_at timestamp with time zone default now()
);

alter table transactions enable row level security;

drop policy if exists "Users can view own transactions." on transactions;
create policy "Users can view own transactions." on transactions
  for select using (auth.uid() = user_id);
drop policy if exists "Users can insert own transactions." on transactions;
create policy "Users can insert own transactions." on transactions
  for insert with check (auth.uid() = user_id);

-- Purchased workflows table
create table if not exists purchased_workflows (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references profiles(id) on delete cascade not null,
  workflow_id text not null,
  purchase_date timestamp with time zone default now(),
  unique(user_id, workflow_id)
);

alter table purchased_workflows enable row level security;

drop policy if exists "Users can view own purchased workflows." on purchased_workflows;
create policy "Users can view own purchased workflows." on purchased_workflows
  for select using (auth.uid() = user_id);
drop policy if exists "Users can insert own purchased workflows." on purchased_workflows;
create policy "Users can insert own purchased workflows." on purchased_workflows
  for insert with check (auth.uid() = user_id);

-- Workflows table
create table if not exists workflows (
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

alter table workflows enable row level security;

drop policy if exists "Workflows are viewable by everyone." on workflows;
create policy "Workflows are viewable by everyone." on workflows
  for select using (true);
drop policy if exists "Admins can insert workflows." on workflows;
create policy "Admins can insert workflows." on workflows
  for insert with check (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid()
      and profiles.role = 'admin'
    )
  );
drop policy if exists "Admins can update workflows." on workflows;
create policy "Admins can update workflows." on workflows
  for update using (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid()
      and profiles.role = 'admin'
    )
  );
drop policy if exists "Admins can delete workflows." on workflows;
create policy "Admins can delete workflows." on workflows
  for delete using (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid()
      and profiles.role = 'admin'
    )
  );

-- Documents table
create table if not exists documents (
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

drop policy if exists "Documents are viewable by everyone." on documents;
create policy "Documents are viewable by everyone." on documents
  for select using (true);
drop policy if exists "Admins can manage documents." on documents;
create policy "Admins can manage documents." on documents
  for all using (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid()
      and profiles.role = 'admin'
    )
  );

-- Subscription plans table
create table if not exists subscription_plans (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  price numeric(10, 2) not null,
  features text[],
  is_popular boolean default false,
  created_at timestamp with time zone default now()
);

alter table subscription_plans enable row level security;

drop policy if exists "Plans are viewable by everyone." on subscription_plans;
create policy "Plans are viewable by everyone." on subscription_plans
  for select using (true);
drop policy if exists "Admins can manage plans." on subscription_plans;
create policy "Admins can manage plans." on subscription_plans
  for all using (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid()
      and profiles.role = 'admin'
    )
  );

-- Payment types table
create table if not exists payment_types (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  description text,
  is_enabled boolean default true,
  created_at timestamp with time zone default now()
);

alter table payment_types enable row level security;

drop policy if exists "Payment types are viewable by everyone." on payment_types;
create policy "Payment types are viewable by everyone." on payment_types
  for select using (true);
drop policy if exists "Admins can manage payment types." on payment_types;
create policy "Admins can manage payment types." on payment_types
  for all using (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid()
      and profiles.role = 'admin'
    )
  );

-- System settings table
create table if not exists system_settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamp with time zone default now()
);

alter table system_settings enable row level security;

drop policy if exists "System settings are viewable by everyone." on system_settings;
create policy "System settings are viewable by everyone." on system_settings
  for select using (true);
drop policy if exists "Admins can manage system settings." on system_settings;
create policy "Admins can manage system settings." on system_settings
  for all using (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid()
      and profiles.role = 'admin'
    )
  );

-- Activity logs table
create table if not exists activity_logs (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references profiles(id) on delete cascade,
  action text not null,
  entity_type text,
  entity_id text,
  description text,
  metadata jsonb,
  created_at timestamp with time zone default now()
);

alter table activity_logs enable row level security;

drop policy if exists "Users can view own activity logs." on activity_logs;
create policy "Users can view own activity logs." on activity_logs
  for select using (auth.uid() = user_id);
drop policy if exists "Admins can view all activity logs." on activity_logs;
create policy "Admins can view all activity logs." on activity_logs
  for select using (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid()
      and profiles.role = 'admin'
    )
  );
drop policy if exists "Users can insert own activity logs." on activity_logs;
create policy "Users can insert own activity logs." on activity_logs
  for insert with check (auth.uid() = user_id);

-- Seed default system setting
insert into system_settings (key, value)
values ('subscriptions_enabled', 'true'::jsonb)
on conflict (key) do nothing;
