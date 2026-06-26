import api from './api';
import type { Service, Review, ApiResponse } from '../types';

/**
 * Transform backend service data to frontend format
 */
const transformService = (service: any): Service => {
  const baseService: any = {
    id: service._id || service.id,
    name: service.name,
    type: service.type,
    description: service.description,
    address: service.address,
    city: service.city,
    district: service.district,
    ward: service.ward,
    latitude: service.location?.coordinates?.[1] || service.latitude || 0,
    longitude: service.location?.coordinates?.[0] || service.longitude || 0,
    images: service.images || [],
    openTime: service.openTime || '00:00',
    closeTime: service.closeTime || '23:59',
    priceRange: {
      min: service.priceRange?.min || service.priceMin || 0,
      max: service.priceRange?.max || service.priceMax || 0,
    },
    rating: service.rating || service.reviewStats?.averageRating || 0,
    reviewCount: service.reviewCount || service.reviewStats?.totalReviews || 0,
    isAvailable: service.isAvailable !== false && service.status === 'active',
    status: service.status || 'active',
    popularity: service.popularity || 0,
    bookingCount: service.bookingCount || 0,
    ownerId: typeof service.ownerId === 'object' ? service.ownerId?._id : service.ownerId,
    createdAt: service.createdAt,
    updatedAt: service.updatedAt,
  };

  // Add type-specific fields
  if (service.type === 'transport') {
    baseService.vehicleType = service.vehicleType;
    baseService.seats = service.seats;
    baseService.routes = (service.routes || []).map((route: any, index: number) => {
      if (typeof route === 'string') {
        return {
          id: `route-${index}`,
          name: route,
          price: service.priceRange?.min || 0
        };
      }
      return {
        id: route.id || route._id,
        _id: route._id,
        name: route.name,
        price: route.price
      };
    });
    baseService.departureTime = service.departureTime || [];
  } else if (service.type === 'accommodation') {
    baseService.roomTypes = (service.roomTypes || []).map((rt: any, index: number) => ({
      id: rt._id?.toString() || `room-${index}`,
      name: rt.name,
      price: rt.price,
      capacity: rt.capacity,
      available: rt.available,
      images: rt.images || [],
    }));
    baseService.amenities = service.amenities || [];
    baseService.rules = service.rules || [];
  } else if (service.type === 'restaurant') {
    baseService.cuisine = service.cuisine || [];
    baseService.menuItems = (service.menuItems || []).map((mi: any, index: number) => ({
      id: mi._id?.toString() || `menu-${index}`,
      name: mi.name,
      price: mi.price,
      description: mi.description,
      image: mi.image,
      category: mi.category,
    }));
    baseService.hasDelivery = service.hasDelivery || false;
    baseService.hasReservation = service.hasReservation || false;
  } else if (service.type === 'carpool') {
    baseService.carpoolOptions = service.carpoolOptions;
  }

  return baseService as Service;
};

/**
 * Get popular services
 * @param limit - Number of services to return (default: 10)
 * @param type - Optional service type filter
 */
export const getPopularServices = async (
  limit: number = 10,
  type?: 'transport' | 'accommodation' | 'restaurant' | 'carpool'
): Promise<Service[]> => {
  try {
    const params = new URLSearchParams();
    params.append('limit', limit.toString());
    if (type) {
      params.append('type', type);
    }

    const response = await api.get<ApiResponse<Service[]>>(
      `/services/popular?${params.toString()}`
    );

    if (response.data.success) {
      // Transform backend data to frontend format
      return response.data.data.map((service: any) => transformService(service));
    }

    return [];
  } catch (error) {
    console.error('Error fetching popular services:', error);
    return [];
  }
};

/**
 * Get all services with filters
 */
export const getServices = async (filters?: {
  type?: 'transport' | 'accommodation' | 'restaurant' | 'carpool';
  city?: string;
  district?: string;
  priceMin?: number;
  priceMax?: number;
  rating?: number;
  isAvailable?: boolean;
  search?: string;
  sortBy?: 'popularity' | 'rating' | 'price_asc' | 'price_desc' | 'newest';
  page?: number;
  limit?: number;
}): Promise<{ data: Service[]; pagination?: any }> => {
  try {
    const params = new URLSearchParams();
    
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, value.toString());
        }
      });
    }

    const response = await api.get<ApiResponse<Service[]>>(
      `/services?${params.toString()}`
    );

    if (response.data.success) {
      const services = (response.data as any).data.map((service: any) => transformService(service));

      return {
        data: services,
        pagination: (response.data as any).pagination,
      };
    }

    return { data: [] };
  } catch (error) {
    console.error('Error fetching services:', error);
    return { data: [] };
  }
};

/**
 * Get service by ID
 * @param id - Service ID
 */
export const getServiceById = async (id: string): Promise<Service | null> => {
  try {
    const response = await api.get<ApiResponse<any>>(`/services/${id}`);

    if (response.data.success && response.data.data) {
      return transformService(response.data.data);
    }

    return null;
  } catch (error) {
    console.error('Error fetching service by ID:', error);
    return null;
  }
};

/**
 * Get reviews for a service
 * @param serviceId - Service ID
 * @param page - Page number (default: 1)
 * @param limit - Number of reviews per page (default: 10)
 */
export const getServiceReviews = async (
  serviceId: string,
  page: number = 1,
  limit: number = 10
): Promise<{ data: Review[]; pagination?: any }> => {
  try {
    const params = new URLSearchParams();
    params.append('page', page.toString());
    params.append('limit', limit.toString());

    // Assuming reviews endpoint is /services/:id/reviews or /reviews?serviceId=:id
    const response = await api.get<ApiResponse<Review[]>>(
      `/services/${serviceId}/reviews?${params.toString()}`
    );

    if (response.data.success) {
      const reviews = (response.data as any).data.map((review: any) => ({
        id: review._id || review.id,
        userId: review.userId || review.userId?._id || '',
        userName: review.userName || review.userId?.fullName || 'Người dùng',
        userAvatar: review.userAvatar || review.userId?.avatar,
        serviceId: review.serviceId || serviceId,
        rating: review.rating || 0,
        comment: review.comment || review.content || '',
        images: review.images || [],
        createdAt: review.createdAt,
        updatedAt: review.updatedAt,
      }));

      return {
        data: reviews,
        pagination: (response.data as any).pagination,
      };
    }

    return { data: [] };
  } catch (error) {
    console.error('Error fetching service reviews:', error);
    // If endpoint doesn't exist, return empty array
    return { data: [] };
  }
};

/**
 * Create new service (Partner/Admin only)
 */
export const createService = async (data: {
  type: 'transport' | 'accommodation' | 'restaurant' | 'carpool';
  name: string;
  description: string;
  address: string;
  city: string;
  district: string;
  ward?: string;
  latitude?: number;
  longitude?: number;
  openTime?: string;
  closeTime?: string;
  priceRange: {
    min: number;
    max: number;
  };
  images?: string[];
  // Transport specific
  vehicleType?: string;
  seats?: number;
  routes?: string[];
  departureTime?: string[];
  // Accommodation specific
  roomTypes?: Array<{
    name: string;
    price: number;
    capacity: number;
    available: number;
    images?: string[];
  }>;
  amenities?: string[];
  rules?: string[];
  // Restaurant specific
  cuisine?: string[];
  menuItems?: Array<{
    name: string;
    price: number;
    description?: string;
    image?: string;
    category?: string;
  }>;
  hasDelivery?: boolean;
  hasReservation?: boolean;
}): Promise<Service | null> => {
  try {
    const response = await api.post<ApiResponse<any>>('/services', data);

    if (response.data.success && response.data.data) {
      return transformService(response.data.data);
    }

    return null;
  } catch (error: any) {
    console.error('Error creating service:', error);
    throw error;
  }
};

/**
 * Get my services (Partner/Admin only)
 */
export const getMyServices = async (
  page: number = 1,
  limit: number = 20
): Promise<{ data: Service[]; pagination?: any }> => {
  try {
    const params = new URLSearchParams();
    params.append('page', page.toString());
    params.append('limit', limit.toString());

    const response = await api.get<ApiResponse<Service[]>>(
      `/services/my?${params.toString()}`
    );

    if (response.data.success) {
      const services = (response.data as any).data.map((service: any) => transformService(service));

      return {
        data: services,
        pagination: (response.data as any).pagination,
      };
    }

    return { data: [] };
  } catch (error) {
    console.error('Error fetching my services:', error);
    return { data: [] };
  }
};

/**
 * Delete service (Partner/Admin only)
 * @param id - Service ID
 */
export const deleteService = async (id: string): Promise<boolean> => {
  try {
    const response = await api.delete<ApiResponse<any>>(`/services/${id}`);
    return response.data.success || false;
  } catch (error: any) {
    console.error('Error deleting service:', error);
    throw new Error(error.response?.data?.message || 'Không thể xóa dịch vụ');
  }
};

/**
 * Update service (Partner/Admin only)
 * @param id - Service ID
 * @param data - Service data to update
 */
export const updateService = async (id: string, data: any): Promise<Service | null> => {
  try {
    const response = await api.put<ApiResponse<any>>(`/services/${id}`, data);
    
    if (response.data.success && response.data.data) {
      return transformService(response.data.data);
    }
    
    return null;
  } catch (error: any) {
    console.error('Error updating service:', error);
    throw new Error(error.response?.data?.message || 'Không thể cập nhật dịch vụ');
  }
};

export const getNearbyServices = async (params: {
  latitude: number;
  longitude: number;
  maxDistance?: number;
  types?: string[];
}): Promise<{ services: any[]; flashDeals: any[]; liveVehicles: any[] }> => {
  try {
    const query = new URLSearchParams({
      latitude: params.latitude.toString(),
      longitude: params.longitude.toString(),
      maxDistance: (params.maxDistance ?? 5000).toString(),
    });
    if (params.types?.length) {
      query.set('types', params.types.join(','));
    }
    const response = await api.get<ApiResponse<{ services: any[]; flashDeals: any[]; liveVehicles: any[] }>>(
      `/services/nearby?${query.toString()}`
    );
    return response.data.data ?? { services: [], flashDeals: [], liveVehicles: [] };
  } catch {
    return { services: [], flashDeals: [], liveVehicles: [] };
  }
};

/**
 * Update service status (Admin only)
 */
export const updateServiceStatus = async (
  id: string,
  status: 'active' | 'pending' | 'rejected' | 'suspended'
): Promise<boolean> => {
  try {
    const response = await api.patch<ApiResponse<any>>(`/services/${id}/status`, { status });
    return response.data.success || false;
  } catch (error: any) {
    console.error('Error updating service status:', error);
    throw new Error(error.response?.data?.message || 'Không thể cập nhật trạng thái dịch vụ');
  }
};
