import React from 'react';
import { View, Text, Image, StyleSheet, Animated } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Hadist from '../screens/hadist';
import Quran from '../screens/quran';
import Doa from '../screens/doa';

const Tab = createBottomTabNavigator();

// Custom Tab Icon Component with Animation
const TabIcon = ({ focused, icon, label, isCenter = false }) => {
  const scaleValue = React.useRef(new Animated.Value(focused ? 1.1 : 1)).current;
  const translateY = React.useRef(new Animated.Value(focused ? -4 : 0)).current;

  React.useEffect(() => {
    Animated.parallel([
      Animated.spring(scaleValue, {
        toValue: focused ? 1.1 : 1,
        tension: 100,
        friction: 8,
        useNativeDriver: true,
      }),
      Animated.spring(translateY, {
        toValue: focused ? -4 : 0,
        tension: 100,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();
  }, [focused]);

  if (isCenter) {
    return (
      <Animated.View style={[
        styles.centerIconContainer,
        {
          transform: [
            { scale: scaleValue },
            { translateY: translateY }
          ]
        }
      ]}>
        <View style={[styles.centerIcon, focused && styles.centerIconActive]}>
          <Image
            source={icon}
            style={[
              styles.centerIconImage,
              { tintColor: focused ? '#ffffff' : '#1e3a8a' },
            ]}
          />
        </View>
        <Text style={[styles.label, styles.centerLabel, focused && styles.labelActive]}>
          {label}
        </Text>
      </Animated.View>
    );
  }

  return (
    <Animated.View style={[
      styles.iconContainer,
      {
        transform: [
          { scale: scaleValue },
          { translateY: translateY }
        ]
      }
    ]}>
      <View style={styles.iconWrapper}>
        <Image
          source={icon}
          style={[
            styles.icon,
            { tintColor: focused ? '#1e3a8a' : '#64748b' },
          ]}
        />
      </View>
      <Text style={[styles.label, focused && styles.labelActive]}>
        {label}
      </Text>
    </Animated.View>
  );
};

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
      <Tab.Screen
        name="Hadist"
        component={Hadist}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon
              focused={focused}
              icon={require('../assets/icons/hadist.png')}
              label="Hadist"
            />
          ),
        }}
      />

      <Tab.Screen
        name="Quran"
        component={Quran}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon
              focused={focused}
              icon={require('../assets/icons/quran2.png')}
              label="Quran"
              isCenter={true}
            />
          ),
        }}
      />

      <Tab.Screen
        name="Doa"
        component={Doa}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon
              focused={focused}
              icon={require('../assets/icons/doa.png')}
              label="Doa"
            />
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
    left: 30,
    right: 30,
    height: 75,
    backgroundColor: '#ffffff',
    borderRadius: 35,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 12,
    paddingBottom: 8,
    paddingTop: 8,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    paddingHorizontal: 12,
  },
  iconWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    marginBottom: 4,
  },
  centerIconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -35,
  },
  icon: {
    width: 26,
    height: 26,
  },
  centerIcon: {
    width: 65,
    height: 65,
    borderRadius: 32.5,
    backgroundColor: '#f8fafc',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
    borderWidth: 5,
    borderColor: '#ffffff',
    shadowColor: '#1e3a8a',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 10,
    position: 'relative',
  },
  centerIconActive: {
    backgroundColor: '#1e3a8a',
    shadowOpacity: 0.4,
    shadowRadius: 16,
  },
  centerIconImage: {
    width: 34,
    height: 34,
  },
  label: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '600',
    marginTop: 2,
    letterSpacing: 0.3,
  },
  centerLabel: {
    marginTop: 4,
    fontSize: 12,
    fontWeight: '700',
  },
  labelActive: {
    color: '#1e3a8a',
    fontWeight: '700',
  },
});