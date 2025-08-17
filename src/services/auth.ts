import {api} from '../utils/axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {LOGIN_KEY, EXPIRE_TIME_MS} from '../utils/constants';

const login = async (
  no_layanan: string,
  password: string,
): Promise<boolean> => {
  try {
    const response = await api.post('/auth/login', {no_layanan, password});

    if (response.data.success) {
      const now = new Date().getTime();
      const dataToStore = {
        user: response.data.data.user,
        timestamp: now,
      };

      await AsyncStorage.setItem(LOGIN_KEY, JSON.stringify(dataToStore));
      return true;
    }

    return false;
  } catch (error) {
    console.error('Login error:', error);
    return false;
  }
};

const getStoredUser = async () => {
  const data = await AsyncStorage.getItem(LOGIN_KEY);
  if (!data) return null;

  try {
    const parsed = JSON.parse(data);
    const now = new Date().getTime();

    if (now - parsed.timestamp > EXPIRE_TIME_MS) {
      // expired
      await AsyncStorage.removeItem(LOGIN_KEY);
      return null;
    }

    return parsed.user;
  } catch (error) {
    console.error('Parse error:', error);
    return null;
  }
};

const logout = async () => {
  await AsyncStorage.removeItem(LOGIN_KEY);
};

const getUserDetail = async (userId: number) => {
  try {
    const response = await api.get(`/auth/detail-pelanggan/${userId}`);
    if (response.data.success) {
      return response.data.data.user;
    }
    return null;
  } catch (error) {
    console.error('Error get user detail:', error);
    return null;
  }
};

const updateUser = async (
  userId: number,
  data: {
    nama: string;
    email: string;
    no_wa: string;
    alamat: string;
    password?: string;
  },
) => {
  try {
    const response = await api.post(`/auth/update-pelanggan/${userId}`, data);
    return response.data.success ? response.data.data : null;
  } catch (error) {
    console.error('Error update user:', error);
    return null;
  }
};

const requestPasswordReset = async (no_layanan: string): Promise<any> => {
  try {
    const response = await api.post('/password/request-token', {no_layanan});
    if (response.data.success) {
      return response.data;
    }
    throw new Error(response.data.message || 'Gagal mengirim permintaan');
  } catch (error: any) {
    const errorMessage =
      error?.response?.data?.message ||
      error.message ||
      'Terjadi kesalahan pada server';
    throw new Error(errorMessage);
  }
};

const resetPassword = async (
  no_layanan: string,
  token: string,
  password: string,
  password_confirmation: string,
): Promise<any> => {
  try {
    const response = await api.post('/password/reset', {
      no_layanan,
      token,
      password,
      password_confirmation,
    });
    if (response.data.success) {
      return response.data;
    }
    throw new Error(response.data.message || 'Gagal mereset password');
  } catch (error: any) {
    const errorMessage =
      error?.response?.data?.message ||
      error.message ||
      'Terjadi kesalahan pada server';
    throw new Error(errorMessage);
  }
};

export default {
  login,
  getStoredUser,
  logout,
  getUserDetail,
  updateUser,
  requestPasswordReset,
  resetPassword,
};
