//importReact
import React, { useState, useEffect } from 'react';
import { Alert, Text } from 'react-native';
import Navigation from './src/navigation';
import { ToastProvider } from 'react-native-toast-notifications';
import messaging from '@react-native-firebase/messaging';

const App = () => {
    return (
        <ToastProvider>
            <Navigation />
        </ToastProvider>
    );
}

export default App;