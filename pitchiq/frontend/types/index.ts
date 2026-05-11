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

export interface AgentOutput {
  agent_name: string
  model_used: string
  tokens: number
  cost_usd: number
  latency_ms: number
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
