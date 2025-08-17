import {api} from '../utils/axios';

export const fetchInformations = async (page = 1, limit = 10) => {
  try {
    const response = await api.get('/informasi-management', {
      params: {page, limit},
    });

    if (response.data.success) {
      return response.data.data;
    } else {
      console.warn('Gagal mengambil data informasi:', response.data.message);
      return {data: [], total: 0, page, limit};
    }
  } catch (error) {
    console.error('Error fetch informasi:', error);
    return {data: [], total: 0, page, limit};
  }
};

export const fetchInformationDetail = async (id: number) => {
  try {
    const response = await api.get(`/informasi-management/detail/${id}`);
    if (response.data.success) {
      return response.data.data.informasi; // Sesuai struktur response baru
    }
    return null;
  } catch (error) {
    console.error('Error fetch detail informasi:', error);
    return null;
  }
};

export const searchInformationsByJudul = async (
  query: string,
  page = 1,
  limit = 10,
) => {
  try {
    const response = await api.get('/informasi-management/search', {
      params: {q: query, page, limit},
    });

    if (response.data.success) {
      return response.data.data;
    } else {
      console.warn('Gagal mencari informasi:', response.data.message);
      return {data: [], total: 0, page, limit};
    }
  } catch (error) {
    console.error('Error search informasi:', error);
    return {data: [], total: 0, page, limit};
  }
};
