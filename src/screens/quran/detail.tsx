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
  const [showDescription, setShowDescription] = useState(false);
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

  // Enhanced Hero Section with Islamic Pattern
  const renderSurahHero = () => (
    <View style={styles.heroContainer}>
      <LinearGradient
        colors={['#667eea', '#764ba2']}
        start={{x: 0, y: 0}}
        end={{x: 1, y: 1}}
        style={styles.heroGradient}
      >
        {/* Decorative Islamic Pattern Overlay */}
        <View style={styles.patternOverlay}>
          <View style={styles.geometricPattern}>
            <View style={[styles.diamond, { backgroundColor: 'rgba(255,255,255,0.1)' }]} />
            <View style={[styles.diamond, styles.diamondRotated, { backgroundColor: 'rgba(255,255,255,0.05)' }]} />
          </View>
        </View>
        
        <View style={styles.heroContent}>
          {/* Main Title */}
          <View style={styles.titleSection}>
            <Text style={styles.surahNameArabic}>{surahDetail.nama}</Text>
            <Text style={styles.surahNameLatin}>{surahDetail.namaLatin}</Text>
            <Text style={styles.surahMeaning}>"{surahDetail.arti}"</Text>
          </View>
          
          {/* Meta Information */}
          <View style={styles.metaInfo}>
            <View style={styles.metaItem}>
              <Icon 
                name={surahDetail.tempatTurun === 'mekah' ? 'location-on' : 'location-city'} 
                size={16} 
                color="rgba(255,255,255,0.9)" 
              />
              <Text style={styles.metaText}>
                {surahDetail.tempatTurun === 'mekah' ? 'Makkiyah' : 'Madaniyah'}
              </Text>
            </View>
            <View style={styles.metaDivider} />
            <View style={styles.metaItem}>
              <Icon name="book" size={16} color="rgba(255,255,255,0.9)" />
              <Text style={styles.metaText}>{surahDetail.jumlahAyat} Verses</Text>
            </View>
          </View>
        </View>
      </LinearGradient>
    </View>
  );

  // Enhanced Audio Player Section
  const renderAudioSection = () => (
    <View style={styles.audioSection}>
      {/* Description Toggle */}
      <TouchableOpacity 
        style={[styles.descriptionHeader, { backgroundColor: colors.card }]}
        onPress={() => setShowDescription(!showDescription)}
        activeOpacity={0.7}
      >
        <View style={styles.descriptionHeaderLeft}>
          <View style={[styles.infoIconContainer, { backgroundColor: colors.accent + '20' }]}>
            <Icon name="info-outline" size={18} color={colors.accent} />
          </View>
          <Text style={[styles.descriptionHeaderText, { color: colors.text }]}>
            About this Surah
          </Text>
        </View>
        <Icon 
          name={showDescription ? 'expand-less' : 'expand-more'} 
          size={24} 
          color={colors.subtext} 
        />
      </TouchableOpacity>

      {showDescription && (
        <Animated.View style={[styles.descriptionContent, { backgroundColor: colors.background }]}>
          <RenderHtml
            contentWidth={width - 64}
            source={{ html: surahDetail.deskripsi }}
            baseStyle={{
              color: colors.subtext,
              fontSize: 14,
              lineHeight: 22,
              textAlign: 'justify',
            }}
          />
        </Animated.View>
      )}

      {/* Audio Player Card */}
      <View style={[styles.audioPlayerCard, { backgroundColor: colors.card }]}>
        {/* Player Header */}
        <View style={styles.audioPlayerHeader}>
          <View style={styles.audioIconContainer}>
<LinearGradient
  colors={['#667eea', '#764ba2']}
  style={styles.audioIconGradient}
>
  <IconFeather name="headphones" size={20} color="#FFF" />
</LinearGradient>
            <View>
              <Text style={[styles.audioTitle, { color: colors.text }]}>Audio Recitation</Text>
              <Text style={[styles.audioSubtitle, { color: colors.subtext }]}>Choose your reciter</Text>
            </View>
          </View>
        </View>
        
        {/* Reciter Selection */}
        <View style={styles.reciterContainer}>
          {[
            { id: '01', name: 'Abdullah Al-Juhany', short: 'Al-Juhany' },
            { id: '02', name: 'Abdul Rashid Ali Sufi', short: 'Ali Sufi' },
            { id: '03', name: 'Abdurrahman as-Sudais', short: 'As-Sudais' }
          ].map((qari) => (
            <TouchableOpacity 
              key={qari.id}
              style={[
                styles.reciterCard,
                { 
                  backgroundColor: selectedAudio === qari.id ? '#667eea' : colors.background,
                  borderColor: selectedAudio === qari.id ? '#667eea' : colors.border,
                }
              ]}
              onPress={() => setSelectedAudio(qari.id)}
              activeOpacity={0.8}
            >
              <View style={styles.reciterCardContent}>
                <Icon 
                  name="person" 
                  size={16} 
                  color={selectedAudio === qari.id ? '#FFF' : colors.subtext} 
                />
                <Text style={[
                  styles.reciterName, 
                  { color: selectedAudio === qari.id ? '#FFF' : colors.text }
                ]}>
                  {qari.short}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
        
        {/* Play Button */}
        {surahDetail?.audioFull && (
          <TouchableOpacity 
            style={styles.playButton}
            onPress={() => playAudio(surahDetail.audioFull[selectedAudio], 'full')}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={['#667eea', '#764ba2']}
              style={styles.playButtonGradient}
            >
              <Icon 
                name={currentPlayingAyat === 'full' && isPlaying ? 'pause' : 'play-arrow'} 
                size={28} 
                color="#FFF" 
              />
              <Text style={styles.playButtonText}>
                {currentPlayingAyat === 'full' && isPlaying ? 'Pause Full Surah' : 'Play Full Surah'}
              </Text>
              {currentPlayingAyat === 'full' && isPlaying && (
                <View style={styles.playingIndicator}>
                  <View style={styles.waveBar} />
                  <View style={styles.waveBar} />
                  <View style={styles.waveBar} />
                </View>
              )}
            </LinearGradient>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  // Enhanced Ayat Card with built-in transliteration
  const renderAyatCard = (ayat) => (
    <View 
      key={ayat.nomorAyat} 
      style={[styles.ayatCard, { backgroundColor: colors.card }]}
    >
      {/* Ayat Header */}
      <View style={styles.ayatHeader}>
        <View style={styles.ayatNumberContainer}>
          <LinearGradient
            colors={['#667eea', '#764ba2']}
            style={styles.ayatNumberBadge}
          >
            <Text style={styles.ayatNumberText}>{ayat.nomorAyat}</Text>
          </LinearGradient>
        </View>
        
        <TouchableOpacity 
          style={[
            styles.ayatPlayBtn, 
            { 
              backgroundColor: currentPlayingAyat === ayat.nomorAyat && isPlaying 
                ? '#667eea20' : colors.background,
            }
          ]}
          onPress={() => playAudio(ayat.audio[selectedAudio], ayat.nomorAyat)}
          activeOpacity={0.8}
        >
          <Icon 
            name={currentPlayingAyat === ayat.nomorAyat && isPlaying ? 'pause' : 'play-arrow'} 
            size={20} 
            color="#667eea" 
          />
        </TouchableOpacity>
      </View>
      
      {/* Ayat Content */}
      <View style={styles.ayatContent}>
        {/* Arabic Text */}
        <Text style={[styles.arabicText, { color: colors.text }]}>
          {ayat.teksArab}
        </Text>
        
        {/* Transliteration - Always Visible but Small */}
        <Text style={[styles.transliterationText, { color: colors.subtext }]}>
          {ayat.teksLatin}
        </Text>
        
        {/* Indonesian Translation */}
        <View style={[styles.translationContainer, { borderLeftColor: '#667eea' }]}>
          <Text style={[styles.translationText, { color: colors.text }]}>
            {ayat.teksIndonesia}
          </Text>
        </View>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color="#667eea" />
        <Text style={[styles.loadingText, { color: colors.text }]}>Loading Surah...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <View style={[styles.errorContainer, { backgroundColor: colors.card }]}>
          <Icon name="error-outline" size={48} color="#667eea" />
          <Text style={[styles.errorText, { color: colors.text }]}>{error}</Text>
          <TouchableOpacity 
            style={styles.retryButton}
            onPress={() => window.location.reload()}
          >
            <LinearGradient
              colors={['#667eea', '#764ba2']}
              style={styles.retryButtonGradient}
            >
              <Text style={styles.retryButtonText}>Retry</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (!surahDetail) {
    return null;
  }

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <Header 
        title={surahDetail?.namaLatin || 'Loading...'}
        subtitle={`${surahDetail?.jumlahAyat} verses`}
        showBackButton={true}
        onBackPress={() => navigation.goBack()}
      />
      
      <ScrollView 
        style={[styles.container, { backgroundColor: colors.background }]}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Enhanced Hero Section */}
        {renderSurahHero()}
        
        {/* Basmalah */}
        {surahNumber !== 1 && surahNumber !== 9 && (
          <View style={styles.basmalahContainer}>
            <LinearGradient
              colors={['#667eea15', '#764ba210']}
              style={styles.basmalahCard}
            >
              <Text style={[styles.basmalahText, { color: colors.accent }]}>
                بِسْمِ اللّٰهِ الرَّحْمٰنِ الرَّحِيْمِ
              </Text>
            </LinearGradient>
          </View>
        )}
        
        {/* Enhanced Audio Section */}
        {renderAudioSection()}
        
        {/* Ayat List */}
        <View style={styles.ayatList}>
          {surahDetail.ayat.map(renderAyatCard)}
        </View>
        
        {/* Next Surah */}
        {surahDetail.suratSelanjutnya && (
          <TouchableOpacity 
            style={styles.nextSurahContainer}
            onPress={() => navigation.replace('DetailSurah', { surahNumber: surahDetail.suratSelanjutnya.nomor })}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={['#667eea', '#764ba2']}
              style={styles.nextSurahCard}
            >
              <View style={styles.nextSurahContent}>
                <Text style={styles.nextSurahLabel}>Continue Reading</Text>
                <Text style={styles.nextSurahTitle}>
                  {surahDetail.suratSelanjutnya.namaLatin}
                </Text>
              </View>
              <Icon name="arrow-forward" size={24} color="#FFF" />
            </LinearGradient>
          </TouchableOpacity>
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
  loadingText: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 16,
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
    borderRadius: 8,
    overflow: 'hidden',
  },
  retryButtonGradient: {
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  retryButtonText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
  },
  scrollContent: {
    paddingBottom: 32,
  },

  // Enhanced Hero Section
  heroContainer: {
    margin: 20,
    borderRadius: 20,
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  heroGradient: {
    padding: 28,
    position: 'relative',
  },
  patternOverlay: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 120,
    height: 120,
    overflow: 'hidden',
  },
  geometricPattern: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  diamond: {
    width: 60,
    height: 60,
    transform: [{ rotate: '45deg' }],
    position: 'absolute',
  },
  diamondRotated: {
    transform: [{ rotate: '90deg' }],
    width: 40,
    height: 40,
  },
  heroContent: {
    alignItems: 'center',
    gap: 16,
  },
  surahNumberBadge: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  surahNumberText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
  },
  titleSection: {
    alignItems: 'center',
    gap: 8,
  },
  surahNameArabic: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFF',
    textAlign: 'center',
  },
  surahNameLatin: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFF',
    textAlign: 'center',
  },
  surahMeaning: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.9)',
    fontStyle: 'italic',
    textAlign: 'center',
  },
  metaInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    marginTop: 8,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaDivider: {
    width: 1,
    height: 16,
    backgroundColor: 'rgba(255,255,255,0.3)',
    marginHorizontal: 16,
  },
  metaText: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 13,
    fontWeight: '600',
  },

  // Enhanced Audio Section
  audioSection: {
    paddingHorizontal: 20,
    gap: 16,
  },
  descriptionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  descriptionHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  infoIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  descriptionHeaderText: {
    fontSize: 16,
    fontWeight: '600',
  },
  descriptionContent: {
    padding: 16,
    borderRadius: 12,
    marginTop: -8,
  },
  audioPlayerCard: {
    borderRadius: 16,
    padding: 20,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 6,
  },
  audioPlayerHeader: {
    marginBottom: 20,
  },
  audioIconContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  audioIconGradient: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  audioTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  audioSubtitle: {
    fontSize: 13,
    marginTop: 2,
  },
  reciterContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 20,
  },
  reciterCard: {
    flex: 1,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  reciterCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  reciterName: {
    fontSize: 12,
    fontWeight: '600',
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
    gap: 12,
  },
  playButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  playingIndicator: {
    flexDirection: 'row',
    gap: 2,
    marginLeft: 8,
  },
  waveBar: {
    width: 3,
    height: 12,
    backgroundColor: 'rgba(255,255,255,0.7)',
    borderRadius: 2,
  },

  // Basmalah
  basmalahContainer: {
    marginHorizontal: 20,
    marginTop: 16,
    borderRadius: 12,
    overflow: 'hidden',
  },
  basmalahCard: {
    padding: 20,
    alignItems: 'center',
  },
  basmalahText: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
  },

  // Enhanced Ayat Cards
  ayatList: {
    paddingHorizontal: 20,
    gap: 16,
    marginTop: 16,
  },
  ayatCard: {
    borderRadius: 16,
    padding: 20,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 6,
  },
  ayatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  ayatNumberContainer: {
    alignItems: 'center',
  },
  ayatNumberBadge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  ayatNumberText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  ayatPlayBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  ayatContent: {
    gap: 12,
  },
  arabicText: {
    fontSize: 24,
    lineHeight: 48,
    textAlign: 'right',
    fontWeight: '500',
  },
  transliterationText: {
    fontSize: 12,
    fontStyle: 'italic',
    lineHeight: 18,
    textAlign: 'right',
    opacity: 0.8,
  },
  translationContainer: {
    paddingLeft: 12,
    borderLeftWidth: 3,
    marginTop: 4,
  },
  translationText: {
    fontSize: 15,
    lineHeight: 24,
    textAlign: 'justify',
  },

  // Next Surah
  nextSurahContainer: {
    marginHorizontal: 20,
    marginTop: 20,
    borderRadius: 16,
    overflow: 'hidden',
  },
  nextSurahCard: {
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
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 4,
  },
  nextSurahTitle: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default DetailSurahScreen;