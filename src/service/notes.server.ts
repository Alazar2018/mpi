import axiosInstance from "@/config/axios.config";

// Types for Match Notes module based on API specification
export type NoteType = 'technical' | 'tactical' | 'mental' | 'physical' | 'strategy' | 'general' | 'improvement' | 'strength';
export type Priority = 'low' | 'medium' | 'high';
export type Visibility = 'private' | 'coach' | 'public';

export interface PointDetail {
  setNumber?: number;
  gameNumber?: number;
  pointNumber?: number;
  isTiebreak?: boolean;
  score?: string;
}

export interface MatchNote {
  _id: string;
  match: string;
  creator: {
    _id: string;
    firstName: string;
    lastName: string;
    avatar?: string;
  };
  note: string;
  noteType: NoteType;
  priority: Priority;
  visibility: Visibility;
  pointDetail?: PointDetail;
  tags: string[];
  relatedPlayer?: {
    _id: string;
    firstName: string;
    lastName: string;
    avatar?: string;
  };
  isResolved: boolean;
  attachments: Array<{
    type: 'image' | 'video' | 'document';
    url: string;
    fileName: string;
  }>;
  createdAt: string;
  updatedAt: string;
}

export interface CreateMatchNoteRequest {
  note: string;
  noteType?: NoteType;
  priority?: Priority;
  visibility?: Visibility;
  pointDetail?: PointDetail;
  tags?: string[];
  relatedPlayer?: string;
}

export interface UpdateMatchNoteRequest {
  note?: string;
  noteType?: NoteType;
  priority?: Priority;
  isResolved?: boolean;
  tags?: string[];
  visibility?: Visibility;
}

export interface GetNotesQuery {
  noteType?: NoteType;
  priority?: Priority;
  isResolved?: boolean;
  relatedPlayer?: string;
  tags?: string | string[];
  search?: string;
  page?: number;
  limit?: number;
  sort?: 'createdAt' | 'updatedAt' | 'priority' | 'noteType';
  order?: 'asc' | 'desc';
}

export interface NotesListResponse {
  notes: MatchNote[];
  pagination: {
    page: number;
    limit: number;
    totalPages: number;
    totalCount: number;
  };
}

// Match Notes API Service
class NotesService {
  private readonly BASE_PATH = '/api/v1/match-notes';

  constructor() {
    // Authentication is handled automatically by axiosInstance interceptors
  }

  /**
   * Create a new match note
   * POST /api/v1/match-notes/match/:matchId
   */
  async createMatchNote(matchId: string, data: CreateMatchNoteRequest): Promise<MatchNote> {
    const response = await axiosInstance.post<MatchNote>(
      `${this.BASE_PATH}/match/${matchId}`,
      data
    );
    return response.data;
  }

  /**
   * Get all notes for a match with optional filtering
   * GET /api/v1/match-notes/match/:matchId
   */
  async getMatchNotes(matchId: string, query?: GetNotesQuery): Promise<NotesListResponse> {
    const response = await axiosInstance.get<NotesListResponse>(
      `${this.BASE_PATH}/match/${matchId}`,
      { params: query }
    );
    return response.data;
  }

  /**
   * Get a single note by ID
   * GET /api/v1/match-notes/:id
   */
  async getNoteById(noteId: string): Promise<MatchNote> {
    const response = await axiosInstance.get<MatchNote>(`${this.BASE_PATH}/${noteId}`);
    return response.data;
  }

  /**
   * Get notes for a specific point in the match
   * GET /api/v1/match-notes/match/:matchId/point/:setNumber/:gameNumber/:pointNumber
   */
  async getNotesForPoint(
    matchId: string,
    setNumber: number,
    gameNumber: number,
    pointNumber: number
  ): Promise<MatchNote[]> {
    const response = await axiosInstance.get<MatchNote[]>(
      `${this.BASE_PATH}/match/${matchId}/point/${setNumber}/${gameNumber}/${pointNumber}`
    );
    return response.data;
  }

  /**
   * Update a match note
   * PATCH /api/v1/match-notes/:id
   */
  async updateNote(noteId: string, data: UpdateMatchNoteRequest): Promise<MatchNote> {
    const response = await axiosInstance.patch<MatchNote>(
      `${this.BASE_PATH}/${noteId}`,
      data
    );
    return response.data;
  }

  /**
   * Delete a match note
   * DELETE /api/v1/match-notes/:id
   */
  async deleteNote(noteId: string): Promise<void> {
    await axiosInstance.delete(`${this.BASE_PATH}/${noteId}`);
  }

  /**
   * Toggle the resolved status of a note
   * POST /api/v1/match-notes/:id/toggle-resolve
   */
  async toggleResolveStatus(noteId: string): Promise<MatchNote> {
    const response = await axiosInstance.post<MatchNote>(
      `${this.BASE_PATH}/${noteId}/toggle-resolve`
    );
    return response.data;
  }

  /**
   * Search notes by text
   * GET /api/v1/match-notes/match/:matchId/search
   */
  async searchNotes(matchId: string, query: string): Promise<MatchNote[]> {
    const response = await axiosInstance.get<MatchNote[]>(
      `${this.BASE_PATH}/match/${matchId}/search`,
      { params: { q: query } }
    );
    return response.data;
  }

  /**
   * Get notes by tags
   * GET /api/v1/match-notes/match/:matchId/tags
   */
  async getNotesByTags(matchId: string, tags: string[]): Promise<MatchNote[]> {
    const response = await axiosInstance.get<MatchNote[]>(
      `${this.BASE_PATH}/match/${matchId}/tags`,
      { params: { tags: tags.join(',') } }
    );
    return response.data;
  }

  /**
   * Helper: Format note type for display
   */
  formatNoteType(noteType: NoteType): string {
    const typeMap: Record<NoteType, string> = {
      technical: 'Technical',
      tactical: 'Tactical',
      mental: 'Mental',
      physical: 'Physical',
      strategy: 'Strategy',
      general: 'General',
      improvement: 'Improvement',
      strength: 'Strength'
    };
    return typeMap[noteType] || noteType;
  }

  /**
   * Helper: Get priority badge color
   */
  getPriorityColor(priority: Priority): string {
    const colorMap: Record<Priority, string> = {
      high: 'bg-red-100 text-red-800 border-red-300',
      medium: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      low: 'bg-green-100 text-green-800 border-green-300'
    };
    return colorMap[priority] || colorMap.low;
  }

  /**
   * Helper: Get note type color
   */
  getNoteTypeColor(noteType: NoteType): string {
    const colorMap: Record<NoteType, string> = {
      technical: 'bg-blue-100 text-blue-800',
      tactical: 'bg-purple-100 text-purple-800',
      mental: 'bg-pink-100 text-pink-800',
      physical: 'bg-orange-100 text-orange-800',
      strategy: 'bg-indigo-100 text-indigo-800',
      general: 'bg-gray-100 text-gray-800',
      improvement: 'bg-red-100 text-red-800',
      strength: 'bg-green-100 text-green-800'
    };
    return colorMap[noteType] || colorMap.general;
  }

  /**
   * Helper: Format point detail for display
   */
  formatPointDetail(pointDetail?: PointDetail): string {
    if (!pointDetail) return 'General Match Note';
    
    const parts: string[] = [];
    
    if (pointDetail.setNumber) {
      parts.push(`Set ${pointDetail.setNumber}`);
    }
    
    if (pointDetail.gameNumber) {
      parts.push(`Game ${pointDetail.gameNumber}`);
    }
    
    if (pointDetail.pointNumber) {
      parts.push(`Point ${pointDetail.pointNumber}`);
    }
    
    if (pointDetail.isTiebreak) {
      parts.push('(Tiebreak)');
    }
    
    if (pointDetail.score) {
      parts.push(`[${pointDetail.score}]`);
    }
    
    return parts.length > 0 ? parts.join(' · ') : 'General Match Note';
  }

  /**
   * Helper: Format relative time
   */
  formatRelativeTime(dateString: string): string {
    const now = new Date();
    const date = new Date(dateString);
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    if (diffInMinutes < 10080) return `${Math.floor(diffInMinutes / 1440)}d ago`;
    return `${Math.floor(diffInMinutes / 10080)}w ago`;
  }
}

// Create and export instance
export const notesService = new NotesService();

