import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Text,
  TextInput,
  ScrollView,
  Image,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
  Alert,
  RefreshControl,
  PermissionsAndroid,
  Platform,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { format } from 'date-fns';
import { Colors, FontSizes, FontFamily } from '../../utils/constants';
import { getTiketDetail, updateStatusTiket, TiketAduan, updateTiket, deleteTiket } from '../../services/tiket';
import { launchImageLibrary, launchCamera } from 'react-native-image-picker';

const TiketDetailScreen = ({ navigation, route }: any) => {
  const { tiketId, onDeleteSuccess } = route.params;
  const [tiket, setTiket] = useState<TiketAduan | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editForm, setEditForm] = useState({
    deskripsi: '',
    prioritas: 'Sedang' as 'Rendah' | 'Sedang' | 'Tinggi',
    lampiran: null as any,
    removeLampiran: false,
  });
  const [imagePreview, setImagePreview] = useState('');

  const loadTiketDetail = async () => {
    try {
      setLoading(true);
      const data = await getTiketDetail(tiketId);
      setTiket(data);
      setEditForm({
        deskripsi: data.deskripsi_aduan,
        prioritas: data.prioritas,
        lampiran: null,
        removeLampiran: false,
      });
      setImagePreview('');
    } catch (error) {
      console.error('Error loading ticket detail:', error);
      Alert.alert('Error', 'Gagal memuat detail tiket');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadTiketDetail();
  };

  useEffect(() => {
    loadTiketDetail();
  }, [tiketId]);

  const handleUpdateStatus = async (status: 'Selesai' | 'Dibatalkan') => {
    try {
      setLoading(true);
      await updateStatusTiket(tiketId, status);
      Alert.alert('Berhasil', `Status tiket berhasil diubah menjadi ${status}`);
      loadTiketDetail();
    } catch (error: any) {
      console.error('Error updating status:', error);
      Alert.alert('Error', error.message || 'Gagal mengubah status tiket');
    } finally {
      setLoading(false);
    }
  };

  const handlePilihLampiran = () => {
    launchImageLibrary(
      {
        mediaType: 'photo',
        quality: 0.8,
      },
      (response) => {
        if (response.didCancel) {
          console.log('User cancelled image picker');
        } else if (response.errorCode) {
          console.log('ImagePicker Error: ', response.errorMessage);
        } else if (response.assets && response.assets.length > 0) {
          setEditForm(prev => ({
            ...prev,
            lampiran: response.assets?.[0] || null,
            removeLampiran: false
          }));
          setImagePreview(response.assets?.[0].uri || '');
        }
      }
    );
  };

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

    launchCamera(
      {
        mediaType: 'photo',
        quality: 0.8,
        cameraType: 'back',
        saveToPhotos: true,
      },
      (response) => {
        if (response.didCancel) {
          console.log('User cancelled camera');
        } else if (response.errorCode) {
          Alert.alert('Error', response.errorMessage || 'Failed to take photo');
          console.log('Camera Error: ', response.errorMessage);
        } else if (response.assets && response.assets.length > 0) {
          setEditForm(prev => ({
            ...prev,
            lampiran: response.assets?.[0] || null,
            removeLampiran: false
          }));
          setImagePreview(response.assets?.[0].uri || '');
        }
      }
    );
  };

  const handleUpdateTiket = async () => {
    if (!editForm.deskripsi) {
      Alert.alert('Error', 'Deskripsi aduan harus diisi');
      return;
    }

    try {
      setLoading(true);

      const updateData: any = {
        deskripsi_aduan: editForm.deskripsi,
        prioritas: editForm.prioritas,
      };

      if (editForm.lampiran) {
        updateData.lampiran = editForm.lampiran;
      }

      if (editForm.removeLampiran) {
        updateData.lampiran = null;
      }

      await updateTiket(tiketId, updateData);
      Alert.alert('Berhasil', 'Tiket berhasil diperbarui');
      setShowEditModal(false);
      loadTiketDetail();
    } catch (error: any) {
      console.error('Error updating ticket:', error);
      Alert.alert('Error', error.message || 'Gagal memperbarui tiket');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTiket = async () => {
    try {
      setLoading(true);
      await deleteTiket(tiketId);
      Alert.alert('Berhasil', 'Tiket berhasil dihapus');

      if (onDeleteSuccess) {
        onDeleteSuccess(tiketId);
      }

      navigation.goBack();
    } catch (error: any) {
      console.error('Error deleting ticket:', error);
      Alert.alert('Error', error.message || 'Gagal menghapus tiket');
    } finally {
      setLoading(false);
      setShowDeleteModal(false);
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

  if (loading && !tiket) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  if (!tiket) {
    return (
      <View style={styles.emptyContainer}>
        <Icon name="error-outline" size={48} color={Colors.gray} />
        <Text style={styles.emptyText}>Tiket tidak ditemukan</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerButton}>
          <Icon name="arrow-back" size={FontSizes.xlarge} color={Colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Detail Tiket</Text>
        <View style={styles.headerRight}>
          {tiket.status === 'Menunggu' || tiket.status === 'Diproses' ? (
            <>
              <TouchableOpacity
                onPress={() => setShowEditModal(true)}
                style={styles.actionButton}
              >
                <Icon name="edit" size={FontSizes.xlarge} color={Colors.white} />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setShowDeleteModal(true)}
                style={styles.actionButton}
              >
                <Icon name="delete" size={FontSizes.xlarge} color={Colors.white} />
              </TouchableOpacity>
            </>
          ) : null}
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[Colors.primary]}
            tintColor={Colors.primary}
          />
        }
      >
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.tiketNumber}>{tiket.nomor_tiket}</Text>
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(tiket.status) }]}>
              <Text style={styles.statusText}>{tiket.status}</Text>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Deskripsi Aduan</Text>
            <Text style={styles.sectionValue}>{tiket.deskripsi_aduan}</Text>
          </View>

          <View style={styles.row}>
            <View style={styles.rowItem}>
              <Text style={styles.sectionTitle}>Prioritas</Text>
              <View style={[styles.prioritasBadge, { backgroundColor: getPrioritasColor(tiket.prioritas) }]}>
                <Text style={styles.prioritasText}>{tiket.prioritas}</Text>
              </View>
            </View>
            <View style={styles.rowItem}>
              <Text style={styles.sectionTitle}>Tanggal Aduan</Text>
              <Text style={styles.sectionValue}>
                {format(new Date(tiket.tanggal_aduan), 'dd MMM yyyy HH:mm')}
              </Text>
            </View>
          </View>

          {tiket.lampiran && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Lampiran</Text>
              <Image
                source={{ uri: tiket.lampiran_url || `https://your-api-domain.com/uploads/${tiket.lampiran}` }}
                style={styles.attachmentImage}
                resizeMode="cover"
              />
            </View>
          )}

          {(tiket.status === 'Menunggu' || tiket.status === 'Diproses') && (
            <View style={styles.actionSection}>
              <TouchableOpacity
                style={[styles.actionButtonLarge, { backgroundColor: Colors.success }]}
                onPress={() => handleUpdateStatus('Selesai')}
                disabled={loading}
                activeOpacity={0.7}
              >
                {loading ? (
                  <ActivityIndicator size="small" color={Colors.white} />
                ) : (
                  <>
                    <Icon name="check-circle" size={20} color={Colors.white} />
                    <Text style={styles.actionButtonText}>Tandai Selesai</Text>
                  </>
                )}
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionButtonLarge, { backgroundColor: Colors.danger }]}
                onPress={() => handleUpdateStatus('Dibatalkan')}
                disabled={loading}
                activeOpacity={0.7}
              >
                {loading ? (
                  <ActivityIndicator size="small" color={Colors.white} />
                ) : (
                  <>
                    <Icon name="cancel" size={20} color={Colors.white} />
                    <Text style={styles.actionButtonText}>Batalkan Tiket</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Edit Modal */}
      <Modal
        visible={showEditModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowEditModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Tiket</Text>
              <TouchableOpacity
                onPress={() => setShowEditModal(false)}
                style={styles.modalCloseButton}
              >
                <Icon name="close" size={FontSizes.xlarge} color={Colors.gray} />
              </TouchableOpacity>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Deskripsi Aduan</Text>
              <TextInput
                style={[styles.textInput, styles.multilineInput]}
                placeholder="Masukkan deskripsi aduan"
                placeholderTextColor={Colors.lightGray}
                multiline
                numberOfLines={4}
                value={editForm.deskripsi}
                onChangeText={(text) => setEditForm(prev => ({ ...prev, deskripsi: text }))}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Prioritas</Text>
              <View style={styles.prioritasOptions}>
                {(['Rendah', 'Sedang', 'Tinggi'] as const).map((option) => (
                  <TouchableOpacity
                    key={option}
                    style={[
                      styles.prioritasButton,
                      editForm.prioritas === option && styles.prioritasButtonActive,
                      editForm.prioritas === option && {
                        borderColor: getPrioritasColor(option),
                        backgroundColor: `${getPrioritasColor(option)}20`
                      }
                    ]}
                    onPress={() => setEditForm(prev => ({ ...prev, prioritas: option }))}
                    activeOpacity={0.7}
                  >
                    <Text style={[
                      styles.prioritasButtonText,
                      editForm.prioritas === option && {
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
              <Text style={styles.formLabel}>Lampiran 2</Text>
              {imagePreview || (tiket.lampiran && !editForm.removeLampiran) ? (
                <View style={styles.lampiranPreview}>
                  <Image
                    source={{ uri: imagePreview || tiket.lampiran_url || `https://your-api-domain.com/uploads/${tiket.lampiran}` }}
                    style={styles.lampiranImage}
                    resizeMode="cover"
                  />
                  <View style={styles.lampiranActions}>
                    <TouchableOpacity
                      style={styles.removeLampiranButton}
                      onPress={() => {
                        if (imagePreview) {
                          setImagePreview('');
                          setEditForm(prev => ({ ...prev, lampiran: null }));
                        } else {
                          setEditForm(prev => ({ ...prev, removeLampiran: true }));
                        }
                      }}
                      activeOpacity={0.7}
                    >
                      <Icon name="close" size={16} color={Colors.white} />
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                <View style={styles.uploadOptions}>
                  <TouchableOpacity
                    style={[styles.uploadButton, styles.uploadGalleryButton]}
                    onPress={handlePilihLampiran}
                    activeOpacity={0.7}
                  >
                    <Icon name="photo-library" size={20} color={Colors.primary} />
                    <Text style={styles.uploadButtonText}>Pilih dari Galeri</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.uploadButton, styles.uploadCameraButton]}
                    onPress={handleTakePhoto}
                    activeOpacity={0.7}
                  >
                    <Icon name="camera-alt" size={20} color={Colors.white} />
                    <Text style={[styles.uploadButtonText, { color: Colors.white }]}>Ambil Foto</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowEditModal(false)}
                activeOpacity={0.7}
              >
                <Text style={styles.cancelButtonText}>Batal</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.submitButton]}
                onPress={handleUpdateTiket}
                disabled={loading}
                activeOpacity={0.7}
              >
                {loading ? (
                  <ActivityIndicator size="small" color={Colors.white} />
                ) : (
                  <Text style={styles.submitButtonText}>Simpan Perubahan</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        visible={showDeleteModal}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setShowDeleteModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.confirmationModal}>
            <View style={styles.confirmationIconContainer}>
              <Icon name="warning" size={48} color={Colors.danger} />
            </View>
            <Text style={styles.confirmationTitle}>Hapus Tiket?</Text>
            <Text style={styles.confirmationText}>
              Apakah Anda yakin ingin menghapus tiket ini? Tindakan ini tidak dapat dibatalkan.
            </Text>
            <View style={styles.confirmationButtons}>
              <TouchableOpacity
                style={[styles.confirmationButton, styles.cancelButton]}
                onPress={() => setShowDeleteModal(false)}
                activeOpacity={0.7}
              >
                <Text style={styles.cancelButtonText}>Batal</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.confirmationButton, styles.deleteButton]}
                onPress={handleDeleteTiket}
                disabled={loading}
                activeOpacity={0.7}
              >
                {loading ? (
                  <ActivityIndicator size="small" color={Colors.white} />
                ) : (
                  <Text style={styles.deleteButtonText}>Hapus</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.white,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    backgroundColor: Colors.white,
  },
  emptyText: {
    marginTop: 16,
    fontSize: FontSizes.large,
    fontFamily: FontFamily.medium,
    color: Colors.gray,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: Colors.primary,
    elevation: 4,
    shadowColor: Colors.dark,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  headerButton: {
    padding: 4,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  headerTitle: {
    color: Colors.white,
    fontSize: FontSizes.xlarge,
    fontFamily: FontFamily.semiBold,
    textAlign: 'center',
    flex: 1,
    marginHorizontal: 8,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    marginLeft: 12,
    padding: 4,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  card: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    shadowColor: Colors.shadowGray,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderGray,
  },
  tiketNumber: {
    fontSize: FontSizes.large,
    fontFamily: FontFamily.semiBold,
    color: Colors.dark,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    minWidth: 80,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusText: {
    fontSize: FontSizes.small,
    fontFamily: FontFamily.semiBold,
    color: Colors.white,
    textTransform: 'uppercase',
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: FontSizes.small,
    fontFamily: FontFamily.medium,
    color: Colors.gray,
    marginBottom: 6,
  },
  sectionValue: {
    fontSize: FontSizes.medium,
    fontFamily: FontFamily.regular,
    color: Colors.dark,
    lineHeight: 22,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  rowItem: {
    width: '48%',
  },
  prioritasBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  prioritasText: {
    fontSize: FontSizes.small,
    fontFamily: FontFamily.semiBold,
    color: Colors.white,
  },
  attachmentImage: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    marginTop: 8,
    backgroundColor: Colors.lightGray,
  },
  actionSection: {
    marginTop: 24,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionButtonLarge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 14,
    borderRadius: 8,
    width: '48%',
    shadowColor: Colors.dark,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  actionButtonText: {
    color: Colors.white,
    fontFamily: FontFamily.semiBold,
    fontSize: FontSizes.small,
    marginLeft: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 24,
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
    flex: 1,
  },
  modalCloseButton: {
    padding: 4,
  },
  formGroup: {
    marginBottom: 20,
  },
  formLabel: {
    fontSize: FontSizes.medium,
    fontFamily: FontFamily.semiBold,
    color: Colors.dark,
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: Colors.borderGray,
    borderRadius: 8,
    padding: 14,
    fontSize: FontSizes.medium,
    color: Colors.dark,
    fontFamily: FontFamily.regular,
    backgroundColor: Colors.white,
  },
  multilineInput: {
    height: 120,
    textAlignVertical: 'top',
  },
  prioritasOptions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  prioritasButton: {
    flex: 1,
    padding: 12,
    borderWidth: 1,
    borderColor: Colors.borderGray,
    borderRadius: 8,
    alignItems: 'center',
    backgroundColor: Colors.white,
  },
  prioritasButtonActive: {
    borderWidth: 1,
  },
  prioritasButtonText: {
    color: Colors.dark,
    fontFamily: FontFamily.regular,
    fontSize: FontSizes.small,
  },
  uploadOptions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  uploadButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    padding: 14,
  },
  uploadGalleryButton: {
    borderWidth: 1,
    borderColor: Colors.primary,
    backgroundColor: Colors.white,
  },
  uploadCameraButton: {
    backgroundColor: Colors.primary,
  },
  uploadButtonText: {
    marginLeft: 8,
    color: Colors.primary,
    fontFamily: FontFamily.semiBold,
    fontSize: FontSizes.small,
  },
  lampiranPreview: {
    position: 'relative',
    height: 180,
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.borderGray,
  },
  lampiranImage: {
    width: '100%',
    height: '100%',
    backgroundColor: Colors.lightGray,
  },
  lampiranActions: {
    position: 'absolute',
    top: 8,
    right: 8,
    flexDirection: 'row',
    gap: 8,
  },
  removeLampiranButton: {
    backgroundColor: Colors.danger,
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: Colors.dark,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  replaceLampiranButton: {
    backgroundColor: Colors.info,
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: Colors.dark,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 24,
    gap: 12,
  },
  modalButton: {
    flex: 1,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    height: 50,
  },
  cancelButton: {
    backgroundColor: Colors.lightGray,
  },
  cancelButtonText: {
    color: Colors.dark,
    fontFamily: FontFamily.semiBold,
    fontSize: FontSizes.medium,
  },
  submitButton: {
    backgroundColor: Colors.primary,
    shadowColor: Colors.dark,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  submitButtonText: {
    color: Colors.white,
    fontFamily: FontFamily.semiBold,
    fontSize: FontSizes.medium,
  },
  confirmationModal: {
    width: '100%',
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    shadowColor: Colors.dark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  confirmationIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: `${Colors.danger}20`,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  confirmationTitle: {
    fontSize: FontSizes.xlarge,
    fontFamily: FontFamily.semiBold,
    color: Colors.dark,
    marginBottom: 8,
    textAlign: 'center',
  },
  confirmationText: {
    fontSize: FontSizes.medium,
    fontFamily: FontFamily.regular,
    color: Colors.gray,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  confirmationButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    gap: 12,
  },
  confirmationButton: {
    flex: 1,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    height: 50,
  },
  deleteButton: {
    backgroundColor: Colors.danger,
    shadowColor: Colors.dark,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  deleteButtonText: {
    color: Colors.white,
    fontFamily: FontFamily.semiBold,
    fontSize: FontSizes.medium,
  },
});

export default TiketDetailScreen;