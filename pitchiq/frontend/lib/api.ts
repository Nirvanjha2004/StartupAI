import type {
  TaskRequest,
  TaskResponse,
  TaskEvent,
  DashboardStats,
  TaskSummary,
  TaskBreakdown,
} from '@/types'

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

// ── Task endpoints ────────────────────────────────────────────────────────────

/**
 * Start a task. Returns task_id + final_output when pipeline completes.
 * Connect to streamTask() immediately after getting task_id for live events.
 */
export async function runTask(task: string, tier: string): Promise<TaskResponse> {
  const body: TaskRequest = { task, user_tier: tier as 'free' | 'premium' }

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 600_000)

  try {
    const res = await fetch(`${API_BASE}/api/v1/task`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: controller.signal,
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: res.statusText }))
      throw new Error(err.detail || `Request failed: ${res.status}`)
    }
    return res.json()
  } finally {
    clearTimeout(timeout)
  }
}

export async function getTask(taskId: string): Promise<TaskResponse> {
  const res = await fetch(`${API_BASE}/api/v1/task/${taskId}`)
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }))
    throw new Error(err.detail || `Request failed: ${res.status}`)
  }
  return res.json()
}

/**
 * Connect to SSE stream for a running task.
 * Returns a cleanup function — call it on unmount.
 */
export function streamTask(
  taskId: string,
  onEvent: (event: TaskEvent) => void,
  onDone: () => void,
): () => void {
  const url = `${API_BASE}/api/v1/task/${taskId}/stream`
  const es = new EventSource(url)

  es.onmessage = (e) => {
    if (e.data === '[DONE]') {
      es.close()
      onDone()
      return
    }
    try {
      const event: TaskEvent = JSON.parse(e.data)
      onEvent(event)
    } catch {
      // ignore malformed events
    }
  }

  es.onerror = () => {
    es.close()
    onDone()
  }

  return () => es.close()
}

// ── Dashboard endpoints ───────────────────────────────────────────────────────

export async function getDashboardStats(): Promise<DashboardStats> {
  const res = await fetch(`${API_BASE}/api/v1/dashboard/stats`)
  if (!res.ok) throw new Error(`Stats fetch failed: ${res.status}`)
  return res.json()
}

export async function getDashboardTasks(): Promise<TaskSummary[]> {
  const res = await fetch(`${API_BASE}/api/v1/dashboard/tasks`)
  if (!res.ok) throw new Error(`Tasks fetch failed: ${res.status}`)
  const data = await res.json()
  return data.tasks
}

export async function getTaskBreakdown(taskId: string): Promise<TaskBreakdown> {
  const res = await fetch(`${API_BASE}/api/v1/dashboard/tasks/${taskId}/breakdown`)
  if (!res.ok) throw new Error(`Breakdown fetch failed: ${res.status}`)
  return res.json()
}
