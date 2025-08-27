import axiosInstance from "@/config/axios.config";
import { useAuthStore } from "@/store/auth.store";

// Types for Community/Posts module based on API response
export interface CommunityUser {
  _id: string;
  firstName: string;
  lastName: string;
  avatar: string;
  lastOnline: string;
}

export interface Post {
  _id: string;
  content?: string;
  location?: string;
  photos: string[];
  user: CommunityUser;
  likes: number;
  liked: boolean;
  comments: number;
  createdAt: string;
  updatedAt: string;
}

export interface SinglePost extends Omit<Post, 'comments'> {
  comments: Comment[];
}

export interface Comment {
  _id: string;
  content: string;
  user: CommunityUser | string;
  post: string;
  parentComment?: string | null;
  replies: Comment[];
  likes: string[];
  createdAt: string;
  updatedAt: string;
  likesCount: number;
  liked: boolean;
  repliesCount: number;
}

export interface CreatePostRequest {
  content?: string;
  location?: string;
  files?: File[];
}

export interface UpdatePostRequest {
  content?: string;
  location?: string;
}

export interface CreateCommentRequest {
  content: string;
}

export interface UpdateCommentRequest {
  content: string;
}

export interface PostsResponse {
  success: boolean;
  message: string;
  data: Post[];
}

// For APIs that return posts directly (like GET /posts)
export interface PostsArrayResponse extends Array<Post> {}

export interface SinglePostResponse {
  success: boolean;
  message: string;
  data: SinglePost;
}

export interface PostOperationResponse {
  success: boolean;
  message: string;
  data: Post;
}

export interface CommentResponse {
  success: boolean;
  message: string;
  data: Comment;
}

export interface CommentsResponse {
  success: boolean;
  message: string;
  data: Comment[];
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  sort?: string;
  order?: 'asc' | 'desc';
}

// Community API Service
class CommunityService {
  constructor() {
    // Authentication is handled automatically by axiosInstance interceptors
  }

  /**
   * Check if user has coach role
   */
  private isCoach(): boolean {
    const authStore = useAuthStore.getState();
    return authStore.getRole() === 'coach';
  }

  /**
   * Check if user has player role
   */
  private isPlayer(): boolean {
    const authStore = useAuthStore.getState();
    return authStore.getRole() === 'player';
  }

  /**
   * Check if user has parent role
   */
  private isParent(): boolean {
    const authStore = useAuthStore.getState();
    return authStore.getRole() === 'parent';
  }

  /**
   * Check if user has valid role for community operations
   */
  private hasValidRole(): boolean {
    return this.isCoach() || this.isPlayer() || this.isParent();
  }

  /**
   * Create a new post
   * POST /api/v1/posts
   */
  async createPost(data: CreatePostRequest): Promise<PostOperationResponse> {
    if (!this.hasValidRole()) {
      throw new Error('Invalid role for this operation');
    }

    const formData = new FormData();
    if (data.content) formData.append('content', data.content);
    if (data.location) formData.append('location', data.location);
    if (data.files) {
      data.files.forEach((file) => {
        formData.append('files', file);
      });
    }

    const response = await axiosInstance.post<Post>('/api/v1/posts', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    
    // The API returns post data directly, so we wrap it in our expected format
    return {
      success: true,
      message: 'Post created successfully',
      data: response.data
    };
  }

  /**
   * Get timeline posts
   * GET /api/v1/posts
   */
  async getTimelinePosts(params: PaginationParams = {}): Promise<PostsResponse> {
    if (!this.hasValidRole()) {
      throw new Error('Invalid role for this operation');
    }

    const queryParams = new URLSearchParams();
    if (params.page) queryParams.append('page', params.page.toString());
    if (params.limit) queryParams.append('limit', params.limit.toString());
    if (params.sort) queryParams.append('sort', params.sort);
    if (params.order) queryParams.append('order', params.order);

    const url = `/api/v1/posts${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    const response = await axiosInstance.get<PostsArrayResponse>(url);
    
    // The API returns posts array directly, so we wrap it in our expected format
    return {
      success: true,
      message: 'Posts retrieved successfully',
      data: response.data
    };
  }

  /**
   * Get user's own posts
   * GET /api/v1/posts/me
   */
  async getMyPosts(params: PaginationParams = {}): Promise<PostsResponse> {
    if (!this.hasValidRole()) {
      throw new Error('Invalid role for this operation');
    }

    const queryParams = new URLSearchParams();
    if (params.page) queryParams.append('page', params.page.toString());
    if (params.limit) queryParams.append('limit', params.limit.toString());
    if (params.sort) queryParams.append('sort', params.sort);
    if (params.order) queryParams.append('order', params.order);

    const url = `/api/v1/posts/me${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    const response = await axiosInstance.get<PostsArrayResponse>(url);
    
    // The API returns posts array directly, so we wrap it in our expected format
    return {
      success: true,
      message: 'Posts retrieved successfully',
      data: response.data
    };
  }

  /**
   * Get single post
   * GET /api/v1/posts/{postId}
   */
  async getPost(postId: string): Promise<SinglePostResponse> {
    if (!this.hasValidRole()) {
      throw new Error('Invalid role for this operation');
    }

    const response = await axiosInstance.get<SinglePostResponse>(`/api/v1/posts/${postId}`);
    return response.data;
  }

  /**
   * Update post
   * PATCH /api/v1/posts/{postId}
   */
  async updatePost(postId: string, data: UpdatePostRequest): Promise<PostOperationResponse> {
    if (!this.hasValidRole()) {
      throw new Error('Invalid role for this operation');
    }

    const response = await axiosInstance.patch<PostOperationResponse>(`/api/v1/posts/${postId}`, data);
    return response.data;
  }

  /**
   * Delete post
   * DELETE /api/v1/posts/{postId}
   */
  async deletePost(postId: string): Promise<PostOperationResponse> {
    if (!this.hasValidRole()) {
      throw new Error('Invalid role for this operation');
    }

    const response = await axiosInstance.delete<PostOperationResponse>(`/api/v1/posts/${postId}`);
    return response.data;
  }

  /**
   * Toggle like post
   * PATCH /api/v1/posts/{postId}/like
   */
  async toggleLikePost(postId: string): Promise<PostOperationResponse> {
    if (!this.hasValidRole()) {
      throw new Error('Invalid role for this operation');
    }

    const response = await axiosInstance.patch<Post>(`/api/v1/posts/${postId}/like`);
    
    // The API returns post data directly, so we wrap it in our expected format
    return {
      success: true,
      message: 'Post liked successfully',
      data: response.data
    };
  }

  /**
   * Create comment
   * POST /api/v1/comments/{postId}
   */
  async createComment(postId: string, data: CreateCommentRequest): Promise<CommentResponse> {
    if (!this.hasValidRole()) {
      throw new Error('Invalid role for this operation');
    }

    const response = await axiosInstance.post<Comment>(`/api/v1/comments/${postId}`, data);
    
    // The API returns comment data directly, so we wrap it in our expected format
    return {
      success: true,
      message: 'Comment created successfully',
      data: response.data
    };
  }

  /**
   * Get post comments
   * GET /api/v1/comments/{postId}
   */
  async getPostComments(postId: string, params: PaginationParams = {}): Promise<CommentsResponse> {
    if (!this.hasValidRole()) {
      throw new Error('Invalid role for this operation');
    }

    const queryParams = new URLSearchParams();
    if (params.page) queryParams.append('page', params.page.toString());
    if (params.limit) queryParams.append('limit', params.limit.toString());
    if (params.sort) queryParams.append('sort', params.sort);
    if (params.order) queryParams.append('order', params.order);

    const url = `/api/v1/comments/${postId}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    const response = await axiosInstance.get<Comment[]>(url);
    
    // The API returns comments array directly, so we wrap it in our expected format
    return {
      success: true,
      message: 'Comments retrieved successfully',
      data: response.data
    };
  }

  /**
   * Get single comment
   * GET /api/v1/comments/{commentId}
   */
  async getComment(commentId: string): Promise<CommentResponse> {
    if (!this.hasValidRole()) {
      throw new Error('Invalid role for this operation');
    }

    const response = await axiosInstance.get<CommentResponse>(`/api/v1/comments/${commentId}`);
    return response.data;
  }

  /**
   * Update comment
   * PATCH /api/v1/comments/{commentId}
   */
  async updateComment(commentId: string, data: UpdateCommentRequest): Promise<CommentResponse> {
    if (!this.hasValidRole()) {
      throw new Error('Invalid role for this operation');
    }

    const response = await axiosInstance.patch<Comment>(`/api/v1/comments/${commentId}`, data);
    
    // The API returns comment data directly, so we wrap it in our expected format
    return {
      success: true,
      message: 'Comment updated successfully',
      data: response.data
    };
  }

  /**
   * Delete comment
   * DELETE /api/v1/comments/{commentId}
   */
  async deleteComment(commentId: string): Promise<CommentResponse> {
    if (!this.hasValidRole()) {
      throw new Error('Invalid role for this operation');
    }

    const response = await axiosInstance.delete<any>(`/api/v1/comments/${commentId}`);
    
    // The API returns a success response directly, so we wrap it in our expected format
    return {
      success: true,
      message: 'Comment deleted successfully',
      data: response.data
    };
  }

  /**
   * Toggle like comment
   * PATCH /api/v1/comments/{commentId}/like
   */
  async toggleLikeComment(commentId: string): Promise<CommentResponse> {
    if (!this.hasValidRole()) {
      throw new Error('Invalid role for this operation');
    }

    const response = await axiosInstance.patch<Comment>(`/api/v1/comments/${commentId}/like`);
    
    // The API returns comment data directly, so we wrap it in our expected format
    return {
      success: true,
      message: 'Comment liked successfully',
      data: response.data
    };
  }

  /**
   * Create reply to comment
   * POST /api/v1/comments/{commentId}/reply
   */
  async createReply(commentId: string, data: CreateCommentRequest): Promise<CommentResponse> {
    if (!this.hasValidRole()) {
      throw new Error('Invalid role for this operation');
    }

    const response = await axiosInstance.post<Comment>(`/api/v1/comments/${commentId}/reply`, data);
    
    // The API returns comment data directly, so we wrap it in our expected format
    return {
      success: true,
      message: 'Reply created successfully',
      data: response.data
    };
  }

  /**
   * Check if user can create posts
   */
  canCreatePosts(): boolean {
    return this.hasValidRole();
  }

  /**
   * Check if user can edit posts
   */
  canEditPosts(): boolean {
    return this.hasValidRole();
  }

  /**
   * Check if user can delete posts
   */
  canDeletePosts(): boolean {
    return this.hasValidRole();
  }

  /**
   * Check if user can comment
   */
  canComment(): boolean {
    return this.hasValidRole();
  }

  /**
   * Format post date for display
   */
  formatPostDate(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return 'Today';
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return `${diffDays} days ago`;
    } else {
      return date.toLocaleDateString('en-US', { 
        month: 'long', 
        day: 'numeric',
        year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
      });
    }
  }

  /**
   * Format post time for display
   */
  formatPostTime(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });
  }

  /**
   * Get file upload validation rules
   */
  getFileUploadRules() {
    return {
      maxFiles: 5,
      maxFileSize: 5 * 1024 * 1024, // 5MB
      supportedFormats: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif']
    };
  }
}

// Create and export instance
export const communityService = new CommunityService();
