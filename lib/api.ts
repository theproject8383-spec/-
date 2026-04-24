import axios from "axios";

const api = axios.create({ 
  baseURL: "https://46160a42-d249-4acb-98af-270590c8b219-00-1timt5yp4mm41.janeway.replit.dev/api" 
});

export interface Task {
  id: number;
  title: string;
  description: string | null;
  deadline: string | null;
  priority: "low" | "medium" | "high";
  category: string | null;
  status: "pending" | "done";
  createdAt: string;
  updatedAt: string;
}

export interface TasksResponse {
  success: boolean;
  data: {
    tasks: Task[];
    total: number;
    page: number;
    limit: number;
  };
  error: string | null;
}

export interface TaskResponse {
  success: boolean;
  data: Task;
  error: string | null;
}

export interface ParseResponse {
  success: boolean;
  data: {
    tasks: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>[];
  };
  error: string | null;
}

export interface ChatResponse {
  success: boolean;
  data: {
    reply: string;
    needs_clarification: boolean;
    actions_performed: {
      created: Task[];
      updated: Task[];
      deleted: number[];
    };
  };
  error: string | null;
}

export interface TaskFilters {
  page?: number;
  limit?: number;
  status?: "pending" | "done";
  priority?: "low" | "medium" | "high";
  category?: string;
  sortBy?: "deadline" | "priority" | "createdAt";
  sortOrder?: "asc" | "desc";
}

// Task CRUD operations
export const getTasks = async (filters: TaskFilters = {}): Promise<TasksResponse> => {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined) params.append(key, String(value));
  });
  const response = await api.get(`/tasks?${params.toString()}`);
  return response.data;
};

export const createTask = async (task: Partial<Task>): Promise<TaskResponse> => {
  const response = await api.post('/tasks', task);
  return response.data;
};

export const updateTask = async (id: number, task: Partial<Task>): Promise<TaskResponse> => {
  const response = await api.put(`/tasks/${id}`, task);
  return response.data;
};

export const deleteTask = async (id: number): Promise<void> => {
  await api.delete(`/tasks/${id}`);
};

// AI operations
export const parseTasks = async (text: string): Promise<ParseResponse> => {
  const response = await api.post('/tasks/parse', { text });
  return response.data;
};

export const sendChatMessage = async (message: string): Promise<ChatResponse> => {
  const response = await api.post('/chat', { message });
  return response.data;
};

export default api;
