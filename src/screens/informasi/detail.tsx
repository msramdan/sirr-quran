import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Image, Text, ActivityIndicator } from 'react-native';
import Header from '../../components/Header';
import { fetchInformationDetail } from '../../services/information';

const InformationDetail = ({ route }: any) => {
  const { id } = route.params;
  const [loading, setLoading] = useState(true);
  const [information, setInformation] = useState<any>(null);

  useEffect(() => {
    const loadDetail = async () => {
      try {
        setLoading(true);
        const data = await fetchInformationDetail(id);
        setInformation(data);
      } finally {
        setLoading(false);
      }
    };

    loadDetail();
  }, [id]);

  if (loading) {
    return (
      <View style={styles.container}>
        <Header showSearchBar={false} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3a7bd5" />
        </View>
      </View>
    );
  }

  if (!information) {
    return (
      <View style={styles.container}>
        <Header showSearchBar={false} />
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Gagal memuat detail informasi</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Header showSearchBar={false} />
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.card}>
          <Image 
            source={{ uri: information.thumbnail }} 
            style={styles.thumbnail} 
            resizeMode="cover"
          />
          <View style={styles.textContainer}>
            <Text style={styles.title}>{information.judul}</Text>

            <View style={styles.metaContainer}>
              <Text style={[
                styles.status,
                { backgroundColor: information.is_aktif === 'Yes' ? '#E8F5E9' : '#FFEBEE', color: information.is_aktif === 'Yes' ? '#388E3C' : '#C62828' }
              ]}>
                {information.is_aktif === 'Yes' ? 'Aktif' : 'Tidak Aktif'}
              </Text>
              <Text style={styles.date}>
                Dipublikasikan: {new Date(information.created_at).toLocaleDateString('id-ID', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric'
                })}
              </Text>
            </View>

            <Text style={styles.description}>{information.deskripsi}</Text>

            {information.updated_at !== information.created_at && (
              <Text style={styles.updatedText}>
                Terakhir diperbarui: {new Date(information.updated_at).toLocaleDateString('id-ID', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric'
                })}
              </Text>
            )}
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f2f5',
  },
  scrollContainer: {
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    color: '#ff4444',
    fontSize: 16,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
  },
  thumbnail: {
    width: '100%',
    height: 200,
  },
  textContainer: {
    padding: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  metaContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  status: {
    fontSize: 12,
    fontWeight: '600',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 8,
    overflow: 'hidden',
  },
  date: {
    fontSize: 13,
    color: '#888',
  },
  description: {
    fontSize: 16,
    color: '#444',
    lineHeight: 24,
    textAlign: 'justify',
  },
  updatedText: {
    fontSize: 12,
    color: '#888',
    fontStyle: 'italic',
    marginTop: 16,
  },
});

export default InformationDetail;
