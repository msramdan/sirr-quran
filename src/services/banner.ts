// src/services/banner.ts
import {api} from '../utils/axios';

export const fetchBanners = async () => {
  try {
    const response = await api.get('/banner-management');
    if (response.data.success) {
      return response.data.data.banners;
    } else {
      console.warn('Gagal mengambil data banner:', response.data.message);
      return [];
    }
  } catch (error) {
    console.error('Error fetch banner:', error);
    return [];
  }
};
