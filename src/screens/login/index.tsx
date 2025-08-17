import React, {useState} from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  Text,
  StyleSheet,
  Image,
  KeyboardAvoidingView,
  Platform,
  Modal,
  TouchableWithoutFeedback,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import authService from '../../services/auth';
import {Colors, FontSizes, FontFamily} from '../../utils/constants';
import {useSettings} from '../../context/SettingsContext';

const LoginScreen = ({navigation}: any) => {
  const [noLayanan, setNoLayanan] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showAlert, setShowAlert] = useState(false);
  const [alertTitle, setAlertTitle] = useState('');
  const [alertMessage, setAlertMessage] = useState('');
  const {logoUrl, companyName} = useSettings();

  const showCustomAlert = (title: string, message: string) => {
    setAlertTitle(title);
    setAlertMessage(message);
    setShowAlert(true);
  };

  const handleLogin = async () => {
    if (!noLayanan || !password) {
      showCustomAlert(
        'Input Tidak Lengkap',
        'Harap isi ID Pelanggan dan password.',
      );
      return;
    }
    setIsLoading(true);
    try {
      const success = await authService.login(noLayanan, password);
      if (success) {
        navigation.replace('HomeScreen');
      } else {
        showCustomAlert('Login Gagal', 'ID Pelanggan atau password salah');
      }
    } catch (error) {
      showCustomAlert('Error', 'Terjadi kesalahan saat login');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.header}>
          {logoUrl && (
            <Image
              source={{uri: logoUrl}}
              style={styles.logo}
              resizeMode="contain"
            />
          )}
          <Text style={styles.title}>Selamat Datang</Text>
          {companyName && (
            <Text style={styles.subtitle}>
              Masuk untuk melanjutkan ke {companyName}
            </Text>
          )}
        </View>

        <View style={styles.formContainer}>
          {/* ID Pelanggan Input */}
          <View style={styles.inputContainer}>
            <Icon
              name="person-outline"
              size={22}
              color={Colors.gray}
              style={styles.icon}
            />
            <TextInput
              placeholder="ID Pelanggan"
              placeholderTextColor={Colors.lightGray}
              value={noLayanan}
              onChangeText={setNoLayanan}
              style={styles.input}
              autoCapitalize="none"
              keyboardType="numeric"
            />
          </View>

          {/* Password Input */}
          <View style={styles.inputContainer}>
            <Icon
              name="lock-outline"
              size={22}
              color={Colors.gray}
              style={styles.icon}
            />
            <TextInput
              placeholder="Password"
              placeholderTextColor={Colors.lightGray}
              secureTextEntry={!showPassword}
              value={password}
              onChangeText={setPassword}
              style={styles.input}
            />
            <TouchableOpacity
              onPress={() => setShowPassword(!showPassword)}
              style={styles.eyeIcon}>
              <Icon
                name={showPassword ? 'visibility-off' : 'visibility'}
                size={22}
                color={Colors.gray}
              />
            </TouchableOpacity>
          </View>

          {/* Forgot Password Link */}
          <TouchableOpacity
            style={styles.forgotPasswordButton}
            onPress={() => navigation.navigate('ForgotPassword')}>
            <Text style={styles.forgotPasswordText}>Lupa Password?</Text>
          </TouchableOpacity>

          {/* Login Button */}
          <TouchableOpacity
            style={[
              styles.loginButton,
              isLoading && {backgroundColor: Colors.shadowGray},
            ]}
            onPress={handleLogin}
            disabled={isLoading}>
            {isLoading ? (
              <ActivityIndicator color={Colors.white} />
            ) : (
              <Text style={styles.loginButtonText}>Masuk</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Custom Alert Modal */}
      <Modal
        visible={showAlert}
        transparent
        animationType="fade"
        onRequestClose={() => setShowAlert(false)}>
        <TouchableWithoutFeedback onPress={() => setShowAlert(false)}>
          <View style={styles.modalOverlay} />
        </TouchableWithoutFeedback>

        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Icon name="error-outline" size={30} color={Colors.danger} />
              <Text style={styles.modalTitle}>{alertTitle}</Text>
            </View>
            <Text style={styles.modalText}>{alertMessage}</Text>
            <TouchableOpacity
              style={styles.modalButton}
              onPress={() => setShowAlert(false)}>
              <Text style={styles.modalButtonText}>OK</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 32,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logo: {
    width: 120,
    height: 120,
    marginBottom: 20,
  },
  title: {
    fontSize: FontSizes.xxxlarge,
    fontFamily: FontFamily.bold,
    color: Colors.dark,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: FontSizes.medium,
    fontFamily: FontFamily.regular,
    color: Colors.gray,
    textAlign: 'center',
  },
  formContainer: {
    width: '100%',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.borderGray,
    paddingHorizontal: 16,
    marginBottom: 20,
    height: 56,
  },
  icon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: FontSizes.medium,
    fontFamily: FontFamily.regular,
    color: Colors.dark,
  },
  eyeIcon: {
    padding: 8,
  },
  forgotPasswordButton: {
    alignSelf: 'flex-end',
    marginBottom: 24,
  },
  forgotPasswordText: {
    color: Colors.primary,
    fontSize: FontSizes.medium,
    fontFamily: FontFamily.semiBold,
  },
  loginButton: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: Colors.primary,
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  loginButtonText: {
    color: Colors.white,
    fontSize: FontSizes.large,
    fontFamily: FontFamily.semiBold,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  modalContent: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 24,
    width: '80%',
    alignItems: 'center',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: FontSizes.xlarge,
    fontFamily: FontFamily.bold,
    marginLeft: 10,
    color: Colors.dark,
  },
  modalText: {
    fontSize: FontSizes.medium,
    marginBottom: 24,
    textAlign: 'center',
    lineHeight: 22,
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
  },
  modalButtonText: {
    color: Colors.white,
    fontFamily: FontFamily.semiBold,
    fontSize: FontSizes.medium,
  },
});

export default LoginScreen;