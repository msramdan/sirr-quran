import React, {useEffect} from 'react';
import {View, Image, StyleSheet, ActivityIndicator} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {LOGIN_KEY, EXPIRE_TIME_MS} from '../../utils/constants';
import {useSettings} from '../../context/SettingsContext';

const SplashScreen = () => {
  const navigation = useNavigation();
  const {logoUrl} = useSettings();

  useEffect(() => {
    const checkLogin = async () => {
      try {
        const stored = await AsyncStorage.getItem(LOGIN_KEY);
        if (!stored) {
          navigation.replace('Login');
          return;
        }

        const parsed = JSON.parse(stored);
        const now = new Date().getTime();

        if (now - parsed.timestamp > EXPIRE_TIME_MS) {
          await AsyncStorage.removeItem(LOGIN_KEY);
          navigation.replace('Login');
        } else {
          navigation.replace('HomeScreen');
        }
      } catch (err) {
        console.error('Error checking login:', err);
        navigation.replace('Login');
      }
    };

    const timer = setTimeout(() => {
      checkLogin();
    }, 2000);

    return () => clearTimeout(timer);
  }, [navigation]);

  return (
    <View style={styles.container}>
      {logoUrl && (
        <Image
          source={{uri: logoUrl}}
          style={styles.logo}
          resizeMode="contain"
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  logo: {
    width: 250,
    height: 250,
    resizeMode: 'contain',
  },
});

export default SplashScreen;