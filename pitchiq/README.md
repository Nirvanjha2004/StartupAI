# PitchIQ

AI-powered cold outreach. Describe your target companies — PitchIQ researches them, finds decision makers, and writes personalized emails. Automatically.

---

## What it does

You type something like:

> *"Find 5 AI infrastructure startups that raised in 2024 and write cold emails to their CTOs"*

PitchIQ spins up a multi-agent pipeline that:

1. **Plans** — breaks the task into agent steps
2. **Researches** — runs targeted web searches via Tavily
3. **Enriches** — finds decision maker names and context (concurrent searches)
4. **Writes** — generates personalized cold emails for every company
5. **Critiques** — scores the output quality (0–10) and gives feedback

Everything streams live to the UI via SSE. Results include copy-ready emails, a quality score, cost breakdown, and per-agent latency.

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                     Next.js Frontend                     │
│  Home (task runner) · Dashboard · Results               │
└────────────────────────┬────────────────────────────────┘
                         │ HTTP + SSE
┌────────────────────────▼────────────────────────────────┐
│                    FastAPI Backend                        │
│                                                          │
│  POST /api/v1/task          ← start pipeline            │
│  GET  /api/v1/task/:id/stream ← SSE live events         │
│  GET  /api/v1/task/:id      ← fetch final result        │
│  GET  /api/v1/dashboard/*   ← stats + history           │
│                                                          │
│  ┌─────────────────────────────────────────────────┐    │
│  │              Agent Orchestrator                  │    │
│  │  Planner → Researcher → Enricher → Writer        │    │
│  │                                    ↓             │    │
│  │                                  Critic          │    │
│  └──────────────────┬──────────────────────────────┘    │
│                     │                                    │
│  ┌──────────────────▼──────────────────────────────┐    │
│  │           LLM Inference Gateway                  │    │
│  │  free  → single-pass Groq + critic               │    │
│  │  premium → iterative Groq/Claude (max 3 rounds)  │    │
│  │  agent → direct Groq, no critic, no cache        │    │
│  └──────────────────┬──────────────────────────────┘    │
│                     │                                    │
│  ┌──────────────────▼──────────────────────────────┐    │
│  │  Semantic Cache (pgvector cosine sim > 0.92)     │    │
│  └─────────────────────────────────────────────────┘    │
└──────────────────────────────────────────────────────────┘
         │                              │
   Supabase (Postgres + pgvector)   Upstash (Redis)
   · prompt_cache                   · SSE event queue
   · agent_tasks                    · rate limiting
   · token_usage
```

### Tier routing

| Tier | Strategy | Model | Critic loop |
|------|----------|-------|-------------|
| `free` | single-pass | `llama-3.1-8b-instant` | 1× (score shown, doesn't gate) |
| `premium` | iterative | `llama-3.1-8b-instant` (or Claude) | up to 3×, exits early at score ≥ 7.5 |
| `agent` | direct | `llama-3.1-8b-instant` | none — used by all pipeline agents |

All agents use the `agent` tier internally. The gateway-level critic loop is reserved for direct API calls, not the orchestrator pipeline (which has its own CriticAgent at the end).

---

## Tech Stack

**Backend**
- [FastAPI](https://fastapi.tiangolo.com/) + [uvicorn](https://www.uvicorn.org/) — async Python API
- [SQLAlchemy 2](https://www.sqlalchemy.org/) + [asyncpg](https://github.com/MagicStack/asyncpg) — async Postgres
- [Alembic](https://alembic.sqlalchemy.org/) — database migrations
- [Groq](https://console.groq.com/) — `llama-3.1-8b-instant` (fast, cheap)
- [Anthropic](https://console.anthropic.com/) — `claude-sonnet-4-20250514` (premium quality)
- [Tavily](https://tavily.com/) — web search API for researcher + enricher agents
- [Jina AI](https://jina.ai/) — `jina-embeddings-v3` (1024-dim) for semantic cache
- [Redis](https://redis.io/) — SSE event queue + rate limiting

**Frontend**
- [Next.js 14](https://nextjs.org/) (App Router)
- [Tailwind CSS](https://tailwindcss.com/)
- [Framer Motion](https://www.framer.com/motion/) — animations
- [Lucide React](https://lucide.dev/) — icons

**Infrastructure**
- [Supabase](https://supabase.com/) — managed Postgres with pgvector
- [Upstash](https://upstash.com/) — serverless Redis (TLS)
- Docker — backend container

---

## Project Structure

```
pitchiq/
├── backend/
│   ├── app/
│   │   ├── agents/
│   │   │   ├── base.py           # BaseAgent — all LLM calls go through gateway
│   │   │   ├── planner.py        # Breaks task into agent steps + instructions
│   │   │   ├── researcher.py     # Tavily web search → structured company data
│   │   │   ├── enricher.py       # Concurrent Tavily lookups → decision makers
│   │   │   ├── writer.py         # Batched cold email generation
│   │   │   └── critic.py         # Scores output quality 0–10
│   │   ├── api/
│   │   │   ├── tasks.py          # Task endpoints + SSE stream + dashboard
│   │   │   ├── gateway.py        # POST /api/v1/chat (direct gateway access)
│   │   │   └── auth.py           # Auth stubs
│   │   ├── db/
│   │   │   ├── models.py         # SQLAlchemy ORM models
│   │   │   ├── session.py        # Async engine + session factory
│   │   │   └── migrations/       # Alembic migration files
│   │   ├── gateway/
│   │   │   ├── cache.py          # Semantic cache (pgvector)
│   │   │   ├── proxy.py          # Anthropic + Groq API calls
│   │   │   ├── router.py         # Tier → model + strategy routing
│   │   │   └── streaming.py      # SSE token streaming
│   │   ├── orchestrator/
│   │   │   ├── pipeline.py       # AgentPipeline — runs the full agent chain
│   │   │   └── state.py          # Task state management (DB read/write)
│   │   ├── services/
│   │   │   ├── embeddings.py     # Jina AI embedding calls
│   │   │   ├── event_emitter.py  # Push SSE events to Redis
│   │   │   ├── rate_limiter.py   # Redis-backed rate limiting
│   │   │   └── token_tracker.py  # Log token usage + cost to DB
│   │   ├── config.py             # Pydantic settings (reads from .env)
│   │   └── main.py               # FastAPI app + CORS + router registration
│   ├── tests/
│   ├── alembic.ini
│   ├── requirements.txt
│   ├── Dockerfile
│   ├── .env
│   └── .env.example
├── frontend/
│   ├── app/
│   │   ├── page.tsx              # Home — task input + live terminal + results
│   │   ├── dashboard/page.tsx    # Stats, charts, task history
│   │   └── results/[id]/page.tsx # Single task result view
│   ├── components/               # All UI components
│   ├── lib/
│   │   ├── api.ts                # API client (fetch + SSE)
│   │   └── utils.ts              # cn() helper
│   └── types/index.ts            # Shared TypeScript types
├── scripts/
│   └── init-db.sql               # Enable pgvector (local dev only)
├── docker-compose.yml
└── README.md
```

---

## Getting Started

### Prerequisites

- [Docker](https://www.docker.com/) — for the backend
- [Node.js 18+](https://nodejs.org/) — for the frontend
- API keys (all free tiers work):
  - [Groq](https://console.groq.com/) — required
  - [Tavily](https://tavily.com/) — required (web search)
  - [Jina AI](https://jina.ai/) — required (embeddings / semantic cache)
  - [Anthropic](https://console.anthropic.com/) — optional (premium model)
- [Supabase](https://supabase.com/) project — free tier is fine
- [Upstash](https://upstash.com/) Redis database — free tier is fine

---

### 1. Clone

```bash
git clone <repo-url>
cd pitchiq
```

---

### 2. Set up Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to **Database → Extensions** and enable **vector**
3. Open the **SQL Editor** and run the following to create all tables:

```sql
-- Enable pgvector
CREATE EXTENSION IF NOT EXISTS vector;

-- Users
CREATE TABLE IF NOT EXISTS users (
    id            TEXT PRIMARY KEY,
    email         TEXT UNIQUE,
    password_hash TEXT,
    created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- Semantic cache
CREATE TABLE IF NOT EXISTS prompt_cache (
    id            TEXT PRIMARY KEY,
    prompt_text   TEXT NOT NULL,
    embedding     vector(1024) NOT NULL,
    response_text TEXT NOT NULL,
    model_used    TEXT NOT NULL,
    quality_score FLOAT DEFAULT 0.0,
    created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS prompt_cache_embedding_idx
ON prompt_cache USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- Token usage
CREATE TABLE IF NOT EXISTS token_usage (
    id                 TEXT PRIMARY KEY,
    user_id            TEXT,
    model_used         TEXT NOT NULL,
    input_tokens       INTEGER DEFAULT 0,
    output_tokens      INTEGER DEFAULT 0,
    estimated_cost_usd FLOAT DEFAULT 0.0,
    task_id            TEXT,
    created_at         TIMESTAMPTZ DEFAULT NOW()
);

-- Tasks (legacy)
CREATE TABLE IF NOT EXISTS tasks (
    id           TEXT PRIMARY KEY,
    user_id      TEXT REFERENCES users(id),
    status       TEXT DEFAULT 'pending',
    input_data   JSONB,
    output_data  JSONB,
    created_at   TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

-- Agent tasks (main table)
CREATE TABLE IF NOT EXISTS agent_tasks (
    id             TEXT PRIMARY KEY,
    user_id        TEXT,
    original_task  TEXT NOT NULL,
    user_tier      TEXT NOT NULL,
    status         TEXT NOT NULL DEFAULT 'pending',
    plan           JSONB,
    agent_outputs  JSONB DEFAULT '{}',
    final_output   JSONB,
    total_cost_usd FLOAT DEFAULT 0.0,
    total_tokens   INTEGER DEFAULT 0,
    error_message  TEXT,
    created_at     TIMESTAMPTZ DEFAULT NOW(),
    updated_at     TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS agent_tasks_status_idx
ON agent_tasks (status, created_at DESC);

-- Alembic version marker
CREATE TABLE IF NOT EXISTS alembic_version (version_num TEXT PRIMARY KEY);
INSERT INTO alembic_version (version_num) VALUES ('0002') ON CONFLICT DO NOTHING;
```

4. Go to **Project Settings → Database** and copy the **Transaction pooler** connection string (port `6543`).

---

### 3. Set up Upstash Redis

1. Create a database at [upstash.com](https://upstash.com)
2. From the **Connect** tab, copy the `rediss://` URL.

---

### 4. Configure environment

```bash
cp backend/.env.example backend/.env
```

Edit `backend/.env`:

```env
# Supabase — Transaction pooler URL (port 6543)
DATABASE_URL=postgresql+asyncpg://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres?ssl=require

# Upstash Redis — TLS URL
REDIS_URL=rediss://default:[password]@[endpoint].upstash.io:6379

# LLM
GROQ_API_KEY=gsk_...
ANTHROPIC_API_KEY=sk-ant-...   # optional

# Search + embeddings
TAVILY_API_KEY=tvly-...
JINA_API_KEY=jina_...
```

---

### 5. Start the backend

```bash
docker compose up --build
```

The API will be available at `http://localhost:8000`.  
Interactive docs: `http://localhost:8000/docs`

---

### 6. Start the frontend

```bash
cd frontend
npm install
npm run dev
```

The UI will be available at `http://localhost:3000`.

---

## API Reference

### Start a task

```
POST /api/v1/task
```

```json
{
  "task": "Find 3 YC startups solving logistics in India and write cold emails to their founders",
  "user_tier": "free"
}
```

Returns immediately with a `task_id`. Connect to the SSE stream right after.

```json
{
  "task_id": "a1b2c3d4-...",
  "status": "pending",
  "message": "Task started. Connect to SSE stream for live updates."
}
```

### Stream live events

```
GET /api/v1/task/{task_id}/stream
```

Server-Sent Events. Each event is a JSON object:

```
data: {"type": "task_started",    "message": "Task received. Analyzing..."}
data: {"type": "plan_ready",      "agents": ["researcher","enricher","writer"]}
data: {"type": "agent_started",   "agent": "researcher", "message": "..."}
data: {"type": "agent_log",       "agent": "researcher", "message": "Found: Delhivery — Series D"}
data: {"type": "agent_completed", "agent": "researcher", "latency_ms": 4200, "cost_usd": 0.0}
data: {"type": "task_completed",  "total_cost_usd": 0.0003, "critic_score": 8.1}
data: [DONE]
```

### Get final result

```
GET /api/v1/task/{task_id}
```

Returns the full `final_output` including all generated emails, critic score, cost, and execution time.

### Dashboard

```
GET /api/v1/dashboard/stats          # aggregate stats
GET /api/v1/dashboard/tasks          # last 20 tasks
GET /api/v1/dashboard/tasks/{id}/breakdown  # per-agent token/cost breakdown
```

---

## Semantic Cache

Identical or near-identical prompts (cosine similarity ≥ 0.92) return a cached response instantly — zero LLM cost.

- **Embedding model:** `jina-embeddings-v3` via Jina AI API (1024-dim, no local GPU needed)
- **Storage:** `prompt_cache` table in Supabase with a pgvector IVFFlat index
- **Task type:** `text-matching` (symmetric — same text maps to same vector space)
- **Cache hit:** skips LLM call entirely, returns stored response + score

---

## Cost Tracking

Every LLM call is logged to `token_usage` in Supabase.

| Model | Input (per 1M tokens) | Output (per 1M tokens) |
|-------|-----------------------|------------------------|
| `llama-3.1-8b-instant` | $0.05 | $0.08 |
| `claude-sonnet-4-20250514` | $3.00 | $15.00 |

A typical free-tier task (3 companies, all agents) costs **~$0.0003**.

---

## Development

### Run tests

```bash
docker compose run --rm backend pytest
```

### View backend logs

```bash
docker compose logs -f backend
```

### Add a new migration

If you change the DB schema, add a migration file in `backend/app/db/migrations/versions/` following the existing pattern, then run the SQL manually in Supabase's SQL editor.

---

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | ✅ | Supabase Transaction pooler URL (`postgresql+asyncpg://...?ssl=require`) |
| `REDIS_URL` | ✅ | Upstash Redis TLS URL (`rediss://...`) |
| `GROQ_API_KEY` | ✅ | Groq API key — main LLM for all agents |
| `TAVILY_API_KEY` | ✅ | Tavily web search — researcher + enricher |
| `JINA_API_KEY` | ✅ | Jina AI embeddings — semantic cache |
| `ANTHROPIC_API_KEY` | ⬜ | Anthropic — only needed if `PREMIUM_MODEL=claude-sonnet-4-20250514` |
| `SECRET_KEY` | ⬜ | JWT secret — for future auth |
| `CORS_ORIGINS` | ⬜ | Allowed origins (default: localhost:3000) |
| `CACHE_ENABLED` | ⬜ | Set to `false` to disable semantic cache (default: `true`) |
| `MAX_CRITIC_ITERATIONS` | ⬜ | Max premium refinement loops (default: `3`) |
| `PREMIUM_QUALITY_THRESHOLD` | ⬜ | Score to exit early (default: `7.5`) |

---

## License

MIT
