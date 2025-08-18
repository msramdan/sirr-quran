import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Animated,
  Easing,
  useWindowDimensions,
  SafeAreaView 
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialIcons';
import IconFeather from 'react-native-vector-icons/Feather';
import { Audio } from 'expo-av';
import RenderHtml from 'react-native-render-html';
import Header from '../../components/Header';
import { useTheme } from '../../utils/ThemeContext';
import { BASE_URL } from '../../utils/constants';

const DetailSurahScreen = ({ route, navigation }) => {
  const { surahNumber } = route.params;
  const [surahDetail, setSurahDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [sound, setSound] = useState(null);
  const [selectedAudio, setSelectedAudio] = useState('03');
  const [currentPlayingAyat, setCurrentPlayingAyat] = useState(null);
  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(50));
  const { width } = useWindowDimensions();
  const { colors, isDarkMode } = useTheme();

  useEffect(() => {
    const fetchSurahDetail = async () => {
      try {
        const response = await fetch(`${BASE_URL}/surat/${surahNumber}`);
        const data = await response.json();

        if (data.code === 200) {
          setSurahDetail(data.data);
          Animated.parallel([
            Animated.timing(fadeAnim, {
              toValue: 1,
              duration: 600,
              easing: Easing.out(Easing.cubic),
              useNativeDriver: true,
            }),
            Animated.timing(slideAnim, {
              toValue: 0,
              duration: 600,
              easing: Easing.out(Easing.cubic),
              useNativeDriver: true,
            }),
          ]).start();
        } else {
          setError('Failed to fetch surah details');
        }
      } catch (err) {
        setError('Error fetching surah details');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchSurahDetail();
  }, [surahNumber]);

  useEffect(() => {
    return () => {
      if (sound) {
        sound.unloadAsync();
      }
    };
  }, [sound]);

  const playAudio = async (audioUrl, ayatNumber) => {
    try {
      if (!audioUrl) {
        console.warn('Invalid audio URL');
        return;
      }

      if (sound) {
        await sound.stopAsync();
        setIsPlaying(false);
      }

      if (currentPlayingAyat === ayatNumber && isPlaying) {
        await sound.pauseAsync();
        setIsPlaying(false);
        return;
      }

      if (currentPlayingAyat === ayatNumber && !isPlaying) {
        await sound.playAsync();
        setIsPlaying(true);
        return;
      }

      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: audioUrl },
        { shouldPlay: true }
      );
      
      setSound(newSound);
      setIsPlaying(true);
      setCurrentPlayingAyat(ayatNumber);

      newSound.setOnPlaybackStatusUpdate((status) => {
        if (status.didJustFinish) {
          setIsPlaying(false);
          setCurrentPlayingAyat(null);
        }
      });

      await newSound.playAsync();
    } catch (error) {
      console.error('Error playing audio:', error);
    }
  };

  const stopAudio = async () => {
    if (sound) {
      await sound.stopAsync();
      setIsPlaying(false);
      setCurrentPlayingAyat(null);
    }
  };

  const renderAudioControls = () => (
    <View style={[styles.audioControls, {
      backgroundColor: colors.card, 
      shadowColor: colors.shadow
    }]}>
      <View style={styles.audioHeader}>
        <IconFeather name="headphones" size={20} color={colors.accent} />
        <Text style={[styles.audioTitle, {color: colors.text}]}>Select Reciter</Text>
      </View>
      
      <View style={styles.qariOptions}>
        {[
          { id: '01', name: 'Juhany', subtitle: 'Abdullah Al-Juhany' },
          { id: '02', name: 'Qasim', subtitle: 'Sa\'ad Al-Qasim' },
          { id: '03', name: 'Sudais', subtitle: 'Abdur-Rahman As-Sudais' }
        ].map((qari) => (
          <TouchableOpacity 
            key={qari.id}
            style={[
              styles.qariOption, 
              { 
                backgroundColor: selectedAudio === qari.id ? colors.accent : colors.background,
                borderColor: selectedAudio === qari.id ? colors.accent : colors.border
              }
            ]}
            onPress={() => setSelectedAudio(qari.id)}
            activeOpacity={0.8}
          >
            <Text style={[
              styles.qariName, 
              { color: selectedAudio === qari.id ? '#FFF' : colors.text }
            ]}>
              {qari.name}
            </Text>
            <Text style={[
              styles.qariSubtitle, 
              { color: selectedAudio === qari.id ? 'rgba(255,255,255,0.8)' : colors.subtext }
            ]}>
              {qari.subtitle}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      
      {surahDetail?.audioFull && (
        <TouchableOpacity 
          style={[styles.playButton, {backgroundColor: colors.accent}]}
          onPress={() => playAudio(surahDetail.audioFull[selectedAudio], 'full')}
          activeOpacity={0.9}
        >
          <LinearGradient
            colors={[colors.accent, colors.accentLight || colors.accent]}
            style={styles.playButtonGradient}
            start={{x: 0, y: 0}}
            end={{x: 1, y: 0}}
          >
            <Icon 
              name={currentPlayingAyat === 'full' && isPlaying ? 'pause' : 'play-arrow'} 
              size={24} 
              color="#FFF" 
            />
            <Text style={styles.playButtonText}>
              {currentPlayingAyat === 'full' && isPlaying ? 'Pause' : 'Play'} Full Surah
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      )}
    </View>
  );

  const renderAyatItem = (ayat) => (
    <Animated.View 
      key={ayat.nomorAyat} 
      style={[
        styles.ayatContainer, 
        { 
          backgroundColor: colors.card,
          shadowColor: colors.shadow,
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }]
        }
      ]}
    >
      <View style={styles.ayatHeader}>
        <LinearGradient 
          colors={[colors.accent, colors.accentLight || colors.accent]}
          style={styles.ayatNumber}
          start={{x: 0, y: 0}}
          end={{x: 1, y: 1}}
        >
          <Text style={styles.ayatNumberText}>{ayat.nomorAyat}</Text>
        </LinearGradient>
        
        <TouchableOpacity 
          style={[
            styles.audioButton, 
            { 
              borderColor: currentPlayingAyat === ayat.nomorAyat && isPlaying ? colors.success : colors.accent,
              backgroundColor: currentPlayingAyat === ayat.nomorAyat && isPlaying ? `${colors.success}20` : 'transparent'
            }
          ]}
          onPress={() => playAudio(ayat.audio[selectedAudio], ayat.nomorAyat)}
          activeOpacity={0.8}
        >
          <IconFeather 
            name={currentPlayingAyat === ayat.nomorAyat && isPlaying ? 'pause' : 'play'} 
            size={16} 
            color={currentPlayingAyat === ayat.nomorAyat && isPlaying ? colors.success : colors.accent} 
          />
        </TouchableOpacity>
      </View>
      
      <View style={styles.ayatContent}>
        <Text style={[styles.arabicText, {color: colors.text}]}>
          {ayat.teksArab}
        </Text>
        
        <View style={[styles.transliterationContainer, { backgroundColor: colors.backgroundSecondary }]}>
          <Text style={[styles.latinText, {color: colors.textSecondary}]}>
            {ayat.teksLatin}
          </Text>
        </View>
        
        <Text style={[styles.translationText, {color: colors.text}]}>
          {ayat.teksIndonesia}
        </Text>
      </View>
    </Animated.View>
  );

  if (loading) {
    return (
      <View style={[styles.loadingContainer, {backgroundColor: colors.background}]}>
        <LinearGradient
          colors={[colors.accent, colors.accentLight || colors.accent]}
          style={styles.loadingIndicator}
        >
          <ActivityIndicator size="large" color="#FFF" />
        </LinearGradient>
        <Text style={[styles.loadingText, {color: colors.text}]}>Loading Surah...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.loadingContainer, {backgroundColor: colors.background}]}>
        <View style={[styles.errorContainer, { backgroundColor: colors.card }]}>
          <Icon name="error-outline" size={48} color={colors.warning} />
          <Text style={[styles.errorText, {color: colors.text}]}>{error}</Text>
          <TouchableOpacity 
            style={[styles.retryButton, { backgroundColor: colors.accent }]}
            onPress={() => window.location.reload()}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (!surahDetail) {
    return null;
  }

  return (
    <SafeAreaView style={[styles.safeArea, {backgroundColor: colors.background}]}>
      <Header 
        title={surahDetail?.namaLatin || 'Loading...'}
        subtitle={`${surahDetail?.jumlahAyat} verses`}
        showBackButton={true}
        onBackPress={() => navigation.goBack()}
        additionalContent={
          <View style={[styles.badge, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
            <Text style={[styles.badgeText, {color: '#FFF'}]}>
              {surahDetail?.tempatTurun === 'mekah' ? 'Makkiyah' : 'Madaniyah'}
            </Text>
          </View>
        }
      />
      
      <ScrollView 
        style={[styles.container, {backgroundColor: colors.background}]}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {surahNumber !== 1 && surahNumber !== 9 && (
          <Animated.View 
            style={[
              styles.basmalahContainer, 
              { 
                backgroundColor: colors.card,
                shadowColor: colors.shadow,
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }]
              }
            ]}
          >
            <LinearGradient
              colors={[`${colors.accent}15`, `${colors.accentLight || colors.accent}15`]}
              style={styles.basmalahBackground}
            >
              <Text style={[styles.basmalah, {color: colors.accent}]}>
                بِسْمِ اللّٰهِ الرَّحْمٰنِ الرَّحِيْمِ
              </Text>
            </LinearGradient>
          </Animated.View>
        )}
        
        <Animated.View
          style={{
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }]
          }}
        >
          {renderAudioControls()}
        </Animated.View>
        
        <Animated.View 
          style={[
            styles.surahInfo,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }]
            }
          ]}
        >
          <View style={[styles.surahTitleContainer, { 
            backgroundColor: colors.card, 
            shadowColor: colors.shadow 
          }]}>
            <Text style={[styles.surahName, {color: colors.text}]}>
              {surahDetail.namaLatin}
            </Text>
            <Text style={[styles.surahNameArabic, {color: colors.accent}]}>
              {surahDetail.nama}
            </Text>
            <View style={[styles.meaningContainer, { backgroundColor: colors.backgroundSecondary }]}>
              <Text style={[styles.surahArt, {color: colors.textSecondary}]}>
                "{surahDetail.arti}"
              </Text>
            </View>
          </View>
          
          <View style={[styles.descriptionContainer, {
            backgroundColor: colors.card, 
            shadowColor: colors.shadow
          }]}>
            <View style={styles.descriptionHeader}>
              <Icon name="info-outline" size={20} color={colors.accent} />
              <Text style={[styles.descriptionTitle, {color: colors.text}]}>About this Surah</Text>
            </View>
            <RenderHtml
              contentWidth={width - 64}
              source={{ html: surahDetail.deskripsi }}
              baseStyle={{
                color: colors.textSecondary,
                fontSize: 14,
                lineHeight: 22,
                textAlign: 'justify',
                fontFamily: 'sans-serif',
              }}
            />
          </View>
        </Animated.View>
        
        <View style={styles.ayatList}>
          {surahDetail.ayat.map(renderAyatItem)}
        </View>
        
        {surahDetail.suratSelanjutnya && (
          <Animated.View
            style={{
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }]
            }}
          >
            <TouchableOpacity 
              style={styles.nextSurah}
              onPress={() => navigation.replace('DetailSurah', { surahNumber: surahDetail.suratSelanjutnya.nomor })}
              activeOpacity={0.9}
            >
              <LinearGradient
                colors={[colors.accent, colors.accentLight || colors.accent]}
                style={styles.nextSurahGradient}
                start={{x: 0, y: 0}}
                end={{x: 1, y: 0}}
              >
                <View style={styles.nextSurahContent}>
                  <Text style={styles.nextSurahLabel}>Next Surah</Text>
                  <Text style={styles.nextSurahText}>
                    {surahDetail.suratSelanjutnya.namaLatin}
                  </Text>
                </View>
                <Icon name="chevron-right" size={24} color="#FFF" />
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  loadingIndicator: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  loadingText: {
    fontSize: 16,
    fontWeight: '600',
  },
  errorContainer: {
    padding: 32,
    borderRadius: 16,
    alignItems: 'center',
    maxWidth: 300,
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
    marginVertical: 16,
    lineHeight: 24,
  },
  retryButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
  },
  scrollContent: {
    paddingBottom: 32,
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 12,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  basmalahContainer: {
    marginHorizontal: 20,
    marginTop: 20,
    borderRadius: 16,
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  basmalahBackground: {
    padding: 24,
    alignItems: 'center',
  },
  basmalah: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    lineHeight: 36,
  },
  audioControls: {
    marginHorizontal: 20,
    marginTop: 20,
    borderRadius: 16,
    padding: 20,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
  },
  audioHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  audioTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginLeft: 8,
  },
  qariOptions: {
    marginBottom: 20,
  },
  qariOption: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    marginBottom: 12,
  },
  qariName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  qariSubtitle: {
    fontSize: 12,
  },
  playButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  playButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  playButtonText: {
    color: '#FFF',
    marginLeft: 12,
    fontSize: 16,
    fontWeight: '600',
  },
  surahInfo: {
    paddingHorizontal: 20,
    marginTop: 20,
  },
  surahTitleContainer: {
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 16,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
  },
  surahName: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  surahNameArabic: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
  },
  meaningContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  surahArt: {
    fontSize: 14,
    fontStyle: 'italic',
    textAlign: 'center',
  },
  descriptionContainer: {
    padding: 20,
    borderRadius: 16,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
  },
  descriptionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  descriptionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  ayatList: {
    paddingHorizontal: 20,
    marginTop: 20,
  },
  ayatContainer: {
    borderRadius: 16,
    marginBottom: 20,
    padding: 20,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
  },
  ayatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  ayatNumber: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  ayatNumberText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  audioButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  ayatContent: {
    marginTop: 8,
  },
  arabicText: {
    fontSize: 28,
    lineHeight: 56,
    marginBottom: 16,
    textAlign: 'right',
    fontWeight: '500',
  },
  transliterationContainer: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  latinText: {
    fontSize: 14,
    fontStyle: 'italic',
    lineHeight: 20,
  },
  translationText: {
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'justify',
  },
  nextSurah: {
    marginHorizontal: 20,
    marginTop: 20,
    borderRadius: 16,
    overflow: 'hidden',
  },
  nextSurahGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
  },
  nextSurahContent: {
    flex: 1,
  },
  nextSurahLabel: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
  },
  nextSurahText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default DetailSurahScreen;