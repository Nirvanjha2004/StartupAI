export interface TaskRequest {
  task: string
  user_tier: 'free' | 'premium'
}

export interface EmailOutput {
  company: string
  to: string
  subject: string
  body: string
  personalization_hooks: string[]
}

export interface FinalOutput {
  task: string
  task_summary: string
  emails: EmailOutput[]
  companies_researched: number
  critic_score: number
  critic_feedback: string
  total_cost_usd: number
  total_tokens: number
  agents_used: string[]
  execution_time_ms: number
}

export interface TaskResponse {
  task_id: string
  status: string
  message?: string
  final_output: FinalOutput | null
}

// ── SSE Events ───────────────────────────────────────────────────────────────

export type TaskEventType =
  | 'task_started'
  | 'plan_ready'
  | 'agent_started'
  | 'agent_log'
  | 'agent_completed'
  | 'task_completed'
  | 'task_failed'

export interface TaskEvent {
  type: TaskEventType
  message: string
  timestamp: string
  agent?: string
  agents?: string[]
  tokens?: number
  cost_usd?: number
  latency_ms?: number
  total_cost_usd?: number
  total_tokens?: number
  critic_score?: number
}

export interface DashboardStats {
  total_tasks: number
  completed_tasks: number
  failed_tasks: number
  total_cost_usd: number
  total_tokens: number
  average_critic_score: number
  average_execution_time_ms: number
}

export interface TaskSummary {
  task_id: string
  original_task: string
  status: string
  user_tier: string
  total_cost_usd: number
  critic_score: number
  agents_used: string[]
  execution_time_ms: number
  created_at: string
}

export interface AgentDetail {
  agent_name: string
  model_used: string
  input_tokens: number
  output_tokens: number
  estimated_cost_usd: number
  latency_ms: number
  success: boolean
}

export interface TaskBreakdown {
  task_id: string
  original_task: string
  agents: AgentDetail[]
  total_cost_usd: number
  total_tokens: number
  execution_time_ms: number
  critic_score: number
}
