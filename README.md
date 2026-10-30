# KelvJessia Transport v2

New Next.js + PostgreSQL foundation for the KelvJessia booking platform. It uses only fictional demonstration routes and fares. No live payment is enabled.

## Local setup

1. Copy `.env.example` to `.env` and replace the placeholders.
2. Install packages: `npm install`.
3. Start PostgreSQL with Docker (when Docker Desktop is available): `docker compose up -d`.
4. Generate the Prisma client and apply the initial migration:
   ```powershell
   npm run db:generate
   npm run db:migrate -- --name init
   npm run db:seed
   ```
5. Start the app: `npm run dev`.

If Docker is unavailable, install PostgreSQL 16 locally, create the `kelvjessia` database and user matching `DATABASE_URL`, then continue from step 4.

## Included foundation

- Responsive customer pages: homepage, trip browsing, booking flow and enquiries.
- PostgreSQL Prisma domain schema, indexes, foreign keys and unique seat assignment.
- Transactional reservation endpoint with a server-generated 15-minute expiry.
- Expiry command: `npm run reservations:expire` (schedule this with a worker/cron in staging).
- Health endpoint: `GET /api/health` reports a degraded service while the database is offline.
- Rate-limited, server-validated enquiry endpoint: `POST /api/enquiries`.
- Admin and driver dashboard starting points, intentionally access-restricted until session auth is completed.

## Security and payment implementation notes

Paystack test keys belong only in `.env`; live payment keys are not supported by this starter. A production payment module must initialize Paystack server-side, verify the callback amount/currency/reference server-side, validate signed webhooks, and process each provider event idempotently. Booking lookup requires a contact-delivered one-time code before details are returned.

## Current validation status

The code and schema have been written, but package installation, Prisma generation, migrations, database integration testing and a production-ready authentication/Paystack implementation still require a runnable local database and configured secrets. Do not accept customer bookings yet.
