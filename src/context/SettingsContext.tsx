import React, {
  createContext,
  useState,
  useEffect,
  useContext,
  ReactNode,
} from 'react';
import {getPublicSettings} from '../services/settings';

// Definisikan tipe untuk data yang akan disimpan di context
interface Settings {
  logoUrl: string | null;
  companyName: string | null;
}

// Buat context
const SettingsContext = createContext<Settings>({
  logoUrl: null,
  companyName: null,
});

// Buat custom hook untuk mempermudah penggunaan context
export const useSettings = () => useContext(SettingsContext);

// Buat Provider yang akan "membungkus" aplikasi
export const SettingsProvider = ({children}: {children: ReactNode}) => {
  const [settings, setSettings] = useState<Settings>({
    logoUrl: null,
    companyName: null,
  });

  useEffect(() => {
    // Panggil API saat aplikasi pertama kali dimuat
    const fetchSettings = async () => {
      try {
        const response = await getPublicSettings();
        if (response.success && response.data) {
          setSettings({
            logoUrl: response.data.logo,
            companyName: response.data.nama_perusahaan,
          });
        }
      } catch (error) {
        console.error('Failed to fetch settings:', error);
      }
    };

    fetchSettings();
  }, []);

  return (
    <SettingsContext.Provider value={settings}>
      {children}
    </SettingsContext.Provider>
  );
};
