# PitchIQ — LLM Inference Gateway

Multi-agent cold outreach system with a tiered LLM inference gateway. Every agent in the system calls the LLM through this gateway, never directly.

---

## Architecture

### Two-Tier Inference Pipeline

**FREE tier:**
1. Check semantic cache (pgvector cosine similarity > 0.92)
2. If cache miss → call Groq `llama-3.1-8b-instant`
3. Run critic once (Groq, cheap model)
4. Return response + quality_score regardless of score
5. Store in cache

**PREMIUM tier:**
1. Check semantic cache
2. If cache miss → call Claude Sonnet `claude-sonnet-4-20250514`
3. Run critic (Groq)
4. If score >= 8.5 → return
5. If score < 8.5 → append feedback, rewrite with Claude
6. Repeat until score >= 8.5 OR max 5 iterations
7. Return best response with iteration count
8. Store in cache

### Critic Format

The critic always receives the original prompt + current response and must reply in strict JSON:

```json
{"score": 8.2, "feedback": "Improve the call-to-action clarity"}
```

Critic model: `groq/llama-3.1-8b-instant` (cheap evaluation)

---

## Tech Stack

- **FastAPI** — async Python web framework
- **PostgreSQL 15** with **pgvector** extension — semantic cache
- **Redis 7** — rate limiting (future)
- **Anthropic API** — Claude Sonnet (quality model)
- **Groq API** — Llama 3.1 8B Instant (cheap model + critic)
- **Jina AI API** — `jina-embeddings-v3` embeddings (1024-dim, no local model needed)
- **asyncpg** — async PostgreSQL driver
- **Alembic** — database migrations

---

## Project Structure

```
pitchiq/
├── backend/
│   ├── app/
│   │   ├── api/
│   │   │   └── gateway.py          # POST /api/v1/chat endpoint
│   │   ├── db/
│   │   │   ├── models.py           # SQLAlchemy ORM models
│   │   │   ├── session.py          # Async DB session
│   │   │   └── migrations/         # Alembic migrations
│   │   ├── gateway/
│   │   │   ├── cache.py            # Semantic cache (pgvector)
│   │   │   ├── critic.py           # Critic runner
│   │   │   ├── proxy.py            # LLM API calls (Anthropic + Groq)
│   │   │   ├── router.py           # Tier → model routing
│   │   │   └── streaming.py        # SSE streaming (PREMIUM only)
│   │   ├── orchestrator/
│   │   │   └── pipeline.py         # Tiered inference pipeline
│   │   ├── services/
│   │   │   └── token_tracker.py    # Token usage + cost tracking
│   │   ├── utils/
│   │   │   ├── exceptions.py       # Custom exceptions
│   │   │   └── logger.py           # Logging
│   │   ├── config.py               # Pydantic settings
│   │   └── main.py                 # FastAPI app
│   ├── alembic.ini                 # Alembic config
│   ├── requirements.txt
│   ├── Dockerfile
│   └── .env.example
├── docker-compose.yml
├── scripts/
│   └── init-db.sql                 # Enable pgvector on startup
└── README.md
```

---

## Getting Started

### 1. Prerequisites

- Docker + Docker Compose
- Python 3.11+ (for local development)
- API keys:
  - [Anthropic API key](https://console.anthropic.com/)
  - [Groq API key](https://console.groq.com/)

### 2. Clone and Configure

```bash
git clone <repo-url>
cd pitchiq

# Copy environment template
cp .env.example .env

# Edit .env and add your API keys
nano .env
```

Your `.env` should look like:

```env
ANTHROPIC_API_KEY=sk-ant-...
GROQ_API_KEY=gsk_...
JINA_API_KEY=jina_...
DATABASE_URL=postgresql+asyncpg://postgres:postgres@localhost:5432/pitchiq
REDIS_URL=redis://localhost:6379
EMBEDDING_MODEL=jina-embeddings-v3
```

### 3. Start Docker Services

```bash
# Start PostgreSQL (with pgvector) + Redis
docker-compose up -d postgres redis

# Wait for health checks to pass
docker-compose ps
```

### 4. Run Database Migrations

```bash
cd backend

# Install dependencies (if running locally)
pip install -r requirements.txt

# Run Alembic migrations
alembic upgrade head
```

This creates:
- `prompt_cache` table with pgvector embedding column (384-dim)
- `token_usage` table for cost tracking
- `users` and `tasks` tables (stubs for future auth)

### 5. Start the Backend

**Option A: Docker (recommended)**

```bash
docker-compose up backend
```

**Option B: Local (for development)**

```bash
cd backend
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

The API will be available at `http://localhost:8000`.

---

## API Usage

### Endpoint: `POST /api/v1/chat`

**Request body:**

```json
{
  "prompt": "Write a cold email to a SaaS founder about our AI sales tool",
  "messages": [
    {"role": "user", "content": "Write a cold email to a SaaS founder about our AI sales tool"}
  ],
  "stream": false,
  "user_tier": "free"
}
```

**Response (FREE tier):**

```json
{
  "response": "Subject: Boost Your Sales with AI...",
  "model_used": "llama-3.1-8b-instant",
  "quality_score": 7.2,
  "iterations": 1,
  "cached": false,
  "estimated_cost_usd": 0.00012,
  "note": "Upgrade to Premium for iterative refinement"
}
```

**Response (PREMIUM tier):**

```json
{
  "response": "Subject: Transform Your Sales Pipeline...",
  "model_used": "claude-sonnet-4-20250514",
  "quality_score": 9.1,
  "iterations": 3,
  "cached": false,
  "estimated_cost_usd": 0.0234,
  "note": null
}
```

### Example cURL

```bash
curl -X POST http://localhost:8000/api/v1/chat \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Write a cold email to a SaaS founder",
    "user_tier": "premium"
  }'
```

### Streaming (PREMIUM only)

```bash
curl -X POST http://localhost:8000/api/v1/chat \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Write a cold email",
    "user_tier": "premium",
    "stream": true
  }'
```

Yields SSE chunks:

```
data: Subject: Transform
data:  Your Sales
data:  Pipeline...
data: [DONE]
```

---

## Cost Tracking

Every LLM call (including critic calls) is logged to the `token_usage` table:

| Column | Description |
|--------|-------------|
| `model_used` | e.g. `llama-3.1-8b-instant` or `claude-sonnet-4-20250514` |
| `input_tokens` | Prompt tokens |
| `output_tokens` | Completion tokens |
| `estimated_cost_usd` | Calculated cost based on pricing |

**Pricing (per 1M tokens):**

| Model | Input | Output |
|-------|-------|--------|
| `llama-3.1-8b-instant` | $0.05 | $0.08 |
| `claude-sonnet-4-20250514` | $3.00 | $15.00 |

---

## Semantic Cache

- **Table:** `prompt_cache`
- **Embedding model:** `jina-embeddings-v3` via Jina AI API (1024-dim, multilingual, 8K context)
- **Tasks:** `retrieval.query` for lookups, `retrieval.passage` for storing
- **Similarity threshold:** 0.92 (cosine)
- **Index:** IVFFlat for fast approximate nearest-neighbour search

On cache hit, the LLM call is skipped entirely → zero cost.

---

## Error Handling

- **Groq call fails** → fallback to Claude Sonnet (both tiers)
- **Critic returns invalid JSON** → default score to 5.0, feedback to "Could not evaluate"
- **Cache read fails** → log warning, continue without cache (don't crash)
- **Max iterations hit (PREMIUM)** → return best response so far with note: "Max iterations reached"
- **All LLM errors** → HTTP 503 with message

---

## Development

### Run Tests

```bash
cd backend
pytest
```

### Create a New Migration

```bash
cd backend
alembic revision -m "add new column"
# Edit the generated file in app/db/migrations/versions/
alembic upgrade head
```

### View Logs

```bash
docker-compose logs -f backend
```

---

## What's NOT Built Yet

- JWT auth (user_tier comes from request body for now)
- Kafka or background jobs
- Kubernetes deployment
- Frontend UI
- Full multi-agent system (planner, researcher, enricher, writer)

---

## License

MIT
