import React, { createContext, useContext, useState } from 'react';

export const colors = {
  light: {
    primary: '#0F1B2D',
    secondary: '#1A365D',
    accent: '#4299E1',
    background: '#F8FAFC',
    card: '#FFFFFF',
    text: '#1A202C',
    subtext: '#4A5568',
    border: '#E2E8F0',
    searchBg: '#EDF2F7',
    shadow: 'rgba(27, 41, 81, 0.08)',
  },
  dark: {
    primary: '#0A192F',
    secondary: '#172A45',
    accent: '#63B3ED',
    background: '#1A202C',
    card: '#2D3748',
    text: '#F7FAFC',
    subtext: '#CBD5E0',
    border: '#4A5568',
    searchBg: '#2D3748',
    shadow: 'rgba(0, 0, 0, 0.25)',
  }
};

type Theme = {
  isDarkMode: boolean;
  colors: typeof colors.light | typeof colors.dark;
  toggleTheme: () => void;
};

const ThemeContext = createContext<Theme>({
  isDarkMode: false,
  colors: colors.light,
  toggleTheme: () => {},
});

export const ThemeProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
  const [isDarkMode, setIsDarkMode] = useState(false);

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
  };

  const theme = {
    isDarkMode,
    colors: isDarkMode ? colors.dark : colors.light,
    toggleTheme,
  };

  return (
    <ThemeContext.Provider value={theme}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);