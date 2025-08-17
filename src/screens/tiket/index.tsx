import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  FlatList,
  Modal,
  TouchableWithoutFeedback,
  Keyboard,
  TextInput,
  Alert,
  Image,
  ScrollView
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { format } from 'date-fns';
import { Colors, FontSizes, FontFamily } from '../../utils/constants';
import DatePicker from 'react-native-date-picker';
import { fetchTiketByPelanggan, TiketAduan, createTiket } from '../../services/tiket';
import authService from '../../services/auth';
import { launchImageLibrary, launchCamera } from 'react-native-image-picker';
import { PermissionsAndroid, Platform } from 'react-native';

const TiketScreen = ({ navigation }: any) => {
  const [data, setData] = useState<TiketAduan[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [pelangganId, setPelangganId] = useState<number | null>(null);

  // Form states
  const [deskripsi, setDeskripsi] = useState('');
  const [prioritas, setPrioritas] = useState<'Rendah' | 'Sedang' | 'Tinggi'>('Sedang');
  const [lampiran, setLampiran] = useState<any>(null);

  // Filter states
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [statusFilter, setStatusFilter] = useState<'Semua' | 'Menunggu' | 'Diproses' | 'Selesai' | 'Dibatalkan'>('Semua');
  const [datePickerMode, setDatePickerMode] = useState<'start' | 'end' | null>(null);

  const loadData = useCallback(async (currentPage = 1, isRefreshing = false) => {
    try {
      if (!pelangganId) return;

      if (currentPage === 1 || isRefreshing) {
        setLoading(true);
      }

      const filters = {
        ...(startDate && { startDate: format(startDate, 'yyyy-MM-dd') }),
        ...(endDate && { endDate: format(endDate, 'yyyy-MM-dd') }),
        ...(statusFilter !== 'Semua' && { status: statusFilter }),
      };

      const response = await fetchTiketByPelanggan(pelangganId, currentPage, 10, filters);

      if (response) {
        if (currentPage === 1 || isRefreshing) {
          setData(response.data);
        } else {
          setData(prev => [...prev, ...response.data]);
        }
        setTotal(response.total);
        setHasMore(response.data.length >= 10);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [pelangganId, startDate, endDate, statusFilter]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setPage(1);
    loadData(1, true);
  }, [loadData]);

  const loadMore = () => {
    if (!loading && hasMore) {
      setPage(prev => {
        const newPage = prev + 1;
        loadData(newPage);
        return newPage;
      });
    }
  };

  const loadUserData = useCallback(async () => {
    try {
      const storedUser = await authService.getStoredUser();
      if (storedUser?.id) {
        setPelangganId(storedUser.id);
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  }, []);

  useEffect(() => {
    loadUserData();
  }, [loadUserData]);

  useEffect(() => {
    if (pelangganId) {
      loadData();
    }
  }, [pelangganId, loadData]);

  const handleDeleteSuccess = useCallback(() => {
    loadData(1, true);
  }, [loadData]);

  const applyFilters = () => {
    setShowFilterModal(false);
    setPage(1);
    loadData(1, true);
  };

  const resetFilters = () => {
    setStartDate(null);
    setEndDate(null);
    setStatusFilter('Semua');
    setShowFilterModal(false);
    setPage(1);
    loadData(1, true);
  };

  const handlePilihLampiran = () => {
    const options: any = {
      mediaType: 'photo',
      quality: 0.8,
      includeBase64: false,
      saveToPhotos: false,
    };

    launchImageLibrary(options, (response) => {
      if (response.didCancel) {
        console.log('User cancelled image picker');
      } else if (response.errorCode) {
        console.log('ImagePicker Error: ', response.errorMessage);
      } else if (response.assets && response.assets.length > 0) {
        const asset = response.assets[0];
        setLampiran({
          uri: asset.uri,
          type: asset.type || 'image/jpeg',
          name: asset.fileName || `photo_${Date.now()}.jpg`,
        });
      }
    });
  };

  // Fungsi untuk mengambil foto langsung dari kamera
  const handleTakePhoto = async () => {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.CAMERA,
          {
            title: 'Camera Permission',
            message: 'App needs access to your camera',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          }
        );

        if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
          Alert.alert('Permission Denied', 'Camera permission is required to take photos');
          return;
        }
      } catch (err) {
        console.warn(err);
        return;
      }
    }

    const options: any = {
      mediaType: 'photo',
      quality: 0.8,
      includeBase64: false,
      saveToPhotos: true,
      cameraType: 'back',
    };

    launchCamera(options, (response) => {
      if (response.didCancel) {
        console.log('User cancelled camera');
      } else if (response.errorCode) {
        Alert.alert('Error', response.errorMessage || 'Failed to take photo');
        console.log('Camera Error: ', response.errorMessage);
      } else if (response.assets && response.assets.length > 0) {
        const asset = response.assets[0];
        setLampiran({
          uri: asset.uri,
          type: asset.type || 'image/jpeg',
          name: asset.fileName || `photo_${Date.now()}.jpg`,
        });
      }
    });
  };

  const handleSubmitTiket = async () => {
    if (!pelangganId || !deskripsi) {
      Alert.alert('Kesalahan', 'Deskripsi aduan harus diisi');
      return;
    }

    try {
      setLoading(true);
      await createTiket(pelangganId, deskripsi, prioritas, lampiran);

      Alert.alert('Berhasil', 'Tiket aduan berhasil dibuat');
      setShowCreateModal(false);
      setDeskripsi('');
      setPrioritas('Sedang');
      setLampiran(null);

      loadData(1, true);
    } catch (error: any) {
      console.error('Gagal membuat tiket:', error);
      Alert.alert('Kesalahan', error.message || 'Terjadi kesalahan saat membuat tiket');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Menunggu':
        return Colors.warning;
      case 'Diproses':
        return Colors.info;
      case 'Selesai':
        return Colors.success;
      case 'Dibatalkan':
        return Colors.danger;
      default:
        return Colors.gray;
    }
  };

  const getPrioritasColor = (prioritas: string) => {
    switch (prioritas) {
      case 'Rendah':
        return Colors.primary;
      case 'Sedang':
        return Colors.warning;
      case 'Tinggi':
        return Colors.danger;
      default:
        return Colors.gray;
    }
  };

  const renderItem = ({ item }: { item: TiketAduan }) => (
    <TouchableOpacity
      style={styles.historyItem}
      onPress={() => navigation.navigate('TiketDetail', {
        tiketId: item.id,
        onDeleteSuccess: handleDeleteSuccess
      })}
    >
      <View style={styles.historyHeader}>
        <View style={styles.tiketNumberContainer}>
          <Icon name="confirmation-number" size={18} color={Colors.primary} style={styles.tiketIcon} />
          <Text style={styles.tiketNumber}>{item.nomor_tiket}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
          <Text style={styles.statusText}>{item.status}</Text>
        </View>
      </View>

      <Text style={styles.historyDescription} numberOfLines={2}>
        {item.deskripsi_aduan}
      </Text>

      <View style={styles.historyFooter}>
        <View style={[styles.prioritasBadge, { backgroundColor: getPrioritasColor(item.prioritas) }]}>
          <Icon
            name={
              item.prioritas === 'Tinggi' ? 'priority-high' :
                item.prioritas === 'Sedang' ? 'star' : 'low-priority'
            }
            size={14}
            color={Colors.white}
            style={styles.prioritasIcon}
          />
          <Text style={styles.prioritasText}>{item.prioritas}</Text>
        </View>
        <View style={styles.dateContainer}>
          <Icon name="event" size={14} color={Colors.gray} style={styles.dateIcon} />
          <Text style={styles.historyDate}>
            {format(new Date(item.tanggal_aduan), 'dd MMM yyyy')}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderFooter = () => {
    if (!loading || page === 1) return null;
    return (
      <View style={styles.footer}>
        <ActivityIndicator size="small" color={Colors.primary} />
      </View>
    );
  };

  return (
    <View style={styles.container}>
      
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerButton}>
          <Icon name="arrow-back" size={FontSizes.xlarge} color={Colors.white} />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Icon name="confirmation-number" size={FontSizes.xlarge} color={Colors.white} style={styles.headerIcon} />
          <Text style={styles.headerTitle}>Tiket Aduan</Text>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity onPress={() => setShowFilterModal(true)} style={styles.headerButton}>
            <Icon name="filter-alt" size={FontSizes.xlarge} color={Colors.white} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setShowCreateModal(true)} style={styles.headerButton}>
            <Icon name="add-circle-outline" size={FontSizes.xlarge} color={Colors.white} />
          </TouchableOpacity>
        </View>
      </View>

      {loading && page === 1 ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : (
        <FlatList
          data={data}
          renderItem={renderItem}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[Colors.primary]}
              tintColor={Colors.primary}
            />
          }
          ListHeaderComponent={
            <View style={styles.listHeader}>
              <Text style={styles.listHeaderText}>Riwayat Tiket</Text>
              <Text style={styles.listHeaderCount}>{total} tiket ditemukan</Text>
            </View>
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Icon name="history" size={48} color={Colors.gray} />
              <Text style={styles.emptyText}>Tidak ada tiket aduan</Text>
            </View>
          }
          ListFooterComponent={renderFooter}
          onEndReached={loadMore}
          onEndReachedThreshold={0.5}
        />
      )}

      {/* Filter Modal */}
      <Modal
        visible={showFilterModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowFilterModal(false)}
      >
        <TouchableWithoutFeedback onPress={() => Keyboard.dismiss()}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>
                  <Icon name="filter-alt" size={20} color={Colors.primary} /> Filter Tiket
                </Text>
                <TouchableOpacity onPress={() => setShowFilterModal(false)}>
                  <Icon name="close" size={FontSizes.xlarge} color={Colors.gray} />
                </TouchableOpacity>
              </View>

              <ScrollView>
                <View style={styles.filterSection}>
                  <Text style={styles.filterLabel}>
                    Status Tiket
                  </Text>
                  <View style={styles.statusFilterContainer}>
                    {(['Semua', 'Menunggu', 'Diproses', 'Selesai', 'Dibatalkan'] as const).map((status) => (
                      <TouchableOpacity
                        key={status}
                        style={[
                          styles.statusFilterButton,
                          statusFilter === status && styles.statusFilterActive
                        ]}
                        onPress={() => setStatusFilter(status)}
                      >
                        <Icon
                          name={
                            status === 'Menunggu' ? 'hourglass-empty' :
                              status === 'Diproses' ? 'autorenew' :
                                status === 'Selesai' ? 'check-circle' :
                                  status === 'Dibatalkan' ? 'cancel' : 'all-inclusive'
                          }
                          size={16}
                          color={statusFilter === status ? Colors.primary : Colors.gray}
                        />
                        <Text style={statusFilter === status ? styles.statusFilterTextActive : styles.statusFilterText}>
                          {status}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                <View style={styles.filterSection}>
                  <Text style={styles.filterLabel}>
                    Tanggal Mulai
                  </Text>
                  <TouchableOpacity
                    style={styles.dateInput}
                    onPress={() => setDatePickerMode('start')}
                  >
                    <Icon name="calendar-today" size={18} color={Colors.primary} />
                    <Text style={styles.dateInputText}>
                      {startDate ? format(startDate, 'dd MMM yyyy') : 'Pilih tanggal'}
                    </Text>
                    <Icon name="keyboard-arrow-down" size={20} color={Colors.gray} />
                  </TouchableOpacity>
                </View>

                <View style={styles.filterSection}>
                  <Text style={styles.filterLabel}>
                    Tanggal Selesai
                  </Text>
                  <TouchableOpacity
                    style={styles.dateInput}
                    onPress={() => setDatePickerMode('end')}
                  >
                    <Icon name="calendar-today" size={18} color={Colors.primary} />
                    <Text style={styles.dateInputText}>
                      {endDate ? format(endDate, 'dd MMM yyyy') : 'Pilih tanggal'}
                    </Text>
                    <Icon name="keyboard-arrow-down" size={20} color={Colors.gray} />
                  </TouchableOpacity>
                </View>
              </ScrollView>

              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.resetButton]}
                  onPress={resetFilters}
                >
                  <Icon name="refresh" size={18} color={Colors.dark} />
                  <Text style={styles.resetButtonText}>Reset</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalButton, styles.applyButton]}
                  onPress={applyFilters}
                >
                  <Icon name="check" size={18} color={Colors.white} />
                  <Text style={styles.applyButtonText}>Terapkan</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </TouchableWithoutFeedback>

        {datePickerMode && (
          <DatePicker
            modal
            open={true}
            date={datePickerMode === 'start' ? (startDate || new Date()) : (endDate || new Date())}
            mode="date"
            locale="id"
            onConfirm={(date) => {
              if (datePickerMode === 'start') {
                setStartDate(date);
              } else {
                setEndDate(date);
              }
              setDatePickerMode(null);
            }}
            onCancel={() => setDatePickerMode(null)}
          />
        )}
      </Modal>

      {/* Create Tiket Modal */}
      <Modal
        visible={showCreateModal}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setShowCreateModal(false)}
      >
        <TouchableWithoutFeedback onPress={() => Keyboard.dismiss()}>
          <View style={styles.modalOverlay}>
            <View style={styles.createModalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>
                  <Icon name="add-circle" size={20} color={Colors.primary} /> Buat Tiket Baru
                </Text>
                <TouchableOpacity onPress={() => setShowCreateModal(false)}>
                  <Icon name="close" size={FontSizes.xlarge} color={Colors.gray} />
                </TouchableOpacity>
              </View>

              <ScrollView>
                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>
                    Deskripsi Aduan
                  </Text>
                  <TextInput
                    style={[styles.textInput, styles.multilineInput]}
                    placeholder="Masukkan deskripsi aduan Anda"
                    placeholderTextColor={Colors.gray}
                    multiline
                    numberOfLines={4}
                    value={deskripsi}
                    onChangeText={setDeskripsi}
                  />
                </View>

                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>
                    Prioritas
                  </Text>
                  <View style={styles.prioritasOptions}>
                    {(['Rendah', 'Sedang', 'Tinggi'] as const).map((option) => (
                      <TouchableOpacity
                        key={option}
                        style={[
                          styles.prioritasButton,
                          prioritas === option && styles.prioritasButtonActive,
                          prioritas === option && {
                            borderColor: getPrioritasColor(option),
                            backgroundColor: `${getPrioritasColor(option)}20` // 20 = 20% opacity
                          }
                        ]}
                        onPress={() => setPrioritas(option)}
                      >
                        <Icon
                          name={
                            option === 'Tinggi' ? 'priority-high' :
                              option === 'Sedang' ? 'star' : 'low-priority'
                          }
                          size={16}
                          color={prioritas === option ? getPrioritasColor(option) : Colors.gray}
                        />
                        <Text style={[
                          styles.prioritasButtonText,
                          prioritas === option && {
                            color: getPrioritasColor(option),
                            fontFamily: FontFamily.semiBold
                          }
                        ]}>
                          {option}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>Lampiran (Opsional)</Text>
                  {lampiran ? (
                    <View style={styles.lampiranPreview}>
                      <Image
                        source={{ uri: lampiran.uri }}
                        style={styles.lampiranImage}
                        resizeMode="cover"
                      />
                      <TouchableOpacity
                        style={styles.removeLampiranButton}
                        onPress={() => setLampiran(null)}
                      >
                        <Icon name="close" size={16} color={Colors.white} />
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <View style={styles.uploadOptions}>
                      <TouchableOpacity
                        style={[styles.uploadButton, styles.uploadGalleryButton]}
                        onPress={handlePilihLampiran}
                      >
                        <Icon name="photo-library" size={20} color={Colors.primary} />
                        <Text style={styles.uploadButtonText}>Pilih dari Galeri</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.uploadButton, styles.uploadCameraButton]}
                        onPress={handleTakePhoto}
                      >
                        <Icon name="camera-alt" size={20} color={Colors.white} />
                        <Text style={[styles.uploadButtonText, { color: Colors.white }]}>Ambil Foto</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              </ScrollView>

              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.cancelButton]}
                  onPress={() => {
                    setShowCreateModal(false);
                    setDeskripsi('');
                    setPrioritas('Sedang');
                    setLampiran(null);
                  }}
                >
                  <Icon name="close" size={18} color={Colors.dark} />
                  <Text style={styles.cancelButtonText}>Batal</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalButton, styles.submitButton]}
                  onPress={handleSubmitTiket}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator size="small" color={Colors.white} />
                  ) : (
                    <>
                      <Icon name="send" size={18} color={Colors.white} />
                      <Text style={styles.submitButtonText}>Kirim Tiket</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light,
  },
  // Header Styles
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: Colors.primary,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  headerButton: {
    padding: 4,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerIcon: {
    marginRight: 8,
  },
  headerTitle: {
    color: Colors.white,
    fontSize: FontSizes.xlarge,
    fontFamily: FontFamily.semiBold,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  // List Styles
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    paddingBottom: 16,
  },
  listHeader: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  listHeaderText: {
    fontSize: FontSizes.large,
    fontFamily: FontFamily.semiBold,
    color: Colors.dark,
  },
  listHeaderCount: {
    fontSize: FontSizes.small,
    fontFamily: FontFamily.regular,
    color: Colors.gray,
    marginTop: 4,
  },
  // History Item Styles
  historyItem: {
    padding: 16,
    backgroundColor: Colors.white,
    marginHorizontal: 16,
    marginTop: 8,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  tiketNumberContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tiketIcon: {
    marginRight: 8,
  },
  tiketNumber: {
    fontSize: FontSizes.medium,
    fontFamily: FontFamily.semiBold,
    color: Colors.dark,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusText: {
    fontSize: FontSizes.small,
    fontFamily: FontFamily.semiBold,
    color: Colors.white,
    marginLeft: 4,
  },
  historyDescription: {
    fontSize: FontSizes.small,
    fontFamily: FontFamily.regular,
    color: Colors.dark,
    marginBottom: 12,
    lineHeight: 20,
  },
  historyFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  prioritasBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  prioritasIcon: {
    marginRight: 4,
  },
  prioritasText: {
    fontSize: FontSizes.small,
    fontFamily: FontFamily.semiBold,
    color: Colors.white,
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateIcon: {
    marginRight: 4,
  },
  historyDate: {
    fontSize: FontSizes.small,
    fontFamily: FontFamily.regular,
    color: Colors.gray,
  },
  footer: {
    padding: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Empty State Styles
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    marginTop: 16,
    fontSize: FontSizes.large,
    fontFamily: FontFamily.medium,
    color: Colors.gray,
    textAlign: 'center',
  },
  emptyActionButton: {
    marginTop: 20,
    backgroundColor: Colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  emptyActionText: {
    color: Colors.white,
    fontFamily: FontFamily.semiBold,
    fontSize: FontSizes.medium,
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    maxHeight: '80%',
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 20,
  },
  createModalContent: {
    width: '90%',
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 20,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: FontSizes.xlarge,
    fontFamily: FontFamily.semiBold,
    color: Colors.dark,
    flexDirection: 'row',
    alignItems: 'center',
  },
  // Filter Section Styles
  filterSection: {
    marginBottom: 20,
  },
  filterLabel: {
    fontSize: FontSizes.medium,
    fontFamily: FontFamily.medium,
    color: Colors.dark,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusFilterContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 8,
  },
  statusFilterButton: {
    flex: 1,
    minWidth: '48%',
    padding: 12,
    borderWidth: 1,
    borderColor: Colors.borderGray,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  statusFilterActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.lightPrimary,
  },
  statusFilterText: {
    color: Colors.dark,
    fontFamily: FontFamily.regular,
    fontSize: FontSizes.small,
  },
  statusFilterTextActive: {
    color: Colors.primary,
    fontFamily: FontFamily.semiBold,
    fontSize: FontSizes.small,
  },
  // Date Input Styles
  dateInput: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: Colors.borderGray,
    borderRadius: 8,
    padding: 14,
    gap: 8,
  },
  dateInputText: {
    flex: 1,
    color: Colors.dark,
    fontFamily: FontFamily.regular,
    fontSize: FontSizes.medium,
  },
  // Modal Buttons Styles
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
    gap: 12,
  },
  modalButton: {
    flex: 1,
    padding: 14,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  resetButton: {
    backgroundColor: Colors.lightGray,
  },
  resetButtonText: {
    color: Colors.dark,
    fontFamily: FontFamily.medium,
    fontSize: FontSizes.medium,
  },
  applyButton: {
    backgroundColor: Colors.primary,
  },
  applyButtonText: {
    color: Colors.white,
    fontFamily: FontFamily.medium,
    fontSize: FontSizes.medium,
  },
  // Form Styles
  formGroup: {
    marginBottom: 20,
  },
  formLabel: {
    fontSize: FontSizes.medium,
    fontFamily: FontFamily.medium,
    color: Colors.dark,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  textInput: {
    borderWidth: 1,
    borderColor: Colors.borderGray,
    borderRadius: 8,
    padding: 14,
    fontSize: FontSizes.medium,
    color: Colors.dark,
    fontFamily: FontFamily.regular,
  },
  multilineInput: {
    height: 120,
    textAlignVertical: 'top',
  },
  // Prioritas Options Styles
  prioritasOptions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  prioritasButton: {
    flex: 1,
    padding: 12,
    borderWidth: 1,
    borderColor: Colors.borderGray,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  prioritasButtonActive: {
    borderWidth: 1,
  },
  prioritasButtonText: {
    color: Colors.dark,
    fontFamily: FontFamily.regular,
    fontSize: FontSizes.small,
  },
  prioritasButtonTextActive: {
    color: Colors.primary,
    fontFamily: FontFamily.semiBold,
    fontSize: FontSizes.small,
  },
  // Upload Button Styles
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.primary,
    borderRadius: 8,
    padding: 12,
    backgroundColor: Colors.white,
  },
  uploadButtonText: {
    marginLeft: 8,
    color: Colors.primary,
    fontFamily: FontFamily.medium,
    fontSize: FontSizes.medium,
  },
  // Lampiran Preview Styles
  lampiranPreview: {
    position: 'relative',
    height: 150,
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.borderGray,
  },
  lampiranImage: {
    width: '100%',
    height: '100%',
  },
  removeLampiranButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: Colors.danger,
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Cancel Button Styles
  cancelButton: {
    backgroundColor: Colors.lightGray,
  },
  cancelButtonText: {
    color: Colors.dark,
    fontFamily: FontFamily.medium,
    fontSize: FontSizes.medium,
  },
  // Submit Button Styles
  submitButton: {
    backgroundColor: Colors.primary,
  },
  submitButtonText: {
    color: Colors.white,
    fontFamily: FontFamily.medium,
    fontSize: FontSizes.medium,
  },

  uploadOptions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  uploadGalleryButton: {
    flex: 1,
    backgroundColor: Colors.white,
    borderColor: Colors.primary,
    borderWidth: 1,
  },
  uploadCameraButton: {
    flex: 1,
    backgroundColor: Colors.primary,
  },
});

export default TiketScreen;