import api from './api';

export interface LinkedService {
  serviceId: string | any;
  supplierId: string | any;
  netPriceAtBooking?: number;
}

export interface ComboPricing {
  servedPrice: number;
  unservedPrice: number;
  privateRentalPrice: number;
}

export interface Combo {
  id?: string;
  _id?: string;
  resellerId: string | any;
  name: string;
  description: string;
  images: string[];
  linkedServices: LinkedService[];
  pricing: ComboPricing;
  status: 'active' | 'inactive';
  rating?: number;
  reviewCount?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface ComboFilter {
  search?: string;
  status?: string;
  resellerId?: string;
  sortBy?: string;
  page?: number;
  limit?: number;
}

export const getCombos = async (filters?: ComboFilter) => {
  const response = await api.get('/combos', { params: filters });
  return response.data;
};

export const getComboById = async (id: string) => {
  const response = await api.get(`/combos/${id}`);
  return response.data;
};

export const createCombo = async (data: any) => {
  const response = await api.post('/combos', data);
  return response.data;
};

export const updateCombo = async (id: string, data: any) => {
  const response = await api.put(`/combos/${id}`, data);
  return response.data;
};

export const deleteCombo = async (id: string) => {
  const response = await api.delete(`/combos/${id}`);
  return response.data;
};
