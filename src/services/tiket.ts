import {api} from '../utils/axios';
import {Platform} from 'react-native';
import {format} from 'date-fns';

export interface TiketAduan {
  id: number;
  nomor_tiket: string;
  pelanggan_id: number;
  deskripsi_aduan: string;
  tanggal_aduan: string;
  status: 'Menunggu' | 'Diproses' | 'Selesai' | 'Dibatalkan';
  prioritas: 'Rendah' | 'Sedang' | 'Tinggi';
  lampiran?: string;
  created_at: string;
  updated_at: string;
}

export interface TiketResponse {
  success: boolean;
  message: string;
  data?: {
    data: TiketAduan[];
    total: number;
    page: number;
    limit: number;
  };
  tiket?: TiketAduan;
  errors?: any;
}

export const fetchTiketByPelanggan = async (
  pelangganId: number,
  page = 1,
  limit = 10,
  filters?: {
    startDate?: string;
    endDate?: string;
    status?: string;
  },
): Promise<{
  data: TiketAduan[];
  total: number;
  page: number;
  limit: number;
}> => {
  try {
    console.log('Sending filters:', {
      // Debug log
      page,
      limit,
      startDate: filters?.startDate,
      endDate: filters?.endDate,
      status: filters?.status,
    });

    const response = await api.get(`/tiket/pelanggan/${pelangganId}`, {
      params: {
        page,
        limit,
        ...(filters?.startDate && {startDate: filters.startDate}),
        ...(filters?.endDate && {endDate: filters.endDate}),
        ...(filters?.status && {status: filters.status}),
      },
    });

    console.log('API Response:', response.data); // Debug log

    if (response.data.success) {
      return {
        data: response.data.data.data,
        total: response.data.data.total,
        page: response.data.data.page,
        limit: response.data.data.limit,
      };
    } else {
      console.warn('Failed to fetch tickets:', response.data.message);
      return {data: [], total: 0, page, limit};
    }
  } catch (error) {
    console.error('Error fetching tickets:', error);
    return {data: [], total: 0, page, limit};
  }
};

export const createTiket = async (
  pelangganId: number,
  deskripsi: string,
  prioritas: 'Rendah' | 'Sedang' | 'Tinggi',
  lampiran?: {
    uri: string;
    type?: string;
    name?: string;
  },
): Promise<TiketResponse> => {
  try {
    const formData = new FormData();

    formData.append('pelanggan_id', pelangganId.toString());
    formData.append('deskripsi_aduan', deskripsi);
    formData.append('status', 'Menunggu');
    formData.append('prioritas', prioritas);

    if (lampiran) {
      // Perbaikan struktur file untuk FormData
      const file = {
        uri: lampiran.uri,
        name: lampiran.name || `photo_${Date.now()}.jpg`,
        type: lampiran.type || 'image/jpeg',
      };

      formData.append('lampiran', file as any);
    }

    const response = await api.post('/tiket/create', formData);

    if (response.data.success) {
      return response.data;
    } else {
      console.warn('Gagal membuat tiket:', response.data.message);
      throw new Error(response.data.message || 'Gagal membuat tiket');
    }
  } catch (error: any) {
    const errorMessage =
      error?.response?.data?.message ||
      (error?.response?.data?.errors
        ? JSON.stringify(error.response.data.errors)
        : error.message || 'Terjadi kesalahan saat membuat tiket');
    throw new Error(errorMessage);
  }
};

export const updateTiket = async (
  tiketId: number,
  data: {
    deskripsi_aduan?: string;
    prioritas?: 'Rendah' | 'Sedang' | 'Tinggi';
    lampiran?: any;
  },
): Promise<TiketResponse> => {
  try {
    const formData = new FormData();

    if (data.deskripsi_aduan) {
      formData.append('deskripsi_aduan', data.deskripsi_aduan);
    }
    if (data.prioritas) {
      formData.append('prioritas', data.prioritas);
    }
    if (data.lampiran) {
      const uri =
        Platform.OS === 'android'
          ? data.lampiran.uri
          : data.lampiran.uri.replace('file://', '');
      const filename = uri.split('/').pop();
      const match = /\.(\w+)$/.exec(filename || '');
      const type = match ? `image/${match[1]}` : 'image';

      formData.append('lampiran', {
        uri,
        name: filename,
        type,
      } as any);
    }

    const response = await api.post(`/tiket/update/${tiketId}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    if (response.data.success) {
      return response.data;
    } else {
      console.warn('Gagal memperbarui tiket:', response.data.message);
      throw new Error(response.data.message || 'Gagal memperbarui tiket');
    }
  } catch (error: any) {
    if (error.response) {
      const errorMessage =
        error.response.data.message ||
        (error.response.data.errors
          ? JSON.stringify(error.response.data.errors)
          : error.message);
      throw new Error(errorMessage);
    } else {
      throw new Error(
        error.message || 'Terjadi kesalahan saat memperbarui tiket',
      );
    }
  }
};

export const deleteTiket = async (tiketId: number): Promise<TiketResponse> => {
  try {
    const response = await api.delete(`/tiket/delete/${tiketId}`);

    if (response.data.success) {
      return response.data;
    } else {
      console.warn('Gagal menghapus tiket:', response.data.message);
      throw new Error(response.data.message || 'Gagal menghapus tiket');
    }
  } catch (error: any) {
    if (error.response) {
      const errorMessage =
        error.response.data.message ||
        (error.response.data.errors
          ? JSON.stringify(error.response.data.errors)
          : error.message);
      throw new Error(errorMessage);
    } else {
      throw new Error(
        error.message || 'Terjadi kesalahan saat menghapus tiket',
      );
    }
  }
};

export const getTiketDetail = async (tiketId: number): Promise<TiketAduan> => {
  try {
    const response = await api.get(`/tiket/detail/${tiketId}`);

    console.log('API Response:', response.data);

    if (response.data.success && response.data.data?.tiket) {
      return response.data.data.tiket;
    } else {
      console.warn('Failed to fetch ticket detail:', response.data.message);
      throw new Error(response.data.message || 'Failed to fetch ticket detail');
    }
  } catch (error: any) {
    console.error('Error fetching ticket detail:', error);
    if (error.response) {
      const errorMessage =
        error.response.data.message ||
        (error.response.data.errors
          ? JSON.stringify(error.response.data.errors)
          : error.message);
      throw new Error(errorMessage);
    } else {
      throw new Error(
        error.message || 'Error occurred while fetching ticket detail',
      );
    }
  }
};

export const updateStatusTiket = async (
  tiketId: number,
  status: 'Selesai' | 'Dibatalkan',
): Promise<TiketResponse> => {
  try {
    const response = await api.post(
      `/tiket/update-status/${tiketId}`,
      {
        status,
      },
      {
        headers: {
          'Content-Type': 'application/json',
        },
      },
    );

    if (response.data.success) {
      return response.data;
    } else {
      console.warn('Gagal memperbarui status tiket:', response.data.message);
      throw new Error(
        response.data.message || 'Gagal memperbarui status tiket',
      );
    }
  } catch (error: any) {
    if (error.response) {
      const errorMessage =
        error.response.data.message ||
        (error.response.data.errors
          ? JSON.stringify(error.response.data.errors)
          : error.message);
      throw new Error(errorMessage);
    } else {
      throw new Error(
        error.message || 'Terjadi kesalahan saat memperbarui status tiket',
      );
    }
  }
};
