-- Hotels table
create table if not exists hotels (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  address text,
  logo_url text,
  services jsonb default '[]'::jsonb,
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
  items jsonb not null, -- store array of {name, qty, price}
  total numeric,
  created_at timestamptz default now()
);
