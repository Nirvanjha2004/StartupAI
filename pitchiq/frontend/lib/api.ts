"""Backend API client"""

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

export interface TaskRequest {
  company: string;
  contact_name: string;
  context?: string;
  tone?: string;
}

export interface TaskResponse {
  task_id: string;
  status: string;
  created_at: string;
}

export async function submitTask(data: TaskRequest): Promise<TaskResponse> {
  const response = await fetch(`${API_BASE_URL}/tasks/run`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error('Failed to submit task');
  }

  return response.json();
}

export async function getTaskResult(taskId: string) {
  const response = await fetch(`${API_BASE_URL}/tasks/task/${taskId}`);

  if (!response.ok) {
    throw new Error('Failed to fetch task result');
  }

  return response.json();
}

export async function listTasks(userId: string) {
  const response = await fetch(`${API_BASE_URL}/tasks/tasks?user_id=${userId}`);

  if (!response.ok) {
    throw new Error('Failed to fetch tasks');
  }

  return response.json();
}

export async function login(email: string, password: string) {
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, password }),
  });

  if (!response.ok) {
    throw new Error('Failed to login');
  }

  return response.json();
}

export async function register(email: string, password: string) {
  const response = await fetch(`${API_BASE_URL}/auth/register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, password }),
  });

  if (!response.ok) {
    throw new Error('Failed to register');
  }

  return response.json();
}
