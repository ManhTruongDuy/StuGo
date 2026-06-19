import api from './api';

export interface UpdateUserData {
    fullName?: string;
    phone?: string;
    address?: string;
    city?: string;
    district?: string;
    ward?: string;
    bankName?: string;
    bankAccount?: string;
    bankAccountName?: string;
    avatar?: string;
    contracts?: string[] | null;
}

export const updateUserProfile = async (userId: string, data: UpdateUserData) => {
    const response = await api.put(`/users/${userId}`, data);
    return response.data;
};

export const getUserProfile = async (userId: string) => {
    const response = await api.get(`/users/${userId}`);
    return response.data;
};
