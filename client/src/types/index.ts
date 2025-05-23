export interface User {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  role?: string;
  name?: string;
  token?: string;
}

export interface Attachment {
  _id: string;
  filename: string;
  url: string;
  taskId: string;
  uploadedBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface Task {
  _id: string;
  title: string;
  description?: string;
  status: 'todo' | 'in_progress' | 'completed';
  priority: 'low' | 'medium' | 'high';
  dueDate?: string;
  assignedTo?: User;
  createdBy: User;
  attachments?: Attachment[];
  createdAt: string;
  updatedAt: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  error: string | null;
}

export interface TaskState {
  tasks: Task[];
  currentTask: Task | null;
  isLoading: boolean;
  error: string | null;
}

export interface RootState {
  auth: AuthState;
  tasks: TaskState;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials extends LoginCredentials {
  firstName: string;
  lastName: string;
  confirmPassword: string;
}

export interface TaskFormData {
  title: string;
  description: string;
  status: Task['status'];
  priority: Task['priority'];
  dueDate: string;
  assignedTo: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
} 