import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  TouchableWithoutFeedback,
  TextStyle,
  ViewStyle
} from 'react-native';
import Header from '../../components/Header';
import Icon from 'react-native-vector-icons/MaterialIcons';
import authService from '../../services/auth';
import { Colors, FontSizes, FontFamily } from '../../utils/constants';

type InputStyle = TextStyle & {
  borderColor?: string;
};

type ErrorTextStyle = TextStyle;

const EditProfileScreen = ({ route, navigation }: any) => {
  const { user, onSave } = route.params;
  const [form, setForm] = useState({
    nama: user.nama,
    email: user.email,
    no_wa: user.no_wa,
    alamat: user.alamat,
    password: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [showAlert, setShowAlert] = useState(false);
  const [alertTitle, setAlertTitle] = useState('');
  const [alertMessage, setAlertMessage] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const showCustomAlert = (title: string, message: string) => {
    setAlertTitle(title);
    setAlertMessage(message);
    setShowAlert(true);
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!form.nama || form.nama.trim() === '') {
      newErrors.nama = 'Nama wajib diisi';
    } else if (form.nama.length > 255) {
      newErrors.nama = 'Nama maksimal 255 karakter';
    }

    if (!form.email || form.email.trim() === '') {
      newErrors.email = 'Email wajib diisi';
    } else if (!/^\S+@\S+\.\S+$/.test(form.email)) {
      newErrors.email = 'Email tidak valid';
    } else if (form.email.length > 255) {
      newErrors.email = 'Email maksimal 255 karakter';
    }

    if (!form.no_wa || form.no_wa.trim() === '') {
      newErrors.no_wa = 'Nomor WhatsApp wajib diisi';
    } else if (!/^62[0-9]{9,15}$/.test(form.no_wa)) {
      newErrors.no_wa = 'Nomor WhatsApp harus dimulai dengan 62 dan hanya berisi angka';
    }

    if (form.alamat && form.alamat.length > 500) {
      newErrors.alamat = 'Alamat maksimal 500 karakter';
    }

    if (form.password && form.password.length < 6) {
      newErrors.password = 'Password minimal 6 karakter';
    }

    if (form.password && form.password !== form.confirmPassword) {
      newErrors.confirmPassword = 'Password dan konfirmasi password tidak sama';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      showCustomAlert('Validasi Gagal', 'Harap periksa kembali data yang Anda masukkan');
      return;
    }

    setLoading(true);
    try {
      const updateData = {
        nama: form.nama,
        email: form.email,
        no_wa: form.no_wa,
        alamat: form.alamat,
        ...(form.password ? { password: form.password } : {})
      };

      const updatedUser = await authService.updateUser(user.id, updateData);

      if (updatedUser) {
        showCustomAlert('Sukses', 'Profil berhasil diperbarui');
        onSave(updatedUser);
        navigation.goBack();
      } else {
        showCustomAlert('Error', 'Gagal memperbarui profil');
      }
    } catch (error) {
      console.error('Update error:', error);
      showCustomAlert('Error', 'Terjadi kesalahan saat memperbarui profil');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Header showSearchBar={false} />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Informasi Pribadi</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Nama Lengkap</Text>
            <TextInput
              style={[
                styles.input,
                errors.nama ? styles.inputError as InputStyle : null
              ]}
              value={form.nama}
              onChangeText={(text) => setForm({ ...form, nama: text })}
              placeholder="Nama lengkap"
              placeholderTextColor={Colors.lightGray}
            />
            {errors.nama && <Text style={styles.errorText}>{errors.nama}</Text>}
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={[
                styles.input,
                errors.email ? styles.inputError as InputStyle : null
              ]}
              value={form.email}
              onChangeText={(text) => setForm({ ...form, email: text })}
              placeholder="Email"
              placeholderTextColor={Colors.lightGray}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Nomor WhatsApp</Text>
            <TextInput
              style={[
                styles.input,
                errors.no_wa ? styles.inputError as InputStyle : null
              ]}
              value={form.no_wa}
              onChangeText={(text) => setForm({ ...form, no_wa: text })}
              placeholder="62xxxxxxxxxx"
              placeholderTextColor={Colors.lightGray}
              keyboardType="phone-pad"
            />
            {errors.no_wa && <Text style={styles.errorText}>{errors.no_wa}</Text>}
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Alamat</Text>
            <TextInput
              style={[
                styles.input,
                styles.textArea,
                errors.alamat ? styles.inputError as InputStyle : null
              ]}
              value={form.alamat}
              onChangeText={(text) => setForm({ ...form, alamat: text })}
              placeholder="Alamat lengkap"
              placeholderTextColor={Colors.lightGray}
              multiline
              numberOfLines={3}
            />
            {errors.alamat && <Text style={styles.errorText}>{errors.alamat}</Text>}
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Ubah Password</Text>
          <Text style={styles.note}>Kosongkan jika tidak ingin mengubah password</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Password Baru</Text>
            <TextInput
              style={[
                styles.input,
                errors.password ? styles.inputError as InputStyle : null
              ]}
              value={form.password}
              onChangeText={(text) => setForm({ ...form, password: text })}
              placeholder="Password baru (minimal 6 karakter)"
              placeholderTextColor={Colors.lightGray}
              secureTextEntry
            />
            {errors.password && <Text style={styles.errorText}>{errors.password}</Text>}
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Konfirmasi Password</Text>
            <TextInput
              style={[
                styles.input,
                errors.confirmPassword ? styles.inputError as InputStyle : null
              ]}
              value={form.confirmPassword}
              onChangeText={(text) => setForm({ ...form, confirmPassword: text })}
              placeholder="Konfirmasi password"
              placeholderTextColor={Colors.lightGray}
              secureTextEntry
            />
            {errors.confirmPassword && <Text style={styles.errorText}>{errors.confirmPassword}</Text>}
          </View>
        </View>

        <TouchableOpacity
          style={styles.saveButton}
          onPress={handleSubmit}
          disabled={loading}
          activeOpacity={0.8}
        >
          {loading ? (
            <ActivityIndicator color={Colors.white} />
          ) : (
            <>
              <Icon name="save" size={20} color={Colors.white} style={styles.saveIcon} />
              <Text style={styles.saveButtonText}>Simpan Perubahan</Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>

      {/* Custom Alert Modal */}
      <Modal
        visible={showAlert}
        transparent
        animationType="fade"
        onRequestClose={() => setShowAlert(false)}
      >
        <TouchableWithoutFeedback onPress={() => setShowAlert(false)}>
          <View style={styles.modalOverlay} />
        </TouchableWithoutFeedback>

        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Icon
                name={alertTitle === 'Sukses' ? 'check-circle' : 'error-outline'}
                size={30}
                color={alertTitle === 'Sukses' ? Colors.success : Colors.danger}
              />
              <Text style={styles.modalTitle}>{alertTitle}</Text>
            </View>
            <Text style={styles.modalText}>{alertMessage}</Text>
            <TouchableOpacity
              style={styles.modalButton}
              onPress={() => setShowAlert(false)}
              activeOpacity={0.8}
            >
              <Text style={styles.modalButtonText}>OK</Text>
            </TouchableOpacity>
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
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  card: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: Colors.shadowGray,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: FontSizes.large,
    fontFamily: FontFamily.semiBold,
    color: Colors.primary,
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderGray,
    paddingBottom: 8,
  },
  note: {
    fontSize: FontSizes.small,
    color: Colors.gray,
    marginBottom: 16,
    fontFamily: FontFamily.regular,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: FontSizes.medium,
    color: Colors.dark,
    marginBottom: 8,
    fontFamily: FontFamily.medium,
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.borderGray,
    borderRadius: 8,
    padding: 14,
    fontSize: FontSizes.medium,
    backgroundColor: Colors.white,
    fontFamily: FontFamily.regular,
    color: Colors.dark,
  } as InputStyle,
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  inputError: {
    borderColor: Colors.danger,
  } as InputStyle,
  errorText: {
    color: Colors.danger,
    fontSize: FontSizes.small,
    marginTop: 4,
    fontFamily: FontFamily.regular,
  } as ErrorTextStyle,
  saveButton: {
    backgroundColor: Colors.primary,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
    flexDirection: 'row',
    justifyContent: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  saveButtonText: {
    color: Colors.white,
    fontSize: FontSizes.medium,
    fontFamily: FontFamily.semiBold,
  },
  saveIcon: {
    marginRight: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)'
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    width: '100%',
    height: '100%'
  },
  modalContent: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 24,
    width: '80%',
    alignItems: 'center',
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 10
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16
  },
  modalTitle: {
    fontSize: FontSizes.xlarge,
    fontFamily: FontFamily.semiBold,
    marginLeft: 10,
    color: Colors.dark,
  },
  modalText: {
    fontSize: FontSizes.medium,
    marginBottom: 24,
    textAlign: 'center',
    lineHeight: 24,
    color: Colors.dark,
    fontFamily: FontFamily.regular,
  },
  modalButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 8,
    width: '100%',
    alignItems: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  modalButtonText: {
    color: Colors.white,
    fontFamily: FontFamily.semiBold,
    fontSize: FontSizes.medium,
  },
});

export default EditProfileScreen;