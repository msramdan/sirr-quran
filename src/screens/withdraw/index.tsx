import React, {useState, useEffect, useCallback} from 'react';
import {useFocusEffect} from '@react-navigation/native';
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
  TextInput,
  Alert,
  ScrollView,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import {format} from 'date-fns';
import {Colors, FontSizes, FontFamily} from '../../utils/constants';
import DatePicker from 'react-native-date-picker';
import {
  fetchWithdrawHistory,
  createWithdraw,
  updateWithdraw,
  deleteWithdraw,
  WithdrawHistory,
} from '../../services/withdraw';
import authService from '../../services/auth';
import {formatRupiah, unformatRupiah} from '../../utils/helpers';

const WithdrawScreen = ({navigation}: any) => {
  const [data, setData] = useState<WithdrawHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [pelangganId, setPelangganId] = useState<number | null>(null);
  const [balance, setBalance] = useState(0);

  // Form states
  const [nominal, setNominal] = useState('');
  const [tanggalWd, setTanggalWd] = useState(new Date());
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Filter states
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [statusFilter, setStatusFilter] = useState<
    'Semua' | 'Pending' | 'Approved' | 'Rejected'
  >('Semua');
  const [datePickerMode, setDatePickerMode] = useState<'start' | 'end' | null>(
    null,
  );

  const loadData = useCallback(
    async (currentPage = 1, isRefreshing = false) => {
      if (!pelangganId) return;
      if (currentPage === 1 && !isRefreshing) setLoading(true);

      try {
        const filters = {
          ...(startDate && {startDate: format(startDate, 'yyyy-MM-dd')}),
          ...(endDate && {endDate: format(endDate, 'yyyy-MM-dd')}),
          ...(statusFilter !== 'Semua' && {status: statusFilter}),
        };

        const response = await fetchWithdrawHistory(
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
        console.error('Error loading data:', error);
        Alert.alert('Error', 'Gagal memuat riwayat penarikan.');
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [pelangganId, startDate, endDate, statusFilter],
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setPage(1);
    loadData(1, true);
  }, [loadData]);

  const loadMore = () => {
    if (!loading && hasMore) {
      setPage(prev => {
        const newPage = prev + 1;
        loadData(newPage);
        return newPage;
      });
    }
  };

  const loadUserData = useCallback(async () => {
    try {
      const storedUser = await authService.getStoredUser();
      if (storedUser?.id) {
        setPelangganId(storedUser.id);
        const userDetail = await authService.getUserDetail(storedUser.id);
        if (userDetail) {
          setBalance(Number(userDetail.balance) || 0);
        }
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  }, []);

  const fetchCurrentBalance = useCallback(async () => {
    if (!pelangganId) return;

    try {
      const userDetail = await authService.getUserDetail(pelangganId);
      if (userDetail) {
        setBalance(Number(userDetail.balance) || 0);
      }
    } catch (error) {
      console.error('Error fetching current balance:', error);
    }
  }, [pelangganId]);

  useEffect(() => {
    const init = async () => {
      await loadUserData();
    };
    init();
  }, [loadUserData]);

  useFocusEffect(
    useCallback(() => {
      if (pelangganId) {
        loadData(1, true);
      }
    }, [pelangganId, loadData]),
  );

  const handleOpenWithdrawModal = async () => {
    try {
      await fetchCurrentBalance();
      setShowWithdrawModal(true);
    } catch (error) {
      console.error('Error preparing withdraw modal:', error);
      Alert.alert('Error', 'Gagal memuat data saldo terbaru');
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
    setShowFilterModal(false);
    setPage(1);
    loadData(1, true);
  };

  const handleSetMax = () => {
    setNominal(String(balance));
  };

  const handleSubmitWithdraw = async () => {
    if (!pelangganId || !nominal || isNaN(Number(nominal))) {
      Alert.alert('Kesalahan', 'Silakan masukkan jumlah yang valid');
      return;
    }

    if (Number(nominal) < 50000) {
      Alert.alert('Kesalahan', 'Jumlah penarikan minimal 50.000');
      return;
    }

    try {
      await fetchCurrentBalance();

      if (Number(nominal) > balance) {
        Alert.alert('Kesalahan', 'Saldo tidak mencukupi');
        return;
      }

      setSubmitting(true);
      const response = await createWithdraw(
        pelangganId,
        Number(nominal),
        format(new Date(), 'yyyy-MM-dd'),
      );

      Alert.alert('Berhasil', 'Permintaan penarikan berhasil dikirim');
      setShowWithdrawModal(false);
      setNominal('');
      setTanggalWd(new Date());

      await Promise.all([fetchCurrentBalance(), loadData(1, true)]);
    } catch (error: any) {
      console.error('Gagal submit penarikan:', error);
      Alert.alert(
        'Kesalahan',
        error.message || 'Terjadi kesalahan saat mengirim permintaan penarikan',
      );
    } finally {
      setSubmitting(false);
    }
  };

  const renderItem = ({item}: {item: WithdrawHistory}) => {
    const handleEdit = () => {
      navigation.navigate('WithdrawEdit', {withdrawData: item});
    };

    const handleDelete = () => {
      Alert.alert(
        'Konfirmasi Hapus',
        `Anda yakin ingin menghapus permintaan penarikan ini?`,
        [
          {text: 'Batal', style: 'cancel'},
          {
            text: 'Hapus',
            style: 'destructive',
            onPress: async () => {
              try {
                await deleteWithdraw(item.id);
                Alert.alert('Berhasil', 'Permintaan berhasil dihapus.');
                loadData(1, true);
              } catch (error: any) {
                Alert.alert('Error', error.message);
              }
            },
          },
        ],
      );
    };

    return (
      <View style={styles.historyItemContainer}>
        <View style={styles.historyItem}>
          <View
            style={[
              styles.historyIcon,
              item.status === 'Approved'
                ? styles.approvedIcon
                : item.status === 'Rejected'
                ? styles.rejectedIcon
                : styles.pendingIcon,
            ]}>
            <Icon
              name={
                item.status === 'Approved'
                  ? 'check-circle'
                  : item.status === 'Rejected'
                  ? 'cancel'
                  : 'pending'
              }
              size={FontSizes.xlarge}
              color={Colors.white}
            />
          </View>
          <View style={styles.historyContent}>
            <View style={styles.historyHeader}>
              <Text style={styles.historyAmount}>
                Rp{Number(item.nominal_wd).toLocaleString('id-ID')}
              </Text>
              <View
                style={[
                  styles.statusBadge,
                  item.status === 'Approved'
                    ? styles.approvedBadge
                    : item.status === 'Rejected'
                    ? styles.rejectedBadge
                    : styles.pendingBadge,
                ]}>
                <Text style={styles.statusBadgeText}>{item.status}</Text>
              </View>
            </View>
            <View style={styles.historyDetailRow}>
              <Icon name="calendar-today" size={14} color={Colors.gray} />
              <Text style={styles.historyDetailText}>
                Request: {format(new Date(item.tanggal_wd), 'dd MMM yyyy')}
              </Text>
            </View>
            <View style={styles.historyDetailRow}>
              <Icon name="access-time" size={14} color={Colors.gray} />
              <Text style={styles.historyDetailText}>
                Submitted:{' '}
                {format(new Date(item.created_at), 'dd MMM yyyy HH:mm')}
              </Text>
            </View>
          </View>
          <Icon
            name="chevron-right"
            size={FontSizes.xlarge}
            color={Colors.gray}
          />
        </View>
        {item.status === 'Pending' && (
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
        <View style={styles.headerTitleContainer}>
          <Icon
            name="account-balance-wallet"
            size={FontSizes.xlarge}
            color={Colors.white}
            style={styles.headerIcon}
          />
          <Text style={styles.headerTitle}>Riwayat Penarikan</Text>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity
            onPress={() => setShowFilterModal(true)}
            style={styles.headerButton}>
            <Icon
              name="filter-alt"
              size={FontSizes.xlarge}
              color={Colors.white}
            />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.balanceCard}>
        <View style={styles.balanceCardHeader}>
          <Icon
            name="account-balance"
            size={FontSizes.xlarge}
            color={Colors.white}
          />
          <Text style={styles.balanceCardTitle}>Saldo Anda</Text>
        </View>
        <Text style={styles.balanceAmount}>
          Rp{balance.toLocaleString('id-ID')}
        </Text>
        <TouchableOpacity
          style={styles.withdrawButton}
          onPress={handleOpenWithdrawModal}>
          <Icon name="send" size={18} color={Colors.white} />
          <Text style={styles.withdrawButtonText}>Ajukan Penarikan</Text>
        </TouchableOpacity>
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
              tintColor={Colors.primary}
            />
          }
          ListHeaderComponent={
            <View style={styles.listHeader}>
              <Text style={styles.listHeaderText}>Riwayat Transaksi</Text>
              <Text style={styles.listHeaderCount}>
                {total} transaksi ditemukan
              </Text>
            </View>
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Icon name="history" size={48} color={Colors.gray} />
              <Text style={styles.emptyText}>Tidak ada riwayat penarikan</Text>
            </View>
          }
          ListFooterComponent={renderFooter}
          onEndReached={loadMore}
          onEndReachedThreshold={0.5}
        />
      )}

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
                  Filter Riwayat
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
                    {(
                      ['Semua', 'Pending', 'Approved', 'Rejected'] as const
                    ).map(status => (
                      <TouchableOpacity
                        key={status}
                        style={[
                          styles.statusFilterButton,
                          statusFilter === status && styles.statusFilterActive,
                        ]}
                        onPress={() => setStatusFilter(status)}>
                        <Icon
                          name={
                            status === 'Approved'
                              ? 'check-circle'
                              : status === 'Rejected'
                              ? 'cancel'
                              : status === 'Pending'
                              ? 'pending'
                              : 'all-inclusive'
                          }
                          size={16}
                          color={
                            statusFilter === status
                              ? Colors.primary
                              : Colors.gray
                          }
                        />
                        <Text
                          style={
                            statusFilter === status
                              ? styles.statusFilterTextActive
                              : styles.statusFilterText
                          }>
                          {status}
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
            locale="id"
            onConfirm={date => {
              if (datePickerMode === 'start') {
                setStartDate(date);
              } else {
                setEndDate(date);
              }
              setDatePickerMode(null);
            }}
            onCancel={() => setDatePickerMode(null)}
          />
        )}
      </Modal>

      <Modal
        visible={showWithdrawModal}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setShowWithdrawModal(false)}>
        <TouchableWithoutFeedback onPress={() => Keyboard.dismiss()}>
          <View style={styles.modalOverlay}>
            <View style={styles.withdrawModalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>
                  <Icon
                    name="account-balance-wallet"
                    size={20}
                    color={Colors.primary}
                  />{' '}
                  Penarikan Saldo
                </Text>
                <TouchableOpacity onPress={() => setShowWithdrawModal(false)}>
                  <Icon
                    name="close"
                    size={FontSizes.xlarge}
                    color={Colors.gray}
                  />
                </TouchableOpacity>
              </View>

              <View style={styles.balanceInfo}>
                <View style={styles.balanceCardSmall}>
                  <View style={styles.balanceCardSmallHeader}>
                    <Icon
                      name="account-balance"
                      size={18}
                      color={Colors.white}
                    />
                    <Text style={styles.balanceCardSmallTitle}>
                      Saldo Tersedia
                    </Text>
                  </View>
                  <Text style={styles.balanceAmountSmall}>
                    Rp{balance.toLocaleString('id-ID')}
                  </Text>
                </View>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Jumlah Penarikan</Text>
                <View style={styles.amountInputContainer}>
                  <Text style={styles.currencySymbol}>Rp</Text>
                  <TextInput
                    style={styles.amountInput}
                    placeholder="Masukan nominal penarikan"
                    placeholderTextColor={Colors.gray}
                    keyboardType="numeric"
                    value={formatRupiah(nominal)}
                    onChangeText={text => setNominal(unformatRupiah(text))}
                  />
                  <TouchableOpacity
                    style={styles.maxButton}
                    onPress={handleSetMax}>
                    <Text style={styles.maxButtonText}>MAX</Text>
                  </TouchableOpacity>
                </View>
                <Text style={styles.minAmountText}>
                  Minimal penarikan: Rp50.000
                </Text>
              </View>

              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.cancelButton]}
                  onPress={() => setShowWithdrawModal(false)}>
                  <Icon name="close" size={18} color={Colors.dark} />
                  <Text style={styles.cancelButtonText}>Batal</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalButton, styles.submitButton]}
                  onPress={handleSubmitWithdraw}
                  disabled={submitting}>
                  {submitting ? (
                    <ActivityIndicator size="small" color={Colors.white} />
                  ) : (
                    <>
                      <Icon name="send" size={18} color={Colors.white} />
                      <Text style={styles.submitButtonText}>
                        Ajukan Penarikan
                      </Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
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
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  headerButton: {
    padding: 4,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerIcon: {
    marginRight: 8,
  },
  headerTitle: {
    color: Colors.white,
    fontSize: FontSizes.xlarge,
    fontFamily: FontFamily.semiBold,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  balanceCard: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    padding: 16,
    margin: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  balanceCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  balanceCardTitle: {
    color: Colors.white,
    fontSize: FontSizes.medium,
    fontFamily: FontFamily.medium,
    marginLeft: 8,
  },
  balanceAmount: {
    color: Colors.white,
    fontSize: 28,
    fontFamily: FontFamily.bold,
    marginVertical: 8,
  },
  withdrawButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.secondary,
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  withdrawButtonText: {
    color: Colors.white,
    fontFamily: FontFamily.semiBold,
    fontSize: FontSizes.medium,
    marginLeft: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    paddingBottom: 16,
  },
  listHeader: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
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
  historyItemContainer: {
    backgroundColor: Colors.white,
    marginHorizontal: 16,
    marginTop: 8,
    borderRadius: 12,
    elevation: 2,
  },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  historyIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  pendingIcon: {
    backgroundColor: Colors.warning,
  },
  approvedIcon: {
    backgroundColor: Colors.success,
  },
  rejectedIcon: {
    backgroundColor: Colors.danger,
  },
  historyContent: {
    flex: 1,
  },
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
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  pendingBadge: {
    backgroundColor: Colors.lightWarning,
  },
  approvedBadge: {
    backgroundColor: Colors.lightSuccess,
  },
  rejectedBadge: {
    backgroundColor: Colors.lightDanger,
  },
  statusBadgeText: {
    fontSize: FontSizes.small,
    fontFamily: FontFamily.semiBold,
  },
  historyDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  historyDetailText: {
    fontSize: FontSizes.small,
    fontFamily: FontFamily.regular,
    color: Colors.gray,
    marginLeft: 4,
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
  deleteButton: {},
  actionButtonText: {
    fontFamily: FontFamily.semiBold,
    fontSize: FontSizes.small,
    color: Colors.primary,
  },
  footer: {
    padding: 16,
    justifyContent: 'center',
    alignItems: 'center',
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
  withdrawModalContent: {
    width: '90%',
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: FontSizes.xlarge,
    fontFamily: FontFamily.semiBold,
    color: Colors.dark,
  },
  filterSection: {
    marginBottom: 20,
  },
  filterLabel: {
    fontSize: FontSizes.medium,
    fontFamily: FontFamily.medium,
    color: Colors.dark,
    marginBottom: 8,
  },
  statusFilterContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 8,
  },
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
  },
  statusFilterTextActive: {
    color: Colors.primary,
    fontFamily: FontFamily.semiBold,
    fontSize: FontSizes.small,
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  resetButton: {
    backgroundColor: Colors.lightGray,
  },
  resetButtonText: {
    color: Colors.dark,
    fontFamily: FontFamily.medium,
    fontSize: FontSizes.medium,
  },
  applyButton: {
    backgroundColor: Colors.primary,
  },
  applyButtonText: {
    color: Colors.white,
    fontFamily: FontFamily.medium,
    fontSize: FontSizes.medium,
  },
  balanceInfo: {
    marginBottom: 20,
  },
  balanceCardSmall: {
    backgroundColor: Colors.primary,
    borderRadius: 8,
    padding: 12,
  },
  balanceCardSmallHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  balanceCardSmallTitle: {
    color: Colors.white,
    fontSize: FontSizes.small,
    fontFamily: FontFamily.medium,
    marginLeft: 8,
  },
  balanceAmountSmall: {
    color: Colors.white,
    fontSize: FontSizes.xlarge,
    fontFamily: FontFamily.bold,
    marginTop: 4,
  },
  formGroup: {
    marginBottom: 20,
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
    fontSize: FontSizes.medium,
    color: Colors.dark,
    fontFamily: FontFamily.semiBold,
  },
  amountInput: {
    flex: 1,
    height: 48,
    fontSize: FontSizes.medium,
    color: Colors.dark,
    fontFamily: FontFamily.regular,
    paddingHorizontal: 8,
  },
  maxButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
  },
  maxButtonText: {
    color: Colors.white,
    fontFamily: FontFamily.semiBold,
    fontSize: FontSizes.small,
  },
  minAmountText: {
    fontSize: FontSizes.small,
    color: Colors.gray,
    fontFamily: FontFamily.regular,
    marginTop: 4,
  },
  cancelButton: {
    backgroundColor: Colors.lightGray,
  },
  cancelButtonText: {
    color: Colors.dark,
    fontFamily: FontFamily.medium,
    fontSize: FontSizes.medium,
  },
  submitButton: {
    backgroundColor: Colors.primary,
  },
  submitButtonText: {
    color: Colors.white,
    fontFamily: FontFamily.medium,
    fontSize: FontSizes.medium,
  },
});

export default WithdrawScreen;
