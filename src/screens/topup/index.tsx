// src/screens/topup/index.tsx
import React, {useState, useEffect, useCallback} from 'react';
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
  ScrollView,
  TextInput,
  Image,
  Alert,
  Linking,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import {format} from 'date-fns';
import {Colors, FontSizes, FontFamily} from '../../utils/constants';
import DatePicker from 'react-native-date-picker';
import {
  fetchTopupHistory,
  TopupHistory,
  createTripayTopup,
  deleteManualTopup,
} from '../../services/topup';
import {fetchPaymentMethods} from '../../services/tagihan';
import {PaymentMethod} from '../../types/navigation';
import authService from '../../services/auth';
import {formatRupiah, unformatRupiah} from '../../utils/helpers';
import {useFocusEffect} from '@react-navigation/native';

const TopupScreen = ({navigation}: any) => {
  const [data, setData] = useState<TopupHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [showOptionModal, setShowOptionModal] = useState(false);
  const [showAutoTopupModal, setShowAutoTopupModal] = useState(false);
  const [pelangganId, setPelangganId] = useState<number | null>(null);
  const [nominalOtomatis, setNominalOtomatis] = useState('');
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [loadingMethods, setLoadingMethods] = useState(false);
  const [processingPayment, setProcessingPayment] = useState(false);
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [statusFilter, setStatusFilter] = useState('Semua');
  const [metodeFilter, setMetodeFilter] = useState('Semua');
  const [datePickerMode, setDatePickerMode] = useState<'start' | 'end' | null>(
    null,
  );

  const loadPaymentMethods = async () => {
    setLoadingMethods(true);
    try {
      const response = await fetchPaymentMethods();
      setPaymentMethods(response.data.payment_methods);
    } catch (error) {
      Alert.alert('Error', 'Gagal memuat metode pembayaran.');
    } finally {
      setLoadingMethods(false);
    }
  };

  const loadData = useCallback(
    async (currentPage = 1, isRefreshing = false) => {
      if (!pelangganId) return;
      // Hanya tampilkan loading indicator besar saat pertama kali
      if (currentPage === 1 && !isRefreshing) {
        setLoading(true);
      } else {
        setLoading(false); // Pastikan loading besar tidak muncul saat refresh/load more
      }

      try {
        const filters = {
          ...(startDate && {startDate: format(startDate, 'yyyy-MM-dd')}),
          ...(endDate && {endDate: format(endDate, 'yyyy-MM-dd')}),
          ...(statusFilter !== 'Semua' && {status: statusFilter}),
          ...(metodeFilter !== 'Semua' && {metode: metodeFilter}),
        };

        const response = await fetchTopupHistory(
          pelangganId,
          currentPage,
          10,
          filters,
        );

        if (response) {
          setData(
            currentPage === 1
              ? response.data
              : prev => [...prev, ...response.data],
          );
          setTotal(response.total);
          setHasMore(response.data.length >= 10);
        }
      } catch (error) {
        Alert.alert('Error', 'Gagal memuat riwayat top up.');
        console.error('Error loading topup data:', error);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [pelangganId, startDate, endDate, statusFilter, metodeFilter],
  );

  useEffect(() => {
    const init = async () => {
      const storedUser = await authService.getStoredUser();
      if (storedUser?.id) {
        setPelangganId(storedUser.id);
      }
    };
    init();
    loadPaymentMethods();
  }, []);

  useFocusEffect(
    useCallback(() => {
      if (pelangganId) {
        loadData(1, true);
      }
    }, [pelangganId, loadData]),
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setPage(1);
    loadData(1, true);
  }, [loadData]);

  const loadMore = () => {
    if (!loading && hasMore) {
      const newPage = page + 1;
      setPage(newPage);
      loadData(newPage);
    }
  };

  const applyFilters = () => {
    setShowFilterModal(false);
    setPage(1);
    loadData(1, true);
  };

  const resetFilters = () => {
    setStartDate(null);
    setEndDate(null);
    setStatusFilter('Semua');
    setMetodeFilter('Semua');
    setShowFilterModal(false);
    setPage(1);
    loadData(1, true);
  };

  const handleManualTopup = () => {
    setShowOptionModal(false);
    navigation.navigate('TopupCreate');
  };

  const handleAutomaticTopup = () => {
    setShowOptionModal(false);
    setShowAutoTopupModal(true);
  };

  const handlePayWithMethod = async (method: PaymentMethod) => {
    const cleanNominal = unformatRupiah(nominalOtomatis);
    if (!cleanNominal || Number(cleanNominal) < 10000) {
      Alert.alert('Input Tidak Valid', 'Minimal top up adalah Rp 10.000.');
      return;
    }
    setProcessingPayment(true);
    try {
      const result = await createTripayTopup(
        pelangganId!,
        Number(cleanNominal),
        method.code,
      );
      setShowAutoTopupModal(false);

      if (method.group === 'E-Wallet' && result.data?.checkout_url) {
        Linking.openURL(result.data.checkout_url);
      } else if (result.data) {
        navigation.navigate('TopupDetail', {
          paymentData: result.data,
          paymentMethod: method,
        });
      } else {
        throw new Error('Data pembayaran tidak ditemukan.');
      }
    } catch (error: any) {
      Alert.alert('Error Pembayaran', error.message);
    } finally {
      setProcessingPayment(false);
      setNominalOtomatis('');
    }
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'success':
        return {
          icon: 'check-circle',
          color: Colors.success,
          badge: Colors.lightSuccess,
        };
      case 'pending':
        return {
          icon: 'pending',
          color: Colors.warning,
          badge: Colors.lightWarning,
        };
      case 'failed':
      case 'canceled':
      case 'expired':
        return {
          icon: 'cancel',
          color: Colors.danger,
          badge: Colors.lightDanger,
        };
      default:
        return {
          icon: 'hourglass-empty',
          color: Colors.gray,
          badge: Colors.lightGray,
        };
    }
  };

  const formatFee = (fee: {flat: number; percent: string}) => {
    const flatFee = fee.flat > 0 ? `Rp${fee.flat.toLocaleString('id-ID')}` : '';
    const percentFee = parseFloat(fee.percent) > 0 ? `${fee.percent}%` : '';

    if (flatFee && percentFee) {
      return `Biaya: ${flatFee} + ${percentFee}`;
    }
    return `Biaya: ${flatFee || percentFee || 'Gratis'}`;
  };

  const renderItem = ({item}: {item: TopupHistory}) => {
    const statusStyle = getStatusStyle(item.status);

    const handleEdit = () => {
      navigation.navigate('TopupCreate', {topupData: item});
    };

    const handleDelete = () => {
      Alert.alert(
        'Konfirmasi Hapus',
        `Anda yakin ingin menghapus permintaan top up sebesar Rp${Number(
          item.nominal,
        ).toLocaleString('id-ID')}?`,
        [
          {text: 'Batal', style: 'cancel'},
          {
            text: 'Hapus',
            style: 'destructive',
            onPress: async () => {
              try {
                setLoading(true);
                await deleteManualTopup(item.id);
                Alert.alert('Berhasil', 'Permintaan top up berhasil dihapus.');
                onRefresh(); // Muat ulang data
              } catch (error: any) {
                Alert.alert('Error', error.message);
              } finally {
                setLoading(false);
              }
            },
          },
        ],
      );
    };

    return (
      <View style={styles.historyItemContainer}>
        <TouchableOpacity style={styles.historyItem}>
          <View
            style={[styles.historyIcon, {backgroundColor: statusStyle.color}]}>
            <Icon
              name={statusStyle.icon}
              size={FontSizes.xlarge}
              color={Colors.white}
            />
          </View>
          <View style={styles.historyContent}>
            <View style={styles.historyHeader}>
              <Text style={styles.historyAmount}>
                Rp{Number(item.nominal).toLocaleString('id-ID')}
              </Text>
              <View
                style={[
                  styles.statusBadge,
                  {backgroundColor: statusStyle.badge},
                ]}>
                <Text style={styles.statusBadgeText}>{item.status}</Text>
              </View>
            </View>
            <View style={styles.historyDetailRow}>
              <Icon name="receipt" size={14} color={Colors.gray} />
              <Text style={styles.historyDetailText}>No: {item.no_topup}</Text>
            </View>
            <View style={styles.historyDetailRow}>
              <Icon name="payment" size={14} color={Colors.gray} />
              <Text style={styles.historyDetailText}>
                Metode: {item.metode_topup} ({item.metode})
              </Text>
            </View>
            <View style={styles.historyDetailRow}>
              <Icon name="access-time" size={14} color={Colors.gray} />
              <Text style={styles.historyDetailText}>
                Tanggal:{' '}
                {format(new Date(item.tanggal_topup), 'dd MMM yyyy HH:mm')}
              </Text>
            </View>
          </View>
        </TouchableOpacity>

        {item.metode === 'manual' && item.status === 'pending' && (
          <View style={styles.actionContainer}>
            <TouchableOpacity
              style={[styles.actionButton, styles.editButton]}
              onPress={handleEdit}>
              <Icon name="edit" size={16} color={Colors.primary} />
              <Text style={styles.actionButtonText}>Edit</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, styles.deleteButton]}
              onPress={handleDelete}>
              <Icon name="delete" size={16} color={Colors.danger} />
              <Text style={[styles.actionButtonText, {color: Colors.danger}]}>
                Hapus
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  const renderFooter = () => {
    if (!loading || page === 1) return null;
    return (
      <View style={styles.footer}>
        <ActivityIndicator size="small" color={Colors.primary} />
      </View>
    );
  };

  const renderPaymentMethod = ({item}: {item: PaymentMethod}) => (
    <TouchableOpacity
      style={styles.methodItem}
      onPress={() => handlePayWithMethod(item)}
      disabled={processingPayment}>
      <Image
        source={{uri: item.icon_url}}
        style={styles.methodIcon}
        resizeMode="contain"
      />
      <View style={styles.methodInfo}>
        <Text style={styles.methodName}>{item.name}</Text>
        <Text style={styles.methodFee}>{formatFee(item.total_fee)}</Text>
      </View>
      {processingPayment ? (
        <ActivityIndicator />
      ) : (
        <Icon name="chevron-right" size={24} color={Colors.gray} />
      )}
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.headerButton}
          activeOpacity={0.7}>
          <Icon
            name="arrow-back"
            size={FontSizes.xlarge}
            color={Colors.white}
          />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Icon
            name="account-balance-wallet"
            size={FontSizes.xlarge}
            color={Colors.white}
            style={styles.headerIcon}
          />
          <Text style={styles.headerTitle}>Riwayat Top Up</Text>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity
            onPress={() => setShowFilterModal(true)}
            style={styles.headerButton}
            activeOpacity={0.7}>
            <Icon
              name="filter-alt"
              size={FontSizes.xlarge}
              color={Colors.white}
            />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setShowOptionModal(true)}
            style={styles.headerButton}
            activeOpacity={0.7}>
            <Icon
              name="add-circle-outline"
              size={FontSizes.xlarge}
              color={Colors.white}
            />
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
          keyExtractor={item => item.id.toString()}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[Colors.primary]}
            />
          }
          ListHeaderComponent={
            <View style={styles.listHeader}>
              <Text style={styles.listHeaderText}>Daftar Top Up</Text>
              <Text style={styles.listHeaderCount}>
                {total} transaksi ditemukan
              </Text>
            </View>
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Icon name="history" size={48} color={Colors.gray} />
              <Text style={styles.emptyText}>Tidak ada riwayat top up</Text>
            </View>
          }
          onEndReached={loadMore}
          onEndReachedThreshold={0.5}
          ListFooterComponent={renderFooter}
        />
      )}

      {/* Filter Modal */}
      <Modal
        visible={showFilterModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowFilterModal(false)}>
        <TouchableWithoutFeedback onPress={() => Keyboard.dismiss()}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>
                  <Icon name="filter-alt" size={20} color={Colors.primary} />{' '}
                  Filter Top Up
                </Text>
                <TouchableOpacity onPress={() => setShowFilterModal(false)}>
                  <Icon
                    name="close"
                    size={FontSizes.xlarge}
                    color={Colors.gray}
                  />
                </TouchableOpacity>
              </View>
              <ScrollView>
                <View style={styles.filterSection}>
                  <Text style={styles.filterLabel}>Status</Text>
                  <View style={styles.statusFilterContainer}>
                    {[
                      {name: 'Semua', icon: 'all-inclusive'},
                      {name: 'pending', icon: 'pending'},
                      {name: 'success', icon: 'check-circle'},
                      {name: 'failed', icon: 'cancel'},
                    ].map((status, index) => (
                      <TouchableOpacity
                        key={index}
                        style={[
                          styles.statusFilterButton,
                          statusFilter === status.name &&
                            styles.statusFilterActive,
                        ]}
                        onPress={() => setStatusFilter(status.name)}>
                        <Icon
                          name={status.icon}
                          size={16}
                          color={
                            statusFilter === status.name
                              ? Colors.primary
                              : Colors.gray
                          }
                        />
                        <Text
                          style={
                            statusFilter === status.name
                              ? styles.statusFilterTextActive
                              : styles.statusFilterText
                          }>
                          {status.name}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
                <View style={styles.filterSection}>
                  <Text style={styles.filterLabel}>Metode</Text>
                  <View style={styles.statusFilterContainer}>
                    {[
                      {name: 'Semua', icon: 'all-inclusive'},
                      {name: 'manual', icon: 'edit'},
                      {name: 'tripay', icon: 'payment'},
                    ].map((metode, index) => (
                      <TouchableOpacity
                        key={index}
                        style={[
                          styles.statusFilterButton,
                          metodeFilter === metode.name &&
                            styles.statusFilterActive,
                        ]}
                        onPress={() => setMetodeFilter(metode.name)}>
                        <Icon
                          name={metode.icon}
                          size={16}
                          color={
                            metodeFilter === metode.name
                              ? Colors.primary
                              : Colors.gray
                          }
                        />
                        <Text
                          style={
                            metodeFilter === metode.name
                              ? styles.statusFilterTextActive
                              : styles.statusFilterText
                          }>
                          {metode.name}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
                <View style={styles.filterSection}>
                  <Text style={styles.filterLabel}>Tanggal Mulai</Text>
                  <TouchableOpacity
                    style={styles.dateInput}
                    onPress={() => setDatePickerMode('start')}>
                    <Icon
                      name="calendar-today"
                      size={18}
                      color={Colors.primary}
                    />
                    <Text style={styles.dateInputText}>
                      {startDate
                        ? format(startDate, 'dd MMM yyyy')
                        : 'Pilih tanggal'}
                    </Text>
                    <Icon
                      name="keyboard-arrow-down"
                      size={20}
                      color={Colors.gray}
                    />
                  </TouchableOpacity>
                </View>
                <View style={styles.filterSection}>
                  <Text style={styles.filterLabel}>Tanggal Selesai</Text>
                  <TouchableOpacity
                    style={styles.dateInput}
                    onPress={() => setDatePickerMode('end')}>
                    <Icon
                      name="calendar-today"
                      size={18}
                      color={Colors.primary}
                    />
                    <Text style={styles.dateInputText}>
                      {endDate
                        ? format(endDate, 'dd MMM yyyy')
                        : 'Pilih tanggal'}
                    </Text>
                    <Icon
                      name="keyboard-arrow-down"
                      size={20}
                      color={Colors.gray}
                    />
                  </TouchableOpacity>
                </View>
              </ScrollView>
              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.resetButton]}
                  onPress={resetFilters}>
                  <Icon name="refresh" size={18} color={Colors.dark} />
                  <Text style={styles.resetButtonText}>Reset</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalButton, styles.applyButton]}
                  onPress={applyFilters}>
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
            date={
              datePickerMode === 'start'
                ? startDate || new Date()
                : endDate || new Date()
            }
            mode="date"
            onConfirm={date => {
              datePickerMode === 'start'
                ? setStartDate(date)
                : setEndDate(date);
              setDatePickerMode(null);
            }}
            onCancel={() => setDatePickerMode(null)}
          />
        )}
      </Modal>

      <Modal
        visible={showOptionModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowOptionModal(false)}>
        <TouchableOpacity
          style={styles.modalOverlay}
          onPress={() => setShowOptionModal(false)}
          activeOpacity={1}>
          <TouchableWithoutFeedback>
            <View style={styles.optionModalContent}>
              <Text style={styles.optionModalTitle}>Pilih Metode Top Up</Text>
              <Text style={styles.optionModalSubtitle}>
                Pilih metode yang Anda inginkan untuk melakukan top up saldo.
              </Text>
              <TouchableOpacity
                style={styles.optionButton}
                onPress={handleManualTopup}>
                <Icon
                  name="edit"
                  size={24}
                  color={Colors.primary}
                  style={styles.optionIcon}
                />
                <View>
                  <Text style={styles.optionButtonText}>Verifikasi Manual</Text>
                  <Text style={styles.optionButtonDescription}>
                    Transfer bank & upload bukti. Diproses oleh admin.
                  </Text>
                </View>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.optionButton}
                onPress={handleAutomaticTopup}>
                <Icon
                  name="payment"
                  size={24}
                  color={Colors.primary}
                  style={styles.optionIcon}
                />
                <View>
                  <Text style={styles.optionButtonText}>Otomatis (Tripay)</Text>
                  <Text style={styles.optionButtonDescription}>
                    Pembayaran instan melalui berbagai metode.
                  </Text>
                </View>
              </TouchableOpacity>
            </View>
          </TouchableWithoutFeedback>
        </TouchableOpacity>
      </Modal>

      <Modal
        visible={showAutoTopupModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowAutoTopupModal(false)}>
        <View style={[styles.modalOverlay, {justifyContent: 'flex-end'}]}>
          <TouchableWithoutFeedback>
            <View style={styles.autoTopupModalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>
                  <Icon name="payment" size={20} color={Colors.primary} /> Top
                  Up Otomatis
                </Text>
                <TouchableOpacity onPress={() => setShowAutoTopupModal(false)}>
                  <Icon
                    name="close"
                    size={FontSizes.xlarge}
                    color={Colors.gray}
                  />
                </TouchableOpacity>
              </View>
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>
                  Nominal Top Up (Min. Rp 10.000)
                </Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="Contoh: 50.000"
                  placeholderTextColor={Colors.gray}
                  keyboardType="numeric"
                  value={formatRupiah(nominalOtomatis)}
                  onChangeText={text =>
                    setNominalOtomatis(unformatRupiah(text))
                  }
                />
              </View>
              <Text style={styles.formLabel}>Pilih Metode Pembayaran</Text>
              {loadingMethods ? (
                <ActivityIndicator
                  size="large"
                  color={Colors.primary}
                  style={{marginVertical: 20}}
                />
              ) : (
                <FlatList
                  data={paymentMethods}
                  keyExtractor={item => item.code}
                  renderItem={renderPaymentMethod}
                  ListEmptyComponent={
                    <Text style={{textAlign: 'center', color: Colors.gray}}>
                      Tidak ada metode pembayaran yang tersedia.
                    </Text>
                  }
                />
              )}
            </View>
          </TouchableWithoutFeedback>
        </View>
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
  headerButton: {
    padding: 4,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  headerTitleContainer: {flexDirection: 'row', alignItems: 'center'},
  headerIcon: {marginRight: 8},
  headerTitle: {
    color: Colors.white,
    fontSize: FontSizes.xlarge,
    fontFamily: FontFamily.semiBold,
  },
  headerRight: {flexDirection: 'row', alignItems: 'center', gap: 12},
  loadingContainer: {flex: 1, justifyContent: 'center', alignItems: 'center'},
  listContent: {paddingBottom: 16},
  listHeader: {paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8},
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
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: Colors.white,
    marginHorizontal: 16,
    marginTop: 8,
    borderRadius: 12,
    elevation: 2,
  },
  historyIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  historyContent: {flex: 1},
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  historyAmount: {
    fontSize: FontSizes.medium,
    fontFamily: FontFamily.semiBold,
    color: Colors.dark,
  },
  statusBadge: {paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12},
  statusBadgeText: {
    fontSize: FontSizes.small,
    fontFamily: FontFamily.semiBold,
    textTransform: 'capitalize',
  },
  historyDetailRow: {flexDirection: 'row', alignItems: 'center', marginTop: 2},
  historyDetailText: {
    fontSize: FontSizes.small,
    fontFamily: FontFamily.regular,
    color: Colors.gray,
    marginLeft: 4,
    textTransform: 'capitalize',
  },
  historyItemContainer: {
    backgroundColor: Colors.white,
    marginHorizontal: 16,
    marginTop: 8,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  actionContainer: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: Colors.borderGray,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 8,
  },
  editButton: {
    borderRightWidth: 1,
    borderRightColor: Colors.borderGray,
  },
  actionButtonText: {
    fontFamily: FontFamily.semiBold,
    fontSize: FontSizes.small,
    color: Colors.primary,
  },
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
  footer: {padding: 16, justifyContent: 'center', alignItems: 'center'},
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
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderGray,
  },
  modalTitle: {
    fontSize: FontSizes.xlarge,
    fontFamily: FontFamily.semiBold,
    color: Colors.dark,
    flexDirection: 'row',
    alignItems: 'center',
  },
  filterSection: {marginBottom: 20},
  filterLabel: {
    fontSize: FontSizes.medium,
    fontFamily: FontFamily.medium,
    color: Colors.dark,
    marginBottom: 8,
  },
  statusFilterContainer: {flexDirection: 'row', flexWrap: 'wrap', gap: 8},
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
    textTransform: 'capitalize',
  },
  statusFilterTextActive: {
    color: Colors.primary,
    fontFamily: FontFamily.semiBold,
    fontSize: FontSizes.small,
    textTransform: 'capitalize',
  },
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
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  resetButton: {backgroundColor: Colors.lightGray},
  resetButtonText: {color: Colors.dark, fontFamily: FontFamily.medium},
  applyButton: {backgroundColor: Colors.primary},
  applyButtonText: {color: Colors.white, fontFamily: FontFamily.medium},
  optionModalContent: {
    width: '90%',
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 24,
  },
  optionModalTitle: {
    fontSize: FontSizes.xlarge,
    fontFamily: FontFamily.semiBold,
    color: Colors.dark,
    textAlign: 'center',
    marginBottom: 8,
  },
  optionModalSubtitle: {
    fontSize: FontSizes.medium,
    fontFamily: FontFamily.regular,
    color: Colors.gray,
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
  optionIcon: {marginRight: 16},
  optionButtonText: {
    fontSize: FontSizes.large,
    fontFamily: FontFamily.semiBold,
    color: Colors.dark,
  },
  optionButtonDescription: {
    fontSize: FontSizes.small,
    color: Colors.gray,
    marginTop: 2,
  },
  autoTopupModalContent: {
    width: '100%',
    backgroundColor: Colors.white,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 20,
    maxHeight: '85%',
  },
  formGroup: {marginBottom: 16},
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
    color: Colors.dark,
    fontFamily: FontFamily.regular,
  },
  methodItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: Colors.white,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.borderGray,
  },
  methodIcon: {width: 40, height: 40, marginRight: 16},
  methodInfo: {flex: 1},
  methodName: {
    fontSize: FontSizes.medium,
    fontFamily: FontFamily.semiBold,
    color: Colors.dark,
    marginBottom: 4,
  },
  methodFee: {
    fontSize: FontSizes.small,
    fontFamily: FontFamily.regular,
    color: Colors.gray,
  },
});

export default TopupScreen;
