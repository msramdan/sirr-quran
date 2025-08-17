import {api} from '../utils/axios';
import authService from './auth';

interface BalanceHistory {
  id: number;
  pelanggan_id: number;
  type: 'Penambahan' | 'Pengurangan';
  amount: string;
  balance_before: string;
  balance_after: string;
  description: string;
  created_at: string;
  updated_at: string | null;
}

interface BalanceHistoryResponse {
  success: boolean;
  message: string;
  data: {
    total: number;
    page: number;
    limit: number;
    data: BalanceHistory[];
  };
}

const getBalanceHistory = async (
  page: number = 1,
  limit: number = 10,
  filters?: {
    startDate?: string;
    endDate?: string;
    type?: 'Penambahan' | 'Pengurangan';
  },
): Promise<BalanceHistoryResponse | null> => {
  try {
    const storedUser = await authService.getStoredUser();
    if (!storedUser?.id) return null;

    const params = {
      page,
      limit,
      ...(filters?.startDate && {start_date: filters.startDate}),
      ...(filters?.endDate && {end_date: filters.endDate}),
      ...(filters?.type && {type: filters.type}),
    };

    const response = await api.get(
      `/balance/history-pelanggan/${storedUser.id}`,
      {params},
    );
    return response.data;
  } catch (error) {
    console.error('Error fetching balance history:', error);
    return null;
  }
};

export default {
  getBalanceHistory,
};

export type {BalanceHistory, BalanceHistoryResponse};
