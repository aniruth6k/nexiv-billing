# Hotel Management System

A Next.js application with Supabase backend for hotel billing, staff management, and inventory tracking.

## Prerequisites

- Node.js (v18 or higher)
- pnpm
- Git
- Supabase CLI

## Installation

### 1. Install Supabase CLI

**Windows (using Scoop - Recommended):**
```bash
# Install Scoop if not already installed
iwr -useb get.scoop.sh | iex

# Install Supabase CLI
scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
scoop install supabase
```

**Alternative - PNPM (any OS):**
```bash
pnpm add -g supabase
```

### 2. Clone and Setup Project

```bash
# Clone the repository
git clone <your-repo-url>
cd <project-name>

# Install dependencies
pnpm install

# Initialize shadcn UI components
pnpm dlx shadcn-ui@latest init
```

### 3. Environment Variables

Create `.env.local` in the project root:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

Get these values from your Supabase Dashboard → Settings → API.

### 4. Supabase Setup

```bash
# Login to Supabase
supabase login

# Link to your Supabase project
supabase link --project-ref <your-project-ref>

# Push migrations to create database tables
supabase db push
```

### 5. Storage Bucket Setup

In your Supabase Dashboard:
1. Go to Storage → Create bucket
2. Name: `hotel-logos`
3. Set as Public bucket

## Running the Project

```bash
# Start development server
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
src/
├── app/                 # Next.js app router pages
│   ├── billing/        # Billing management
│   ├── dashboard/      # Main dashboard
│   ├── hotel/          # Hotel setup & auth
│   ├── settings/       # App settings
│   └── staff/          # Staff management
├── components/         # Reusable components
├── lib/               # Utilities and Supabase client
└── migrations/        # Database migration files
```

## First Time Setup

1. Navigate to `/hotel/auth` to sign up
2. Complete hotel setup at `/hotel/setup`
3. Access the dashboard at `/dashboard`

## Troubleshooting

### Authentication Issues
- Disable email confirmation in Supabase Dashboard → Auth → Settings for development
- Make sure `.env.local` has correct Supabase credentials

### Database Issues
- Ensure all migrations are applied: `supabase db push`
- Check Supabase Dashboard for any policy or RLS issues

### Component Errors
- Add missing shadcn components: `pnpm dlx shadcn-ui@latest add <component-name>`

## Available Scripts

- `pnpm dev` - Start development server
- `pnpm build` - Build for production
- `pnpm start` - Start production server
- `pnpm lint` - Run ESLint