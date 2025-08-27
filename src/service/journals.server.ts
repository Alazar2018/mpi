import axiosInstance from "@/config/axios.config";

// Types for Journal and Folder
export interface Journal {
  _id: string;
  title: string;
  content: string;
  document?: string;
  isFavorite: boolean;
  color?: string;
  userId: string;
  folderId?: {
    _id: string;
    name: string;
    createdAt: string;
    updatedAt: string;
  } | null;
  createdAt: string;
  updatedAt: string;
}

export interface JournalFolder {
  _id: string;
  name: string;
  user: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateJournalRequest {
  title?: string;
  content?: string;
  document?: string;
  isFavorite?: boolean;
  color?: string;
  folderId?: string;
}

export interface UpdateJournalRequest {
  title?: string;
  content?: string;
  document?: string;
  isFavorite?: boolean;
  color?: string;
  folderId?: string;
}

export interface CreateFolderRequest {
  name: string;
}

export interface UpdateFolderRequest {
  name: string;
}

export interface DeleteFolderRequest {
  deleteNotesToo: boolean;
}

export interface JournalQueryParams {
  page?: number;
  limit?: number;
  sort?: string;
  fields?: string;
  title?: string;
  isFavorite?: boolean;
  color?: string;
  folderId?: string;
}

export interface FolderQueryParams {
  page?: number;
  limit?: number;
  sort?: string;
  fields?: string;
  name?: string;
}

class JournalsService {
  constructor() {
    // Authentication is now handled automatically by axiosInstance interceptors
  }

  // Journal Endpoints

  /**
   * Create a new journal entry
   */
  async createJournal(data: CreateJournalRequest): Promise<Journal> {
    const response = await axiosInstance.post<Journal>("/api/v1/journals", data);
    return response.data;
  }

  /**
   * Get all journal entries with filtering and pagination
   * Example: GET /api/v1/journals?page=1&limit=5&sort=-createdAt&isFavorite=true&fields=title,content,createdAt
   */
  async getJournals(params?: JournalQueryParams): Promise<Journal[]> {
    const queryString = this.buildQueryString(params);
    const response = await axiosInstance.get<Journal[]>(`/api/v1/journals${queryString}`);
    return response.data;
  }

  /**
   * Get a single journal entry by ID
   */
  async getJournal(id: string): Promise<Journal> {
    const response = await axiosInstance.get<Journal>(`/api/v1/journals/${id}`);
    return response.data;
  }

  /**
   * Update a journal entry
   */
  async updateJournal(id: string, data: UpdateJournalRequest): Promise<Journal[]> {
    const response = await axiosInstance.patch<Journal[]>(`/api/v1/journals/${id}`, data);
    return response.data;
  }

  /**
   * Delete a journal entry
   */
  async deleteJournal(id: string): Promise<Journal[]> {
    const response = await axiosInstance.delete<Journal[]>(`/api/v1/journals/${id}`);
    return response.data;
  }

  // Folder Endpoints

  /**
   * Create a new journal folder
   */
  async createFolder(data: CreateFolderRequest): Promise<JournalFolder> {
    const response = await axiosInstance.post<JournalFolder>("/api/v1/folders", data);
    return response.data;
  }

  /**
   * Get all journal folders with filtering and pagination
   */
  async getFolders(params?: FolderQueryParams): Promise<JournalFolder[]> {
    const queryString = this.buildQueryString(params);
    const response = await axiosInstance.get<JournalFolder[]>(`/api/v1/folders${queryString}`);
    return response.data;
  }

  /**
   * Get a single journal folder
   */
  async getFolder(id: string): Promise<JournalFolder> {
    const response = await axiosInstance.get<JournalFolder>(`/api/v1/folders/${id}`);
    return response.data;
  }

  /**
   * Update a journal folder
   */
  async updateFolder(id: string, data: UpdateFolderRequest): Promise<JournalFolder[]> {
    const response = await axiosInstance.patch<JournalFolder[]>(`/api/v1/folders/${id}`, data);
    return response.data;
  }

  /**
   * Delete a journal folder
   */
  async deleteFolder(id: string, data: DeleteFolderRequest): Promise<JournalFolder[]> {
    const response = await axiosInstance.delete<JournalFolder[]>(`/api/v1/folders/${id}`, {
      data
    });
    return response.data;
  }

  // Helper method to build query string
  private buildQueryString(params?: any): string {
    if (!params) return "";
    
    const queryParams = new URLSearchParams();
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        queryParams.append(key, String(value));
      }
    });
    
    const queryString = queryParams.toString();
    return queryString ? `?${queryString}` : "";
  }
}

// Export singleton instance
export const journalsService = new JournalsService();
