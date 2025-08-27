import axiosInstance from "@/config/axios.config";

// Types for uploads
export interface Upload {
  _id: string;
  title: string;
  url: string;
  type: 'photo' | 'video';
  category: 'forehand' | 'backhand' | 'volley' | 'serve';
  user: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateUploadRequest {
  title: string;
  type: 'photo' | 'video';
  category: 'forehand' | 'backhand' | 'volley' | 'serve';
}

export interface UpdateUploadRequest {
  title?: string;
  category?: 'forehand' | 'backhand' | 'volley' | 'serve';
}

export interface SendUploadRequest {
  players: string[];
  message: string;
}

export interface UploadsQueryParams {
  page?: number;
  limit?: number;
  sort?: string;
  category?: string;
  type?: 'photo' | 'video';
}

// Upload Image
export const uploadImage = async (file: File, data: CreateUploadRequest): Promise<Upload> => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('title', data.title);
  formData.append('type', 'photo');
  formData.append('category', data.category);

  try {
    const response = await axiosInstance.post('/api/v1/uploads/image', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    
    console.log('Image upload successful:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error uploading image:', error);
    throw error;
  }
};

// Upload Video
export const uploadVideo = async (file: File, data: CreateUploadRequest): Promise<Upload> => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('title', data.title);
  formData.append('type', 'video');
  formData.append('category', data.category);

  try {
    const response = await axiosInstance.post('/api/v1/uploads/video', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    
    console.log('Video upload successful:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error uploading video:', error);
    throw error;
  }
};

// Get All Uploads
export const getAllUploads = async (params?: UploadsQueryParams): Promise<Upload[]> => {
  try {
    const queryParams = new URLSearchParams();
    
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.sort) queryParams.append('sort', params.sort);
    if (params?.category) queryParams.append('category', params.category);
    if (params?.type) queryParams.append('type', params.type);

    const url = `/api/v1/uploads${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    const response = await axiosInstance.get(url);
    
    console.log('Fetched uploads:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error fetching uploads:', error);
    throw error;
  }
};

// Get Single Upload
export const getUpload = async (id: string): Promise<Upload> => {
  try {
    const response = await axiosInstance.get(`/api/v1/uploads/${id}`);
    
    console.log('Fetched upload:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error fetching upload:', error);
    throw error;
  }
};

// Update Upload
export const updateUpload = async (id: string, data: UpdateUploadRequest): Promise<Upload[]> => {
  try {
    const response = await axiosInstance.patch(`/api/v1/uploads/${id}`, data);
    
    console.log('Upload updated successfully:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error updating upload:', error);
    throw error;
  }
};

// Delete Upload
export const deleteUpload = async (id: string): Promise<Upload[]> => {
  try {
    const response = await axiosInstance.delete(`/api/v1/uploads/${id}`);
    
    console.log('Upload deleted successfully:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error deleting upload:', error);
    throw error;
  }
};

// Send Upload to Players
export const sendUploadToPlayers = async (id: string, data: SendUploadRequest): Promise<{ message: string }> => {
  try {
    const response = await axiosInstance.post(`/api/v1/uploads/${id}/send`, data);
    
    console.log('Upload sent to players successfully:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error sending upload to players:', error);
    throw error;
  }
};

// Helper function to get uploads with pagination
export const getUploadsWithPagination = async (page: number = 1, limit: number = 10): Promise<{
  uploads: Upload[];
  hasMore: boolean;
  totalPages: number;
}> => {
  try {
    const uploads = await getAllUploads({ page, limit, sort: '-createdAt' });
    
    // Since the API doesn't return pagination metadata, we'll assume there are more if we get the full limit
    const hasMore = uploads.length === limit;
    const totalPages = Math.ceil(uploads.length / limit);
    
    return {
      uploads,
      hasMore,
      totalPages
    };
  } catch (error) {
    console.error('Error fetching uploads with pagination:', error);
    throw error;
  }
};

// Helper function to filter uploads by category
export const getUploadsByCategory = async (category: string): Promise<Upload[]> => {
  try {
    return await getAllUploads({ category });
  } catch (error) {
    console.error('Error fetching uploads by category:', error);
    throw error;
  }
};

// Helper function to filter uploads by type
export const getUploadsByType = async (type: 'photo' | 'video'): Promise<Upload[]> => {
  try {
    return await getAllUploads({ type });
  } catch (error) {
    console.error('Error fetching uploads by type:', error);
    throw error;
  }
};
