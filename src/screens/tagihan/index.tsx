import React, { useState, useEffect, useCallback } from 'react';
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
  ScrollView
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { format } from 'date-fns';
import { Colors, FontSizes, FontFamily } from '../../utils/constants';
import DatePicker from 'react-native-date-picker';
import { fetchTagihanHistory, TagihanHistory } from '../../services/tagihan';
import authService from '../../services/auth';


const TagihanScreen = ({ navigation }: any) => {
  const [data, setData] = useState<TagihanHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [pelangganId, setPelangganId] = useState<number | null>(null);

  // Filter states
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [statusFilter, setStatusFilter] = useState<'Semua' | 'Sudah Bayar' | 'Belum Bayar' | 'Waiting Review'>('Semua');
  const [paymentMethodFilter, setPaymentMethodFilter] = useState<'Semua' | 'Cash' | 'Transfer Bank' | 'Payment Tripay'>('Semua');
  const [datePickerMode, setDatePickerMode] = useState<'start' | 'end' | null>(null);

  const loadData = useCallback(async (currentPage = 1, isRefreshing = false) => {
    try {
      if (!pelangganId) return;

      if (currentPage === 1 || isRefreshing) {
        setLoading(true);
      }

      const filters = {
        ...(startDate && { startDate: format(startDate, 'yyyy-MM-dd') }),
        ...(endDate && { endDate: format(endDate, 'yyyy-MM-dd') }),
        ...(statusFilter !== 'Semua' && { status: statusFilter }),
        ...(paymentMethodFilter !== 'Semua' && { metode_bayar: paymentMethodFilter }),
      };

      const response = await fetchTagihanHistory(pelangganId, currentPage, 10, filters);

      if (response) {
        if (currentPage === 1 || isRefreshing) {
          setData(response.data);
        } else {
          setData(prev => [...prev, ...response.data]);
        }
        setTotal(response.total);
        setHasMore(response.data.length >= 10);
      }
    } catch (error) {
      console.error('Error loading data:', error);
      Alert.alert('Error', 'Gagal memuat data tagihan');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [pelangganId, startDate, endDate, statusFilter, paymentMethodFilter]);

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
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  }, []);

  useEffect(() => {
    loadUserData();
  }, [loadUserData]);

  useEffect(() => {
    if (pelangganId) {
      loadData();
    }
  }, [pelangganId, loadData]);

  const applyFilters = () => {
    setShowFilterModal(false);
    setPage(1);
    loadData(1, true);
  };

  const resetFilters = () => {
    setStartDate(null);
    setEndDate(null);
    setStatusFilter('Semua');
    setPaymentMethodFilter('Semua');
    setShowFilterModal(false);
    setPage(1);
    loadData(1, true);
  };

  const renderItem = ({ item }: { item: TagihanHistory }) => (
    <TouchableOpacity
      onPress={() => navigation.navigate('TagihanDetail', { tagihanId: item.id })}
    >
      <View style={styles.historyItem}>
        <View style={[
          styles.historyIcon,
          item.status_bayar === 'Sudah Bayar' ? styles.paidIcon :
            item.status_bayar === 'Waiting Review' ? styles.pendingIcon : styles.unpaidIcon
        ]}>
          <Icon
            name={item.status_bayar === 'Sudah Bayar' ? 'check-circle' :
              item.status_bayar === 'Waiting Review' ? 'pending' : 'error'}
            size={FontSizes.xlarge}
            color={Colors.white}
          />
        </View>
        <View style={styles.historyContent}>
          <View style={styles.historyHeader}>
            <Text style={styles.historyAmount}>
              Rp{Number(item.total_bayar).toLocaleString('id-ID')}
            </Text>
            <View style={[
              styles.statusBadge,
              item.status_bayar === 'Sudah Bayar' ? styles.paidBadge :
                item.status_bayar === 'Waiting Review' ? styles.pendingBadge : styles.unpaidBadge
            ]}>
              <Text style={styles.statusBadgeText}>{item.status_bayar}</Text>
            </View>
          </View>
          <View style={styles.historyDetailRow}>
            <Icon name="receipt" size={14} color={Colors.gray} />
            <Text style={styles.historyDetailText}>
              No: {item.no_tagihan}
            </Text>
          </View>
          <View style={styles.historyDetailRow}>
            <Icon name="calendar-today" size={14} color={Colors.gray} />
            <Text style={styles.historyDetailText}>
              Periode: {item.periode}
            </Text>
          </View>
          {item.metode_bayar && (
            <View style={styles.historyDetailRow}>
              <Icon name="payment" size={14} color={Colors.gray} />
              <Text style={styles.historyDetailText}>
                Metode: {item.metode_bayar}
              </Text>
            </View>
          )}
          {item.tanggal_bayar && (
            <View style={styles.historyDetailRow}>
              <Icon name="access-time" size={14} color={Colors.gray} />
              <Text style={styles.historyDetailText}>
                Dibayar: {format(new Date(item.tanggal_bayar), 'dd MMM yyyy HH:mm')}
              </Text>
            </View>
          )}
        </View>
        <Icon name="chevron-right" size={FontSizes.xlarge} color={Colors.gray} />
      </View>
    </TouchableOpacity >
  );

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
      {/* Header with gradient background */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerButton}>
          <Icon name="arrow-back" size={FontSizes.xlarge} color={Colors.white} />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Icon name="receipt" size={FontSizes.xlarge} color={Colors.white} style={styles.headerIcon} />
          <Text style={styles.headerTitle}>Riwayat Tagihan</Text>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity onPress={() => setShowFilterModal(true)} style={styles.headerButton}>
            <Icon name="filter-alt" size={FontSizes.xlarge} color={Colors.white} />
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
          keyExtractor={(item) => item.id.toString()}
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
              <Text style={styles.listHeaderText}>Daftar Tagihan</Text>
              <Text style={styles.listHeaderCount}>{total} tagihan ditemukan</Text>
            </View>
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Icon name="receipt" size={48} color={Colors.gray} />
              <Text style={styles.emptyText}>Tidak ada riwayat tagihan</Text>
            </View>
          }
          ListFooterComponent={renderFooter}
          onEndReached={loadMore}
          onEndReachedThreshold={0.5}
        />
      )}

      {/* Filter Modal */}
      <Modal
        visible={showFilterModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowFilterModal(false)}
      >
        <TouchableWithoutFeedback onPress={() => Keyboard.dismiss()}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>
                  <Icon name="filter-alt" size={20} color={Colors.primary} /> Filter Tagihan
                </Text>
                <TouchableOpacity onPress={() => setShowFilterModal(false)}>
                  <Icon name="close" size={FontSizes.xlarge} color={Colors.gray} />
                </TouchableOpacity>
              </View>

              <ScrollView>
                <View style={styles.filterSection}>
                  <Text style={styles.filterLabel}>
                    Status Pembayaran
                  </Text>
                  <View style={styles.statusFilterContainer}>
                    {(['Semua', 'Sudah Bayar', 'Belum Bayar', 'Waiting Review'] as const).map((status) => (
                      <TouchableOpacity
                        key={status}
                        style={[
                          styles.statusFilterButton,
                          statusFilter === status && styles.statusFilterActive
                        ]}
                        onPress={() => setStatusFilter(status)}
                      >
                        <Icon
                          name={
                            status === 'Sudah Bayar' ? 'check-circle' :
                              status === 'Waiting Review' ? 'pending' :
                                status === 'Belum Bayar' ? 'error' : 'all-inclusive'
                          }
                          size={16}
                          color={statusFilter === status ? Colors.primary : Colors.gray}
                        />
                        <Text style={statusFilter === status ? styles.statusFilterTextActive : styles.statusFilterText}>
                          {status}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                <View style={styles.filterSection}>
                  <Text style={styles.filterLabel}>
                    Metode Pembayaran
                  </Text>
                  <View style={styles.statusFilterContainer}>
                    {(['Semua', 'Cash', 'Transfer Bank', 'Payment Tripay'] as const).map((method) => (
                      <TouchableOpacity
                        key={method}
                        style={[
                          styles.statusFilterButton,
                          paymentMethodFilter === method && styles.statusFilterActive
                        ]}
                        onPress={() => setPaymentMethodFilter(method)}
                      >
                        <Icon
                          name={
                            method === 'Cash' ? 'money' :
                              method === 'Transfer Bank' ? 'account-balance' :
                                method === 'Payment Tripay' ? 'payment' : 'all-inclusive'
                          }
                          size={16}
                          color={paymentMethodFilter === method ? Colors.primary : Colors.gray}
                        />
                        <Text style={paymentMethodFilter === method ? styles.statusFilterTextActive : styles.statusFilterText}>
                          {method}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                <View style={styles.filterSection}>
                  <Text style={styles.filterLabel}>
                    Tanggal Mulai
                  </Text>
                  <TouchableOpacity
                    style={styles.dateInput}
                    onPress={() => setDatePickerMode('start')}
                  >
                    <Icon name="calendar-today" size={18} color={Colors.primary} />
                    <Text style={styles.dateInputText}>
                      {startDate ? format(startDate, 'dd MMM yyyy') : 'Pilih tanggal'}
                    </Text>
                    <Icon name="keyboard-arrow-down" size={20} color={Colors.gray} />
                  </TouchableOpacity>
                </View>

                <View style={styles.filterSection}>
                  <Text style={styles.filterLabel}>
                    Tanggal Selesai
                  </Text>
                  <TouchableOpacity
                    style={styles.dateInput}
                    onPress={() => setDatePickerMode('end')}
                  >
                    <Icon name="calendar-today" size={18} color={Colors.primary} />
                    <Text style={styles.dateInputText}>
                      {endDate ? format(endDate, 'dd MMM yyyy') : 'Pilih tanggal'}
                    </Text>
                    <Icon name="keyboard-arrow-down" size={20} color={Colors.gray} />
                  </TouchableOpacity>
                </View>
              </ScrollView>

              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.resetButton]}
                  onPress={resetFilters}
                >
                  <Icon name="refresh" size={18} color={Colors.dark} />
                  <Text style={styles.resetButtonText}>Reset</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalButton, styles.applyButton]}
                  onPress={applyFilters}
                >
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
            date={datePickerMode === 'start' ? (startDate || new Date()) : (endDate || new Date())}
            mode="date"
            locale="id"
            onConfirm={(date) => {
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
    shadowOffset: { width: 0, height: 2 },
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
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: Colors.white,
    marginHorizontal: 16,
    marginTop: 8,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  historyIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  paidIcon: {
    backgroundColor: Colors.success,
  },
  pendingIcon: {
    backgroundColor: Colors.warning,
  },
  unpaidIcon: {
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
  paidBadge: {
    backgroundColor: Colors.lightSuccess,
  },
  pendingBadge: {
    backgroundColor: Colors.lightWarning,
  },
  unpaidBadge: {
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
    flexDirection: 'row',
    alignItems: 'center',
  },
  filterSection: {
    marginBottom: 20,
  },
  filterLabel: {
    fontSize: FontSizes.medium,
    fontFamily: FontFamily.medium,
    color: Colors.dark,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
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
});

export default TagihanScreen;