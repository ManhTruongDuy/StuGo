import api from './api';
import type { ApiResponse } from '../types';

export interface Payment {
  id: string;
  bookingId: string;
  orderCode: number;
  amount: number;
  description: string;
  status: 'pending' | 'paid' | 'cancelled';
  checkoutUrl?: string;
  qrCode?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreatePaymentResponse {
  payment: Payment;
  checkoutUrl: string;
  qrCode: string;
  orderCode: number;
}

/**
 * Create payment link for a booking (generic - auto-detects service type)
 * @param bookingId - Booking ID
 */
export const createPayment = async (bookingId: string): Promise<CreatePaymentResponse | null> => {
  try {
    const response = await api.post<ApiResponse<CreatePaymentResponse>>('/payments', {
      bookingId,
    });

    if (response.data.success && response.data.data) {
      return response.data.data;
    }

    return null;
  } catch (error: any) {
    console.error('Error creating payment:', error);
    throw new Error(error.response?.data?.message || 'Không thể tạo link thanh toán');
  }
};

/**
 * Create payment link for accommodation booking
 * @param bookingId - Booking ID
 * @param paymentType - Payment type: 'deposit' (30%) or 'full' (100%)
 */
export const createAccommodationPayment = async (bookingId: string, paymentType: 'deposit' | 'full' = 'deposit'): Promise<CreatePaymentResponse | null> => {
  try {
    const response = await api.post<ApiResponse<CreatePaymentResponse>>('/payments/accommodation', {
      bookingId,
      paymentType,
    });

    if (response.data.success && response.data.data) {
      return response.data.data;
    }

    return null;
  } catch (error: any) {
    console.error('Error creating accommodation payment:', error);
    throw new Error(error.response?.data?.message || 'Không thể tạo link thanh toán');
  }
};

/**
 * Create payment link for restaurant booking
 * @param bookingId - Booking ID
 * @param paymentType - Payment type: 'deposit' (30%) or 'full' (100%)
 */
export const createRestaurantPayment = async (bookingId: string, paymentType: 'deposit' | 'full' = 'deposit'): Promise<CreatePaymentResponse | null> => {
  try {
    const response = await api.post<ApiResponse<CreatePaymentResponse>>('/payments/restaurant', {
      bookingId,
      paymentType,
    });

    if (response.data.success && response.data.data) {
      return response.data.data;
    }

    return null;
  } catch (error: any) {
    console.error('Error creating restaurant payment:', error);
    throw new Error(error.response?.data?.message || 'Không thể tạo link thanh toán');
  }
};

/**
 * Create payment link for transport booking
 * @param bookingId - Booking ID
 * @param paymentType - Payment type: 'deposit' (30%) or 'full' (100%)
 */
export const createTransportPayment = async (bookingId: string, paymentType: 'deposit' | 'full' = 'deposit'): Promise<CreatePaymentResponse | null> => {
  try {
    const response = await api.post<ApiResponse<CreatePaymentResponse>>('/payments/transport', {
      bookingId,
      paymentType,
    });

    if (response.data.success && response.data.data) {
      return response.data.data;
    }

    return null;
  } catch (error: any) {
    console.error('Error creating transport payment:', error);
    throw new Error(error.response?.data?.message || 'Không thể tạo link thanh toán');
  }
};

/**
 * Get payment by order code
 * @param orderCode - Order code
 */
export const getPaymentByOrderCode = async (orderCode: number): Promise<Payment | null> => {
  try {
    const response = await api.get<ApiResponse<Payment>>(`/payments/${orderCode}`);

    if (response.data.success && response.data.data) {
      return response.data.data;
    }

    return null;
  } catch (error: any) {
    console.error('Error fetching payment:', error);
    throw new Error(error.response?.data?.message || 'Không thể lấy thông tin thanh toán');
  }
};

/**
 * Check payment status
 * @param orderCode - Order code
 */
export const checkPaymentStatus = async (orderCode: number): Promise<any> => {
  try {
    const response = await api.get<ApiResponse<any>>(`/payments/${orderCode}/status`);

    if (response.data.success && response.data.data) {
      return response.data.data;
    }

    return null;
  } catch (error: any) {
    console.error('Error checking payment status:', error);
    throw new Error(error.response?.data?.message || 'Không thể kiểm tra trạng thái thanh toán');
  }
};

/**
 * Cancel payment
 * @param orderCode - Order code
 * @param reason - Cancellation reason
 */
export const cancelPayment = async (orderCode: number, reason?: string): Promise<boolean> => {
  try {
    const response = await api.post<ApiResponse<any>>(`/payments/${orderCode}/cancel`, {
      reason,
    });

    return response.data.success || false;
  } catch (error: any) {
    console.error('Error canceling payment:', error);
    throw new Error(error.response?.data?.message || 'Không thể hủy thanh toán');
  }
};

export interface PaymentResponse {
  payment: Payment;
  checkoutUrl: string;
  qrCode: string;
  orderCode: number;
}

/**
 * Create payment link for remaining amount
 * @param bookingId - Booking ID
 */
export const createRemainingPayment = async (bookingId: string): Promise<PaymentResponse | null> => {
  try {
    const response = await api.post<ApiResponse<PaymentResponse>>('/payments/remaining', {
      bookingId
    });

    if (response.data.success) {
      return response.data.data;
    }

    return null;
  } catch (error: any) {
    console.error('Error creating remaining payment:', error);
    throw error;
  }
};
