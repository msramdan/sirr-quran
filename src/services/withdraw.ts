// src/services/withdraw.ts
import {api} from '../utils/axios';

export interface WithdrawHistory {
  id: number;
  pelanggan_id: number;
  nominal_wd: number;
  status: 'Pending' | 'Approved' | 'Rejected';
  tanggal_wd: string;
  created_at: string;
  updated_at: string;
}

export const fetchWithdrawHistory = async (
  pelangganId: number,
  page = 1,
  limit = 10,
) => {
  try {
    const response = await api.get(`/withdraw/history/${pelangganId}`, {
      params: {page, limit},
    });
    if (response.data.success) {
      return response.data.data;
    }
    return {data: [], total: 0};
  } catch (error) {
    console.error('Error fetching withdraw history:', error);
    throw error;
  }
};

export const createWithdraw = async (
  pelangganId: number,
  nominal: string,
  tanggalWd: string,
) => {
  try {
    const response = await api.post('/withdraw/create', {
      pelanggan_id: pelangganId,
      nominal_wd: nominal,
      tanggal_wd: tanggalWd,
    });
    if (!response.data.success) {
      throw new Error(response.data.message || 'Gagal membuat permintaan');
    }
    return response.data;
  } catch (error: any) {
    const errorMessage =
      error?.response?.data?.message || error.message || 'Terjadi kesalahan';
    throw new Error(errorMessage);
  }
};

export const updateWithdraw = async (withdrawId: number, nominal: string) => {
  try {
    const response = await api.post(`/withdraw/update/${withdrawId}`, {
      nominal_wd: nominal,
    });
    if (!response.data.success) {
      throw new Error(response.data.message || 'Gagal memperbarui permintaan');
    }
    return response.data;
  } catch (error: any) {
    const errorMessage =
      error?.response?.data?.message || error.message || 'Terjadi kesalahan';
    throw new Error(errorMessage);
  }
};

export const deleteWithdraw = async (withdrawId: number) => {
  try {
    const response = await api.delete(`/withdraw/delete/${withdrawId}`);
    if (!response.data.success) {
      throw new Error(response.data.message || 'Gagal menghapus permintaan');
    }
    return response.data;
  } catch (error: any) {
    const errorMessage =
      error?.response?.data?.message || error.message || 'Terjadi kesalahan';
    throw new Error(errorMessage);
  }
};
