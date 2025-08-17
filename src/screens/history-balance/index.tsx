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
    ScrollView,
    Animated,
    Easing
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { format } from 'date-fns';
import balanceService, { BalanceHistory } from '../../services/balance';
import { Colors, FontSizes, FontFamily } from '../../utils/constants';
import DatePicker from 'react-native-date-picker';

const HistoryBalanceScreen = ({ navigation }: any) => {
    const [data, setData] = useState<BalanceHistory[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);
    const [hasMore, setHasMore] = useState(true);
    const [showFilterModal, setShowFilterModal] = useState(false);

    // Animation values
    const fadeAnim = useState(new Animated.Value(0))[0];
    const scaleValue = useState(new Animated.Value(0.95))[0];

    // Filter states
    const [startDate, setStartDate] = useState<Date | null>(null);
    const [endDate, setEndDate] = useState<Date | null>(null);
    const [typeFilter, setTypeFilter] = useState<'Penambahan' | 'Pengurangan' | 'All'>('All');
    const [datePickerMode, setDatePickerMode] = useState<'start' | 'end' | null>(null);

    useEffect(() => {
        Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
        }).start();
    }, []);

    const animatePressIn = () => {
        Animated.spring(scaleValue, {
            toValue: 0.98,
            friction: 3,
            useNativeDriver: true,
        }).start();
    };

    const animatePressOut = () => {
        Animated.spring(scaleValue, {
            toValue: 1,
            friction: 3,
            useNativeDriver: true,
        }).start();
    };

    const loadData = useCallback(async (currentPage = 1, isRefreshing = false) => {
        try {
            if (currentPage === 1 || isRefreshing) {
                setLoading(true);
            }

            const filters = {
                ...(startDate && { startDate: format(startDate, 'yyyy-MM-dd') }),
                ...(endDate && { endDate: format(endDate, 'yyyy-MM-dd') }),
                ...(typeFilter !== 'All' && { type: typeFilter }),
            };

            const response = await balanceService.getBalanceHistory(currentPage, 10, filters);

            if (response?.success) {
                if (currentPage === 1 || isRefreshing) {
                    setData(response.data.data);
                } else {
                    setData(prev => [...prev, ...response.data.data]);
                }
                setTotal(response.data.total);
                setHasMore(response.data.data.length >= 10);
            }
        } catch (error) {
            console.error('Error loading data:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [startDate, endDate, typeFilter]);

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

    useEffect(() => {
        loadData();
    }, [loadData]);

    const applyFilters = () => {
        setShowFilterModal(false);
        setPage(1);
        loadData(1, true);
    };

    const resetFilters = () => {
        setStartDate(null);
        setEndDate(null);
        setTypeFilter('All');
        setShowFilterModal(false);
        setPage(1);
        loadData(1, true);
    };

    const renderItem = ({ item, index }: { item: BalanceHistory, index: number }) => {
        const translateY = new Animated.Value(50);
        const opacity = new Animated.Value(0);

        Animated.parallel([
            Animated.timing(translateY, {
                toValue: 0,
                duration: 500,
                delay: index * 50,
                easing: Easing.out(Easing.cubic),
                useNativeDriver: true,
            }),
            Animated.timing(opacity, {
                toValue: 1,
                duration: 500,
                delay: index * 50,
                useNativeDriver: true,
            })
        ]).start();

        return (
            <Animated.View
                style={[
                    styles.historyItem,
                    {
                        transform: [{ translateY }],
                        opacity
                    }
                ]}
            >
                <View style={[
                    styles.historyIcon,
                    item.type === 'Penambahan' ? styles.incomeIcon : styles.outcomeIcon
                ]}>
                    <Icon
                        name={item.type === 'Penambahan' ? 'arrow-upward' : 'arrow-downward'}
                        size={FontSizes.xlarge}
                        color={Colors.white}
                    />
                </View>
                <View style={styles.historyContent}>
                    <Text style={styles.historyType}>
                        {item.type} - Rp{Number(item.amount).toLocaleString('id-ID')}
                    </Text>
                    <Text
                        style={styles.historyDesc}
                        numberOfLines={2}
                        ellipsizeMode="tail"
                    >
                        {item.description}
                    </Text>
                    <Text style={styles.historyDate}>
                        {format(new Date(item.created_at), 'dd MMM yyyy HH:mm')}
                    </Text>
                </View>
                <View style={styles.historyBalance}>
                    <Text style={styles.balanceAfter}>Rp{Number(item.balance_after).toLocaleString('id-ID')}</Text>
                </View>
            </Animated.View>
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
        <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerButton}>
                    <Icon name="arrow-back" size={FontSizes.xlarge} color={Colors.white} />
                </TouchableOpacity>
                <View style={styles.headerTitleContainer}>
                    <Icon name="account-balance" size={FontSizes.xlarge} color={Colors.white} style={styles.headerIcon} />
                    <Text style={styles.headerTitle}>Riwayat Saldo</Text>
                </View>
                <TouchableOpacity
                    onPress={() => setShowFilterModal(true)}
                    style={styles.headerButton}
                    activeOpacity={0.7}
                >
                    <Icon name="filter-alt" size={FontSizes.xlarge} color={Colors.white} />
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
                    keyExtractor={(item) => item.id.toString()}
                    contentContainerStyle={styles.listContent}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={onRefresh}
                            colors={[Colors.primary]}
                            tintColor={Colors.primary}
                            progressBackgroundColor={Colors.white}
                        />
                    }
                    ListHeaderComponent={
                        <View style={styles.listHeader}>
                            <Text style={styles.listHeaderText}>Riwayat Transaksi</Text>
                            <Text style={styles.listHeaderCount}>{total} transaksi ditemukan</Text>
                        </View>
                    }
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Icon name="history" size={48} color={Colors.gray} />
                            <Text style={styles.emptyText}>Tidak ada riwayat saldo</Text>
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
                        <Animated.View
                            style={[
                                styles.modalContent,
                                {
                                    transform: [{ scale: scaleValue }],
                                }
                            ]}
                        >
                            <View style={styles.modalHeader}>
                                <Text style={styles.modalTitle}>
                                    <Icon name="filter-alt" size={20} color={Colors.primary} /> Filter Riwayat
                                </Text>
                                <TouchableOpacity
                                    onPress={() => setShowFilterModal(false)}
                                    activeOpacity={0.7}
                                >
                                    <Icon name="close" size={FontSizes.xlarge} color={Colors.gray} />
                                </TouchableOpacity>
                            </View>

                            <ScrollView>
                                <View style={styles.filterSection}>
                                    <Text style={styles.filterLabel}>
                                        Jenis Transaksi
                                    </Text>
                                    <View style={styles.typeFilterContainer}>
                                        <TouchableOpacity
                                            style={[
                                                styles.typeFilterButton,
                                                typeFilter === 'All' && styles.typeFilterActive
                                            ]}
                                            onPress={() => setTypeFilter('All')}
                                            activeOpacity={0.7}
                                        >
                                            <Icon
                                                name="all-inclusive"
                                                size={16}
                                                color={typeFilter === 'All' ? Colors.primary : Colors.gray}
                                            />
                                            <Text style={typeFilter === 'All' ? styles.typeFilterTextActive : styles.typeFilterText}>
                                                Semua
                                            </Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                            style={[
                                                styles.typeFilterButton,
                                                typeFilter === 'Penambahan' && styles.typeFilterActive
                                            ]}
                                            onPress={() => setTypeFilter('Penambahan')}
                                            activeOpacity={0.7}
                                        >
                                            <Icon
                                                name="arrow-upward"
                                                size={16}
                                                color={typeFilter === 'Penambahan' ? Colors.primary : Colors.gray}
                                            />
                                            <Text style={typeFilter === 'Penambahan' ? styles.typeFilterTextActive : styles.typeFilterText}>
                                                Penambahan
                                            </Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                            style={[
                                                styles.typeFilterButton,
                                                typeFilter === 'Pengurangan' && styles.typeFilterActive
                                            ]}
                                            onPress={() => setTypeFilter('Pengurangan')}
                                            activeOpacity={0.7}
                                        >
                                            <Icon
                                                name="arrow-downward"
                                                size={16}
                                                color={typeFilter === 'Pengurangan' ? Colors.primary : Colors.gray}
                                            />
                                            <Text style={typeFilter === 'Pengurangan' ? styles.typeFilterTextActive : styles.typeFilterText}>
                                                Pengurangan
                                            </Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>

                                <View style={styles.filterSection}>
                                    <Text style={styles.filterLabel}>
                                        Tanggal Mulai
                                    </Text>
                                    <TouchableOpacity
                                        style={styles.dateInput}
                                        onPress={() => setDatePickerMode('start')}
                                        activeOpacity={0.7}
                                        onPressIn={animatePressIn}
                                        onPressOut={animatePressOut}
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
                                        Tanggal Akhir
                                    </Text>
                                    <TouchableOpacity
                                        style={styles.dateInput}
                                        onPress={() => setDatePickerMode('end')}
                                        activeOpacity={0.7}
                                        onPressIn={animatePressIn}
                                        onPressOut={animatePressOut}
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
                                    activeOpacity={0.7}
                                >
                                    <Icon name="refresh" size={18} color={Colors.dark} />
                                    <Text style={styles.resetButtonText}>Reset</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[styles.modalButton, styles.applyButton]}
                                    onPress={applyFilters}
                                    activeOpacity={0.7}
                                >
                                    <Icon name="check" size={18} color={Colors.white} />
                                    <Text style={styles.applyButtonText}>Terapkan</Text>
                                </TouchableOpacity>
                            </View>
                        </Animated.View>
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
        shadowOpacity: 0.2,
        shadowRadius: 8,
    },
    headerButton: {
        padding: 4,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.1)',
    },
    headerTitleContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerIcon: {
        marginRight: 12,
    },
    headerTitle: {
        color: Colors.white,
        fontSize: FontSizes.xlarge,
        fontFamily: FontFamily.semiBold,
        letterSpacing: 0.5,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: Colors.white,
    },
    listContent: {
        paddingBottom: 24,
    },
    listHeader: {
        paddingHorizontal: 24,
        paddingTop: 24,
        paddingBottom: 12,
        backgroundColor: Colors.white,
        borderBottomWidth: 1,
        borderBottomColor: Colors.borderGray,
        marginBottom: 8,
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
        padding: 16,
        backgroundColor: Colors.white,
        marginHorizontal: 16,
        marginVertical: 6,
        borderRadius: 12,
        elevation: 2,
        shadowColor: Colors.shadowGray,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 6,
        alignItems: 'center',
    },
    historyIcon: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
        elevation: 2,
        shadowColor: Colors.dark,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
    },
    incomeIcon: {
        backgroundColor: Colors.primary,
    },
    outcomeIcon: {
        backgroundColor: Colors.danger,
    },
    historyContent: {
        flex: 1,
    },
    historyType: {
        fontSize: FontSizes.medium,
        fontFamily: FontFamily.semiBold,
        color: Colors.dark,
        marginBottom: 4,
    },
    historyDesc: {
        fontSize: FontSizes.small,
        fontFamily: FontFamily.regular,
        color: Colors.gray,
        marginBottom: 4,
        lineHeight: 18,
    },
    historyDate: {
        fontSize: FontSizes.small - 2,
        fontFamily: FontFamily.regular,
        color: Colors.lightGray,
    },
    historyBalance: {
        alignItems: 'flex-end',
        minWidth: 100,
    },
    balanceAfter: {
        fontSize: FontSizes.medium,
        fontFamily: FontFamily.semiBold,
        color: Colors.dark,
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
        borderRadius: 16,
        padding: 24,
        elevation: 8,
        shadowColor: Colors.dark,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24,
        paddingBottom: 12,
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
    filterSection: {
        marginBottom: 24,
    },
    filterLabel: {
        fontSize: FontSizes.medium,
        fontFamily: FontFamily.medium,
        color: Colors.dark,
        marginBottom: 12,
        flexDirection: 'row',
        alignItems: 'center',
    },
    typeFilterContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        gap: 12,
    },
    typeFilterButton: {
        flex: 1,
        minWidth: '48%',
        padding: 14,
        borderWidth: 1,
        borderColor: Colors.borderGray,
        borderRadius: 10,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
    },
    typeFilterActive: {
        borderColor: Colors.primary,
        backgroundColor: Colors.lightPrimary,
    },
    typeFilterText: {
        color: Colors.dark,
        fontFamily: FontFamily.regular,
        fontSize: FontSizes.small,
    },
    typeFilterTextActive: {
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
        borderRadius: 10,
        padding: 16,
        gap: 12,
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
        marginTop: 16,
        gap: 16,
    },
    modalButton: {
        flex: 1,
        padding: 16,
        borderRadius: 10,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        elevation: 2,
        shadowColor: Colors.shadowGray,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
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

export default HistoryBalanceScreen;