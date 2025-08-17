import React, { useState, useEffect } from 'react';
import {
  View, StyleSheet, FlatList, TouchableOpacity,
  Image, Text, ActivityIndicator, TextInput
} from 'react-native';
import Header from '../../components/Header';
import { fetchInformations, searchInformationsByJudul } from '../../services/information';

let debounceTimeout: NodeJS.Timeout;

const InformationScreen = ({ navigation }: any) => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [informations, setInformations] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const limit = 10;

  const loadData = async (currentPage = 1, isRefreshing = false) => {
    try {
      isRefreshing ? setRefreshing(true) : setLoading(true);
      const response = await fetchInformations(currentPage, limit);
      setTotal(response.total);
      setInformations(prev =>
        currentPage === 1 ? response.data : [...prev, ...response.data]
      );
    } finally {
      isRefreshing ? setRefreshing(false) : setLoading(false);
    }
  };

  const searchData = async (query: string, currentPage = 1) => {
    setLoading(true);
    try {
      const response = await searchInformationsByJudul(query, currentPage, limit);
      setTotal(response.total);
      setInformations(response.data);
      setPage(currentPage);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSearch = (text: string) => {
    setSearchQuery(text);
    clearTimeout(debounceTimeout);
    debounceTimeout = setTimeout(() => {
      if (text.trim() === '') {
        loadData(1);
      } else {
        searchData(text.trim(), 1);
      }
    }, 400); // debounce 400ms
  };

  const handleRefresh = () => {
    setPage(1);
    if (searchQuery.trim() === '') {
      loadData(1, true);
    } else {
      searchData(searchQuery.trim(), 1);
    }
  };

  const handleLoadMore = () => {
    if (!loading && informations.length < total) {
      const nextPage = page + 1;
      setPage(nextPage);
      if (searchQuery.trim() === '') {
        loadData(nextPage);
      } else {
        searchData(searchQuery.trim(), nextPage);
      }
    }
  };

  const renderItem = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => navigation.navigate('InformationDetail', { id: item.id })}
    >
      <Image
        source={{ uri: item.thumbnail }}
        style={styles.thumbnail}
        resizeMode="cover"
      />
      <View style={styles.content}>
        <Text style={styles.title} numberOfLines={2}>
          {item.judul}
        </Text>
        <Text style={styles.date}>
          {new Date(item.created_at).toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
          })}
        </Text>
        <Text
          style={styles.description}
          numberOfLines={2}
          ellipsizeMode="tail"
        >
          {item.deskripsi}
        </Text>
      </View>
    </TouchableOpacity>
  );

  const renderFooter = () => {
    if (!loading || refreshing) return null;
    return (
      <View style={styles.footer}>
        <ActivityIndicator size="small" color="#3a7bd5" />
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Header showSearchBar={false} />
      <TextInput
        style={styles.searchInput}
        placeholder="Cari Informasi berdasarkan Judul..."
        placeholderTextColor="#aaa"
        value={searchQuery}
        onChangeText={handleSearch}
      />
      <FlatList
        data={informations}
        renderItem={renderItem}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          !loading ? (
            <Text style={styles.emptyText}>Tidak ada informasi ditemukan</Text>
          ) : null
        }
        refreshing={refreshing}
        onRefresh={handleRefresh}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        ListFooterComponent={renderFooter}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f2f5',
  },
  searchInput: {
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 14,
    marginHorizontal: 16,
    marginTop: 10,
    marginBottom: 6,
    borderColor: '#ccc',
    borderWidth: 1,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
  },
  thumbnail: {
    width: '100%',
    height: 160,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  content: {
    padding: 14,
  },
  title: {
    fontSize: 17,
    fontWeight: '600',
    color: '#222',
    marginBottom: 4,
  },
  date: {
    fontSize: 13,
    color: '#777',
    marginBottom: 6,
  },
  description: {
    fontSize: 14,
    color: '#444',
    lineHeight: 22,
  },
  footer: {
    paddingVertical: 20,
  },
  emptyText: {
    textAlign: 'center',
    color: '#888',
    fontSize: 14,
    marginTop: 40,
  },
});

export default InformationScreen;
