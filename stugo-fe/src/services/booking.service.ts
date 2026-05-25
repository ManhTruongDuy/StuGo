import api from './api';
import type { Booking, ApiResponse } from '../types';

/**
 * Create a new booking
 * @param bookingData - Booking data
 */
export const createBooking = async (bookingData: {
  serviceId: string;
  date: string;
  timeSlot?: string;
  quantity: number;
  roomTypeId?: string; // For accommodation - the _id of roomType
  route?: string; // For transport
  bookingType?: 'reservation' | 'order'; // For restaurant
  orderItems?: Array<{ // For restaurant order
    menuItemId: string;
    name: string;
    price: number;
    quantity: number;
  }>;
  customerInfo?: {
    name?: string;
    phone?: string;
    email?: string;
    note?: string;
  };
}): Promise<Booking | null> => {
  try {
    const response = await api.post<ApiResponse<Booking>>('/bookings', bookingData);

    if (response.data.success && response.data.data) {
      const booking = response.data.data as any;
      return {
        id: booking._id || booking.id,
        userId: booking.userId || booking.userId?._id || '',
        serviceId: booking.serviceId || booking.serviceId?._id || '',
        serviceName: booking.serviceName,
        serviceType: booking.serviceType,
        date: booking.date,
        timeSlot: booking.timeSlot,
        quantity: booking.quantity,
        totalAmount: booking.totalAmount,
        depositAmount: booking.depositAmount,
        status: booking.status || 'pending',
        paymentStatus: booking.paymentStatus || 'pending',
        createdAt: booking.createdAt,
        updatedAt: booking.updatedAt,
      };
    }

    return null;
  } catch (error: any) {
    console.error('Error creating booking:', error);
    throw new Error(error.response?.data?.message || 'Không thể tạo đặt chỗ');
  }
};

/**
 * Get available slots for a service
 * @param serviceId - Service ID
 * @param date - Date string (YYYY-MM-DD)
 * @param route - Optional route for transport
 */
export const getAvailableSlots = async (
  serviceId: string,
  date: string,
  route?: string
): Promise<{ 
  slots: any[]; 
  type?: string;
  hasReservation?: boolean;
}> => {
  try {
    const params: any = { date };
    if (route) params.route = route;

    const response = await api.get<ApiResponse<any>>(`/bookings/slots/${serviceId}`, {
      params,
    });

    if (response.data.success) {
      return {
        slots: (response.data.data as any).slots || [],
        type: (response.data.data as any).type,
        hasReservation: (response.data.data as any).hasReservation,
      };
    }

    return { slots: [] };
  } catch (error) {
    console.error('Error fetching available slots:', error);
    return { slots: [] };
  }
};

/**
 * Get user's bookings
 */
export const getBookings = async (filters?: {
  status?: string;
  serviceType?: string;
  page?: number;
  limit?: number;
  startDate?: string;
  endDate?: string;
}): Promise<{ data: Booking[]; pagination?: any }> => {
  try {
    const params = new URLSearchParams();
    
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, value.toString());
        }
      });
    }

    const response = await api.get<ApiResponse<Booking[]>>(`/bookings?${params.toString()}`);

    if (response.data.success) {
      const bookings = (response.data as any).data.map((booking: any) => ({
        ...booking,
        id: booking._id || booking.id,
        userId: typeof booking.userId === 'object' ? (booking.userId?._id || '') : (booking.userId || ''),
        serviceId: typeof booking.serviceId === 'object' ? (booking.serviceId?._id || '') : (booking.serviceId || ''),
      }));

      return {
        data: bookings,
        pagination: (response.data as any).pagination,
      };
    }

    return { data: [] };
  } catch (error) {
    console.error('Error fetching bookings:', error);
    return { data: [] };
  }
};

/**
 * Get booking by ID
 * @param bookingId - Booking ID
 */
export const getBookingById = async (bookingId: string): Promise<Booking | null> => {
  try {
    const response = await api.get<ApiResponse<Booking>>(`/bookings/${bookingId}`);

    if (response.data.success && response.data.data) {
      const booking = response.data.data as any;
      return {
        id: booking._id || booking.id,
        userId: booking.userId || booking.userId?._id || '',
        serviceId: booking.serviceId || booking.serviceId?._id || '',
        serviceName: booking.serviceName,
        serviceType: booking.serviceType,
        date: booking.date,
        timeSlot: booking.timeSlot,
        ...(booking.route && { route: booking.route }),
        ...(booking.roomTypeName && { roomTypeName: booking.roomTypeName }),
        quantity: booking.quantity,
        totalAmount: booking.totalAmount,
        depositAmount: booking.depositAmount,
        status: booking.status || 'pending',
        paymentStatus: booking.paymentStatus || 'pending',
        ...(booking.customerInfo && { customerInfo: booking.customerInfo }),
        createdAt: booking.createdAt,
        updatedAt: booking.updatedAt,
      };
    }

    return null;
  } catch (error: any) {
    console.error('Error fetching booking:', error);
    throw new Error(error.response?.data?.message || 'Không thể lấy thông tin đặt chỗ');
  }
};

/**
 * Cancel a booking
 * @param bookingId - Booking ID
 */
export const cancelBooking = async (bookingId: string): Promise<boolean> => {
  try {
    const response = await api.post<ApiResponse<any>>(`/bookings/${bookingId}/cancel`);

    return response.data.success || false;
  } catch (error: any) {
    console.error('Error canceling booking:', error);
    throw new Error(error.response?.data?.message || 'Không thể hủy đặt chỗ');
  }
};
