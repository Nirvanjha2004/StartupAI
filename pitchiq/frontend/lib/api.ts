import type {
  TaskRequest,
  TaskResponse,
  DashboardStats,
  TaskSummary,
  TaskBreakdown,
} from '@/types'

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

// ── Task endpoints ────────────────────────────────────────────────────────────

export async function runTask(task: string, tier: string): Promise<TaskResponse> {
  const body: TaskRequest = { task, user_tier: tier as 'free' | 'premium' }

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 300_000)

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
