import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  ActivityIndicator, 
  TouchableOpacity, 
  TextInput, 
  SafeAreaView,
  Switch,
  StatusBar
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialIcons';

const HomeScreen = () => {
  const [surahs, setSurahs] = useState([]);
  const [filteredSurahs, setFilteredSurahs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Color schemes
  const colors = {
    light: {
      primary: '#0F1B2D', // Midnight blue
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

  const theme = isDarkMode ? colors.dark : colors.light;

  useEffect(() => {
    const fetchSurahs = async () => {
      try {
        const response = await fetch('https://equran.id/api/v2/surat');
        const data = await response.json();

        if (data.code === 200) {
          setSurahs(data.data);
          setFilteredSurahs(data.data);
        } else {
          setError('Gagal mengambil data surah');
        }
      } catch (err) {
        setError('Error saat mengambil data');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchSurahs();
  }, []);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredSurahs(surahs);
    } else {
      const filtered = surahs.filter(surah => 
        surah.namaLatin.toLowerCase().includes(searchQuery.toLowerCase()) ||
        surah.nama.toLowerCase().includes(searchQuery.toLowerCase()) ||
        surah.nomor.toString().includes(searchQuery)
      );
      setFilteredSurahs(filtered);
    }
  }, [searchQuery, surahs]);

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
  };

  const renderHeader = () => (
    <LinearGradient 
      colors={[theme.primary, theme.secondary]}
      style={styles.headerContainer}
      start={{x: 0, y: 0}}
      end={{x: 1, y: 0}}
    >
      <View style={styles.headerContent}>
        <View>
          <Text style={[styles.headerTitle, {color: '#FFF'}]}>Al-Qur'an</Text>
          <Text style={[styles.headerSubtitle, {color: 'rgba(255,255,255,0.8)'}]}>
            Bacalah dengan nama Tuhanmu
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
      
      <View style={[styles.searchContainer, {backgroundColor: theme.primary}]}>
        <View style={[styles.searchInputContainer, {backgroundColor: theme.searchBg}]}>
          <Icon name="search" size={20} color={theme.subtext} style={styles.searchIcon} />
          <TextInput
            style={[styles.searchInput, {color: theme.text}]}
            placeholder="Cari surah..."
            placeholderTextColor={theme.subtext}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>
    </LinearGradient>
  );

  const renderSurahItem = ({ item }) => (
    <TouchableOpacity 
      style={[
        styles.surahItem, 
        {backgroundColor: theme.card, borderBottomColor: theme.border}
      ]}
      activeOpacity={0.7}
    >
      <LinearGradient 
        colors={[theme.accent, theme.secondary]}
        style={styles.surahNumberContainer}
        start={{x: 0, y: 0}}
        end={{x: 1, y: 0}}
      >
        <Text style={[styles.surahNumber, {color: '#FFF'}]}>{item.nomor}</Text>
      </LinearGradient>
      <View style={styles.surahInfo}>
        <Text style={[styles.surahName, {color: theme.text}]}>{item.namaLatin}</Text>
        <Text style={[styles.surahDetails, {color: theme.subtext}]}>
          {item.tempatTurun === 'mekah' ? 'Makkiyah' : 'Madaniyah'} • {item.jumlahAyat} ayat
        </Text>
      </View>
      <Text style={[styles.surahArabic, {color: theme.accent}]}>{item.nama}</Text>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={[styles.center, {backgroundColor: theme.background}]}>
        <ActivityIndicator size="large" color={theme.accent} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.center, {backgroundColor: theme.background}]}>
        <Text style={[styles.errorText, {color: theme.text}]}>{error}</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.safeArea, {backgroundColor: theme.background}]}>
      <StatusBar 
        barStyle={isDarkMode ? 'light-content' : 'dark-content'} 
        backgroundColor={theme.primary} 
      />
      <View style={[styles.container, {backgroundColor: theme.background}]}>
        <FlatList
          ListHeaderComponent={renderHeader}
          data={filteredSurahs}
          renderItem={renderSurahItem}
          keyExtractor={(item) => item.nomor.toString()}
          contentContainerStyle={styles.listContainer}
          stickyHeaderIndices={[0]}
        />
      </View>
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
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerContainer: {
    paddingTop: 16,
    paddingBottom: 8,
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
    paddingBottom: 16,
  },
  themeToggle: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    fontFamily: 'sans-serif-medium',
  },
  headerSubtitle: {
    fontSize: 14,
    marginTop: 4,
    fontFamily: 'sans-serif',
  },
  searchContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 48,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    height: '100%',
    fontFamily: 'sans-serif',
  },
  listContainer: {
    paddingBottom: 16,
  },
  surahItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    marginHorizontal: 16,
    marginVertical: 4,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  surahNumberContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  surahNumber: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  surahInfo: {
    flex: 1,
  },
  surahName: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'sans-serif-medium',
  },
  surahDetails: {
    fontSize: 12,
    marginTop: 4,
    fontFamily: 'sans-serif',
  },
  surahArabic: {
    fontSize: 18,
    fontFamily: 'Traditional Arabic',
    fontWeight: 'bold',
  },
  errorText: {
    fontSize: 16,
    fontFamily: 'sans-serif-medium',
  },
});

export default HomeScreen;