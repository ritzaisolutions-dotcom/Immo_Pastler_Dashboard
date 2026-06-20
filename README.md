# Pastler Dashboard

Internal tool for **Immobilienverwaltung Pastler UG** — todo management linked to Mieter and Inserate.

## Stack

- Next.js 16 (App Router) + TypeScript + Tailwind CSS v4
- Supabase (Frankfurt `eu-central-1`) + `@supabase/ssr`
- n8n email ingestion → Mistral → Todos

## Quick Start

```bash
npm install
cp .env.example .env.local   # fill in Supabase credentials
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) → redirects to `/dashboard` (login required).

## Supabase Setup

See [`supabase/README.md`](supabase/README.md):

1. Create project in **eu-central-1** (Frankfurt)
2. Run `supabase/schema.sql` then `supabase/seed.sql`
3. Create Mitarbeiter auth user with `app_metadata: {"role": "mitarbeiter"}`

> **Note:** If your Supabase org has reached the free-tier project limit, pause an unused project first or upgrade before creating the Pastler project.

## n8n Workflow

See [`n8n/README.md`](n8n/README.md) for the 9-node IMAP → Mistral → Todo pipeline.

## Deployment

See [`DEPLOYMENT.md`](DEPLOYMENT.md) for Vercel setup and security headers.

## Commands

```bash
npm run dev
npm run build
npm run type-check
npm audit --audit-level=high
```

## Spec Documents

- [`IMPLEMENTATION_PLAN_Dashboard.md`](IMPLEMENTATION_PLAN_Dashboard.md)
- [`CLAUDE_Dashboard.md`](CLAUDE_Dashboard.md)
- [`BRAND_Pastler.md`](BRAND_Pastler.md)
