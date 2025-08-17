// src/screens/topup/detail_topup.tsx

import React from 'react';
import {
  View,
  StyleSheet,
  Text,
  ScrollView,
  TouchableOpacity,
  Linking,
  Image,
  Alert,
  useWindowDimensions,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import RenderHtml from 'react-native-render-html';
import {Colors, FontSizes, FontFamily} from '../../utils/constants';
import {PaymentData, PaymentMethod} from '../../types/navigation';

type TopupInstructionProps = {
  route: {
    params: {
      paymentData: PaymentData;
      paymentMethod: PaymentMethod;
    };
  };
  navigation: any;
};

const HtmlStepRenderer = ({html}: {html: string}) => {
  const {width} = useWindowDimensions();

  return (
    <RenderHtml
      contentWidth={width - 60}
      source={{html}}
      tagsStyles={{
        b: {
          fontWeight: 'bold',
          color: Colors.dark,
        },
      }}
      baseStyle={{
        fontSize: FontSizes.small,
        color: Colors.dark,
        fontFamily: FontFamily.regular,
        lineHeight: 20,
      }}
    />
  );
};

const TopupDetailScreen: React.FC<TopupInstructionProps> = ({
  route,
  navigation,
}) => {
  const {paymentData, paymentMethod} = route.params;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const handleOpenPaymentLink = () => {
    if (paymentData.checkout_url) {
      Linking.openURL(paymentData.checkout_url).catch(() => {
        Alert.alert('Error', 'Tidak dapat membuka halaman pembayaran');
      });
    }
  };

  const copyToClipboard = (text: string) => {
    // Implementasi clipboard (saat ini hanya menampilkan alert)
    Alert.alert('Berhasil', `Teks telah disalin: ${text}`);
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
        <Text style={styles.headerTitle}>Instruksi Top Up</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}>
        <View style={styles.card}>
          <View style={styles.methodHeader}>
            {paymentMethod?.icon_url && (
              <Image
                source={{uri: paymentMethod.icon_url}}
                style={styles.methodIcon}
                resizeMode="contain"
              />
            )}
            <Text style={styles.methodName}>{paymentData.payment_name}</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Total Pembayaran</Text>
            <Text style={[styles.summaryValue, styles.amount]}>
              {formatCurrency(paymentData.amount)}
            </Text>
          </View>

          {paymentData.pay_code && (
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Kode Bayar / VA Number</Text>
              <TouchableOpacity
                onPress={() => copyToClipboard(paymentData.pay_code!)}>
                <Text style={[styles.summaryValue, styles.copyableText]}>
                  {paymentData.pay_code}
                  <Text style={styles.copyIcon}> ⎘ Salin</Text>
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {paymentData.checkout_url && (
            <TouchableOpacity
              style={styles.paymentButton}
              onPress={handleOpenPaymentLink}>
              <Text style={styles.paymentButtonText}>
                Buka Halaman Pembayaran
              </Text>
              <Icon name="open-in-new" size={18} color={Colors.white} />
            </TouchableOpacity>
          )}
        </View>

        {paymentData.instructions?.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Cara Pembayaran</Text>
            {paymentData.instructions.map((instruction, index) => (
              <View
                key={`instruction-${index}`}
                style={styles.instructionGroup}>
                <Text style={styles.instructionTitle}>{instruction.title}</Text>
                <View style={styles.instructionSteps}>
                  {instruction.steps.map((step, stepIndex) => (
                    <View
                      key={`step-${index}-${stepIndex}`}
                      style={styles.stepRow}>
                      <Text style={styles.stepBullet}>•</Text>
                      <View style={{flex: 1}}>
                        <HtmlStepRenderer html={step} />
                      </View>
                    </View>
                  ))}
                </View>
              </View>
            ))}
          </View>
        )}

        <TouchableOpacity
          style={styles.doneButton}
          onPress={() => navigation.replace('HomeScreen', {screen: 'Topup'})}>
          <Text style={styles.doneButtonText}>Selesai</Text>
        </TouchableOpacity>
      </ScrollView>
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
  headerButton: {padding: 4, borderRadius: 20},
  headerTitle: {
    color: Colors.white,
    fontSize: FontSizes.xlarge,
    fontFamily: FontFamily.semiBold,
    flex: 1,
    textAlign: 'center',
  },
  headerRight: {width: 40},
  content: {flex: 1, paddingHorizontal: 16},
  scrollContent: {paddingBottom: 24, paddingTop: 16},
  card: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    elevation: 2,
  },
  methodHeader: {flexDirection: 'row', alignItems: 'center', marginBottom: 12},
  methodIcon: {width: 40, height: 40, marginRight: 12},
  methodName: {
    fontSize: FontSizes.large,
    fontFamily: FontFamily.semiBold,
    color: Colors.dark,
  },
  divider: {height: 1, backgroundColor: Colors.borderGray, marginVertical: 12},
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  summaryLabel: {
    fontSize: FontSizes.medium,
    color: Colors.gray,
    fontFamily: FontFamily.regular,
  },
  summaryValue: {
    fontSize: FontSizes.medium,
    color: Colors.dark,
    fontFamily: FontFamily.semiBold,
  },
  amount: {color: Colors.primary, fontSize: FontSizes.large},
  copyableText: {color: Colors.primary},
  copyIcon: {fontSize: FontSizes.medium, color: Colors.primary},
  paymentButton: {
    backgroundColor: Colors.success,
    borderRadius: 8,
    padding: 14,
    alignItems: 'center',
    marginTop: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  paymentButtonText: {
    color: Colors.white,
    fontFamily: FontFamily.semiBold,
    fontSize: FontSizes.medium,
  },
  sectionTitle: {
    fontSize: FontSizes.large,
    fontFamily: FontFamily.semiBold,
    color: Colors.dark,
    marginBottom: 16,
  },
  instructionGroup: {marginBottom: 20},
  instructionTitle: {
    fontSize: FontSizes.medium,
    fontFamily: FontFamily.semiBold,
    color: Colors.dark,
    marginBottom: 8,
  },
  instructionSteps: {paddingLeft: 8},
  stepRow: {flexDirection: 'row', marginBottom: 8, alignItems: 'flex-start'},
  stepBullet: {
    color: Colors.dark,
    marginRight: 8,
    lineHeight: 22,
    fontSize: 16,
  },
  doneButton: {
    backgroundColor: Colors.primary,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  doneButtonText: {
    color: Colors.white,
    fontSize: FontSizes.large,
    fontFamily: FontFamily.semiBold,
  },
});

export default TopupDetailScreen;
