import {api} from '../utils/axios';

// Definisikan tipe data untuk respons API agar lebih aman
interface SettingsData {
  nama_perusahaan: string;
  email: string;
  alamat: string;
  logo: string;
  telepon_perusahaan: string;
  no_wa: string;
  deskripsi_perusahaan: string;
}

interface ApiResponse {
  success: boolean;
  message: string;
  data: SettingsData;
}

export const getPublicSettings = async (): Promise<ApiResponse> => {
  const response = await api.get<ApiResponse>('/settings/public');
  return response.data;
};
