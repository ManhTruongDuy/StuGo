import api from './api';


export interface LoginData {
  email: string;
  password: string;
}

export interface RegisterData {
  fullName: string;
  email: string;
  phone: string;
  password: string;
  role?: 'user' | 'partner';
}

export interface AuthResponse {
  success: boolean;
  data: {
    user: {
      id: string;
      email: string;
      fullName: string;
      avatar?: string;
      phone?: string;
      role: 'user' | 'partner' | 'admin';
      status: string;
      plan?: string;
    };
    token: string;
  };
  message: string;
}

export interface UserResponse {
  success: boolean;
  data: {
    id: string;
    email: string;
    fullName: string;
    avatar?: string;
    phone?: string;
    address?: string;
    city?: string;
    district?: string;
    ward?: string;
    role: 'user' | 'partner' | 'admin';
    status: string;
    plan?: string;
  };
}

// Email/Password login
export const loginWithEmail = async (data: LoginData): Promise<AuthResponse> => {
  const response = await api.post<AuthResponse>('/auth/login', data);
  return response.data;
};

// Email/Password register
export const register = async (data: RegisterData): Promise<AuthResponse> => {
  const response = await api.post<AuthResponse>('/auth/register', data);
  return response.data;
};

// Get current user
export const getCurrentUser = async (): Promise<UserResponse> => {
  const response = await api.get<UserResponse>('/auth/me');
  return response.data;
};

// Logout
export const logout = async (): Promise<void> => {
  await api.post('/auth/logout');
};

// Refresh token
export const refreshToken = async (): Promise<{ token: string }> => {
  const response = await api.post<{ success: boolean; data: { token: string } }>('/auth/refresh');
  return response.data.data;
};

export default {
  loginWithEmail,
  register,
  getCurrentUser,
  logout,
  refreshToken,
};
