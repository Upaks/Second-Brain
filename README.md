# AI Second Brain

Your personal knowledge operating system built with Next.js 16. Capture anything (text, links, files, audio), let AI distill the signal, resurface the right ideas with search, reminders, and flashcards, then share curated collections with others.

![AI Second Brain hero](public/placeholder.jpg)

## Feature Highlights

- **Frictionless capture** – paste text, drop documents, upload audio/images, or add URLs. The ingestion pipeline cleans HTML, extracts PDF/DOCX/PPTX text, runs OCR/ASR, and stores source files in Supabase.
- **Autonomous insight engine** – OpenAI/OpenRouter summarizes captures into structured insights, tags them, and stores embeddings in Postgres + pgvector for semantic search.
- **Intelligent retrieval** – dashboard lists, semantic search, contextual reminders, and spaced-repetition flashcards keep ideas alive. Decks can be exported or shared via signed tokens.
- **Team-ready organization** – collections, tags, and shareable decks make it easy to organize research or study material.
- **Production-ready plumbing** – NextAuth credential auth, Prisma ORM, Inngest background jobs, cron-driven reminders, and Vercel-friendly API routes out of the box.

## Tech Stack

- **Frontend**: Next.js 16 App Router, React 19, Server Actions/Components, Tailwind, Radix UI, Lucide icons.
- **Backend**: Next.js API routes, Prisma, PostgreSQL 15+ with pgvector, Supabase Storage, Inngest for background work.
- **AI**: OpenAI / OpenRouter APIs for embeddings, summarization, OCR, and audio transcription.
- **Auth & security**: NextAuth (credentials), bcrypt hashing, JWT sessions, share tokens with optional secrets.

## Project Structure

```
app/                # App Router pages, dashboards, auth, share views
components/         # UI primitives + feature clients (capture, insights, flashcards, etc.)
lib/                # AI helpers, ingest pipeline, search, auth/session, storage
app/api/            # REST-style routes for ingest, reminders, flashcards, auth, etc.
inngest/functions/  # Background jobs (ingestion pipeline)
prisma/             # Data models (pgvector-enabled)
public/             # Icons & marketing assets
```

## Getting Started

### Prerequisites

- Node.js 18.18+ (Next.js 16 requirement)
- `pnpm` 9+
- PostgreSQL 15+ with the `pgvector` extension (`CREATE EXTENSION IF NOT EXISTS vector`)
- Supabase project (for file storage) or another S3-compatible target that mimics the Supabase APIs
- OpenAI API key or OpenRouter key (OpenRouter lets you swap in non-OpenAI models)

### 1. Clone & install

```bash
git clone https://github.com/<you>/<repo>.git ai-second-brain
cd ai-second-brain
pnpm install
```

### 2. Configure environment

Create `.env.local` (Vercel-style) or `.env` with at least:

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` | Postgres connection string with pgvector enabled |
| `DIRECT_DATABASE_URL` | (Optional) Direct Postgres URL for Prisma migrations |
| `NEXTAUTH_SECRET` | 32+ char secret for NextAuth JWTs |
| `NEXTAUTH_URL` | Base URL (needed for password reset links) |
| `OPENAI_API_KEY` or `OPENROUTER_API_KEY` | AI provider credentials |
| `OPENROUTER_BASE_URL`, `OPENROUTER_SITE`, `OPENROUTER_APP_NAME` | (Optional) customize OpenRouter requests |
| `OPENROUTER_SUMMARY_MODEL`, `OPENROUTER_EMBED_MODEL`, `OPENROUTER_OCR_MODEL` | (Optional) override default models |
| `SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY` | Used for file uploads + downloads |
| `STORAGE_BUCKET` | Supabase bucket name for captured files |
| `CRON_SECRET` | Bearer token used by the reminders cron route |
| `FLASHCARDS_SHARE_SECRET` | (Optional) overrides `NEXTAUTH_SECRET` for signed share links |
| `INNGEST_APP_ID` | (Optional) custom label for Inngest |
| `SEARCH_LIMIT`, `RELATED_LIMIT`, `VECTOR_DIMENSION` | (Optional) tuning knobs for search |

Feel free to add other provider keys (Resend, etc.) as you extend notifications.

### 3. Prepare the database

```bash
pnpm exec prisma migrate deploy   # or migrate dev --name init
pnpm exec prisma generate
```

Use `pnpm exec prisma studio` if you want a quick GUI for inspecting tables.

### 4. Run the app

```bash
pnpm dev
```

Visit `http://localhost:3000`, sign up with email/password, and start capturing.

### 5. Background ingestion worker (required for heavy uploads)

The capture form writes ingest items immediately; AI processing happens through Inngest.

```bash
pnpm inngest:dev
```

This mirrors your production Inngest deployment and runs the `ingest/process` function locally.

### 6. Cron reminders

Expose `POST /api/cron/reminders` to a scheduler (Vercel Cron, GitHub Actions, Zapier, etc.) and send a `Bearer ${CRON_SECRET}` header. The route finds due reminders, marks them as sent, and is ready for plugging in your email/SMS provider.

## Common Tasks

- **Lint**: `pnpm lint`
- **Type-check**: `pnpm tsc --noEmit`
- **Build**: `pnpm build`
- **Start (production)**: `pnpm start`

## Deployment Notes

- Vercel is the default target (includes `vercel.json`). Ensure the production Postgres instance has pgvector and that Supabase credentials are production-ready.
- In production you’ll need an Inngest environment or any background job runner capable of sending `ingest/process` events.
- Wire up the reminders endpoint to Vercel Cron or another scheduler; swap the placeholder console logging with your email/SMS provider of choice.

## Roadmap Ideas

- OAuth providers (Google, GitHub) via NextAuth
- Collaborative collections and shared workspaces
- Mobile capture app / browser extension
- Push/email delivery for reminders and spaced repetition

---

Questions or suggestions? Open an issue or start a discussion — contributions are welcome!

