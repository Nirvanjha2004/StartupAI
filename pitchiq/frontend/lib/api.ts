import type { TaskRequest, TaskResponse } from '@/types'

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

/**
 * Run a full agent task. Waits for completion (backend is synchronous).
 * Timeout: 300s — agent pipeline can take a few minutes.
 */
export async function runTask(task: string, tier: string): Promise<TaskResponse> {
  const body: TaskRequest = {
    task,
    user_tier: tier as 'free' | 'premium',
  }

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

/**
 * Poll task status by ID.
 */
export async function getTask(taskId: string): Promise<TaskResponse> {
  const res = await fetch(`${API_BASE}/api/v1/task/${taskId}`)

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }))
    throw new Error(err.detail || `Request failed: ${res.status}`)
  }

  return res.json()
}
