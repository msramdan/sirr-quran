// src/screens/forgot-password/index.tsx
import React, {useState} from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  Text,
  StyleSheet,
  Image,
  ActivityIndicator,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import authService from '../../services/auth';
import {Colors, FontSizes, FontFamily} from '../../utils/constants';

const ForgotPasswordScreen = ({navigation}: any) => {
  const [noLayanan, setNoLayanan] = useState('');
  const [token, setToken] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState(1); // 1: Request Token, 2: Reset Password

  // Validation states
  const [errors, setErrors] = useState({
    noLayanan: '',
    token: '',
    password: '',
    confirmPassword: '',
  });

  const validateStepOne = () => {
    const newErrors = {...errors};
    let isValid = true;

    if (!noLayanan.trim()) {
      newErrors.noLayanan = 'Nomor layanan harus diisi';
      isValid = false;
    } else if (!/^\d+$/.test(noLayanan)) {
      newErrors.noLayanan = 'Nomor layanan hanya boleh berisi angka';
      isValid = false;
    } else {
      newErrors.noLayanan = '';
    }

    setErrors(newErrors);
    return isValid;
  };

  const validateStepTwo = () => {
    const newErrors = {...errors};
    let isValid = true;

    if (!token.trim()) {
      newErrors.token = 'Kode OTP harus diisi';
      isValid = false;
    } else if (!/^\d+$/.test(token)) {
      newErrors.token = 'Kode OTP hanya boleh berisi angka';
      isValid = false;
    } else {
      newErrors.token = '';
    }

    if (!password) {
      newErrors.password = 'Password harus diisi';
      isValid = false;
    } else if (password.length < 6) {
      newErrors.password = 'Password minimal 6 karakter';
      isValid = false;
    } else {
      newErrors.password = '';
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = 'Konfirmasi password harus diisi';
      isValid = false;
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Password dan konfirmasi password tidak cocok';
      isValid = false;
    } else {
      newErrors.confirmPassword = '';
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleRequestToken = async () => {
    if (!validateStepOne()) return;

    setIsLoading(true);
    try {
      const response = await authService.requestPasswordReset(noLayanan);
      Alert.alert('Berhasil', response.message);
      setStep(2);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Gagal mengirim permintaan.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!validateStepTwo()) return;

    setIsLoading(true);
    try {
      const response = await authService.resetPassword(
        noLayanan,
        token,
        password,
        confirmPassword,
      );
      Alert.alert('Berhasil', response.message);
      navigation.goBack();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Gagal mereset password.');
    } finally {
      setIsLoading(false);
    }
  };

  const renderStepOne = () => (
    <>
      <Text style={styles.subtitle}>
        Masukkan ID Pelanggan Anda untuk menerima kode OTP melalui WhatsApp.
      </Text>
      <View style={[
        styles.inputContainer,
        errors.noLayanan ? styles.inputError : null
      ]}>
        <Icon
          name="person-pin"
          size={22}
          color={errors.noLayanan ? Colors.danger : Colors.gray}
          style={styles.icon}
        />
        <TextInput
          placeholder="ID Pelanggan"
          placeholderTextColor={errors.noLayanan ? Colors.danger : Colors.lightGray}
          value={noLayanan}
          onChangeText={text => {
            setNoLayanan(text);
            setErrors({...errors, noLayanan: ''});
          }}
          style={[
            styles.input,
            errors.noLayanan ? styles.inputTextError : null
          ]}
          keyboardType="numeric"
        />
      </View>
      {errors.noLayanan ? (
        <View style={styles.errorContainer}>
          <Icon name="error-outline" size={16} color={Colors.danger} />
          <Text style={styles.errorText}>{errors.noLayanan}</Text>
        </View>
      ) : null}
      <TouchableOpacity
        style={styles.button}
        onPress={handleRequestToken}
        disabled={isLoading}>
        {isLoading ? (
          <ActivityIndicator color={Colors.white} />
        ) : (
          <Text style={styles.buttonText}>Kirim Kode OTP</Text>
        )}
      </TouchableOpacity>
    </>
  );

  const renderStepTwo = () => (
    <>
      <Text style={styles.subtitle}>
        Masukkan kode OTP yang Anda terima dan atur password baru Anda.
      </Text>
      <View style={[
        styles.inputContainer,
        errors.token ? styles.inputError : null
      ]}>
        <Icon
          name="vpn-key"
          size={22}
          color={errors.token ? Colors.danger : Colors.gray}
          style={styles.icon}
        />
        <TextInput
          placeholder="Kode OTP"
          placeholderTextColor={errors.token ? Colors.danger : Colors.lightGray}
          value={token}
          onChangeText={text => {
            setToken(text);
            setErrors({...errors, token: ''});
          }}
          style={[
            styles.input,
            errors.token ? styles.inputTextError : null
          ]}
          keyboardType="numeric"
        />
      </View>
      {errors.token ? (
        <View style={styles.errorContainer}>
          <Icon name="error-outline" size={16} color={Colors.danger} />
          <Text style={styles.errorText}>{errors.token}</Text>
        </View>
      ) : null}
      
      <View style={[
        styles.inputContainer,
        errors.password ? styles.inputError : null
      ]}>
        <Icon 
          name="lock" 
          size={22} 
          color={errors.password ? Colors.danger : Colors.gray} 
          style={styles.icon} 
        />
        <TextInput
          placeholder="Password Baru"
          placeholderTextColor={errors.password ? Colors.danger : Colors.lightGray}
          value={password}
          onChangeText={text => {
            setPassword(text);
            setErrors({...errors, password: ''});
          }}
          style={[
            styles.input,
            errors.password ? styles.inputTextError : null
          ]}
          secureTextEntry
        />
      </View>
      {errors.password ? (
        <View style={styles.errorContainer}>
          <Icon name="error-outline" size={16} color={Colors.danger} />
          <Text style={styles.errorText}>{errors.password}</Text>
        </View>
      ) : null}
      
      <View style={[
        styles.inputContainer,
        errors.confirmPassword ? styles.inputError : null
      ]}>
        <Icon
          name="lock-outline"
          size={22}
          color={errors.confirmPassword ? Colors.danger : Colors.gray}
          style={styles.icon}
        />
        <TextInput
          placeholder="Konfirmasi Password Baru"
          placeholderTextColor={errors.confirmPassword ? Colors.danger : Colors.lightGray}
          value={confirmPassword}
          onChangeText={text => {
            setConfirmPassword(text);
            setErrors({...errors, confirmPassword: ''});
          }}
          style={[
            styles.input,
            errors.confirmPassword ? styles.inputTextError : null
          ]}
          secureTextEntry
        />
      </View>
      {errors.confirmPassword ? (
        <View style={styles.errorContainer}>
          <Icon name="error-outline" size={16} color={Colors.danger} />
          <Text style={styles.errorText}>{errors.confirmPassword}</Text>
        </View>
      ) : null}
      
      <TouchableOpacity
        style={styles.button}
        onPress={handleResetPassword}
        disabled={isLoading}>
        {isLoading ? (
          <ActivityIndicator color={Colors.white} />
        ) : (
          <Text style={styles.buttonText}>Reset Password</Text>
        )}
      </TouchableOpacity>
    </>
  );

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}>
            <Icon name="arrow-back" size={FontSizes.xlarge} color={Colors.dark} />
          </TouchableOpacity>
          <Text style={styles.title}>Lupa Password</Text>
        </View>

        <Image
          source={require('../../assets/images/key.png')}
          style={styles.image}
          resizeMode="contain"
        />

        <View style={styles.formContainer}>
          {step === 1 ? renderStepOne() : renderStepTwo()}
        </View>
      </ScrollView>
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
    padding: 24,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  backButton: {
    padding: 8,
    marginRight: 16,
  },
  title: {
    fontSize: FontSizes.xxlarge,
    fontFamily: FontFamily.bold,
    color: Colors.dark,
  },
  image: {
    width: 150,
    height: 150,
    alignSelf: 'center',
    marginVertical: 24,
  },
  subtitle: {
    fontSize: FontSizes.medium,
    fontFamily: FontFamily.regular,
    color: Colors.gray,
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 22,
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
    marginBottom: 8,
    height: 56,
  },
  inputError: {
    borderColor: Colors.danger,
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
  inputTextError: {
    color: Colors.danger,
  },
  button: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
  },
  buttonText: {
    color: Colors.white,
    fontSize: FontSizes.large,
    fontFamily: FontFamily.semiBold,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    marginLeft: 8,
  },
  errorText: {
    color: Colors.danger,
    fontSize: FontSizes.small,
    fontFamily: FontFamily.regular,
    marginLeft: 4,
  },
});

export default ForgotPasswordScreen;