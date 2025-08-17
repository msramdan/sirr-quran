import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  StatusBar,
  SafeAreaView,
  ActivityIndicator,
  Switch
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialIcons';
import IconFeather from 'react-native-vector-icons/Feather';
import { Audio } from 'expo-av';
import RenderHtml from 'react-native-render-html';
import { useWindowDimensions } from 'react-native';

const DetailSurahScreen = ({ route, navigation }) => {
  const { surahNumber } = route.params;
  const [surahDetail, setSurahDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [sound, setSound] = useState(null);
  const [selectedAudio, setSelectedAudio] = useState('03');
  const [currentPlayingAyat, setCurrentPlayingAyat] = useState(null);
  const { width } = useWindowDimensions();

  // Color schemes
  const colors = {
    light: {
      primary: '#0F1B2D',
      secondary: '#1A365D',
      accent: '#4299E1',
      background: '#F8FAFC',
      card: '#FFFFFF',
      text: '#1A202C',
      subtext: '#4A5568',
      border: '#E2E8F0',
      searchBg: '#EDF2F7',
    },
    dark: {
      primary: '#0A192F',
      secondary: '#172A45',
      accent: '#63B3ED',
      background: '#1A202C',
      card: '#2D3748',
      text: '#F7FAFC',
      subtext: '#CBD5E0',
      border: '#4A5568',
      searchBg: '#2D3748',
    }
  };

  const [isDarkMode, setIsDarkMode] = useState(false);
  const theme = isDarkMode ? colors.dark : colors.light;

  useEffect(() => {
    const fetchSurahDetail = async () => {
      try {
        const response = await fetch(`https://equran.id/api/v2/surat/${surahNumber}`);
        const data = await response.json();

        if (data.code === 200) {
          setSurahDetail(data.data);
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

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
  };

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

  const renderHeader = () => (
    <LinearGradient 
      colors={[theme.primary, theme.secondary]}
      style={styles.headerContainer}
      start={{x: 0, y: 0}}
      end={{x: 1, y: 0}}
    >
      <View style={styles.headerContent}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Icon name="arrow-back" size={24} color="#FFF" />
        </TouchableOpacity>
        
        <View style={styles.headerTextContainer}>
          <Text style={[styles.headerTitle, {color: '#FFF'}]}>
            {surahDetail?.namaLatin || 'Loading...'}
          </Text>
          <Text style={[styles.headerSubtitle, {color: 'rgba(255,255,255,0.8)'}]}>
            {surahDetail?.tempatTurun === 'mekah' ? 'Makkiyah' : 'Madaniyah'} • {surahDetail?.jumlahAyat} verses
          </Text>
        </View>
        
        <View style={styles.themeToggle}>
          <Icon 
            name={isDarkMode ? 'nights-stay' : 'wb-sunny'} 
            size={20} 
            color="#FFF" 
          />
          <Switch
            value={isDarkMode}
            onValueChange={toggleDarkMode}
            trackColor={{ false: "#767577", true: "#81b0ff" }}
            thumbColor={isDarkMode ? "#f5dd4b" : "#f4f3f4"}
            style={{marginLeft: 8}}
          />
        </View>
      </View>
    </LinearGradient>
  );

  const renderAudioControls = () => (
    <View style={[styles.audioControls, {backgroundColor: theme.card}]}>
      <Text style={[styles.audioTitle, {color: theme.text}]}>Select Reciter:</Text>
      <View style={styles.qariOptions}>
        <TouchableOpacity 
          style={[
            styles.qariOption, 
            selectedAudio === '01' && {backgroundColor: theme.accent}
          ]}
          onPress={() => setSelectedAudio('01')}
        >
          <Text style={[
            styles.qariOptionText, 
            {color: selectedAudio === '01' ? '#FFF' : theme.text}
          ]}>
            Juhany
          </Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[
            styles.qariOption, 
            selectedAudio === '02' && {backgroundColor: theme.accent}
          ]}
          onPress={() => setSelectedAudio('02')}
        >
          <Text style={[
            styles.qariOptionText, 
            {color: selectedAudio === '02' ? '#FFF' : theme.text}
          ]}>
            Qasim
          </Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[
            styles.qariOption, 
            selectedAudio === '03' && {backgroundColor: theme.accent}
          ]}
          onPress={() => setSelectedAudio('03')}
        >
          <Text style={[
            styles.qariOptionText, 
            {color: selectedAudio === '03' ? '#FFF' : theme.text}
          ]}>
            Sudais
          </Text>
        </TouchableOpacity>
      </View>
      
      {surahDetail?.audioFull && (
        <TouchableOpacity 
          style={[styles.playButton, {backgroundColor: theme.accent}]}
          onPress={() => playAudio(surahDetail.audioFull[selectedAudio], 'full')}
        >
          <Icon 
            name={currentPlayingAyat === 'full' && isPlaying ? 'pause' : 'play-arrow'} 
            size={24} 
            color="#FFF" 
          />
          <Text style={styles.playButtonText}>
            {currentPlayingAyat === 'full' && isPlaying ? 'Pause' : 'Play'} Full Surah
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );

  const renderAyatItem = (ayat) => (
    <View 
      key={ayat.nomorAyat} 
      style={[styles.ayatContainer, {backgroundColor: theme.card}]}
    >
      <View style={styles.ayatNumberContainer}>
        <LinearGradient 
          colors={[theme.accent, theme.secondary]}
          style={styles.ayatNumber}
          start={{x: 0, y: 0}}
          end={{x: 1, y: 0}}
        >
          <Text style={[styles.ayatNumberText, {color: '#FFF'}]}>{ayat.nomorAyat}</Text>
        </LinearGradient>
      </View>
      
      <View style={styles.ayatContent}>
        <Text style={[styles.arabicText, {color: theme.text, textAlign: 'right'}]}>
          {ayat.teksArab}
        </Text>
        
        <View style={styles.audioButtonContainer}>
          <TouchableOpacity 
            style={[styles.audioButton, {borderColor: theme.accent}]}
            onPress={() => playAudio(ayat.audio[selectedAudio], ayat.nomorAyat)}
          >
            <IconFeather 
              name={currentPlayingAyat === ayat.nomorAyat && isPlaying ? 'pause' : 'play'} 
              size={16} 
              color={theme.accent} 
            />
          </TouchableOpacity>
        </View>
        
        <Text style={[styles.latinText, {color: theme.subtext}]}>
          {ayat.teksLatin}
        </Text>
        <Text style={[styles.translationText, {color: theme.text}]}>
          {ayat.teksIndonesia}
        </Text>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={[styles.loadingContainer, {backgroundColor: theme.background}]}>
        <ActivityIndicator size="large" color={theme.accent} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.loadingContainer, {backgroundColor: theme.background}]}>
        <Text style={[styles.errorText, {color: theme.text}]}>{error}</Text>
      </View>
    );
  }

  if (!surahDetail) {
    return null;
  }

  return (
    <SafeAreaView style={[styles.safeArea, {backgroundColor: theme.background}]}>
      <StatusBar 
        barStyle={isDarkMode ? 'light-content' : 'dark-content'} 
        backgroundColor={theme.primary} 
      />
      
      {renderHeader()}
      
      <ScrollView 
        style={[styles.container, {backgroundColor: theme.background}]}
        contentContainerStyle={styles.scrollContent}
      >
        {surahNumber !== 1 && surahNumber !== 9 && (
          <View style={[styles.basmalahContainer, {backgroundColor: theme.card}]}>
            <Text style={[styles.basmalah, {color: theme.accent}]}>
              بِسْمِ اللّٰهِ الرَّحْمٰنِ الرَّحِيْمِ
            </Text>
          </View>
        )}
        
        {renderAudioControls()}
        
        <View style={styles.surahInfo}>
          <Text style={[styles.surahName, {color: theme.text}]}>
            {surahDetail.namaLatin} ({surahDetail.nama})
          </Text>
          <Text style={[styles.surahArt, {color: theme.accent}]}>
            Meaning: {surahDetail.arti}
          </Text>
          
          <View style={[styles.descriptionContainer, {backgroundColor: theme.card}]}>
            <RenderHtml
              contentWidth={width}
              source={{ html: surahDetail.deskripsi }}
              baseStyle={{
                color: theme.text,
                fontSize: 14,
                lineHeight: 22,
                textAlign: 'justify',
              }}
            />
          </View>
        </View>
        
        <View style={styles.ayatList}>
          {surahDetail.ayat.map(renderAyatItem)}
        </View>
        
        {surahDetail.suratSelanjutnya && (
          <TouchableOpacity 
            style={[styles.nextSurah, {backgroundColor: theme.accent}]}
            onPress={() => navigation.replace('DetailSurah', { surahNumber: surahDetail.suratSelanjutnya.nomor })}
          >
            <Text style={styles.nextSurahText}>
              Next Surah: {surahDetail.suratSelanjutnya.namaLatin}
            </Text>
            <Icon name="chevron-right" size={24} color="#FFF" />
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
  },
  scrollContent: {
    paddingBottom: 20,
  },
  headerContainer: {
    paddingTop: 16,
    paddingBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 8,
    zIndex: 10,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  backButton: {
    marginRight: 16,
  },
  headerTextContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    fontFamily: 'sans-serif-medium',
  },
  headerSubtitle: {
    fontSize: 14,
    marginTop: 4,
    fontFamily: 'sans-serif',
  },
  themeToggle: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  basmalahContainer: {
    padding: 20,
    margin: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  basmalah: {
    fontSize: 20,
    fontFamily: 'Traditional Arabic',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  audioControls: {
    padding: 16,
    marginHorizontal: 16,
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  audioTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
    fontFamily: 'sans-serif-medium',
  },
  qariOptions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  qariOption: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  qariOptionText: {
    fontSize: 14,
    fontFamily: 'sans-serif',
  },
  playButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
  },
  playButtonText: {
    color: '#FFF',
    marginLeft: 8,
    fontSize: 16,
    fontFamily: 'sans-serif-medium',
  },
  surahInfo: {
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  surahName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
    fontFamily: 'sans-serif-medium',
  },
  surahArt: {
    fontSize: 16,
    marginBottom: 16,
    textAlign: 'center',
    fontFamily: 'sans-serif',
  },
  descriptionContainer: {
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  ayatList: {
    marginHorizontal: 16,
  },
  ayatContainer: {
    borderRadius: 12,
    marginBottom: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  ayatNumberContainer: {
    alignItems: 'flex-end',
    marginBottom: 12,
  },
  ayatNumber: {
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  ayatNumberText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  ayatContent: {
    marginTop: 8,
  },
  arabicText: {
    fontSize: 24,
    fontFamily: 'Traditional Arabic',
    lineHeight: 48,
    marginBottom: 12,
  },
  audioButtonContainer: {
    alignItems: 'flex-end',
    marginBottom: 12,
  },
  audioButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  latinText: {
    fontSize: 14,
    fontStyle: 'italic',
    marginBottom: 8,
    fontFamily: 'sans-serif',
  },
  translationText: {
    fontSize: 14,
    lineHeight: 20,
    fontFamily: 'sans-serif',
  },
  nextSurah: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 8,
    marginHorizontal: 16,
    marginTop: 8,
  },
  nextSurahText: {
    color: '#FFF',
    fontSize: 16,
    fontFamily: 'sans-serif-medium',
    marginRight: 8,
  },
  errorText: {
    fontSize: 16,
    fontFamily: 'sans-serif-medium',
  },
});

export default DetailSurahScreen;