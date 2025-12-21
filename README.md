Veritas v1: teacher-focused oral assessments with AI-assisted scoring.

Spine: Auth → Onboarding → Dashboard → Assessment workflow.

## Getting Started

1) Configure env

- Set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` (see `./.env.example`).
- For AI scoring, set `GOOGLE_API_KEY`.
- For image generation, you can set `OPENAI_API_KEY` (preferred) or `GOOGLE_API_KEY` + `GEMINI_IMAGE_MODEL` (if your key has access).

2) Create DB schema (Supabase)

- In Supabase SQL Editor, run `supabase/schema.sql`.

3) (Optional) Cron scoring

- Set `CRON_SECRET` and call `POST /api/cron/score-pending` with header `Authorization: Bearer <CRON_SECRET>` to score any submissions stuck in `pending`/`error`.

3) Run the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.
