import api from './api';

export interface Review {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  serviceId: string;
  rating: number;
  comment: string;
  images?: string[];
  isVerified: boolean;
  reply?: {
    content: string;
    repliedAt: string;
    repliedBy: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface CreateReviewData {
  targetId: string;
  targetType: 'Service' | 'Combo';
  bookingId?: string;
  rating: number;
  comment: string;
  images?: string[];
}

export interface UpdateReviewData {
  rating?: number;
  comment?: string;
  images?: string[];
}

export const getServiceReviews = async (serviceId: string, page = 1, limit = 10, sort = '-createdAt') => {
  const response = await api.get(`/reviews/target/${serviceId}?targetType=Service&page=${page}&limit=${limit}&sort=${sort}`);
  return response.data;
};

export const getTargetReviews = async (targetId: string, targetType: 'Service' | 'Combo', page = 1, limit = 10, sort = '-createdAt') => {
  const response = await api.get(`/reviews/target/${targetId}?targetType=${targetType}&page=${page}&limit=${limit}&sort=${sort}`);
  return response.data;
};

export const createReview = async (data: CreateReviewData) => {
  const response = await api.post('/reviews', data);
  return response.data;
};

export const updateReview = async (id: string, data: UpdateReviewData) => {
  const response = await api.put(`/reviews/${id}`, data);
  return response.data;
};

export const deleteReview = async (id: string) => {
  const response = await api.delete(`/reviews/${id}`);
  return response.data;
};

export const getUserReviews = async (page = 1, limit = 10) => {
  const response = await api.get('/reviews/my-reviews', {
    params: { page, limit },
  });
  return response.data;
};
