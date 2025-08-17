import React from 'react';
import {View, Text, StyleSheet, Image} from 'react-native';
import {Colors, FontSizes, FontFamily} from '../utils/constants';
import SearchBar from './SearchBar';
import {useSettings} from '../context/SettingsContext';

interface HeaderProps {
  showSearchBar?: boolean;
  onSearch?: (query: string) => void;
  onItemSelect?: (item: any) => void;
  searchResults?: any[];
  loading?: boolean;
}

const Header: React.FC<HeaderProps> = ({
  showSearchBar = false,
  onSearch = () => {},
  onItemSelect = () => {},
  searchResults = [],
  loading = false,
}) => {
  const {logoUrl, companyName} = useSettings();

  return (
    <View style={styles.headerContainer}>
      <View style={styles.contentContainer}>
        <View style={styles.topSection}>
          <Image
            source={
              logoUrl
                ? {uri: logoUrl}
                : // Gunakan logo lokal sebagai cadangan
                  require('../assets/images/logo.png')
            }
            style={styles.logo}
            resizeMode="contain"
          />
          {/* Gunakan nama perusahaan dari API jika ada, jika tidak, gunakan teks statis */}
          <Text style={styles.title}>{companyName || 'My RBA Billing'}</Text>
        </View>

        {showSearchBar && (
          <View style={styles.searchBarContainer}>
            <SearchBar
              onSearch={onSearch}
              onItemSelect={onItemSelect}
              searchResults={searchResults}
              loading={loading}
            />
          </View>
        )}
      </View>
    </View>
  );
};

// Style tetap sama seperti kode awal Anda
const styles = StyleSheet.create({
  headerContainer: {
    backgroundColor: Colors.primary,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    paddingBottom: 16,
    zIndex: 1000,
    elevation: 10,
  },
  contentContainer: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  topSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  logo: {
    width: 60,
    height: 60,
    marginRight: 12,
  },
  title: {
    fontSize: FontSizes.large,
    color: Colors.white,
    fontFamily: FontFamily.bold,
  },
  searchBarContainer: {
    position: 'relative',
    zIndex: 100,
  },
});

export default Header;
