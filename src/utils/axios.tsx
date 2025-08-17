import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {BASE_URL, API_KEY, LOGIN_KEY} from './constants';

// Buat instance axios
const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'X-API-KEY': API_KEY,
    Accept: 'application/json',
    'Content-Type': 'application/json',
  },
  timeout: 10000, // Menambahkan timeout untuk mencegah request hang
});

// Tambahkan interceptor untuk menyisipkan token otorisasi pada setiap request
api.interceptors.request.use(
  async config => {
    try {
      const storedData = await AsyncStorage.getItem(LOGIN_KEY);
      if (storedData) {
        const parsedData = JSON.parse(storedData);
        // Pastikan token ada di dalam data yang tersimpan
        if (parsedData && parsedData.token) {
          config.headers.Authorization = `Bearer ${parsedData.token}`;
        }
      }
    } catch (error) {
      console.error('Error reading token from AsyncStorage', error);
    }
    return config;
  },
  error => {
    return Promise.reject(error);
  },
);

// Gunakan HANYA export bernama (named export)
export {api};
