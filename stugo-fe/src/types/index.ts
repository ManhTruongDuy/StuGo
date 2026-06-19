// User Types
export interface User {
  id: string;
  email: string;
  fullName: string;
  avatar?: string;
  phone?: string;
  address?: string;
  city?: string;
  district?: string;
  ward?: string;
  bankName?: string;
  bankAccount?: string;
  bankAccountName?: string;
  role: 'user' | 'partner' | 'admin';
  plan?: 'free' | 'premium_user' | 'business_basic' | 'business_premium';
  contracts?: string[] | null;
  createdAt: string;
  updatedAt: string;
}

// Service Types
export type ServiceType = 'transport' | 'accommodation' | 'restaurant';

export interface Service {
  id: string;
  name: string;
  type: ServiceType;
  description: string;
  address: string;
  city: string;
  district: string;
  ward: string;
  latitude: number;
  longitude: number;
  images: string[];
  openTime: string;
  closeTime: string;
  priceRange: {
    min: number;
    max: number;
  };
  rating: number;
  reviewCount: number;
  isAvailable: boolean;
  popularity: number;
  bookingCount?: number;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
}

// Transport specific
export interface Route {
  id?: string;
  _id?: string;
  name: string;
  price: number;
}

export interface Transport extends Service {
  type: 'transport';
  vehicleType: string;
  seats: number;
  routes: (string | Route)[];
  departureTime: string[];
}

// Accommodation specific
export interface Accommodation extends Service {
  type: 'accommodation';
  roomTypes: RoomType[];
  amenities: string[];
  rules: string[];
}

export interface RoomType {
  id: string;
  name: string;
  price: number;
  capacity: number;
  available: number;
  images: string[];
}

// Restaurant specific
export interface Restaurant extends Service {
  type: 'restaurant';
  cuisine: string[];
  menuItems: MenuItem[];
  hasDelivery: boolean;
  hasReservation: boolean;
}

export interface MenuItem {
  id: string;
  name: string;
  price: number;
  description: string;
  image?: string;
  category: string;
}

// Booking Types
export type BookingStatus = 'pending' | 'confirmed' | 'cancelled' | 'completed';

export interface Booking {
  id: string;
  userId: string;
  serviceId: string;
  serviceName: string;
  serviceType: ServiceType;
  date: string;
  timeSlot?: string;
  route?: string;
  seats?: string[];
  roomTypeName?: string;
  quantity: number;
  totalAmount: number;
  depositAmount: number;
  hasInsurance?: boolean;
  status: BookingStatus;
  paymentStatus: 'pending' | 'deposit_paid' | 'fully_paid' | 'refunded';
  bookingType?: 'reservation' | 'order';
  orderType?: 'delivery' | 'pickup' | 'dine_in';
  customerInfo?: {
    name?: string;
    phone?: string;
    email?: string;
    note?: string;
  };
  createdAt: string;
  updatedAt: string;
}

// Review Types
export interface Review {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  serviceId: string;
  rating: number;
  comment: string;
  images?: string[];
  createdAt: string;
  updatedAt: string;
}

// Payment Types
export interface Payment {
  id: string;
  bookingId: string;
  amount: number;
  method: 'vietqr' | 'bank_transfer' | 'ewallet';
  status: 'pending' | 'completed' | 'failed';
  transactionId?: string;
  createdAt: string;
}

// Transaction & Withdrawal Types
export interface Transaction {
  id: string;
  userId: string;
  type: 'deposit' | 'withdrawal' | 'commission';
  amount: number;
  fee?: number;
  netAmount: number;
  status: 'pending' | 'completed' | 'failed';
  bankName?: string;
  accountNumber?: string;
  accountHolder?: string;
  requestDate: string;
  transferDate?: string;
}

// Dashboard Stats
export interface DashboardStats {
  totalRevenue: number;
  pendingBalance: number;
  todayBookings: number;
  totalBookings: number;
  popularServices: {
    id: string;
    name: string;
    bookings: number;
  }[];
  monthlyRevenue: {
    month: string;
    revenue: number;
    bookings: number;
  }[];
}

// Admin Stats
export interface AdminStats extends DashboardStats {
  totalUsers: number;
  totalPartners: number;
  totalServices: number;
  complaints: number;
}

// Complaint/Feedback
export interface Complaint {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  subject: string;
  message: string;
  status: 'pending' | 'resolved' | 'closed';
  response?: string;
  createdAt: string;
  updatedAt: string;
}

// Filter Types
export interface ServiceFilter {
  type?: ServiceType;
  city?: string;
  district?: string;
  priceMin?: number;
  priceMax?: number;
  rating?: number;
  isAvailable?: boolean;
  sortBy?: 'popularity' | 'rating' | 'price_asc' | 'price_desc' | 'newest';
  search?: string;
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Location Types
export interface Province {
  code: string;
  name: string;
}

export interface District {
  code: string;
  name: string;
  provinceCode: string;
}

export interface Ward {
  code: string;
  name: string;
  districtCode: string;
}

// Bank Types
export interface Bank {
  id: string;
  name: string;
  shortName: string;
  logo: string;
}
