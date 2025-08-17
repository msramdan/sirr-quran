import React, { useEffect, useRef } from 'react';
import {
  View,
  Image,
  StyleSheet,
  Animated,
  Dimensions,
  StatusBar,
  Text
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import LinearGradient from 'react-native-linear-gradient';

const { width, height } = Dimensions.get('window');

const SplashScreen = () => {
  const navigation = useNavigation();

  // Animation references
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const textSlideAnim = useRef(new Animated.Value(50)).current;
  const particleAnim = useRef(new Animated.Value(0)).current;
  const glowAnim = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    StatusBar.setHidden(true);

    const startAnimations = () => {
      // Animasi paralel untuk semua efek masuk
      Animated.parallel([
        // Text slide up
        Animated.timing(textSlideAnim, {
          toValue: 0,
          duration: 1000,
          delay: 300,
          useNativeDriver: true,
        }),
        // Particle animation
        Animated.timing(particleAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        })
      ]).start();

      // Continuous glow animation
      const glowAnimation = Animated.loop(
        Animated.sequence([
          Animated.timing(glowAnim, {
            toValue: 1,
            duration: 2000,
            useNativeDriver: true,
          }),
          Animated.timing(glowAnim, {
            toValue: 0.3,
            duration: 2000,
            useNativeDriver: true,
          })
        ])
      );

      setTimeout(() => {
        glowAnimation.start();
      }, 800);
    };

    startAnimations();

    const timer = setTimeout(() => {
      // Animasi fade out sebelum navigasi
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }).start(() => {
        StatusBar.setHidden(false);
        navigation.replace('QuranScreen');
      });
    }, 2000);

    return () => {
      clearTimeout(timer);
    };
  }, [navigation, fadeAnim, textSlideAnim, particleAnim, glowAnim]);

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      {/* Dynamic gradient background */}
      <LinearGradient
        colors={['#0a0e27', '#1a1a2e', '#16213e', '#0f3460']}
        locations={[0, 0.3, 0.7, 1]}
        style={StyleSheet.absoluteFill}
      />

      {/* Animated background particles */}
      <Animated.View style={[styles.particleContainer, { opacity: particleAnim }]}>
        {[...Array(8)].map((_, index) => (
          <Animated.View
            key={index}
            style={[
              styles.particle,
              {
                left: Math.random() * width,
                top: Math.random() * height,
                animationDelay: Math.random() * 2000,
              }
            ]}
          />
        ))}
      </Animated.View>

      {/* Main content container */}
      <View style={styles.contentContainer}>
        {/* Logo section */}
        <View style={styles.logoContainer}>
          <Image
            source={require('../../assets/images/logo.webp')}
            style={styles.logo}
            resizeMode="contain"
          />
        </View>

        {/* App name with typography animation */}
        <Animated.View
          style={[
            styles.textContainer,
            {
              opacity: particleAnim,
              transform: [{ translateY: textSlideAnim }]
            }
          ]}
        >
          <Text style={styles.tagline}>Mendekat kepada-Nya melalui Kalam-Nya</Text>

          {/* Loading indicator */}
          <View style={styles.loadingContainer}>
            <View style={styles.loadingDots}>
              {[0, 1, 2].map((index) => (
                <Animated.View
                  key={index}
                  style={[
                    styles.dot,
                    {
                      transform: [
                        {
                          scale: particleAnim.interpolate({
                            inputRange: [0, 0.5, 1],
                            outputRange: [0.5, 1.2, 0.5],
                          })
                        }
                      ]
                    }
                  ]}
                />
              ))}
            </View>
          </View>
        </Animated.View>
      </View>

      {/* Bottom wave decoration */}
      <View style={styles.bottomWave}>
        <LinearGradient
          colors={['transparent', 'rgba(255,255,255,0.1)']}
          style={styles.waveGradient}
        />
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  particleContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  particle: {
    position: 'absolute',
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(100, 200, 255, 0.6)',
    shadowColor: '#64c8ff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 5,
  },
  contentContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  logoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 40,
  },
  logo: {
    width: 250,
    height: 250,
  },
  textContainer: {
    alignItems: 'center',
    marginTop: 20,
  },
  tagline: {
    fontSize: 16,
    fontWeight: '300',
    color: '#FFFFFF',
    textAlign: 'center',
    letterSpacing: 1,
    marginBottom: 30,
    fontStyle: 'italic',
  },
  loadingContainer: {
    alignItems: 'center',
  },
  loadingDots: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#64c8ff',
    marginHorizontal: 4,
    shadowColor: '#64c8ff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
    elevation: 5,
  },
  bottomWave: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 120,
  },
  waveGradient: {
    flex: 1,
    borderTopLeftRadius: 60,
    borderTopRightRadius: 60,
  },
});

export default SplashScreen;