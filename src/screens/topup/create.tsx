import React, {useState, useEffect} from 'react';
import {
  View,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
  ActivityIndicator,
  Alert,
  Modal,
  FlatList,
  PermissionsAndroid,
  Platform,
  TouchableWithoutFeedback,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import {Colors, FontSizes, FontFamily} from '../../utils/constants';
import {
  getBankAccounts,
  BankAccount,
  createManualTopup,
  updateManualTopup,
} from '../../services/topup';
import authService from '../../services/auth';
import {launchImageLibrary, launchCamera} from 'react-native-image-picker';
import {formatRupiah, unformatRupiah} from '../../utils/helpers';

const TopupCreateScreen = ({navigation, route}: any) => {
  const topupToEdit = route.params?.topupData;
  const isEditMode = !!topupToEdit;

  const [pelangganId, setPelangganId] = useState<number | null>(null);
  const [banks, setBanks] = useState<BankAccount[]>([]);
  const [selectedBank, setSelectedBank] = useState<BankAccount | null>(null);
  const [nominal, setNominal] = useState(
    isEditMode ? String(topupToEdit.nominal) : '',
  );
  const [bukti, setBukti] = useState<any>(null);
  const [existingImageUrl, setExistingImageUrl] = useState(
    isEditMode ? topupToEdit.bukti_topup : null,
  );
  const [loading, setLoading] = useState(false);
  const [loadingBanks, setLoadingBanks] = useState(true);
  const [showBankModal, setShowBankModal] = useState(false);
  const [showImagePickerModal, setShowImagePickerModal] = useState(false);

  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const user = await authService.getStoredUser();
        if (user) setPelangganId(user.id);

        const bankData = await getBankAccounts();
        setBanks(bankData);

        if (isEditMode && bankData.length > 0) {
          const preSelectedBank = bankData.find(
            b => b.id === topupToEdit.bank_account_id,
          );
          if (preSelectedBank) setSelectedBank(preSelectedBank);
        }
      } catch (error) {
        Alert.alert('Error', 'Gagal memuat data bank.');
      } finally {
        setLoadingBanks(false);
      }
    };
    loadInitialData();
  }, [isEditMode, topupToEdit]);

  const handleChooseFromGallery = () => {
    setShowImagePickerModal(false);
    launchImageLibrary({mediaType: 'photo', quality: 0.8}, response => {
      if (response.didCancel) return;
      if (response.errorCode) {
        Alert.alert('Error', 'Gagal memilih gambar.');
        return;
      }
      if (response.assets && response.assets.length > 0) {
        const asset = response.assets[0];
        setBukti({
          uri: asset.uri,
          type: asset.type || 'image/jpeg',
          name: asset.fileName || `bukti_${Date.now()}.jpg`,
        });
      }
    });
  };

  const handleTakePhoto = async () => {
    setShowImagePickerModal(false);
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.CAMERA,
          {
            title: 'Izin Kamera',
            message: 'Aplikasi memerlukan akses ke kamera Anda.',
            buttonPositive: 'OK',
            buttonNegative: 'Batal',
          },
        );
        if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
          Alert.alert('Izin Ditolak', 'Akses kamera diperlukan.');
          return;
        }
      } catch (err) {
        console.warn(err);
        return;
      }
    }

    launchCamera(
      {mediaType: 'photo', quality: 0.8, saveToPhotos: true},
      response => {
        if (response.didCancel) return;
        if (response.errorCode) {
          Alert.alert('Error', 'Gagal mengambil foto.');
          return;
        }
        if (response.assets && response.assets.length > 0) {
          const asset = response.assets[0];
          setBukti({
            uri: asset.uri,
            type: asset.type || 'image/jpeg',
            name: asset.fileName || `bukti_${Date.now()}.jpg`,
          });
        }
      },
    );
  };

  const handleSubmit = async () => {
    const cleanNominal = unformatRupiah(nominal);
    if (!pelangganId || !selectedBank || !cleanNominal) {
      Alert.alert(
        'Input Tidak Lengkap',
        'Harap isi semua kolom yang wajib diisi.',
      );
      return;
    }
    if (Number(cleanNominal) < 10000) {
      Alert.alert('Input Tidak Valid', 'Minimal top up adalah Rp 10.000.');
      return;
    }
    if (!isEditMode && !bukti) {
      Alert.alert('Input Tidak Lengkap', 'Harap unggah bukti transfer.');
      return;
    }

    setLoading(true);

    if (isEditMode) {
      try {
        const updateData = {
          nominal: cleanNominal,
          bank_account_id: selectedBank.id,
          ...(bukti && {bukti_topup: bukti}),
        };
        await updateManualTopup(topupToEdit.id, updateData);
        Alert.alert('Berhasil', 'Permintaan top up Anda telah diperbarui.');
        navigation.goBack();
      } catch (error: any) {
        Alert.alert(
          'Error',
          error.message || 'Gagal memperbarui permintaan top up.',
        );
      } finally {
        setLoading(false);
      }
    } else {
      try {
        await createManualTopup(
          pelangganId,
          cleanNominal,
          selectedBank.id,
          bukti,
        );
        Alert.alert('Berhasil', 'Permintaan top up Anda telah dikirim.');
        navigation.goBack();
      } catch (error: any) {
        Alert.alert(
          'Error',
          error.message || 'Gagal mengirim permintaan top up.',
        );
      } finally {
        setLoading(false);
      }
    }
  };

  const renderBankItem = ({item}: {item: BankAccount}) => (
    <TouchableOpacity
      style={styles.bankItem}
      onPress={() => {
        setSelectedBank(item);
        setShowBankModal(false);
      }}>
      {item.logo_bank && (
        <Image
          source={{uri: item.logo_bank}}
          style={styles.bankLogo}
          resizeMode="contain"
        />
      )}
      <View style={styles.bankInfo}>
        <Text style={styles.bankName}>{item.nama_bank}</Text>
        <Text style={styles.bankDetails}>
          {item.nomor_rekening} a/n {item.pemilik_rekening}
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.headerButton}>
          <Icon
            name="arrow-back"
            size={FontSizes.xlarge}
            color={Colors.white}
          />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {isEditMode ? 'Edit Top Up Manual' : 'Buat Top Up Manual'}
        </Text>
        <View style={{width: 40}} />
      </View>

      <ScrollView contentContainerStyle={styles.formContainer}>
        <View style={styles.card}>
          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Nominal Top Up</Text>
            <TextInput
              style={styles.textInput}
              placeholder="Contoh: 50.000"
              placeholderTextColor={Colors.gray}
              keyboardType="numeric"
              value={formatRupiah(nominal)}
              onChangeText={text => setNominal(unformatRupiah(text))}
            />
            <Text style={styles.helperText}>Minimal top up Rp 10.000</Text>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Tujuan Transfer</Text>
            <TouchableOpacity
              style={styles.selectInput}
              onPress={() => setShowBankModal(true)}>
              <Text
                style={
                  selectedBank ? styles.selectText : styles.selectPlaceholder
                }>
                {selectedBank
                  ? `${selectedBank.nama_bank} - ${selectedBank.nomor_rekening}`
                  : 'Pilih rekening bank'}
              </Text>
              <Icon name="keyboard-arrow-down" size={24} color={Colors.gray} />
            </TouchableOpacity>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Bukti Transfer</Text>
            <TouchableOpacity
              style={styles.uploadButton}
              onPress={() => setShowImagePickerModal(true)}>
              {bukti ? (
                <Image source={{uri: bukti.uri}} style={styles.previewImage} />
              ) : existingImageUrl ? (
                <Image
                  source={{
                    uri: `https://myrba.net/storage/uploads/bukti_topup/${existingImageUrl}`,
                  }}
                  style={styles.previewImage}
                />
              ) : (
                <>
                  <Icon name="cloud-upload" size={32} color={Colors.primary} />
                  <Text style={styles.uploadText}>
                    Ketuk untuk memilih gambar
                  </Text>
                </>
              )}
            </TouchableOpacity>
            {isEditMode && (
              <Text style={styles.helperText}>
                Unggah gambar baru untuk mengganti.
              </Text>
            )}
          </View>
        </View>

        <TouchableOpacity
          style={[
            styles.submitButton,
            (loading || !pelangganId || !selectedBank || !nominal) &&
              styles.submitButtonDisabled,
          ]}
          onPress={handleSubmit}
          disabled={loading || !pelangganId || !selectedBank || !nominal}>
          {loading ? (
            <ActivityIndicator color={Colors.white} />
          ) : (
            <Text style={styles.submitButtonText}>
              {isEditMode ? 'Simpan Perubahan' : 'Kirim Permintaan'}
            </Text>
          )}
        </TouchableOpacity>
      </ScrollView>

      {/* Bank Selection Modal */}
      <Modal
        visible={showBankModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowBankModal(false)}>
        <TouchableOpacity
          style={styles.modalOverlay}
          onPress={() => setShowBankModal(false)}
          activeOpacity={1}>
          <TouchableWithoutFeedback>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Pilih Bank Tujuan</Text>
              {loadingBanks ? (
                <ActivityIndicator size="large" color={Colors.primary} />
              ) : (
                <FlatList
                  data={banks}
                  renderItem={renderBankItem}
                  keyExtractor={item => item.id.toString()}
                  ListEmptyComponent={
                    <Text style={styles.emptyBankText}>
                      Tidak ada data bank tersedia.
                    </Text>
                  }
                />
              )}
            </View>
          </TouchableWithoutFeedback>
        </TouchableOpacity>
      </Modal>

      {/* Image Picker Option Modal */}
      <Modal
        visible={showImagePickerModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowImagePickerModal(false)}>
        <TouchableOpacity
          style={styles.modalOverlay}
          onPress={() => setShowImagePickerModal(false)}
          activeOpacity={1}>
          <TouchableWithoutFeedback>
            <View style={styles.optionModalContent}>
              <Text style={styles.optionModalTitle}>Pilih Sumber Gambar</Text>
              <TouchableOpacity
                style={styles.optionButton}
                onPress={handleChooseFromGallery}>
                <Icon
                  name="photo-library"
                  size={24}
                  color={Colors.primary}
                  style={styles.optionIcon}
                />
                <Text style={styles.optionButtonText}>Buka Galeri</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.optionButton}
                onPress={handleTakePhoto}>
                <Icon
                  name="camera-alt"
                  size={24}
                  color={Colors.primary}
                  style={styles.optionIcon}
                />
                <Text style={styles.optionButtonText}>Gunakan Kamera</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.optionButton, {borderColor: 'transparent'}]}
                onPress={() => setShowImagePickerModal(false)}>
                <Icon
                  name="close"
                  size={24}
                  color={Colors.gray}
                  style={styles.optionIcon}
                />
                <Text style={[styles.optionButtonText, {color: Colors.gray}]}>
                  Batal
                </Text>
              </TouchableOpacity>
            </View>
          </TouchableWithoutFeedback>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: Colors.light},
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: Colors.primary,
    elevation: 4,
  },
  headerButton: {padding: 4},
  headerTitle: {
    color: Colors.white,
    fontSize: FontSizes.xlarge,
    fontFamily: FontFamily.semiBold,
  },
  formContainer: {padding: 16},
  card: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 20,
    marginBottom: 24,
    elevation: 2,
  },
  formGroup: {marginBottom: 20},
  formLabel: {
    fontSize: FontSizes.medium,
    fontFamily: FontFamily.medium,
    color: Colors.dark,
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: Colors.borderGray,
    borderRadius: 8,
    padding: 14,
    fontSize: FontSizes.medium,
    fontFamily: FontFamily.regular,
    color: Colors.dark,
  },
  helperText: {fontSize: FontSizes.small, color: Colors.gray, marginTop: 4},
  selectInput: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: Colors.borderGray,
    borderRadius: 8,
    padding: 14,
  },
  selectText: {
    color: Colors.dark,
    fontFamily: FontFamily.regular,
    fontSize: FontSizes.medium,
  },
  selectPlaceholder: {
    color: Colors.gray,
    fontFamily: FontFamily.regular,
    fontSize: FontSizes.medium,
  },
  uploadButton: {
    height: 150,
    borderWidth: 2,
    borderColor: Colors.borderGray,
    borderStyle: 'dashed',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fafafa',
    overflow: 'hidden',
  },
  uploadText: {
    marginTop: 8,
    color: Colors.gray,
    fontFamily: FontFamily.regular,
  },
  previewImage: {width: '100%', height: '100%', borderRadius: 6},
  submitButton: {
    backgroundColor: Colors.primary,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: Colors.lightGray,
  },
  submitButtonText: {
    color: Colors.white,
    fontFamily: FontFamily.semiBold,
    fontSize: FontSizes.large,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 24,
    maxHeight: '60%',
  },
  modalTitle: {
    fontSize: FontSizes.xlarge,
    fontFamily: FontFamily.semiBold,
    color: Colors.dark,
    marginBottom: 16,
  },
  bankItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderGray,
  },
  bankLogo: {width: 40, height: 40, marginRight: 12},
  bankInfo: {flex: 1},
  bankName: {
    fontSize: FontSizes.medium,
    fontFamily: FontFamily.semiBold,
    color: Colors.dark,
  },
  bankDetails: {fontSize: FontSizes.small, color: Colors.gray},
  emptyBankText: {textAlign: 'center', color: Colors.gray, marginVertical: 20},
  optionModalContent: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 32,
  },
  optionModalTitle: {
    fontSize: FontSizes.xlarge,
    fontFamily: FontFamily.semiBold,
    color: Colors.dark,
    textAlign: 'center',
    marginBottom: 24,
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.borderGray,
    borderRadius: 12,
    marginBottom: 12,
  },
  optionIcon: {
    marginRight: 16,
  },
  optionButtonText: {
    fontSize: FontSizes.large,
    fontFamily: FontFamily.semiBold,
    color: Colors.dark,
  },
});

export default TopupCreateScreen;
