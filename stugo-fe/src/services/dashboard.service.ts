import api from './api';
import type { ApiResponse } from '../types';

export interface DashboardOverview {
  services: {
    total: number;
    active: number;
    pending: number;
    suspended: number;
  };
  bookings: {
    total: number;
    pending: number;
    confirmed: number;
    completed: number;
    cancelled: number;
    today: number;
  };
  revenue: {
    total: number;
    thisMonth: number;
    commissionTotal: number;
    commissionThisMonth: number;
  };
}

export interface RevenueData {
  _id: {
    year: number;
    month: number;
    day?: number;
    week?: number;
  };
  totalRevenue: number;
  depositRevenue: number;
  bookingCount: number;
}

export interface BookingByType {
  _id: string;
  count: number;
  revenue: number;
}

export interface RecentBooking {
  _id: string;
  serviceName: string;
  serviceType: string;
  date: string;
  status: string;
  paymentStatus: string;
  totalAmount: number;
  userId: {
    fullName: string;
    email: string;
    phone: string;
  };
  createdAt: string;
}

export interface TopService {
  _id: string;
  serviceName: string;
  serviceType: string;
  totalRevenue: number;
  bookingCount: number;
}

/**
 * Get dashboard overview statistics
 */
export const getDashboardOverview = async (): Promise<DashboardOverview | null> => {
  try {
    const response = await api.get<ApiResponse<DashboardOverview>>('/dashboard/overview');
    return response.data.success ? response.data.data : null;
  } catch (error: any) {
    console.error('Error fetching dashboard overview:', error);
    throw error;
  }
};

/**
 * Get revenue statistics
 * @param startDate - Start date (optional)
 * @param endDate - End date (optional)
 */
export const getRevenueStats = async (
  startDate?: string,
  endDate?: string
): Promise<RevenueData[]> => {
  try {
    const params: any = {};
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;

    const response = await api.get<ApiResponse<RevenueData[]>>('/dashboard/revenue', { params });
    return response.data.success ? response.data.data : [];
  } catch (error: any) {
    console.error('Error fetching revenue stats:', error);
    throw error;
  }
};

/**
 * Get bookings by service type
 */
export const getBookingsByType = async (): Promise<BookingByType[]> => {
  try {
    const response = await api.get<ApiResponse<BookingByType[]>>('/dashboard/bookings-by-type');
    return response.data.success ? response.data.data : [];
  } catch (error: any) {
    console.error('Error fetching bookings by type:', error);
    throw error;
  }
};

/**
 * Get recent bookings
 * @param limit - Number of bookings to fetch
 */
export const getRecentBookings = async (limit: number = 10): Promise<RecentBooking[]> => {
  try {
    const response = await api.get<ApiResponse<RecentBooking[]>>('/dashboard/recent-bookings', {
      params: { limit }
    });
    return response.data.success ? response.data.data : [];
  } catch (error: any) {
    console.error('Error fetching recent bookings:', error);
    throw error;
  }
};

/**
 * Get top services by revenue
 * @param limit - Number of services to fetch
 */
export const getTopServices = async (limit: number = 5): Promise<TopService[]> => {
  try {
    const response = await api.get<ApiResponse<TopService[]>>('/dashboard/top-services', {
      params: { limit }
    });
    return response.data.success ? response.data.data : [];
  } catch (error: any) {
    console.error('Error fetching top services:', error);
    throw error;
  }
};
