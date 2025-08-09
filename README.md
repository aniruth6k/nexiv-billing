Nice — I’ll give you a single, copy-pasteable **README** that:

* Shows the **current file tree** (as you asked)
* Lists **exact commands** to set up the project on a Windows laptop (including supabase CLI install options)
* Shows the SQL (migrations + RLS + storage policy) to include in your repo so a fresh install will create the right schema and policies
* Shows required `.env.local` values and the `supabaseClient` snippet
* Includes **troubleshooting** notes for the common RLS / session problems you hit
* Calls out the exact commands you already ran

I checked the official docs for the CLI/migrations/buckets and the shadcn CLI so these commands are aligned with the current tooling. ([GitHub][1], [Supabase][2], [Shadcn UI][3])

---

# Nexiv-Bill — Setup / README

## Project file tree (current / recommended)

```
src/
│
├── app/
│   ├── globals.css
│   ├── layout.tsx
│   ├── page.tsx                # Home -> redirects to /hotel (server checks)
│   ├── hotel/
│   │   ├── page.tsx            # /hotel route (server redirect based on auth/hotel)
│   │   ├── setup/
│   │   │   └── page.tsx        # /hotel/setup (hotel setup form)
│   │   └── auth/
│   │       └── page.tsx        # /hotel/auth (sign up / sign in)
│   ├── staff/
│   │   ├── page.tsx
│   │   └── add.tsx
│   ├── billing/
│   │   ├── page.tsx
│   │   └── print.tsx
│   ├── dashboard/
│   │   ├── page.tsx
│   │   └── components/
│   │       ├── Sidebar.tsx
│   │       ├── Header.tsx
│   │       ├── StatsCards.tsx
│   │       └── RecentBills.tsx
│   └── api/
│
├── components/
│   ├── ui/                     # shadcn-generated components (avatar, card, table, button, input, etc.)
│   ├── hotel/
│   ├── staff/
│   ├── billing/
│   └── shared/
│
├── lib/
│   ├── supabaseClient.ts       # Supabase client (persistSession enabled)
│   ├── hotel.ts
│   ├── staff.ts
│   ├── billing.ts
│   └── utils.ts
│
├── services/
├── types/
├── public/
│
supabase/
│   ├── migrations/             # (created by supabase migration new ...)
│   ├── schema.sql              # canonical schema file (keeps it easy to bootstrap)
│   └── config.toml
│
.env.example
package.json
README.md
```

---

## What you (or another dev) must install on a fresh Windows machine

> Short summary: install Node (LTS), Git, optionally WSL, then install the Supabase CLI (recommended via Scoop) or download the binary. Install `shadcn-ui` tools when needed.

### 1) System prerequisites

* Install **Node.js LTS** (v18/20) from [https://nodejs.org](https://nodejs.org) or via nvm-windows.
* Install **Git**.
* (Optional but recommended) Install **WSL2** if you prefer a unix-like environment on Windows.

### 2) Install Supabase CLI (Windows recommended options)

**Option A — using Scoop (recommended on Windows)**
Open PowerShell (as a normal user) and run:

```powershell
# if you don't have Scoop:
iwr -useb get.scoop.sh | iex

# add supabase scoop bucket and install
scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
scoop install supabase
```

This gives you a `supabase` global command. (Docs mention Scoop as Windows install method.) ([GitHub][1])

**Option B — download from GitHub Releases (manual)**

* Go to Supabase CLI releases and download `supabase_windows_amd64.exe`, place it in `C:\Program Files\SupabaseCLI\` and add that directory to your `%PATH%`. (Releases: GitHub releases page). ([GitHub][4])

**Option C — per-project npm dev dependency (works but no global binary)**
If you prefer not to install globally:

```bash
npm install --save-dev supabase
# use via npx:
npx supabase login
```

Any of these approaches are valid — pick whichever fits your environment.

---

## Project bootstrap steps (clone + install + init)

Open PowerShell / WSL / Git Bash and run:

```bash
# 1. Clone repo
git clone <your-repo-url> nexiv-bill
cd nexiv-bill

# 2. Install node deps
npm install

# 3. Initialize shadcn UI (installs shadcn dependencies + CN utils)
npx shadcn-ui@latest init
# then add components you need (example):
npx shadcn-ui@latest add avatar card table
```

(The shadcn CLI helps scaffold UI components into `src/components/ui`). ([Shadcn UI][3])

---

## Supabase project setup (Dashboard + CLI)

**Assumption**: you already created a Supabase project in the Dashboard (app.supabase.com) — if not, create one and note the **Project Ref** and **API keys**.

```bash
# 4. Login to Supabase (opens browser to authorize)
# If installed globally:
supabase login
# If dev dependency:
npx supabase login
```

**Link local project to remote Supabase project** (replace `<project_ref>` with your project reference ID):

```bash
# linking your local supabase folder to the remote project
npx supabase link --project-ref <project_ref>
# or, if global:
supabase link --project-ref <project_ref>
```

**Create migrations & push** (two ways — either migrations or direct push)

Recommended (migration-based — safer, version controlled):

```bash
# create a new migration (creates file in supabase/migrations/)
npx supabase migration new init_tables

# add SQL inside the generated .sql file (or drop in supabase/schema.sql as we keep in repo)
# then apply / push to remote:
npx supabase db push
```

Alternative (push a single schema file or push local migrations): `npx supabase db push`. The CLI reference explains `db push` behavior. ([Supabase][5])

---

## Storage bucket (hotel logos)

**Recommended**: create bucket from Supabase Dashboard → Storage → New bucket → name: `hotel-logos` → public: true (or private and generate signed URLs). You can also create programmatically via client JS:

```js
await supabase.storage.createBucket('hotel-logos', { public: true })
```

Creating buckets in the Dashboard is the simplest for beginners. ([Supabase][6])

---

## Important SQL to include (schema + RLS + storage policies)

Add this to `supabase/schema.sql` or put into a migration file. I recommend keeping the schema + policies version-controlled in `supabase/` so a new setup can `npx supabase db push` and get identical tables & policies.

> **Only run once**; policies that already exist will raise duplicate errors — either run `drop policy if exists` lines or skip recreate steps.

```sql
-- supabase/schema.sql

-- Hotels table (with owner_id referencing auth.users)
create table if not exists hotels (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references auth.users(id),
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
  attendance jsonb default '[]'::jsonb,
  created_at timestamptz default now()
);

-- Rooms
create table if not exists rooms (
  id uuid primary key default gen_random_uuid(),
  hotel_id uuid references hotels(id) on delete cascade,
  room_number text not null,
  type text,
  price numeric,
  created_at timestamptz default now()
);

-- Dishes
create table if not exists dishes (
  id uuid primary key default gen_random_uuid(),
  hotel_id uuid references hotels(id) on delete cascade,
  name text not null,
  price numeric,
  created_at timestamptz default now()
);

-- Bills
create table if not exists bills (
  id uuid primary key default gen_random_uuid(),
  hotel_id uuid references hotels(id) on delete cascade,
  items jsonb not null,
  total numeric,
  created_at timestamptz default now()
);

-- Enable RLS on hotels and set policies (drop first if exist to avoid duplicate errors)
alter table hotels enable row level security;

drop policy if exists "Allow insert for authenticated users" on hotels;
drop policy if exists "Allow update for authenticated users" on hotels;
drop policy if exists "Allow select for authenticated users" on hotels;

create policy "Allow insert for authenticated users"
  on hotels for insert
  to authenticated
  with check (auth.uid() = owner_id);

create policy "Allow select for authenticated users"
  on hotels for select
  to authenticated
  using (auth.uid() = owner_id);

create policy "Allow update for authenticated users"
  on hotels for update
  to authenticated
  using (auth.uid() = owner_id)
  with check (auth.uid() = owner_id);

-- Storage policies for the bucket 'hotel-logos' (drop and recreate)
drop policy if exists "Public read access" on storage.objects;
drop policy if exists "Allow upload for authenticated users" on storage.objects;
drop policy if exists "Allow update for authenticated users" on storage.objects;

create policy "Public read access"
  on storage.objects
  for select
  to public
  using (bucket_id = 'hotel-logos');

create policy "Allow upload for authenticated users"
  on storage.objects
  for insert
  to authenticated
  with check (bucket_id = 'hotel-logos');

create policy "Allow update for authenticated users"
  on storage.objects
  for update
  to authenticated
  using (bucket_id = 'hotel-logos')
  with check (bucket_id = 'hotel-logos');
```

**Notes:**

* Policies use `auth.uid()` / `auth` helpers. `owner_id` maps the row to `auth.users.id`. This is why every insert/upsert from the client must include `owner_id: user.id`. (We handled this in the frontend code earlier.)
* If you already added `owner_id` or policies earlier, skip the ADD/CREATE steps or use `IF NOT EXISTS` or `DROP POLICY IF EXISTS` as above.

---

## .env.local (example)

Create `/.env.local` in project root (do **not** commit):

```
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-public-key>
# (optional for admin scripts)
SUPABASE_SERVICE_ROLE_KEY=<service-role-key>
```

Get the values from Supabase Dashboard → Settings → API. Keep keys secret.

---

## `src/lib/supabaseClient.ts` (recommended)

Use this file so sessions persist (fixes the repeated sign-in problem):

```ts
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});
```

This ensures the browser persists the session and auto-refreshes tokens.

---

## Commands you already ran (so you can copy them into README)

These are the commands you ran earlier and should be in README’s history for reproducibility:

```bash
npm install supabase --save-dev
# tried but global install error; recommended alternatives in this README
# linked your project (example)
npx supabase link --project-ref cbgpxqackulaxxubbwgk

# (created a migration)
npx supabase migration new init_tables

# pushed changes
npx supabase db push
```

---

## Run the app (dev)

```bash
# after installing deps and linking supabase
npm run dev
# open http://localhost:3000
```

If you want to run a **local supabase stack** for local dev (optional):

```bash
supabase init
supabase start
```

(you’ll need Docker). ([Supabase][7])

---

## shadcn notes — generate UI components

If you used shadcn UI initially with `npx shadcn-ui init`, add missing components as needed:

```bash
npx shadcn-ui@latest add avatar card table
# add others later as required (button, input, label, etc.)
```

The CLI scaffolds `src/components/ui/*` files that your dashboard imports. ([Shadcn UI][3])

---

## Troubleshooting — things you hit earlier (quick checklist)

### 1) `StorageApiError: new row violates row-level security policy`

* Cause: RLS prevented the insert because `owner_id` was missing or policy didn’t allow the user.
* Fix:

  * Make sure `owner_id` column exists in `hotels` and is referenced in policies.
  * Include `owner_id: user.id` when inserting/upserting from the client.
  * Ensure user session exists (see next notes).

### 2) You keep having to sign in or “Email not confirmed”

* For dev, you can **disable email confirmations** in Supabase Dashboard → Auth → Settings → Confirm email (turn off) so sign-up immediately logs in for testing.
* Better: configure SMTP in Supabase (so confirm emails are delivered) and confirm the verification link in your email.
* Make sure your `supabaseClient` is created with `persistSession: true` (above) to persist session between reloads.

### 3) Policies already exist / duplicate errors

* Use `DROP POLICY IF EXISTS "PolicyName" ON table;` before re-creating policies to avoid `policy already exists` errors.

### 4) Supabase CLI not found after `npm i supabase --save-dev`

* If you installed as a local dev dep, use `npx supabase ...` (every command prefixed with npx).
* If you want a global `supabase` command, use Scoop on Windows or download and add binary to PATH. ([GitHub][1])

### 5) Dashboard “Element type is invalid” (empty or missing components)

* This happens when you `import` a file that doesn’t export a React component (e.g., empty file).
* Fix: generate the shadcn components or create small exported components for `Sidebar`, `Header`, `StatsCards`, `RecentBills`. You already added them — keep them in `src/app/dashboard/components`.

---

## Ready-to-copy snippets (SQL + supabaseClient + env example)

* `supabase/schema.sql` — copy the SQL block above into it.
* `src/lib/supabaseClient.ts` — copy the TS snippet above.
* `.env.local` — copy the env sample above.

---

## Next recommended steps (small TODO list)

1. Confirm SMTP / email confirmation preference in Supabase (dev: disable confirm).
2. Run `npx supabase db push` (or create migration + push) to ensure schema/policies exist on remote.
3. Create `hotel-logos` bucket in Dashboard (or via script).
4. Start Next dev: `npm run dev` and test full sign up → confirm → setup → dashboard flow.
5. Wire dashboard components to fetch live data (I can do this next — e.g., fetch recent bills, rooms count, staff count).

---

## Helpful links (official docs)

* Supabase CLI install & usage (migrations, local dev): docs & CLI repo. ([GitHub][1], [Supabase][5])
* Database migrations guide. ([Supabase][2])
* Creating buckets & storage quickstart. ([Supabase][6])
* shadcn CLI docs. ([Shadcn UI][3])

---

If you want, I’ll **now**:

1. Generate the final SQL migration file content and a `supabase/migrations/<timestamp>_init_tables.sql` file content for you to copy into repo; **or**
2. Wire the Dashboard components to pull real data from Supabase (stats & recent bills) next.

Which of the two would you like me to do now?

[1]: https://github.com/supabase/cli?utm_source=chatgpt.com "Supabase CLI - GitHub"
[2]: https://supabase.com/docs/guides/deployment/database-migrations?utm_source=chatgpt.com "Database Migrations | Supabase Docs"
[3]: https://ui.shadcn.com/docs/cli?utm_source=chatgpt.com "init - Shadcn UI"
[4]: https://github.com/supabase/cli/releases?utm_source=chatgpt.com "Releases · supabase/cli - GitHub"
[5]: https://supabase.com/docs/reference/cli/introduction?utm_source=chatgpt.com "CLI Reference | Supabase Docs"
[6]: https://supabase.com/docs/guides/storage/buckets/creating-buckets?utm_source=chatgpt.com "Creating Buckets | Supabase Docs"
[7]: https://supabase.com/docs/guides/local-development/cli/getting-started?utm_source=chatgpt.com "Supabase CLI"
