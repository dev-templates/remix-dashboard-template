![Dashboard](https://github.com/user-attachments/assets/4e668840-f4a2-4aa3-a6f7-04ee87b068c4)


# remix-dashboard-template

A basic dashboard template implemented using Remix and shadcn/ui, designed for quick project startup.


## Usage

  ```sh
  pnpm dlx create-remix@latest --template dev-templates/remix-dashboard-template
  ```

## What's included

### Core Features
- **Authentication & Security**
  - Username/Password Authentication with [cookie-based sessions](https://remix.run/utils/sessions#md-createcookiesessionstorage)
  - Mandatory two-factor authentication (2FA) for all users
  - Role-based access control (RBAC) with flexible permission system

- **User Management**
  - Complete user CRUD operations (Create, Read, Update, Delete)
  - Admin capabilities: reset passwords, disable 2FA, manage user roles
  - User self-service: password change, 2FA settings

- **System Administration**
  - Configurable system settings interface
  - User role and permission management
  - Database auto-initialization for both development and production

### Tech Stack
- Development with [Vite](https://vitejs.dev)
- Database: [SQLite](https://sqlite.org) (dev) / [PostgreSQL](https://www.postgresql.org/) (production ready)
- Database ORM with [Prisma](https://prisma.io)
- [GitHub Actions](https://github.com/features/actions) for deploy on merge to production and staging environments
- Styling with [Tailwind CSS v4](https://tailwindcss.com/) and [shadcn/ui](https://ui.shadcn.com/)
- Dark mode support with [next-themes](https://github.com/pacocoursey/next-themes)
- Form validation with [React Hook Form](https://react-hook-form.com/) + [Zod](https://zod.dev/)
- Charts with [Recharts](https://recharts.org/)
- Code formatting and linting with [Biome](https://biomejs.dev)
- Static Types with [TypeScript](https://typescriptlang.org)

## Requirements

- Node.js >= 20.0.0
- pnpm (recommended) or npm

## Features Overview

### For All Users
- **Dashboard** (`/dashboard`) - Main dashboard with charts and statistics
- **Login with 2FA** (`/login`, `/two-factor`) - Secure login with mandatory two-factor authentication
- **Password Management** (`/settings/password`) - Change your password
- **Security Settings** (`/settings/security`) - Manage 2FA settings (setup, regenerate, view backup codes)

### For Administrators
- **User Management** (`/admin/users`) - Manage all users
  - Create new users with role assignment
  - Delete users
  - Reset user passwords
  - Disable user 2FA (for account recovery)
- **System Settings** (`/admin/settings`) - Configure system-wide settings

## Development

### Quick Start (Recommended)

Get started in just three steps:

1. **Install dependencies**

   ```sh
   pnpm i
   ```

2. **Configure environment variables**

   Create a `.env` file:

   ```.env
   NODE_ENV=development
   DATABASE_URL=file:./dev.db
   SESSION_SECRET=e33b3bfc-4c8c-41a3-b6fc-83a9905b90c8
   ```

3. **Start the development server**

   ```sh
   pnpm dev
   ```

   🎉 **That's it!** The database will be automatically initialized, including:
   - Auto-generate Prisma Client
   - Auto-apply database migrations
   - Auto-insert initial seed data

### How it works

The application uses **automatic database initialization**:

- **Development environment**: When running `pnpm dev`, the Vite plugin automatically checks database status and performs necessary initialization
- **Production environment**: Before running `pnpm start`, the `prestart` script automatically executes database migrations

### Default administrator account

After the first startup, you can log in with the following account:

- **Username**: `admin`
- **Password**: `admin`

⚠️ **Important**: Be sure to change the default password before deploying to production!

### Manual database operations (Optional)

If you need to manually control database operations:

```sh
# Generate Prisma Client (after modifying schema.prisma)
pnpm run generate

# Create a new migration (after modifying schema.prisma)
pnpm run migrate:create

# Deploy migrations to production
pnpm run migrate:deploy

# Reset database (⚠️ deletes all data)
pnpm run db:reset

# Re-insert seed data
pnpm run seed

# Skip automatic initialization
SKIP_DB_INIT=true pnpm dev
```

### Code quality tools

```sh
# Format and lint code (auto-fix)
pnpm run lint

# Format code only
pnpm run format

# Check code quality (no auto-fix)
pnpm run check

# Type checking
pnpm run typecheck
```

## Environment variables

### Required variables

- `DATABASE_URL` - Prisma database connection string
  - Development (SQLite): `file:./dev.db`
  - Production (PostgreSQL): `postgresql://user:password@localhost:5432/mydb`
  - [More connection format documentation](https://www.prisma.io/docs/orm/reference/connection-urls)
  - **Note**: To switch to PostgreSQL, update the `provider` in `prisma/schema.prisma` from `sqlite` to `postgresql`

- `SESSION_SECRET` - Session encryption secret key
  - Generate using a random password generator: [Password Generator](https://ipecho.io/tools/password-generator)

### Optional variables

- `NODE_ENV` - Runtime environment (`development` / `production`)
  - Default: `development`

- `SKIP_DB_INIT` - Skip automatic database initialization
  - Set to `true` to disable automatic initialization
  - Useful for debugging or special scenarios

- `SKIP_SEED` - Skip seed data insertion
  - Set to `true` to skip inserting initial data
  - **Strongly recommended to set to `true` in production**

### Production environment configuration example

```.env
NODE_ENV=production
DATABASE_URL=postgresql://user:password@db.example.com:5432/production_db
SESSION_SECRET=your-very-secure-random-secret-key
SKIP_SEED=true
```

## Deployment

### Docker

#### Quick start with Docker Compose (Recommended)

The easiest way to deploy with Docker:

```sh
# 1. Create .env file from example
cp .env.example .env

# 2. Generate a secure session secret
echo "SESSION_SECRET=$(openssl rand -hex 32)" >> .env

# 3. Start the service
docker compose up -d

# 4. View logs
docker compose logs -f app

# 5. Stop the service
docker compose down
```

The application will be available at http://localhost:3000

**Using PostgreSQL with Docker Compose:**

1. **Update database provider in schema**:

   Edit `prisma/schema.prisma`:
   ```prisma
   datasource db {
     provider = "postgresql"  // Change from "sqlite" to "postgresql"
     url      = env("DATABASE_URL")
   }
   ```

2. **Update database URL in .env**:
   ```
   DATABASE_URL=postgresql://remix:remix_password@postgres:5432/remix_dashboard
   ```

3. **Uncomment PostgreSQL service** in `docker-compose.yml`

4. **Restart services**:
   ```sh
   docker compose down
   docker compose up -d --build
   ```

   **Note**: Prisma requires the provider to be hardcoded in schema.prisma and cannot read it from environment variables. This is a design limitation for type safety and compile-time code generation.

#### Build and run with Docker commands

If you prefer to use Docker commands directly:

```sh
# 1. Build the image
docker build -t remix-dashboard .

# 2. Run the container (SQLite)
docker run -d \
  --name remix-dashboard \
  -p 3000:3000 \
  -e SESSION_SECRET="your-secret-key-here" \
  -e SKIP_SEED=true \
  -v remix-data:/app/data \
  remix-dashboard

# 3. View logs
docker logs -f remix-dashboard

# 4. Stop and remove the container
docker stop remix-dashboard
docker rm remix-dashboard
```

**Using PostgreSQL:**

First, update `prisma/schema.prisma` provider to `postgresql`, then:

```sh
# 1. Start PostgreSQL
docker run -d \
  --name postgres \
  -e POSTGRES_USER=remix \
  -e POSTGRES_PASSWORD=secure_password \
  -e POSTGRES_DB=remix_dashboard \
  -v postgres-data:/var/lib/postgresql/data \
  postgres:16-alpine

# 2. Rebuild the app with PostgreSQL provider
docker build -t remix-dashboard .

# 3. Run the app
docker run -d \
  --name remix-dashboard \
  --link postgres:postgres \
  -p 3000:3000 \
  -e DATABASE_URL="postgresql://remix:secure_password@postgres:5432/remix_dashboard" \
  -e SESSION_SECRET="your-secret-key-here" \
  -e SKIP_SEED=true \
  remix-dashboard
```

### Environment variables for Docker

When deploying with Docker, set these environment variables:

- `SESSION_SECRET` - **Required**. Generate with: `openssl rand -hex 32`
- `DATABASE_URL` - Database connection string (default: `file:./data/production.db`)
- `SKIP_SEED` - Set to `true` to skip seed data in production
- `PORT` - Port to listen on (default: `3000`)

## Troubleshooting

### Database connection failed

If you see "Unable to connect to database" error:

1. Check that the `.env` file exists and is configured correctly
2. Confirm that the `DATABASE_URL` format is correct
3. If using PostgreSQL, confirm the database service is running
4. Check network connection and firewall settings

### Migration failed

If database migration fails:

```sh
# Check migration status
pnpm exec prisma migrate status

# Reset database (⚠️ will delete all data)
pnpm run db:reset

# Manually deploy migrations
pnpm run migrate:deploy
```

### Disable automatic initialization

If you need complete control over the database initialization process:

```sh
# Development environment
SKIP_DB_INIT=true pnpm dev

# Production environment
SKIP_SEED=true pnpm start
```
