This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

## Local Development (SQLite fallback)

Production targets MySQL 8, but you can run the app locally with no external
services using a generated SQLite schema. Redis and MinIO are optional: an empty
`REDIS_URL` runs jobs inline, and uploads are not used in Milestone 1.

```bash
# 1. Create the SQLite schema (mirrors prisma/schema.prisma) and push it
npm run db:sqlite

# 2. Seed demo data
npm run db:seed

# 3. Start the dev server
npm run dev
```

Demo accounts:

- Admin — `admin@platform.local` / `admin123456`
- Creator — `creator@platform.local` / `creator123456`

Set `DATABASE_URL="file:./dev.db"` and `REDIS_URL=""` in `.env`. `files`:

- `prisma/schema.sqlite.prisma` and `prisma/dev.db` are generated and gitignored.
- `npm run db:sqlite` runs `scripts/make-sqlite-schema.mjs`, which transforms the
  canonical MySQL schema (switches the provider to `sqlite` and strips MySQL-only
  `@db.*` native type attributes). Re-run it whenever `prisma/schema.prisma` changes.

To go back to MySQL, set `DATABASE_URL` to the MySQL URL and run
`npx prisma generate` (regenerates the client for the MySQL schema).

## Mock media material (images & video)

The `mock` image/video provider composites real "abstract background" photos from
Unsplash instead of synthetic gradient posters. The photos are bundled in
`public/seed/unsplash/` so generation works fully offline with no API key.

```bash
# Download/refresh the bundled photos (skips existing files) + CREDITS.json
npm run assets:fetch

# Rebuild existing generated image/video media from the new material
npm run media:regen                 # generations + studio creations
npm run media:regen -- --generations-only
npm run media:regen -- --creations-only
```

- Set `MOCK_MEDIA_SOURCE="gradient"` in `.env` to fall back to the SVG posters
  (also the automatic fallback if the bundle folder is missing).
- Attribution/licensing: see `public/seed/unsplash/CREDITS.json` (Unsplash License).

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
