import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Switch,
  Modal,
  FlatList,
  Image,
  Linking,
  RefreshControl,
  Animated,
  Easing
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { format } from 'date-fns';
import { Colors, FontSizes, FontFamily } from '../../utils/constants';
import {
  fetchTagihanDetail,
  TagihanDetail,
  fetchPaymentMethods,
  PaymentMethod,
  payWithSaldo,
  payWithMethod
} from '../../services/tagihan';
import { useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../types/navigation';
import authService from '../../services/auth';

type RouteParams = {
  tagihanId: number;
};

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

const TagihanDetailScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute();
  const { tagihanId } = route.params as RouteParams;

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [tagihan, setTagihan] = useState<TagihanDetail | null>(null);
  const [useSaldo, setUseSaldo] = useState(false);
  const [balance, setBalance] = useState(0);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [showPaymentMethods, setShowPaymentMethods] = useState(false);
  const [processingPayment, setProcessingPayment] = useState(false);
  const [scaleValue] = useState(new Animated.Value(1));
  const [fadeAnim] = useState(new Animated.Value(0));

  const animateButton = () => {
    Animated.sequence([
      Animated.timing(scaleValue, {
        toValue: 0.95,
        duration: 100,
        easing: Easing.ease,
        useNativeDriver: true
      }),
      Animated.timing(scaleValue, {
        toValue: 1,
        duration: 100,
        easing: Easing.ease,
        useNativeDriver: true
      })
    ]).start();
  };

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true
    }).start();
  }, [fadeAnim]);

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await fetchTagihanDetail(tagihanId);
      setTagihan(data);

      // Load user balance
      const storedUser = await authService.getStoredUser();
      if (storedUser?.id) {
        const userDetail = await authService.getUserDetail(storedUser.id);
        if (userDetail) {
          setBalance(parseFloat(userDetail.balance) || 0);
        }
      }

      // Load payment methods
      const methodsResponse = await fetchPaymentMethods();
      setPaymentMethods(methodsResponse.data.payment_methods);
    } catch (error) {
      Alert.alert('Error', 'Gagal memuat detail tagihan');
      console.error('Error loading tagihan detail:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [tagihanId]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadData();
  }, []);

  const handleToggleSaldo = () => {
    if (balance >= (tagihan?.total_bayar || 0)) {
      Alert.alert(
        'Konfirmasi',
        `Anda akan membayar tagihan sebesar Rp${Number(tagihan?.total_bayar).toLocaleString('id-ID')} menggunakan saldo?`,
        [
          {
            text: 'Batal',
            style: 'cancel',
            onPress: () => setUseSaldo(false)
          },
          {
            text: 'Ya, Bayar',
            onPress: async () => {
              try {
                setProcessingPayment(true);
                await payWithSaldo(tagihanId);
                Alert.alert('Sukses', 'Pembayaran berhasil dilakukan');
                loadData(); // Refresh data
              } catch (error) {
                Alert.alert('Error', 'Gagal melakukan pembayaran');
                console.error('Payment error:', error);
              } finally {
                setProcessingPayment(false);
              }
            }
          }
        ]
      );
    } else {
      Alert.alert('Saldo Tidak Cukup', 'Saldo Anda tidak mencukupi untuk membayar tagihan ini');
      setUseSaldo(false);
    }
  };

  const handlePayWithMethod = async (method: PaymentMethod) => {
    try {
      setProcessingPayment(true);
      const result = await payWithMethod(tagihanId, method.code);

      setShowPaymentMethods(false);

      if (!result.success) {
        throw new Error(result.message || 'Failed to process payment');
      }

      if (method.group === 'E-Wallet') {
        Alert.alert(
          'Lanjutkan Pembayaran',
          'Anda akan diarahkan ke halaman pembayaran. Setelah menyelesaikan pembayaran, status tagihan akan diperbarui otomatis.',
          [
            { text: 'Batal', style: 'cancel' },
            {
              text: 'Lanjutkan',
              onPress: () => {
                if (result.data?.checkout_url) {
                  Linking.openURL(result.data.checkout_url);
                } else {
                  throw new Error('Payment URL not found');
                }
              },
            },
          ]
        );
      } else {
        if (!result.data?.payment_data) {
          throw new Error('Payment data not found');
        }

        navigation.navigate('PaymentInstruction', {
          paymentData: result.data.payment_data,
          paymentMethod: method
        });
      }
    } catch (error) {
      console.error('Payment error:', error);
      Alert.alert(
        'Error',
        error instanceof Error ? error.message : 'Gagal memproses pembayaran'
      );
    } finally {
      setProcessingPayment(false);
    }
  };

  const renderPaymentMethod = ({ item }: { item: PaymentMethod }) => (
    <AnimatedTouchable
      style={[styles.methodItem, { opacity: processingPayment ? 0.7 : 1 }]}
      onPress={() => handlePayWithMethod(item)}
      disabled={processingPayment}
      activeOpacity={0.7}
    >
      <Image
        source={{ uri: item.icon_url }}
        style={styles.methodIcon}
        resizeMode="contain"
      />
      <View style={styles.methodInfo}>
        <Text style={styles.methodName}>{item.name}</Text>
        <Text style={styles.methodFee}>
          Biaya: Rp{Number(item.total_fee.flat).toLocaleString('id-ID')}
          {item.total_fee.percent !== "0.00" && ` + ${item.total_fee.percent}%`}
        </Text>
      </View>
      {processingPayment ? (
        <ActivityIndicator size="small" color={Colors.primary} />
      ) : (
        <Icon name="chevron-right" size={24} color={Colors.gray} />
      )}
    </AnimatedTouchable>
  );

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  if (!tagihan) {
    return (
      <View style={styles.emptyContainer}>
        <Icon name="error" size={48} color={Colors.gray} />
        <Text style={styles.emptyText}>Data tagihan tidak ditemukan</Text>
        <TouchableOpacity 
          onPress={loadData} 
          style={styles.retryButton}
          activeOpacity={0.7}
        >
          <Text style={styles.retryButtonText}>Coba Lagi</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => navigation.goBack()} 
          style={styles.headerButton}
          activeOpacity={0.7}
        >
          <Icon name="arrow-back" size={FontSizes.xlarge} color={Colors.white} />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Icon name="receipt" size={FontSizes.xlarge} color={Colors.white} style={styles.headerIcon} />
          <Text style={styles.headerTitle}>Detail Tagihan</Text>
        </View>
        <View style={styles.headerRight} />
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={{ paddingBottom: 40, flexGrow: 1 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[Colors.primary]}
            tintColor={Colors.primary}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Card Status */}
        <Animated.View 
          style={[
            styles.statusCard,
            tagihan.status_bayar === 'Sudah Bayar' ? styles.paidCard :
              tagihan.status_bayar === 'Waiting Review' ? styles.pendingCard : styles.unpaidCard,
            { transform: [{ scale: fadeAnim }] }
          ]}
        >
          <View style={styles.statusHeader}>
            <Text style={styles.statusTitle}>Status Tagihan</Text>
            <View style={[
              styles.statusBadge,
              tagihan.status_bayar === 'Sudah Bayar' ? styles.paidBadge :
                tagihan.status_bayar === 'Waiting Review' ? styles.pendingBadge : styles.unpaidBadge
            ]}>
              <Text style={styles.statusBadgeText}>{tagihan.status_bayar}</Text>
            </View>
          </View>

          <Text style={styles.amount}>Rp{Number(tagihan.total_bayar).toLocaleString('id-ID')}</Text>
          <Text style={styles.invoiceNumber}>{tagihan.no_tagihan}</Text>
        </Animated.View>

        {/* Detail Tagihan */}
        <View style={styles.detailCard}>
          <View style={styles.sectionHeader}>
            <Icon name="info" size={20} color={Colors.primary} style={styles.sectionIcon} />
            <Text style={styles.sectionTitle}>Informasi Tagihan</Text>
          </View>

          <View style={styles.detailRow}>
            <View style={styles.detailLabelContainer}>
              <Icon name="date-range" size={16} color={Colors.gray} style={styles.detailIcon} />
              <Text style={styles.detailLabel}>Periode</Text>
            </View>
            <Text style={styles.detailValue}>{tagihan.periode}</Text>
          </View>

          <View style={styles.detailRow}>
            <View style={styles.detailLabelContainer}>
              <Icon name="event" size={16} color={Colors.gray} style={styles.detailIcon} />
              <Text style={styles.detailLabel}>Tanggal Dibuat</Text>
            </View>
            <Text style={styles.detailValue}>
              {format(new Date(tagihan.tanggal_create_tagihan), 'dd MMM yyyy HH:mm')}
            </Text>
          </View>

          {tagihan.tanggal_bayar && (
            <View style={styles.detailRow}>
              <View style={styles.detailLabelContainer}>
                <Icon name="payment" size={16} color={Colors.gray} style={styles.detailIcon} />
                <Text style={styles.detailLabel}>Tanggal Bayar</Text>
              </View>
              <Text style={styles.detailValue}>
                {format(new Date(tagihan.tanggal_bayar), 'dd MMM yyyy HH:mm')}
              </Text>
            </View>
          )}

          {tagihan.metode_bayar && (
            <View style={styles.detailRow}>
              <View style={styles.detailLabelContainer}>
                <Icon name="credit-card" size={16} color={Colors.gray} style={styles.detailIcon} />
                <Text style={styles.detailLabel}>Metode Bayar</Text>
              </View>
              <Text style={styles.detailValue}>{tagihan.metode_bayar}</Text>
            </View>
          )}
        </View>

        {/* Rincian Pembayaran */}
        <View style={styles.detailCard}>
          <View style={styles.sectionHeader}>
            <Icon name="attach-money" size={20} color={Colors.primary} style={styles.sectionIcon} />
            <Text style={styles.sectionTitle}>Rincian Pembayaran</Text>
          </View>

          <View style={styles.detailRow}>
            <View style={styles.detailLabelContainer}>
              <Icon name="receipt" size={16} color={Colors.gray} style={styles.detailIcon} />
              <Text style={styles.detailLabel}>Nominal Tagihan</Text>
            </View>
            <Text style={styles.detailValue}>Rp{Number(tagihan.nominal_bayar).toLocaleString('id-ID')}</Text>
          </View>

          {tagihan.potongan_bayar > 0 && (
            <View style={styles.detailRow}>
              <View style={styles.detailLabelContainer}>
                <Icon name="discount" size={16} color={Colors.gray} style={styles.detailIcon} />
                <Text style={styles.detailLabel}>Potongan</Text>
              </View>
              <Text style={[styles.detailValue, styles.discountValue]}>- Rp{Number(tagihan.potongan_bayar).toLocaleString('id-ID')}</Text>
            </View>
          )}

          {tagihan.ppn === 'Yes' && tagihan.nominal_ppn > 0 && (
            <View style={styles.detailRow}>
              <View style={styles.detailLabelContainer}>
                <Icon name="percent" size={16} color={Colors.gray} style={styles.detailIcon} />
                <Text style={styles.detailLabel}>PPN (11%)</Text>
              </View>
              <Text style={styles.detailValue}>+ Rp{Number(tagihan.nominal_ppn).toLocaleString('id-ID')}</Text>
            </View>
          )}

          <View style={[styles.detailRow, styles.totalRow]}>
            <Text style={[styles.detailLabel, styles.totalLabel]}>Total Bayar</Text>
            <Text style={[styles.detailValue, styles.totalValue]}>Rp{Number(tagihan.total_bayar).toLocaleString('id-ID')}</Text>
          </View>
        </View>

        {/* Saldo and Payment Options */}
        {tagihan.status_bayar === 'Belum Bayar' && (
          <>
            <View style={styles.saldoCard}>
              <View style={styles.saldoRow}>
                <View style={styles.saldoLabelContainer}>
                  <Icon name="account-balance-wallet" size={20} color={Colors.primary} style={styles.saldoIcon} />
                  <Text style={styles.saldoLabel}>Gunakan Saldo</Text>
                </View>
                <Switch
                  value={useSaldo}
                  onValueChange={handleToggleSaldo}
                  disabled={balance < tagihan.total_bayar || processingPayment}
                  trackColor={{ true: Colors.primary, false: Colors.lightGray }}
                  thumbColor={Colors.white}
                />
              </View>
              <Text style={styles.saldoInfo}>
                <Icon name="info" size={14} color={Colors.gray} /> Saldo tersedia: Rp{Number(balance).toLocaleString('id-ID')}
                {balance < tagihan.total_bayar && (
                  <Text style={styles.saldoWarning}> (Saldo tidak mencukupi)</Text>
                )}
              </Text>
            </View>

            <AnimatedTouchable
              style={[
                styles.payButton,
                useSaldo && styles.payButtonSecondary,
                processingPayment && styles.payButtonDisabled,
                { transform: [{ scale: scaleValue }] }
              ]}
              onPress={() => useSaldo ? null : setShowPaymentMethods(true)}
              onPressIn={animateButton}
              onPressOut={() => scaleValue.setValue(1)}
              disabled={useSaldo || processingPayment}
              activeOpacity={0.8}
            >
              {processingPayment ? (
                <ActivityIndicator color={Colors.white} />
              ) : (
                <>
                  <Icon 
                    name={useSaldo ? "account-balance-wallet" : "payment"} 
                    size={20} 
                    color={Colors.white} 
                    style={styles.payButtonIcon} 
                  />
                  <Text style={styles.payButtonText}>
                    {useSaldo ? 'Pembayaran dengan Saldo' : 'Pilih Metode Pembayaran'}
                  </Text>
                </>
              )}
            </AnimatedTouchable>
          </>
        )}
      </ScrollView>

      {/* Payment Methods Modal */}
      <Modal
        visible={showPaymentMethods}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setShowPaymentMethods(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity
              onPress={() => setShowPaymentMethods(false)}
              style={styles.modalCloseButton}
              activeOpacity={0.7}
            >
              <Icon name="close" size={24} color={Colors.white} />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Pilih Metode Pembayaran</Text>
          </View>

          <FlatList
            data={paymentMethods}
            renderItem={renderPaymentMethod}
            keyExtractor={(item) => item.code}
            contentContainerStyle={styles.methodsList}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={[Colors.primary]}
                tintColor={Colors.primary}
              />
            }
            ListHeaderComponent={
              <Text style={styles.modalSubtitle}>Pilih metode pembayaran yang tersedia</Text>
            }
          />
        </View>
      </Modal>
    </Animated.View>
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
    elevation: 8,
    shadowColor: Colors.dark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  headerButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerIcon: {
    marginRight: 12,
  },
  headerTitle: {
    color: Colors.white,
    fontSize: FontSizes.large,
    fontFamily: FontFamily.semiBold,
    letterSpacing: 0.5,
  },
  headerRight: {
    width: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.light,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    backgroundColor: Colors.light,
  },
  emptyText: {
    marginTop: 16,
    fontSize: FontSizes.medium,
    fontFamily: FontFamily.medium,
    color: Colors.gray,
    textAlign: 'center',
    lineHeight: 24,
  },
  retryButton: {
    marginTop: 20,
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: Colors.primary,
    borderRadius: 8,
    elevation: 2,
    shadowColor: Colors.dark,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  retryButtonText: {
    color: Colors.white,
    fontFamily: FontFamily.medium,
    fontSize: FontSizes.medium,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  statusCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    elevation: 4,
    shadowColor: Colors.dark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  paidCard: {
    backgroundColor: Colors.success,
  },
  pendingCard: {
    backgroundColor: Colors.warning,
  },
  unpaidCard: {
    backgroundColor: Colors.danger,
  },
  statusHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  statusTitle: {
    color: Colors.white,
    fontSize: FontSizes.medium,
    fontFamily: FontFamily.medium,
    opacity: 0.9,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  paidBadge: {
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  pendingBadge: {
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  unpaidBadge: {
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  statusBadgeText: {
    color: Colors.white,
    fontFamily: FontFamily.semiBold,
    fontSize: FontSizes.small,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  amount: {
    color: Colors.white,
    fontSize: 32,
    fontFamily: FontFamily.bold,
    marginVertical: 8,
    letterSpacing: 0.5,
  },
  invoiceNumber: {
    color: Colors.white,
    fontSize: FontSizes.small,
    fontFamily: FontFamily.regular,
    opacity: 0.9,
  },
  detailCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    elevation: 2,
    shadowColor: Colors.dark,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderGray,
    paddingBottom: 12,
  },
  sectionIcon: {
    marginRight: 12,
  },
  sectionTitle: {
    fontSize: FontSizes.medium,
    fontFamily: FontFamily.semiBold,
    color: Colors.dark,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  detailLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailIcon: {
    marginRight: 8,
  },
  detailLabel: {
    fontSize: FontSizes.small,
    color: Colors.gray,
    fontFamily: FontFamily.regular,
  },
  detailValue: {
    fontSize: FontSizes.small,
    color: Colors.dark,
    fontFamily: FontFamily.medium,
    textAlign: 'right',
    flex: 1,
    paddingLeft: 8,
  },
  discountValue: {
    color: Colors.success,
  },
  totalRow: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.borderGray,
  },
  totalLabel: {
    fontFamily: FontFamily.semiBold,
    fontSize: FontSizes.medium,
  },
  totalValue: {
    fontFamily: FontFamily.semiBold,
    fontSize: FontSizes.medium,
    color: Colors.primary,
  },
  saldoCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    elevation: 2,
    shadowColor: Colors.dark,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
  },
  saldoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  saldoLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  saldoIcon: {
    marginRight: 12,
  },
  saldoLabel: {
    fontSize: FontSizes.medium,
    fontFamily: FontFamily.medium,
    color: Colors.dark,
  },
  saldoInfo: {
    fontSize: FontSizes.small,
    fontFamily: FontFamily.regular,
    color: Colors.gray,
    marginTop: 8,
  },
  saldoWarning: {
    color: Colors.danger,
    fontFamily: FontFamily.medium,
  },
  payButton: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 8,
    elevation: 4,
    shadowColor: Colors.dark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    flexDirection: 'row',
  },
  payButtonSecondary: {
    backgroundColor: Colors.success,
    shadowColor: Colors.darkSuccess,
  },
  payButtonDisabled: {
    backgroundColor: Colors.lightGray,
    shadowColor: Colors.gray,
  },
  payButtonIcon: {
    marginRight: 12,
  },
  payButtonText: {
    color: Colors.white,
    fontFamily: FontFamily.semiBold,
    fontSize: FontSizes.medium,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: Colors.primary,
    elevation: 8,
    shadowColor: Colors.dark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  modalCloseButton: {
    marginRight: 16,
    padding: 4,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  modalTitle: {
    color: Colors.white,
    fontSize: FontSizes.large,
    fontFamily: FontFamily.semiBold,
    flex: 1,
  },
  modalSubtitle: {
    fontSize: FontSizes.small,
    color: Colors.gray,
    fontFamily: FontFamily.regular,
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  methodsList: {
    padding: 16,
  },
  methodItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: Colors.white,
    borderRadius: 12,
    marginBottom: 12,
    elevation: 1,
    borderWidth: 1,
    borderColor: Colors.borderGray,
    shadowColor: Colors.dark,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  methodIcon: {
    width: 40,
    height: 40,
    marginRight: 16,
  },
  methodInfo: {
    flex: 1,
  },
  methodName: {
    fontSize: FontSizes.medium,
    fontFamily: FontFamily.medium,
    color: Colors.dark,
    marginBottom: 4,
  },
  methodFee: {
    fontSize: FontSizes.small,
    fontFamily: FontFamily.regular,
    color: Colors.gray,
  },
});

export default TagihanDetailScreen;