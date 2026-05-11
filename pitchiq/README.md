# PitchIQ

AI-powered email generation for startup outreach. Uses a multi-agent orchestration system to research companies, enrich contact information, and generate personalized email pitches.

## Architecture

### Backend (FastAPI)

The backend is organized into clear layers:

1. **Gateway Layer** - Intelligent LLM routing
   - Routes simple queries to Groq (fast, cheap)
   - Routes complex queries to Claude (powerful)
   - Semantic caching with pgvector
   - Server-sent event streaming

2. **Agent Layer** - Multi-agent system
   - `Planner` - Breaks tasks into subtasks
   - `Researcher` - Web search via Tavily
   - `Enricher` - Finds and enriches contact information
   - `Writer` - Generates personalized email drafts
   - `Critic` - Scores and improves outputs

3. **Orchestrator** - Pipeline coordination
   - Runs agents in sequence
   - Manages shared task state in PostgreSQL
   - Tracks execution logs

4. **Services**
   - Token tracking and cost calculation
   - Redis-based rate limiting
   - Text embeddings for caching

### Frontend (Next.js)

- **Task Form** - Submit new email generation requests
- **Results Page** - View generated emails and execution timeline
- **Dashboard** - Observability and usage metrics
- **Components** - Reusable UI for timeline, results, cost breakdown

## Getting Started

### Prerequisites

- Docker and Docker Compose
- Python 3.11+ (for local development)
- Node.js 18+ (for frontend development)

### Environment Setup

1. Copy environment templates:
```bash
cp backend/.env.example backend/.env
cp .env.example .env
```

2. Add your API keys to `.env`:
```env
GROQ_API_KEY=your_groq_key
ANTHROPIC_API_KEY=your_anthropic_key
TAVILY_API_KEY=your_tavily_key
SECRET_KEY=your_secret_key_here
```

### Running with Docker Compose

```bash
docker-compose up -d
```

This starts:
- PostgreSQL on port 5432
- Redis on port 6379
- FastAPI backend on http://localhost:8000
- API docs available at http://localhost:8000/docs

### Local Development

**Backend:**
```bash
cd backend
python -m venv venv
source venv/bin/activate  # or `venv\Scripts\activate` on Windows
pip install -r requirements.txt
uvicorn app.main:app --reload
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev
# Open http://localhost:3000
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login and get JWT token
- `POST /api/auth/logout` - Logout

### Tasks
- `POST /api/tasks/run` - Start email generation task
- `GET /api/tasks/task/{id}` - Get task results
- `GET /api/tasks/tasks` - List user's tasks

### Gateway (Direct LLM)
- `POST /api/chat` - Direct chat with model routing
- `POST /api/chat/stream` - Streaming chat endpoint

## Cost Tracking

Token usage is automatically tracked and costs are calculated based on:
- Groq: Free tier
- Claude: Pricing per input/output tokens

See `TokenTracker` in `app/services/token_tracker.py` for details.

## Testing

```bash
# Run tests
cd backend
pytest

# With coverage
pytest --cov=app tests/
```

## Project Structure

```
pitchiq/
├── backend/               # FastAPI application
│   ├── app/
│   │   ├── gateway/       # LLM routing & streaming
│   │   ├── agents/        # Multi-agent system
│   │   ├── orchestrator/  # Pipeline & state
│   │   ├── api/           # HTTP endpoints
│   │   ├── db/            # Database models
│   │   ├── services/      # Token tracking, rate limiting
│   │   └── utils/         # Logging, exceptions
│   ├── tests/
│   ├── Dockerfile
│   └── requirements.txt
│
├── frontend/              # Next.js application
│   ├── app/               # Pages
│   ├── components/        # React components
│   └── lib/               # Utilities and API client
│
└── docker-compose.yml     # Local development environment
```

## Key Features

- **Intelligent Model Routing** - Automatically chooses Groq or Claude based on query complexity
- **Semantic Caching** - Reduces costs by caching similar queries with pgvector
- **Multi-Agent Pipeline** - Orchestrates research, enrichment, writing, and criticism
- **Cost Tracking** - Real-time token and monetary cost tracking per request
- **Rate Limiting** - Redis-based rate limiting per user
- **Streaming Responses** - Server-sent events for real-time updates
- **Observability** - Dashboard showing usage metrics and cost breakdowns

## Next Steps

- [ ] Implement LLM calls (replace TODO comments)
- [ ] Set up database migrations with Alembic
- [ ] Add authentication middleware
- [ ] Wire up frontend components to backend APIs
- [ ] Add monitoring and logging
- [ ] Deploy to production (e.g., Railway, Vercel)

## License

MIT
