![Dashboard](https://github.com/user-attachments/assets/4e668840-f4a2-4aa3-a6f7-04ee87b068c4)


# remix-dashboard-template

A basic dashboard template implemented using Remix and shadcn/ui, designed for quick project startup.


## Usage

  ```sh
  pnpm dlx create-remix@latest --template dev-templates/remix-dashboard-template
  ```

## What's included

- Development with [Vite](https://vitejs.dev)
- Production-ready [SQLite Database](https://sqlite.org)
- [GitHub Actions](https://github.com/features/actions) for deploy on merge to production and staging environments
- Username/Password Authentication with [cookie-based sessions](https://remix.run/utils/sessions#md-createcookiesessionstorage)
- All users required to use two-factor authentication (2FA) for login, ensuring a high level of security
- Database ORM with [Prisma](https://prisma.io)
- Styling with [Tailwind](https://tailwindcss.com/) and [shadcn/ui](https://ui.shadcn.com/)
- Code formatting with [Prettier](https://prettier.io)
- Linting with [ESLint](https://eslint.org)
- Static Types with [TypeScript](https://typescriptlang.org)

## Development

- Initial setup:

  ```sh
  pnpm i
  ```

- Setup `.env`

  ```.env
  NODE_ENV=development
  DATABASE_URL=file:./dev.db
  SESSION_SECRET=e33b3bfc-4c8c-41a3-b6fc-83a9905b90c8
  ```

- Initial prisma generate：

  ```sh
  pnpm run generate
  ```

- Migrate and Seed Database:

  ```sh
  pnpm run migrate
  pnpm run seed
  ```

- Start dev server:

  ```sh
  pnpm dev
  ```

This starts your app in development mode, rebuilding assets on file changes.

The database seed script create a new admin user you can use to get started:

- Username: `admin`
- Password: `admin`

## Environment variables

- `NODE_ENV` **production** / **development**
- `DATABASE_URL` Prisma's Connection URL format description. [Connection URLs](https://www.prisma.io/docs/orm/reference/connection-urls)
- `SESSION_SECRET` Secrets used for SESSION encryption. use random password generator to. [Password Generator](https://ipecho.io/tools/password-generator)