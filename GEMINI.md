# Project Gemini Context: actk

## Project Overview
`actk` is a time-tracking and clocking management system built with Next.js 16 (React 19) and Prisma. It allows users to clock in and out of specific departments, and includes an interface for generating monthly reports and exporting data to Excel.

### Core Technologies
- **Framework:** Next.js (App Router)
- **Language:** TypeScript
- **Database/ORM:** Prisma with PostgreSQL (via `@prisma/adapter-pg`)
- **Authentication:** Custom JWT-based authentication (cookies) with Supabase integration.
- **Styling:** Tailwind CSS with Shadcn UI components.
- **Utility Libraries:** Zod (validation), Dayjs (date handling), ExcelJS (reports), Lucide React (icons).

## Architecture
- **Frontend:** Server and Client components using Next.js App Router. UI components are located in `components/ui` (Shadcn).
- **Backend:** Next.js Route Handlers (`app/api/*`) for data fetching and mutations.
- **Database:** Managed via Prisma. The schema is defined in `prisma/schema.prisma`. Note that the Prisma client is generated into `generated/prisma` instead of the default `node_modules`.
- **Auth:** Helpers in `lib/auth.ts` resolve the current user from JWT cookies or development headers.

## Key Directories
- `app/`: Application routes and API endpoints.
  - `admin/`: Admin-only pages (reports, exports).
  - `dashboard/`: User dashboard (clocking).
  - `api/`: Backend API handlers.
- `components/`: Reusable React components.
- `lib/`: Core logic, including database client (`prisma.ts`), auth (`auth.ts`), and validation schemas.
- `prisma/`: Database schema and seed scripts.
- `generated/`: Generated Prisma client files.

## Development Workflows

### Building and Running
- **Development:** `npm run dev`
- **Build:** `npm run build`
- **Start Production:** `npm run start`
- **Linting:** `npm run lint`

### Database Management
- **Generate Client:** `npx prisma generate` (automatically runs after `npm install`).
- **Schema Updates:** Use `npx prisma db push` for prototyping or standard Prisma migration commands for production.
- **Seeding:** `node prisma/seed.js` (if applicable).

### Authentication
- Authentication is handled via a `token` cookie.
- Use `getCurrentUser(req)` from `@/lib/auth` in API routes to get the authenticated user.
- Use `requireAdmin(req)` to restrict access to admin users.

## Conventions
- **Validation:** Always use Zod schemas (found in `lib/validation/`) for validating API request bodies.
- **Date Handling:** Use `dayjs` for all date manipulations to ensure consistency, especially with UTC conversions.
- **UI Components:** Prefer using existing Shadcn components from `components/ui`.
- **Prisma Imports:** Always import the prisma client from `@/lib/prisma` to ensure the singleton instance is used.
