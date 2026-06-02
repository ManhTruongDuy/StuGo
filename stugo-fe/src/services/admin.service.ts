import api from './api';
import type { ApiResponse, User, Complaint } from '../types';

// ===================== USERS =====================

export const getAdminUsers = async (params?: {
  role?: 'user' | 'partner' | 'admin';
  status?: 'active' | 'banned' | 'pending';
  search?: string;
  page?: number;
  limit?: number;
}): Promise<{ data: User[]; pagination?: any }> => {
  const searchParams = new URLSearchParams();

  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        searchParams.append(key, value.toString());
      }
    });
  }

  const response = await api.get<ApiResponse<any>>(`/users?${searchParams.toString()}`);

  if (response.data.success) {
    return {
      data: (response.data as any).data.map((u: any) => ({
        id: u.id || u._id,
        email: u.email,
        fullName: u.fullName,
        avatar: u.avatar,
        phone: u.phone,
        address: u.address,
        city: u.city,
        district: u.district,
        ward: u.ward,
        role: u.role,
        plan: u.plan || 'free',
        status: u.status,
        createdAt: u.createdAt,
        updatedAt: u.updatedAt,
      })) as User[],
      pagination: (response.data as any).pagination,
    };
  }

  return { data: [] };
};

export const updateUserStatus = async (
  userId: string,
  status: 'active' | 'banned' | 'pending'
): Promise<User | null> => {
  const response = await api.patch<ApiResponse<any>>(`/users/${userId}/status`, { status });
  if (response.data.success) {
    return response.data.data;
  }
  return null;
};

// ===================== PARTNERS =====================

export const getPartners = async (params?: {
  search?: string;
  status?: 'active' | 'banned';
  page?: number;
  limit?: number;
}): Promise<{ data: any[]; pagination?: any }> => {
  const searchParams = new URLSearchParams();

  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        searchParams.append(key, value.toString());
      }
    });
  }

  const response = await api.get<ApiResponse<any>>(`/users/partners?${searchParams.toString()}`);

  if (response.data.success) {
    return {
      data: (response.data as any).data.map((p: any) => ({
        id: p.id || p._id,
        email: p.email,
        fullName: p.fullName,
        avatar: p.avatar,
        phone: p.phone,
        address: p.address,
        city: p.city,
        district: p.district,
        role: p.role,
        status: p.status || 'active',
        servicesCount: p.servicesCount || 0,
        totalRevenue: p.totalRevenue || 0,
        createdAt: p.createdAt,
      })),
      pagination: (response.data as any).pagination,
    };
  }

  return { data: [] };
};

// ===================== BOOKINGS =====================

export const getAdminBookings = async (params?: {
  status?: string;
  serviceType?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}): Promise<{ data: any[]; pagination?: any }> => {
  const searchParams = new URLSearchParams();

  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        searchParams.append(key, value.toString());
      }
    });
  }

  const response = await api.get<ApiResponse<any>>(`/bookings?${searchParams.toString()}`);

  if (response.data.success) {
    return {
      data: (response.data as any).data.map((b: any) => ({
        id: b.id || b._id,
        userId: b.userId,
        userName: b.userId?.fullName || 'N/A',
        userEmail: b.userId?.email || '',
        serviceId: b.serviceId,
        serviceName: b.serviceName || b.serviceId?.name || 'N/A',
        serviceType: b.serviceType || b.serviceId?.type || 'N/A',
        date: b.date,
        timeSlot: b.timeSlot,
        quantity: b.quantity,
        totalAmount: b.totalAmount,
        depositAmount: b.depositAmount,
        status: b.status,
        paymentStatus: b.paymentStatus,
        createdAt: b.createdAt,
      })),
      pagination: (response.data as any).pagination,
    };
  }

  return { data: [] };
};

export const confirmBooking = async (bookingId: string): Promise<boolean> => {
  const response = await api.patch<ApiResponse<any>>(`/bookings/${bookingId}/confirm`);
  return response.data.success;
};

export const cancelBooking = async (bookingId: string): Promise<boolean> => {
  const response = await api.post<ApiResponse<any>>(`/bookings/${bookingId}/cancel`);
  return response.data.success;
};

// ===================== TRANSACTIONS =====================

export const getAdminTransactions = async (params?: {
  status?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}): Promise<{ data: any[]; pagination?: any; stats?: any }> => {
  const searchParams = new URLSearchParams();

  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        searchParams.append(key, value.toString());
      }
    });
  }

  const response = await api.get<ApiResponse<any>>(`/payments?${searchParams.toString()}`);

  if (response.data.success) {
    return {
      data: (response.data as any).data.map((t: any) => ({
        id: t.id || t._id,
        orderCode: t.orderCode,
        bookingId: t.bookingId,
        userId: t.userId,
        userName: t.userId?.fullName || t.bookingId?.userId?.fullName || 'N/A',
        amount: t.amount,
        status: t.status,
        method: t.method,
        transactionId: t.transactionId,
        createdAt: t.createdAt,
        paidAt: t.paidAt,
      })),
      pagination: (response.data as any).pagination,
    };
  }

  return { data: [] };
};

export const getPaymentStats = async (): Promise<any> => {
  const response = await api.get<ApiResponse<any>>('/payments/stats');
  if (response.data.success) {
    return response.data.data;
  }
  return null;
};

// ===================== COMPLAINTS =====================

export const getComplaints = async (params?: {
  status?: 'pending' | 'in_progress' | 'resolved' | 'closed';
  category?: string;
  priority?: 'low' | 'medium' | 'high';
  page?: number;
  limit?: number;
}): Promise<{ data: Complaint[]; pagination?: any }> => {
  const searchParams = new URLSearchParams();

  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        searchParams.append(key, value.toString());
      }
    });
  }

  const response = await api.get<ApiResponse<any>>(`/complaints?${searchParams.toString()}`);

  if (response.data.success) {
    return {
      data: (response.data as any).data.map((c: any) => ({
        id: c.id || c._id,
        userId: c.userId?._id || c.userId,
        userName: c.userId?.fullName || 'N/A',
        userEmail: c.userId?.email || '',
        serviceId: c.serviceId,
        serviceName: c.serviceId?.name || '',
        bookingId: c.bookingId,
        subject: c.subject,
        message: c.message,
        category: c.category || 'other',
        priority: c.priority || 'medium',
        status: c.status,
        response: c.response,
        resolution: c.resolution,
        resolutionNote: c.resolutionNote,
        images: c.images || [],
        createdAt: c.createdAt,
        updatedAt: c.updatedAt,
      })),
      pagination: (response.data as any).pagination,
    };
  }

  return { data: [] };
};

export const getComplaintById = async (id: string): Promise<Complaint | null> => {
  const response = await api.get<ApiResponse<any>>(`/complaints/${id}`);
  if (response.data.success) {
    const c = response.data.data;
    return {
      id: c.id || c._id,
      userId: c.userId?._id || c.userId,
      userName: c.userId?.fullName || 'N/A',
      userEmail: c.userId?.email || '',
      subject: c.subject,
      message: c.message,
      status: c.status,
      response: c.response,
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
    };
  }
  return null;
};

export const respondToComplaint = async (
  complaintId: string,
  content: string
): Promise<boolean> => {
  const response = await api.post<ApiResponse<any>>(`/complaints/${complaintId}/respond`, {
    content,
  });
  return response.data.success;
};

export const resolveComplaint = async (
  complaintId: string,
  resolution: string,
  resolutionNote?: string
): Promise<boolean> => {
  const response = await api.post<ApiResponse<any>>(`/complaints/${complaintId}/resolve`, {
    resolution,
    resolutionNote,
  });
  return response.data.success;
};

export const updateComplaintStatus = async (
  complaintId: string,
  status: string,
  priority?: string
): Promise<boolean> => {
  const response = await api.patch<ApiResponse<any>>(`/complaints/${complaintId}/status`, {
    status,
    priority,
  });
  return response.data.success;
};

export const getComplaintStats = async (): Promise<any> => {
  const response = await api.get<ApiResponse<any>>('/complaints/stats');
  if (response.data.success) {
    return response.data.data;
  }
  return null;
};
