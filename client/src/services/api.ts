import { AuthResponse, Task, TaskFormData, UserListItem, SignupData } from '../types';

const API_BASE = '/api';

function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` })
  };
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'שגיאה לא ידועה' }));
    throw new Error(error.error || 'שגיאה לא ידועה');
  }
  if (response.status === 204) {
    return undefined as T;
  }
  return response.json();
}

export async function login(email: string, password: string): Promise<AuthResponse> {
  const response = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  return handleResponse<AuthResponse>(response);
}

export async function signup(data: SignupData): Promise<AuthResponse> {
  const response = await fetch(`${API_BASE}/auth/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  return handleResponse<AuthResponse>(response);
}

export async function googleAuth(credential: string): Promise<AuthResponse> {
  const response = await fetch(`${API_BASE}/auth/google`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ credential })
  });
  return handleResponse<AuthResponse>(response);
}

export async function getTasks(date?: string): Promise<Task[]> {
  const params = date ? `?date=${date}` : '';
  const response = await fetch(`${API_BASE}/tasks${params}`, {
    headers: getAuthHeaders()
  });
  return handleResponse<Task[]>(response);
}

export async function createTask(data: TaskFormData): Promise<Task> {
  const response = await fetch(`${API_BASE}/tasks`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(data)
  });
  return handleResponse<Task>(response);
}

export async function updateTask(id: number, data: Partial<TaskFormData>): Promise<Task> {
  const response = await fetch(`${API_BASE}/tasks/${id}`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(data)
  });
  return handleResponse<Task>(response);
}

export async function deleteTask(id: number): Promise<void> {
  const response = await fetch(`${API_BASE}/tasks/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders()
  });
  return handleResponse<void>(response);
}

export async function toggleTaskCompletion(
  id: number,
  complete: boolean,
  date?: string
): Promise<void> {
  const response = await fetch(`${API_BASE}/tasks/${id}/complete`, {
    method: 'PATCH',
    headers: getAuthHeaders(),
    body: JSON.stringify({ complete, date })
  });
  return handleResponse<void>(response);
}

export async function reorderTasks(taskIds: number[]): Promise<void> {
  const response = await fetch(`${API_BASE}/tasks/reorder`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify({ taskIds })
  });
  return handleResponse<void>(response);
}

export async function getUsers(): Promise<UserListItem[]> {
  const response = await fetch(`${API_BASE}/users`, {
    headers: getAuthHeaders()
  });
  return handleResponse<UserListItem[]>(response);
}
