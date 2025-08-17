import {api} from '../utils/axios';
import {Platform} from 'react-native';

export interface TopupHistory {
  id: number;
  no_topup: string;
  nominal: number;
  status:
    | 'pending'
    | 'success'
    | 'failed'
    | 'canceled'
    | 'refunded'
    | 'expired';
  metode: 'manual' | 'tripay';
  metode_topup: string;
  tanggal_topup: string;
  created_at: string;
  bukti_topup?: string;
  bank_account_id?: number;
}

export interface BankAccount {
  id: number;
  nama_bank: string;
  logo_bank: string | null;
  pemilik_rekening: string;
  nomor_rekening: string;
}

/**
 * Mengambil riwayat top up pelanggan dengan filter.
 */
export const fetchTopupHistory = async (
  pelangganId: number,
  page = 1,
  limit = 10,
  filters?: {
    startDate?: string;
    endDate?: string;
    status?: string;
    metode?: string;
  },
) => {
  try {
    const response = await api.get(`/topup/history/${pelangganId}`, {
      params: {
        page,
        limit,
        ...(filters?.startDate && {start_date: filters.startDate}),
        ...(filters?.endDate && {end_date: filters.endDate}),
        ...(filters?.status && {status: filters.status}),
        ...(filters?.metode && {metode: filters.metode}),
      },
    });

    if (response.data.success) {
      return response.data.data;
    }
    return {data: [], total: 0, page, limit};
  } catch (error) {
    console.error('Error fetching topup history:', error);
    throw error;
  }
};

/**
 * Mengambil daftar rekening bank untuk tujuan transfer.
 */
export const getBankAccounts = async (): Promise<BankAccount[]> => {
  try {
    const response = await api.get('/payment/banks');
    if (response.data.success) {
      return response.data.data.banks;
    }
    return [];
  } catch (error) {
    console.error('Error fetching bank accounts:', error);
    throw error;
  }
};

/**
 * Membuat permintaan top up manual baru.
 */
export const createManualTopup = async (
  pelangganId: number,
  nominal: string,
  bankAccountId: number,
  buktiTopup: {uri: string; type: string; name: string},
) => {
  try {
    const formData = new FormData();
    formData.append('pelanggan_id', pelangganId.toString());
    formData.append('nominal', nominal);
    formData.append('bank_account_id', bankAccountId.toString());
    formData.append('bukti_topup', {
      uri:
        Platform.OS === 'android'
          ? buktiTopup.uri
          : buktiTopup.uri.replace('file://', ''),
      type: buktiTopup.type,
      name: buktiTopup.name,
    } as any);

    const response = await api.post('/topup/manual', formData, {
      headers: {'Content-Type': 'multipart/form-data'},
    });

    if (!response.data.success) {
      throw new Error(
        response.data.message || 'Gagal membuat permintaan top up',
      );
    }
    return response.data;
  } catch (error) {
    console.error('Error creating manual topup:', error);
    throw error;
  }
};

/**
 * Membuat transaksi top up otomatis melalui Tripay.
 */
export const createTripayTopup = async (
  pelangganId: number,
  nominal: number,
  methodCode: string,
) => {
  try {
    const response = await api.post('/topup/tripay', {
      pelanggan_id: pelangganId,
      nominal: nominal,
      method_code: methodCode,
    });

    if (!response.data.success) {
      throw new Error(
        response.data.message || 'Gagal membuat transaksi top up',
      );
    }
    return response.data;
  } catch (error: any) {
    console.error('Error creating Tripay topup:', error);
    const errorMessage =
      error?.response?.data?.message ||
      error.message ||
      'Terjadi kesalahan pada server';
    throw new Error(errorMessage);
  }
};

export const updateManualTopup = async (
  topupId: number,
  data: {
    nominal: string;
    bank_account_id: number;
    bukti_topup?: {uri: string; type: string; name: string};
  },
) => {
  try {
    const formData = new FormData();
    formData.append('nominal', data.nominal);
    formData.append('bank_account_id', data.bank_account_id.toString());

    if (data.bukti_topup) {
      formData.append('bukti_topup', {
        uri:
          Platform.OS === 'android'
            ? data.bukti_topup.uri
            : data.bukti_topup.uri.replace('file://', ''),
        type: data.bukti_topup.type,
        name: data.bukti_topup.name,
      } as any);
    }

    // Laravel method spoofing
    formData.append('_method', 'POST');

    const response = await api.post(
      `/topup/manual/update/${topupId}`,
      formData,
      {
        headers: {'Content-Type': 'multipart/form-data'},
      },
    );

    if (!response.data.success) {
      throw new Error(response.data.message || 'Gagal memperbarui top up');
    }
    return response.data;
  } catch (error: any) {
    console.error('Error updating manual topup:', error);
    const errorMessage =
      error?.response?.data?.message || error.message || 'Terjadi kesalahan';
    throw new Error(errorMessage);
  }
};

export const deleteManualTopup = async (topupId: number) => {
  try {
    const response = await api.delete(`/topup/manual/delete/${topupId}`);
    if (!response.data.success) {
      throw new Error(response.data.message || 'Gagal menghapus top up');
    }
    return response.data;
  } catch (error: any) {
    console.error('Error deleting manual topup:', error);
    const errorMessage =
      error?.response?.data?.message || error.message || 'Terjadi kesalahan';
    throw new Error(errorMessage);
  }
};
