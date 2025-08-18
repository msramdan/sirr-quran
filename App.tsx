import React from 'react';
import { ThemeProvider } from './src/utils/ThemeContext';
import { ToastProvider } from 'react-native-toast-notifications';
import Navigation from './src/navigation';

const App = () => {
  return (
    <ThemeProvider>
      <ToastProvider>
        <Navigation />
      </ToastProvider>
    </ThemeProvider>
  );
}

export default App;