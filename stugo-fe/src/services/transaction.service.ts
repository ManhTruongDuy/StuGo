import api from './api';
import type { ApiResponse } from '../types';

export interface Transaction {
  _id: string;
  userId: string;
  type: string;
  amount: number;
  fee: number;
  netAmount: number;
  bankName: string;
  accountNumber: string;
  accountHolder: string;
  status: 'pending' | 'completed' | 'failed';
  createdAt: string;
  updatedAt: string;
  processedAt?: string;
  processedBy?: string;
}

export interface BalanceData {
  totalRevenue: number;
  withdrawn: number;
  available: number;
}

export interface WithdrawRequest {
  amount: number;
  bankName: string;
  accountNumber: string;
  accountHolder: string;
}

/**
 * Get available balance for partner
 */
export const getBalance = async (): Promise<BalanceData | null> => {
  try {
    const response = await api.get<ApiResponse<BalanceData>>('/transactions/balance');
    return response.data.success ? response.data.data : null;
  } catch (error: any) {
    console.error('Error fetching balance:', error);
    throw error;
  }
};

/**
 * Get transactions history
 */
export const getTransactions = async (status?: string, page: number = 1, limit: number = 20) => {
  try {
    const params: any = { page, limit };
    if (status && status !== 'all') {
      params.status = status;
    }
    const response = await api.get<ApiResponse<Transaction[]>>('/transactions', { params });
    return response.data;
  } catch (error: any) {
    console.error('Error fetching transactions:', error);
    throw error;
  }
};

/**
 * Request a withdrawal
 */
export const requestWithdrawal = async (data: WithdrawRequest) => {
  try {
    const response = await api.post<ApiResponse<Transaction>>('/transactions/withdraw', data);
    return response.data;
  } catch (error: any) {
    console.error('Error requesting withdrawal:', error);
    throw new Error(error.response?.data?.message || 'Không thể gửi yêu cầu rút tiền');
  }
};
