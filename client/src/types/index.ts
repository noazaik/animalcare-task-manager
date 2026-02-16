export type Role = 'ADMIN' | 'USER';

export type Recurrence = 'NONE' | 'DAILY' | 'WEEKLY' | 'MONTHLY';

export interface User {
  id: number;
  fullName: string;
  email: string;
  role: Role;
}

export interface UserListItem {
  id: number;
  fullName: string;
  email: string | null;
  role: Role;
  createdAt: string;
}

export interface SignupData {
  email: string;
  password: string;
  fullName: string;
}

export interface Task {
  id: number;
  title: string;
  description: string | null;
  dueDate: string;
  startTime: string;
  endTime: string;
  recurrence: Recurrence;
  isComplete: boolean;
  isCompleteForDate?: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface TaskFormData {
  title: string;
  description: string;
  dueDate: string;
  startTime: string;
  endTime: string;
  recurrence: Recurrence;
}
