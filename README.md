# Nexiv Billing

A comprehensive hotel billing application designed for seamless deployment on client machines with centralized maintenance support.

## 🏨 Features

- **Complete Hotel Management**: Guest billing, room management, and staff tracking
- **Integrated Authentication**: Secure login system with Supabase Auth
- **Real-time Dashboard**: Live statistics and recent billing overview
- **Food & Inventory Management**: Track consumables and manage hotel inventory
- **Staff Management**: Employee records, attendance tracking, and payroll
- **Automated Billing**: Generate receipts with GST compliance
- **Migration Support**: Database changes handled through automated migrations
- **Consistent UI**: Built entirely with shadcn/ui components

## 🛠️ Tech Stack

- **Frontend**: Next.js 14+ with TypeScript
- **UI Framework**: shadcn/ui components
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Styling**: Tailwind CSS
- **Package Manager**: pnpm
- **Deployment**: Self-hosted on client machines

## 📋 Prerequisites

- **Node.js**: Version 20.11.1 (LTS)
- **pnpm**: Latest stable version (or npm as alternative)
- **Supabase CLI**: For database migrations
- **Git**: For version control

## 🚀 Installation

### 1. Clone the Repository

```bash
git clone <repository-url>
cd nexiv-billing
```

### 2. Install Dependencies

```bash
# Using pnpm (recommended)
pnpm install

# OR using npm
npm install
```

### 3. Environment Setup

Create a `.env.local` file in the root directory:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 4. Database Setup

Initialize and run migrations:

```bash
# Initialize Supabase (if not already done)
npx supabase init

# Login to Supabase
npx supabase login

# Link to your Supabase project
npx supabase link --project-ref your-project-ref
```

### 5. Development Server

```bash
# Using pnpm (recommended)
pnpm dev

# OR using npm
npm run dev
```

The application will be available at `http://localhost:3000`

## 🗄️ Database Migrations

All database changes are handled through migrations located in `supabase/migrations/`:

```
supabase/migrations/
├── 20250808153555_init_tables.sql
├── 20250811084732_add_crash_reports_table.sql
├── 20250811095255_fix_staff_additional_info.sql
├── 20250811120000_enhanced_billing_tables.sql
├── 20250811201730_staff_enhancements.sql
├── 20250812034009_enhanced_food_management.sql
├── 20250812112819_create_inventory_items.sql
├── 20250812141915_create_room_types_table.sql
├── 20250812163102_room_types_enhancements.sql
└── 20250813140726_add_gst_number_to_hotels.sql
```

## 🏗️ Project Structure

```
src/
├── app/                    # Next.js 14 App Router
│   ├── billing/           # Billing management
│   ├── dashboard/         # Main dashboard
│   ├── hotel/            # Hotel setup & auth
│   ├── settings/         # Application settings
│   └── staff/            # Staff management
├── components/
│   ├── layout/           # Layout components
│   └── ui/               # shadcn/ui components
├── lib/                  # Utilities & configurations
└── supabase/            # Database migrations
```

## 🔧 Development Commands

```bash
# Development server
pnpm dev          # or: npm run dev

## 📱 Application Modules

### Authentication & Setup
- Hotel registration and configuration
- Secure authentication system
- Initial setup wizard

### Billing Management
- Guest check-in/check-out
- Invoice generation with GST
- Payment tracking
- Receipt printing

### Dashboard
- Real-time statistics
- Recent activity overview
- Quick access to key features

### Staff Management
- Employee records
- Attendance tracking
- Shift management

### Settings
- Room type configuration
- Inventory management
- Application settings
- Crash reporting

## 🐛 Troubleshooting

### Common Issues

1. **Node Version Mismatch**
   ```bash
   nvm use 20  # or install Node 20.11.1
   ```

2. **Package Installation Issues**
   ```bash
   # Using pnpm
   rm -rf node_modules 
   pnpm install --frozen-lockfile
   
   # Using npm
   rm -rf node_modules 
   npm ci
   ```

## 📄 License

Proprietary software for hotel management clients.

---

**Note**: This application is designed for deployment on client premises with centralized maintenance support. All database changes should be handled through proper migration files.
