import React from 'react';
import { View, Text, Image, StyleSheet, Alert } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import auth from '../services/auth'; // Ganti path sesuai lokasi aslinya
import { useNavigation } from '@react-navigation/native';
import Home from '../screens/home';
import Profile from '../screens/profile';
import Info from '../screens/informasi';
import { Colors, FontSizes, FontFamily } from '../utils/constants';

const Tab = createBottomTabNavigator();

export default function BottomTabsNavigation() {

  const navigation = useNavigation();

  return (
    <Tab.Navigator
      initialRouteName="Home"
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: styles.tabBar,
      }}
    >
      {/* Home Tab */}
      <Tab.Screen
        name="Home"
        component={Home}
        options={{
          tabBarIcon: ({ focused }) => (
            <View style={styles.iconContainer}>
              <Image
                source={require('../assets/icons/home.png')}
                style={[
                  styles.icon,
                  { tintColor: focused ? Colors.primary : Colors.gray },
                ]}
              />
              <Text style={[styles.label, focused && styles.labelActive]}>
                Home
              </Text>
            </View>
          ),
        }}
      />

      {/* Info Tab */}
      <Tab.Screen
        name="Infomasi"
        component={Info}
        options={{
          tabBarIcon: ({ focused }) => (
            <View style={styles.iconContainer}>
              <Image
                source={require('../assets/icons/info.png')}
                style={[
                  styles.icon,
                  { tintColor: focused ? Colors.primary : Colors.gray },
                ]}
              />
              <Text style={[styles.label, focused && styles.labelActive]}>
                Infomasi
              </Text>
            </View>
          ),
        }}
      />

      {/* Profile Tab */}
      <Tab.Screen
        name="Profile"
        component={Profile}
        options={{
          tabBarIcon: ({ focused }) => (
            <View style={styles.iconContainer}>
              <Image
                source={require('../assets/icons/user.png')}
                style={[
                  styles.icon,
                  { tintColor: focused ? Colors.primary : Colors.gray },
                ]}
              />
              <Text style={[styles.label, focused && styles.labelActive]}>
                Profile
              </Text>
            </View>
          ),
        }}
      />

      <Tab.Screen
        name="Logout"
        component={View} // Dummy
        listeners={{
          tabPress: (e) => {
            e.preventDefault();
            Alert.alert(
              'Konfirmasi Logout',
              'Apakah Anda yakin ingin logout?',
              [
                { text: 'Tidak', style: 'cancel' },
                {
                  text: 'Ya',
                  onPress: async () => {
                    await auth.logout();
                    navigation.replace('Login');
                  },
                },
              ],
              { cancelable: true }
            );
          },
        }}
        options={{
          tabBarIcon: ({ focused }) => (
            <View style={styles.iconContainer}>
              <Image
                source={require('../assets/icons/logout.png')}
                style={[
                  styles.icon,
                  { tintColor: focused ? Colors.primary : Colors.gray },
                ]}
              />
              <Text style={[styles.label, focused && styles.labelActive]}>
                Logout
              </Text>
            </View>
          ),
        }}
      />


    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    height: 65,
    backgroundColor: Colors.white,
    borderRadius: 15,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 5,
    paddingBottom: 5,
  },

  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },

  icon: {
    width: 24,
    height: 24,
    marginBottom: 2,
  },

  label: {
    fontSize: FontSizes.small,
    color: Colors.gray,
    fontFamily: FontFamily.medium,
    fontWeight: '600',
  },

  labelActive: {
    color: Colors.primary,
  },
});
