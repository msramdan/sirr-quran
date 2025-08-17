import React, { useState } from 'react';
import {
  View,
  TextInput,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Text,
  Platform,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { Colors, FontFamily } from '../utils/constants';

interface SearchBarProps {
  placeholder?: string;
  onSearch: (query: string) => void;
  onItemSelect: (item: any) => void;
  searchResults?: any[];
  loading?: boolean;
}

const SearchBar: React.FC<SearchBarProps> = ({
  placeholder = 'Cari Tagihan...',
  onSearch,
  onItemSelect,
  searchResults = [],
  loading = false,
}) => {
  const [query, setQuery] = useState('');

  const handleSearch = (text: string) => {
    setQuery(text);
    onSearch(text);
  };

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <Icon name="search" size={20} color="#888" style={styles.icon} />
        <TextInput
          placeholder={placeholder}
          placeholderTextColor="#888"
          style={styles.input}
          value={query}
          onChangeText={handleSearch}
        />
      </View>

      {query.length > 0 && (
        <View style={[
          styles.resultsContainer,
          Platform.OS === 'ios' ? styles.iosShadow : styles.androidShadow
        ]}>
          {loading ? (
            <View style={styles.resultItem}>
              <Text>Mencari...</Text>
            </View>
          ) : searchResults.length > 0 ? (
            <FlatList
              data={searchResults}
              keyExtractor={(item) => item.id.toString()}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.resultItem}
                  onPress={() => {
                    setQuery('');
                    onItemSelect(item);
                  }}>
                  <Text style={styles.resultText}>{item.no_tagihan}</Text>
                </TouchableOpacity>
              )}
              keyboardShouldPersistTaps="handled"
            />
          ) : (
            <View style={styles.resultItem}>
              <Text style={styles.resultText}>Tidak ditemukan</Text>
            </View>
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 40,
    elevation: 2,
  },
  icon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: Colors.dark,
    fontFamily: FontFamily.regular,
  },
  resultsContainer: {
    position: 'absolute',
    top: 45,
    left: 0,
    right: 0,
    backgroundColor: Colors.white,
    borderRadius: 8,
    maxHeight: 200,
    borderWidth: 1,
    borderColor: Colors.lightGray,
    zIndex: 999, // Tambahkan ini
    elevation: 5, // Supaya di Android tetap di atas
  },
  iosShadow: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  androidShadow: {
    elevation: 5,
  },
  resultItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.lightGray,
  },
  resultText: {
    fontSize: 14,
    color: Colors.dark,
  },
});

export default SearchBar;