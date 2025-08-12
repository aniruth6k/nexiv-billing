-- Hotels table
create table if not exists hotels (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  address text,
  logo_url text,
  services jsonb default '["Rooms"]'::jsonb,
  owner_id uuid not null, -- Added this field
  created_at timestamptz default now()
);

-- Staff table
create table if not exists staff (
  id uuid primary key default gen_random_uuid(),
  hotel_id uuid references hotels(id) on delete cascade,
  name text not null,
  role text,
  contact text,
  attendance jsonb default '[]'::jsonb, -- store {date, status}
  created_at timestamptz default now()
);

-- Rooms table
create table if not exists rooms (
  id uuid primary key default gen_random_uuid(),
  hotel_id uuid references hotels(id) on delete cascade,
  room_number text not null,
  type text,
  price numeric,
  created_at timestamptz default now()
);

-- Dishes table
create table if not exists dishes (
  id uuid primary key default gen_random_uuid(),
  hotel_id uuid references hotels(id) on delete cascade,
  name text not null,
  price numeric,
  created_at timestamptz default now()
);

-- Bills table
create table if not exists bills (
  id uuid primary key default gen_random_uuid(),
  hotel_id uuid references hotels(id) on delete cascade,
  customer_name text,
  items jsonb not null, -- store array of {name, qty, price}
  total numeric not null,
  created_at timestamptz default now()
);

-- Create storage bucket for hotel logos (if not exists)
insert into storage.buckets (id, name, public) 
values ('hotel-logos', 'hotel-logos', true)
on conflict (id) do nothing;

-- Allow authenticated users to upload their hotel logos
create policy "Users can upload hotel logos" on storage.objects
  for insert with check (bucket_id = 'hotel-logos' and auth.role() = 'authenticated');

-- Allow public access to hotel logos
create policy "Public access to hotel logos" on storage.objects
  for select using (bucket_id = 'hotel-logos');

-- Allow users to update their hotel logos
create policy "Users can update hotel logos" on storage.objects
  for update using (bucket_id = 'hotel-logos' and auth.role() = 'authenticated');

-- Allow users to delete their hotel logos  
create policy "Users can delete hotel logos" on storage.objects
  for delete using (bucket_id = 'hotel-logos' and auth.role() = 'authenticated');

-- Enable RLS on hotels table
alter table hotels enable row level security;

-- Create policies for hotels table
create policy "Users can view their own hotels" on hotels
  for select using (auth.uid() = owner_id);

create policy "Users can insert their own hotels" on hotels
  for insert with check (auth.uid() = owner_id);

create policy "Users can update their own hotels" on hotels
  for update using (auth.uid() = owner_id);

create policy "Users can delete their own hotels" on hotels
  for delete using (auth.uid() = owner_id);

-- Enable RLS on related tables and create policies
alter table staff enable row level security;
alter table rooms enable row level security;  
alter table dishes enable row level security;
alter table bills enable row level security;

-- Staff policies (users can only manage staff of their hotels)
create policy "Users can view staff of their hotels" on staff
  for select using (exists (
    select 1 from hotels where hotels.id = staff.hotel_id and hotels.owner_id = auth.uid()
  ));

create policy "Users can insert staff for their hotels" on staff
  for insert with check (exists (
    select 1 from hotels where hotels.id = staff.hotel_id and hotels.owner_id = auth.uid()
  ));

create policy "Users can update staff of their hotels" on staff
  for update using (exists (
    select 1 from hotels where hotels.id = staff.hotel_id and hotels.owner_id = auth.uid()
  ));

create policy "Users can delete staff of their hotels" on staff
  for delete using (exists (
    select 1 from hotels where hotels.id = staff.hotel_id and hotels.owner_id = auth.uid()
  ));

-- Similar policies for rooms
create policy "Users can view rooms of their hotels" on rooms
  for select using (exists (
    select 1 from hotels where hotels.id = rooms.hotel_id and hotels.owner_id = auth.uid()
  ));

create policy "Users can insert rooms for their hotels" on rooms
  for insert with check (exists (
    select 1 from hotels where hotels.id = rooms.hotel_id and hotels.owner_id = auth.uid()
  ));

create policy "Users can update rooms of their hotels" on rooms
  for update using (exists (
    select 1 from hotels where hotels.id = rooms.hotel_id and hotels.owner_id = auth.uid()
  ));

create policy "Users can delete rooms of their hotels" on rooms
  for delete using (exists (
    select 1 from hotels where hotels.id = rooms.hotel_id and hotels.owner_id = auth.uid()
  ));

-- Similar policies for dishes
create policy "Users can view dishes of their hotels" on dishes
  for select using (exists (
    select 1 from hotels where hotels.id = dishes.hotel_id and hotels.owner_id = auth.uid()
  ));

create policy "Users can insert dishes for their hotels" on dishes
  for insert with check (exists (
    select 1 from hotels where hotels.id = dishes.hotel_id and hotels.owner_id = auth.uid()
  ));

create policy "Users can update dishes of their hotels" on dishes
  for update using (exists (
    select 1 from hotels where hotels.id = dishes.hotel_id and hotels.owner_id = auth.uid()
  ));

create policy "Users can delete dishes of their hotels" on dishes
  for delete using (exists (
    select 1 from hotels where hotels.id = dishes.hotel_id and hotels.owner_id = auth.uid()
  ));

-- Similar policies for bills
create policy "Users can view bills of their hotels" on bills
  for select using (exists (
    select 1 from hotels where hotels.id = bills.hotel_id and hotels.owner_id = auth.uid()
  ));

create policy "Users can insert bills for their hotels" on bills
  for insert with check (exists (
    select 1 from hotels where hotels.id = bills.hotel_id and hotels.owner_id = auth.uid()
  ));

create policy "Users can update bills of their hotels" on bills
  for update using (exists (
    select 1 from hotels where hotels.id = bills.hotel_id and hotels.owner_id = auth.uid()
  ));

create policy "Users can delete bills of their hotels" on bills
  for delete using (exists (
    select 1 from hotels where hotels.id = bills.hotel_id and hotels.owner_id = auth.uid()
  ));