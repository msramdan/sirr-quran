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
  useWindowDimensions
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import RenderHtml from 'react-native-render-html';
import { Colors, FontSizes, FontFamily } from '../../utils/constants';

type PaymentInstructionProps = {
  route: {
    params: {
      paymentData: {
        payment_name: string;
        reference: string;
        pay_code?: string;
        amount: number;
        checkout_url?: string;
        instructions?: Array<{
          title: string;
          steps: string[];
        }>;
        payment_method?: {
          icon_url: string;
        };
      };
      paymentMethod?: {
        group: string;
        code: string;
        name: string;
        icon_url: string;
      };
    };
  };
  navigation: any;
};

const HtmlStepRenderer = ({ html }: { html: string }) => {
  const { width } = useWindowDimensions();

  return (
    <RenderHtml
      contentWidth={width - 60} // Menyesuaikan dengan lebar layar dikurangi padding
      source={{ html }}
      tagsStyles={{
        b: {
          fontWeight: 'bold',
          color: Colors.dark
        }
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

const PaymentInstructionScreen: React.FC<PaymentInstructionProps> = ({ route, navigation }) => {
  const { paymentData, paymentMethod } = route.params;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
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
    // Implement clipboard functionality here
    Alert.alert('Berhasil', 'Teks telah disalin');
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>

        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerButton}>
          <Icon name="arrow-back" size={FontSizes.xlarge} color={Colors.white} />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Instruksi Pembayaran</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Payment Summary */}
        <View style={styles.card}>
          <View style={styles.methodHeader}>
            {paymentMethod?.icon_url && (
              <Image
                source={{ uri: paymentMethod.icon_url }}
                style={styles.methodIcon}
                resizeMode="contain"
              />
            )}
            <Text style={styles.methodName}>
              {paymentData.payment_name}
            </Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Total Pembayaran</Text>
            <Text style={[styles.summaryValue, styles.amount]}>
              {formatCurrency(paymentData.amount)}
            </Text>
          </View>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Kode Referensi</Text>
            <TouchableOpacity onPress={() => copyToClipboard(paymentData.reference)}>
              <Text style={[styles.summaryValue, styles.copyableText]}>
                {paymentData.reference}
                <Text style={styles.copyIcon}> ⎘</Text>
              </Text>
            </TouchableOpacity>
          </View>

          {paymentData.pay_code && (
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Kode Bayar</Text>
              <TouchableOpacity onPress={() => copyToClipboard(paymentData.pay_code)}>
                <Text style={[styles.summaryValue, styles.copyableText]}>
                  {paymentData.pay_code}
                  <Text style={styles.copyIcon}> ⎘</Text>
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {paymentData.checkout_url && (
            <TouchableOpacity
              style={styles.paymentButton}
              onPress={handleOpenPaymentLink}
              testID="payment-button"
            >
              <Text style={styles.paymentButtonText}>Buka Halaman Pembayaran</Text>
              <Icon name="open-in-new" size={18} color={Colors.white} />
            </TouchableOpacity>
          )}
        </View>

        {/* Payment Instructions */}
        {paymentData.instructions?.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Cara Pembayaran</Text>

            {paymentData.instructions.map((instruction, index) => (
              <View key={`instruction-${index}`} style={styles.instructionGroup}>
                <Text style={styles.instructionTitle}>{instruction.title}</Text>

                <View style={styles.instructionSteps}>
                  {instruction.steps.map((step, stepIndex) => (
                    <View key={`step-${index}-${stepIndex}`} style={styles.stepRow}>
                      <Text style={styles.stepBullet}>•</Text>
                      <View style={styles.stepTextContainer}>
                        <HtmlStepRenderer html={step} />
                      </View>
                    </View>
                  ))}
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Additional Information */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Informasi Penting</Text>
          <View style={styles.stepRow}>
            <Text style={styles.stepBullet}>•</Text>
            <Text style={styles.stepText}>
              Simpan bukti pembayaran Anda sampai transaksi dikonfirmasi
            </Text>
          </View>
          <View style={styles.stepRow}>
            <Text style={styles.stepBullet}>•</Text>
            <Text style={styles.stepText}>
              Proses verifikasi mungkin memakan waktu hingga 5 menit
            </Text>
          </View>
          {paymentMethod?.group === 'Virtual Account' && (
            <View style={styles.stepRow}>
              <Text style={styles.stepBullet}>•</Text>
              <Text style={styles.stepText}>
                Virtual Account hanya valid hingga 24 jam
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: Colors.primary,
    elevation: 4,
  },
  headerButton: {
    padding: 4,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  headerTitle: {
    color: Colors.white,
    fontSize: FontSizes.large,
    fontFamily: FontFamily.semiBold,
    flex: 1,
    textAlign: 'center',
    marginLeft: -24,
  },
  headerRight: {
    width: 24,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  scrollContent: {
    paddingBottom: 24,
  },
  card: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    elevation: 2,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  methodHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  methodIcon: {
    width: 40,
    height: 40,
    marginRight: 12,
  },
  methodName: {
    fontSize: FontSizes.medium,
    fontFamily: FontFamily.semiBold,
    color: Colors.dark,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  summaryLabel: {
    fontSize: FontSizes.small,
    color: Colors.gray,
    fontFamily: FontFamily.regular,
    flex: 1,
  },
  summaryValue: {
    fontSize: FontSizes.small,
    color: Colors.dark,
    fontFamily: FontFamily.medium,
    textAlign: 'right',
    flex: 1,
    paddingLeft: 8,
  },
  amount: {
    color: Colors.primary,
    fontFamily: FontFamily.semiBold,
    fontSize: FontSizes.medium,
  },
  copyableText: {
    color: Colors.primary,
    textDecorationLine: 'underline',
  },
  copyIcon: {
    fontSize: FontSizes.small,
  },
  paymentButton: {
    backgroundColor: Colors.primary,
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
    fontSize: FontSizes.medium,
    fontFamily: FontFamily.semiBold,
    color: Colors.dark,
    marginBottom: 16,
  },
  instructionGroup: {
    marginBottom: 20,
  },
  instructionTitle: {
    fontSize: FontSizes.medium,
    fontFamily: FontFamily.semiBold,
    color: Colors.dark,
    marginBottom: 8,
  },
  instructionSteps: {
    paddingLeft: 8,
  },
  stepRow: {
    flexDirection: 'row',
    marginBottom: 8,
    alignItems: 'flex-start',
  },
  stepBullet: {
    color: Colors.dark,
    marginRight: 8,
    lineHeight: 20,
  },
  stepTextContainer: {
    flex: 1,
  },
  stepText: {
    flex: 1,
    fontSize: FontSizes.small,
    color: Colors.dark,
    fontFamily: FontFamily.regular,
    lineHeight: 20,
  },
});

export default PaymentInstructionScreen;