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
  Dimensions,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialIcons';
import Header from '../../components/Header';
import { useTheme } from '../../utils/ThemeContext';
import { BASE_URL } from '../../utils/constants';

const { width } = Dimensions.get('window');

const QuranScreen = ({ navigation }) => {
  const [surahs, setSurahs] = useState([]);
  const [filteredSurahs, setFilteredSurahs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  const { colors } = useTheme();

  useEffect(() => {
    const fetchSurahs = async () => {
      try {
        const response = await fetch(`${BASE_URL}/surat`);
        const data = await response.json();

        if (data.code === 200) {
          setSurahs(data.data);
          setFilteredSurahs(data.data);
        } else {
          setError('Failed to fetch surahs');
        }
      } catch (err) {
        setError('Error fetching data');
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

  // Komponen Search Bar dengan layout yang lebih elegan
  const renderSearchSection = () => (
    <View style={[styles.searchSection, { backgroundColor: colors.background }]}>
      {/* Header Info */}
      <View style={styles.headerInfoContainer}>
        <View>
          <Text style={[styles.totalSurahs, { color: colors.text }]}>
            {surahs.length} Surahs
          </Text>
          <Text style={[styles.searchSubtitle, { color: colors.subtext }]}>
            Find your surah easily
          </Text>
        </View>
        {searchQuery.length > 0 && (
          <View style={styles.resultsBadge}>
            <Text style={[styles.resultsText, { color: colors.accent }]}>
              {filteredSurahs.length} found
            </Text>
          </View>
        )}
      </View>
      
      {/* Search Input */}
      <View style={[
        styles.modernSearchContainer, 
        { 
          backgroundColor: colors.card,
          borderWidth: searchFocused ? 1.5 : 0,
          borderColor: searchFocused ? colors.accent : 'transparent',
        }
      ]}>
        <Icon 
          name="search" 
          size={22} 
          color={searchFocused ? colors.accent : colors.subtext} 
          style={styles.searchIcon} 
        />
        <TextInput
          style={[styles.modernSearchInput, { color: colors.text }]}
          placeholder="Search by name or number..."
          placeholderTextColor={colors.subtext}
          value={searchQuery}
          onChangeText={setSearchQuery}
          onFocus={() => setSearchFocused(true)}
          onBlur={() => setSearchFocused(false)}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity
            onPress={() => setSearchQuery('')}
            style={[styles.clearButton, { backgroundColor: colors.accent + '15' }]}
          >
            <Icon name="clear" size={16} color={colors.accent} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  // Komponen Surah Item dengan design yang lebih elegan
  const renderSurahItem = ({ item, index }) => (
    <TouchableOpacity
      style={[
        styles.elegantSurahItem,
        {
          backgroundColor: colors.card,
          borderBottomWidth: 1,
          borderBottomColor: colors.border + '30',
        }
      ]}
      activeOpacity={0.7}
      onPress={() => navigation.navigate('DetailSurah', { surahNumber: item.nomor })}
    >
      {/* Left side - Decorative number */}
      <View style={styles.surahNumberWrapper}>
        <LinearGradient
          colors={[colors.accent, colors.secondary]}
          style={styles.modernNumberContainer}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <Text style={styles.modernSurahNumber}>{item.nomor}</Text>
        </LinearGradient>
      </View>

      {/* Middle - Main content */}
      <View style={styles.surahContentArea}>
        <View style={styles.surahMainInfo}>
          <Text style={[styles.elegantSurahName, { color: colors.text }]}>
            {item.namaLatin}
          </Text>
          <Text style={[styles.arabicName, { color: colors.accent }]}>
            {item.nama}
          </Text>
        </View>
        
        <View style={styles.surahMetaInfo}>
          <View style={styles.metaItem}>
            <Icon 
              name={item.tempatTurun === 'mekah' ? 'location-on' : 'location-city'} 
              size={14} 
              color={colors.subtext} 
            />
            <Text style={[styles.metaText, { color: colors.subtext }]}>
              {item.tempatTurun === 'mekah' ? 'Makkiyah' : 'Madaniyah'}
            </Text>
          </View>
          <View style={styles.metaItem}>
            <Icon name="article" size={14} color={colors.subtext} />
            <Text style={[styles.metaText, { color: colors.subtext }]}>
              {item.jumlahAyat} verses
            </Text>
          </View>
        </View>
      </View>

      {/* Right side - Action indicator */}
      <View style={styles.actionArea}>
        <Icon 
          name="play-circle-outline" 
          size={24} 
          color={colors.accent + '80'} 
        />
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.accent} />
        <Text style={[styles.loadingText, { color: colors.text }]}>
          Loading Surahs...
        </Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <Icon name="error-outline" size={48} color={colors.accent} />
        <Text style={[styles.errorText, { color: colors.text }]}>{error}</Text>
        <TouchableOpacity 
          style={[styles.retryButton, { backgroundColor: colors.accent }]}
          onPress={() => window.location.reload()}
        >
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <FlatList
        ListHeaderComponent={
          <>
            <Header
              title="Al-Qur'an"
              subtitle="Read in the name of your Lord"
            />
            {renderSearchSection()}
          </>
        }
        data={filteredSurahs}
        renderItem={renderSurahItem}
        keyExtractor={(item) => item.nomor.toString()}
        contentContainerStyle={styles.listContainer}
        stickyHeaderIndices={[0]}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    fontFamily: 'sans-serif',
  },
  errorText: {
    fontSize: 16,
    fontFamily: 'sans-serif-medium',
    textAlign: 'center',
    marginTop: 16,
    marginHorizontal: 32,
  },
  retryButton: {
    marginTop: 16,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },

  // Search Section Styles - Layout Elegan
  searchSection: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  headerInfoContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  totalSurahs: {
    fontSize: 20,
    fontWeight: '700',
    fontFamily: 'sans-serif-medium',
  },
  searchSubtitle: {
    fontSize: 13,
    fontFamily: 'sans-serif',
    marginTop: 2,
  },
  resultsBadge: {
    backgroundColor: 'rgba(0,0,0,0.05)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  resultsText: {
    fontSize: 12,
    fontWeight: '600',
  },
  modernSearchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    paddingHorizontal: 18,
    height: 50,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  modernSearchInput: {
    flex: 1,
    fontSize: 16,
    fontFamily: 'sans-serif',
    marginLeft: 12,
  },
  clearButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // List Container
  listContainer: {
    paddingBottom: 20,
  },

  // Elegant Surah Item Styles
  elegantSurahItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 18,
    paddingHorizontal: 20,
  },
  surahNumberWrapper: {
    marginRight: 16,
  },
  modernNumberContainer: {
    width: 42,
    height: 42,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modernSurahNumber: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFF',
  },
  surahContentArea: {
    flex: 1,
  },
  surahMainInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  elegantSurahName: {
    fontSize: 17,
    fontWeight: '600',
    fontFamily: 'sans-serif-medium',
    flex: 1,
  },
  arabicName: {
    fontSize: 18,
    fontFamily: 'Traditional Arabic',
    fontWeight: 'bold',
    marginLeft: 16,
  },
  surahMetaInfo: {
    flexDirection: 'row',
    gap: 16,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 12,
    fontFamily: 'sans-serif',
  },
  actionArea: {
    marginLeft: 16,
    padding: 8,
  },
});

export default QuranScreen;