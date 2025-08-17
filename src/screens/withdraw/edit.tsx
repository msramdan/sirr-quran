// src/screens/withdraw/edit.tsx

import React, {useState} from 'react';
import {
  View,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import {Colors, FontSizes, FontFamily} from '../../utils/constants';
import {updateWithdraw} from '../../services/withdraw';
import {formatRupiah, unformatRupiah} from '../../utils/helpers';

const WithdrawEditScreen = ({navigation, route}: any) => {
  const {withdrawData} = route.params;
  const initialNominal = Math.trunc(Number(withdrawData?.nominal_wd || 0));
  const [nominal, setNominal] = useState(String(initialNominal));
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    const cleanNominal = unformatRupiah(nominal);
    if (!cleanNominal || Number(cleanNominal) < 10000) {
      Alert.alert('Input Tidak Valid', 'Minimal penarikan adalah Rp 10.000.');
      return;
    }

    setLoading(true);
    try {
      await updateWithdraw(withdrawData.id, cleanNominal);
      Alert.alert('Berhasil', 'Permintaan penarikan berhasil diperbarui.');
      navigation.goBack();
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

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
        <Text style={styles.headerTitle}>Edit Penarikan</Text>
        <View style={{width: 40}} />
      </View>

      <View style={styles.formContainer}>
        <View style={styles.card}>
          <Text style={styles.formLabel}>Nominal Penarikan</Text>
          <View style={styles.amountInputContainer}>
            <Text style={styles.currencySymbol}>Rp</Text>
            <TextInput
              style={styles.amountInput}
              placeholder="0"
              placeholderTextColor={Colors.gray}
              keyboardType="numeric"
              value={formatRupiah(nominal)}
              onChangeText={text => setNominal(unformatRupiah(text))}
            />
          </View>
          <Text style={styles.helperText}>Minimal penarikan Rp 10.000</Text>
        </View>

        <TouchableOpacity
          style={[styles.submitButton, loading && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={loading}>
          {loading ? (
            <ActivityIndicator color={Colors.white} />
          ) : (
            <Text style={styles.submitButtonText}>Simpan Perubahan</Text>
          )}
        </TouchableOpacity>
      </View>
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
  formLabel: {
    fontSize: FontSizes.medium,
    fontFamily: FontFamily.medium,
    color: Colors.dark,
    marginBottom: 8,
  },
  amountInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.borderGray,
    borderRadius: 8,
    paddingHorizontal: 14,
  },
  currencySymbol: {
    fontSize: FontSizes.large,
    fontFamily: FontFamily.semiBold,
    color: Colors.dark,
    marginRight: 8,
  },
  amountInput: {
    flex: 1,
    paddingVertical: 14,
    fontSize: FontSizes.large,
    fontFamily: FontFamily.semiBold,
    color: Colors.dark,
  },
  helperText: {fontSize: FontSizes.small, color: Colors.gray, marginTop: 4},
  submitButton: {
    backgroundColor: Colors.primary,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  submitButtonDisabled: {backgroundColor: Colors.lightGray},
  submitButtonText: {
    color: Colors.white,
    fontFamily: FontFamily.semiBold,
    fontSize: FontSizes.large,
  },
});

export default WithdrawEditScreen;
