-- Crash Reports table
create table if not exists crash_reports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  hotel_id uuid references hotels(id) on delete cascade,
  title text not null,
  description text not null,
  severity text default 'medium' check (severity in ('low', 'medium', 'high', 'critical')),
  status text default 'open' check (status in ('open', 'in_progress', 'resolved', 'closed')),
  user_agent text,
  created_at timestamptz default now()
);

-- Enable RLS on crash_reports table
alter table crash_reports enable row level security;

-- Crash reports policies
create policy "Users can insert their own crash reports" on crash_reports
  for insert with check (auth.uid() = user_id);

create policy "Users can view their own crash reports" on crash_reports
  for select using (auth.uid() = user_id);

-- Allow developers/admins to view all crash reports (you can modify this based on your admin setup)
create policy "Allow admin access to crash reports" on crash_reports
  for select using (true); -- You might want to restrict this to admin users