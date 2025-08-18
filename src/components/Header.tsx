import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { Switch } from 'react-native';
import { useTheme } from '../utils/ThemeContext';

interface HeaderProps {
  title: string;
  subtitle?: string;
  showBackButton?: boolean;
  onBackPress?: () => void;
  showThemeToggle?: boolean;
}

const Header: React.FC<HeaderProps> = ({
  title,
  subtitle,
  showBackButton = false,
  onBackPress,
  showThemeToggle = true,
}) => {
const { colors, toggleTheme, isDarkMode } = useTheme();

  return (
    <>
      <StatusBar
        barStyle={isDarkMode ? 'light-content' : 'dark-content'}
        backgroundColor={colors.primary}
      />
      <LinearGradient
        colors={[colors.primary, colors.secondary]}
        style={styles.headerContainer}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
      >
        <View style={styles.headerContent}>
          <View style={styles.headerLeft}>
            {showBackButton && (
              <TouchableOpacity
                onPress={onBackPress}
                style={[styles.backButton, { backgroundColor: 'rgba(255,255,255,0.15)' }]}
                activeOpacity={0.8}
              >
                <Icon name="arrow-back" size={24} color="#FFF" />
              </TouchableOpacity>
            )}
            <View>
              <Text style={[styles.headerTitle, { color: '#FFF' }]}>{title}</Text>
              {subtitle && (
                <Text style={[styles.headerSubtitle, { color: 'rgba(255,255,255,0.8)' }]}>
                  {subtitle}
                </Text>
              )}
            </View>
          </View>

          {showThemeToggle && (
            <View style={styles.themeToggle}>
              <Icon
                name={isDarkMode ? 'nights-stay' : 'wb-sunny'}
                size={20}
                color="#FFF"
              />
              <Switch
                value={isDarkMode}
                onValueChange={toggleTheme}
                trackColor={{ false: "#767577", true: "#81b0ff" }}
                thumbColor={isDarkMode ? "#f5dd4b" : "#f4f3f4"}
                style={{ marginLeft: 8 }}
              />
            </View>
          )}
        </View>
      </LinearGradient>
    </>
  );
};

const styles = StyleSheet.create({
  headerContainer: {
    paddingTop: 16,
    paddingBottom: 16,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 8,
    zIndex: 10,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  themeToggle: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    fontFamily: 'sans-serif-medium',
  },
  headerSubtitle: {
    fontSize: 14,
    marginTop: 4,
    fontFamily: 'sans-serif',
  },
});

export default Header;