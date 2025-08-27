import axiosInstance from "@/config/axios.config";

// Types for Todo module based on API documentation
export interface Todo {
  _id: string;
  userId: string;
  title: string;
  isCompleted: boolean;
  dueDate: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTodoRequest {
  title: string;
  dueDate: string;
  timezone: string;
}

export interface UpdateTodoRequest {
  title?: string;
  dueDate?: string;
  timezone?: string;
  isCompleted?: boolean;
}

export interface UpdateTodoStatusRequest {
  isCompleted: boolean;
}

export interface TodoListResponse {
  todos: Todo[];
  totalCount: number;
  currentPage: number;
  totalPages: number;
}

export interface TodoResponse {
  success: boolean;
  message: string;
  data: Todo;
}

export interface TodoListApiResponse {
  success: boolean;
  message: string;
  data: TodoListResponse;
}

export interface LatestTodosResponse {
  success: boolean;
  message: string;
  data: {
    todos: Todo[];
  };
}

export interface TodoQueryParams {
  page?: number;
  limit?: number;
  sort?: string;
  isCompleted?: boolean;
  search?: string;
}

// Todo API Service
class TodoService {
  constructor() {
    // Authentication is handled automatically by axiosInstance interceptors
  }

  /**
   * Create a new todo item
   * POST /api/v1/todos
   */
  async createTodo(data: CreateTodoRequest): Promise<TodoResponse> {
    const response = await axiosInstance.post<TodoResponse>('/api/v1/todos', data);
    return response.data;
  }

  /**
   * Get all todos for the authenticated user with pagination and filtering
   * GET /api/v1/todos
   */
  async getAllTodos(params?: TodoQueryParams): Promise<TodoListApiResponse> {
    const queryParams = new URLSearchParams();
    
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.sort) queryParams.append('sort', params.sort);
    if (params?.isCompleted !== undefined) queryParams.append('isCompleted', params.isCompleted.toString());
    if (params?.search) queryParams.append('search', params.search);
    
    const url = `/api/v1/todos${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    const response = await axiosInstance.get<TodoListApiResponse>(url);
    return response.data;
  }

  /**
   * Get the 3 most recent todos for dashboard display
   * GET /api/v1/todos/latest
   */
  async getLatestTodos(): Promise<LatestTodosResponse> {
    const response = await axiosInstance.get<LatestTodosResponse>('/api/v1/todos/latest');
    return response.data;
  }

  /**
   * Get a specific todo by ID
   * GET /api/v1/todos/{todoId}
   */
  async getTodoById(todoId: string): Promise<TodoResponse> {
    const response = await axiosInstance.get<TodoResponse>(`/api/v1/todos/${todoId}`);
    return response.data;
  }

  /**
   * Update a todo's details
   * PATCH /api/v1/todos/{todoId}
   */
  async updateTodo(todoId: string, data: UpdateTodoRequest): Promise<TodoResponse> {
    const response = await axiosInstance.patch<TodoResponse>(`/api/v1/todos/${todoId}`, data);
    return response.data;
  }

  /**
   * Quick endpoint to toggle completion status of a todo
   * PATCH /api/v1/todos/{todoId}/status
   */
  async updateTodoStatus(todoId: string, data: UpdateTodoStatusRequest): Promise<TodoResponse> {
    const response = await axiosInstance.patch<TodoResponse>(`/api/v1/todos/${todoId}/status`, data);
    return response.data;
  }

  /**
   * Delete a todo permanently
   * DELETE /api/v1/todos/{todoId}
   */
  async deleteTodo(todoId: string): Promise<TodoResponse> {
    const response = await axiosInstance.delete<TodoResponse>(`/api/v1/todos/${todoId}`);
    return response.data;
  }

  /**
   * Toggle todo completion status (convenience method)
   */
  async toggleTodoStatus(todoId: string, currentStatus: boolean): Promise<TodoResponse> {
    return this.updateTodoStatus(todoId, { isCompleted: !currentStatus });
  }

  /**
   * Get todos due today
   */
  async getTodosDueToday(): Promise<Todo[]> {
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59);
    
    const response = await this.getAllTodos({
      limit: 100, // Get more todos to filter by date
      sort: 'dueDate'
    });
    
    return response.data.todos.filter(todo => {
      const dueDate = new Date(todo.dueDate);
      return dueDate >= startOfDay && dueDate <= endOfDay;
    });
  }

  /**
   * Get overdue todos
   */
  async getOverdueTodos(): Promise<Todo[]> {
    const now = new Date();
    
    const response = await this.getAllTodos({
      limit: 100,
      sort: 'dueDate'
    });
    
    return response.data.todos.filter(todo => {
      const dueDate = new Date(todo.dueDate);
      return dueDate < now && !todo.isCompleted;
    });
  }

  /**
   * Get upcoming todos (due in next 7 days)
   */
  async getUpcomingTodos(): Promise<Todo[]> {
    const now = new Date();
    const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    
    const response = await this.getAllTodos({
      limit: 100,
      sort: 'dueDate'
    });
    
    return response.data.todos.filter(todo => {
      const dueDate = new Date(todo.dueDate);
      return dueDate > now && dueDate <= nextWeek && !todo.isCompleted;
    });
  }

  /**
   * Search todos by title
   */
  async searchTodos(searchTerm: string, limit: number = 20): Promise<Todo[]> {
    const response = await this.getAllTodos({
      search: searchTerm,
      limit
    });
    
    return response.data.todos;
  }

  /**
   * Get todos by completion status
   */
  async getTodosByStatus(isCompleted: boolean, limit: number = 20): Promise<Todo[]> {
    const response = await this.getAllTodos({
      isCompleted,
      limit,
      sort: '-createdAt'
    });
    
    return response.data.todos;
  }

  /**
   * Get todos count by status
   */
  async getTodosCount(): Promise<{ completed: number; pending: number; total: number }> {
    const [completedResponse, pendingResponse] = await Promise.all([
      this.getAllTodos({ isCompleted: true, limit: 1 }),
      this.getAllTodos({ isCompleted: false, limit: 1 })
    ]);
    
    return {
      completed: completedResponse.data.totalCount,
      pending: pendingResponse.data.totalCount,
      total: completedResponse.data.totalCount + pendingResponse.data.totalCount
    };
  }

  /**
   * Format due date for display
   */
  formatDueDate(dueDate: string): string {
    const date = new Date(dueDate);
    const now = new Date();
    const diffTime = date.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) {
      return `Overdue by ${Math.abs(diffDays)} day${Math.abs(diffDays) !== 1 ? 's' : ''}`;
    } else if (diffDays === 0) {
      return 'Due today';
    } else if (diffDays === 1) {
      return 'Due tomorrow';
    } else if (diffDays <= 7) {
      return `Due in ${diffDays} days`;
    } else {
      return date.toLocaleDateString();
    }
  }

  /**
   * Check if todo is overdue
   */
  isOverdue(todo: Todo): boolean {
    const dueDate = new Date(todo.dueDate);
    const now = new Date();
    return dueDate < now && !todo.isCompleted;
  }

  /**
   * Check if todo is due soon (within 24 hours)
   */
  isDueSoon(todo: Todo): boolean {
    const dueDate = new Date(todo.dueDate);
    const now = new Date();
    const diffTime = dueDate.getTime() - now.getTime();
    const diffHours = diffTime / (1000 * 60 * 60);
    return diffHours <= 24 && diffHours > 0 && !todo.isCompleted;
  }

  /**
   * Sort todos by priority (overdue first, then due soon, then by due date)
   */
  sortTodosByPriority(todos: Todo[]): Todo[] {
    return todos.sort((a, b) => {
      // Overdue todos first
      if (this.isOverdue(a) && !this.isOverdue(b)) return -1;
      if (!this.isOverdue(a) && this.isOverdue(b)) return 1;
      
      // Due soon todos second
      if (this.isDueSoon(a) && !this.isDueSoon(b)) return -1;
      if (!this.isDueSoon(a) && this.isDueSoon(b)) return 1;
      
      // Then by due date
      const dateA = new Date(a.dueDate);
      const dateB = new Date(b.dueDate);
      return dateA.getTime() - dateB.getTime();
    });
  }
}

// Create and export instance
export const todoService = new TodoService();
