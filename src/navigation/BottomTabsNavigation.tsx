import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Hadist from '../screens/hadist';
import Quran from '../screens/home';
import Doa from '../screens/doa';

const Tab = createBottomTabNavigator();

export default function BottomTabsNavigation() {
  return (
    <Tab.Navigator
      initialRouteName="Quran"
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: styles.tabBar,
      }}
    >
      {/* Hadist Tab */}
      <Tab.Screen
        name="Hadist"
        component={Hadist}
        options={{
          tabBarIcon: ({ focused }) => (
            <View style={styles.iconContainer}>
              <Image
                source={require('../assets/icons/hadist.png')}
                style={[
                  styles.icon,
                  { tintColor: focused ? '#1e3a8a' : '#64748b' },
                ]}
              />
              <Text style={[styles.label, focused && styles.labelActive]}>
                Hadist
              </Text>
            </View>
          ),
        }}
      />

      {/* Quran Tab - Center with special styling */}
      <Tab.Screen
        name="Quran"
        component={Quran}
        options={{
          tabBarIcon: ({ focused }) => (
            <View style={[styles.iconContainer, styles.centerIconContainer]}>
              <View style={[styles.centerIcon, focused && styles.centerIconActive]}>
                <Image
                  source={require('../assets/icons/quran2.png')}
                  style={[
                    styles.centerIconImage,
                    { tintColor: focused ? '#ffffff' : '#1e3a8a' },
                  ]}
                />
              </View>
              <Text style={[styles.label, styles.centerLabel, focused && styles.labelActive]}>
                Quran
              </Text>
            </View>
          ),
        }}
      />

      {/* Doa Tab */}
      <Tab.Screen
        name="Doa"
        component={Doa}
        options={{
          tabBarIcon: ({ focused }) => (
            <View style={styles.iconContainer}>
              <Image
                source={require('../assets/icons/doa.png')}
                style={[
                  styles.icon,
                  { tintColor: focused ? '#1e3a8a' : '#64748b' },
                ]}
              />
              <Text style={[styles.label, focused && styles.labelActive]}>
                Doa
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
    bottom: 25,
    left: 50,
    right: 50,
    height: 75,
    backgroundColor: '#ffffff',
    borderRadius: 25,
    shadowColor: '#1e3a8a',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 15,
    elevation: 10,
    paddingBottom: 10,
    paddingTop: 10,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    paddingHorizontal: 15,
  },
  centerIconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -30,
  },
  icon: {
    width: 28,
    height: 28,
    marginBottom: 6,
  },
  centerIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#e0f2fe',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    borderWidth: 4,
    borderColor: '#ffffff',
    shadowColor: '#1e3a8a',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
  centerIconActive: {
    backgroundColor: '#1e3a8a',
    shadowOpacity: 0.5,
    shadowRadius: 10,
  },
  centerIconImage: {
    width: 32,
    height: 32,
  },
  label: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '700',
    marginTop: 2,
    letterSpacing: 0.5,
  },
  centerLabel: {
    marginTop: 8,
    fontSize: 13,
  },
  labelActive: {
    color: '#1e3a8a',
  },
});