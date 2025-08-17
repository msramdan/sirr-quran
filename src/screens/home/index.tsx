import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Text,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import Header from '../../components/Header';
import BannerSlider from '../../components/BannerSlider';
import Icon from 'react-native-vector-icons/MaterialIcons';
import authService from '../../services/auth';
import { SafeAreaView } from 'react-native-safe-area-context';
import { searchTagihan } from '../../services/tagihan';

const HomeScreen = ({ navigation }: any) => {
  const [balance, setBalance] = useState('0');
  const [referralCode, setReferralCode] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [storedUser, setStoredUser] = useState<any>(null);

  const loadUserData = useCallback(async () => {
    try {
      const user = await authService.getStoredUser();
      setStoredUser(user);
      
      if (user?.id) {
        const userDetail = await authService.getUserDetail(user.id);
        if (userDetail) {
          setBalance(userDetail.balance || '0');
          setReferralCode(userDetail.no_layanan || 'N/A');
        }
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const handleSearch = async (query: string) => {
    if (!storedUser?.id || query.length < 3) {
      setSearchResults([]);
      return;
    }

    setSearchLoading(true);
    try {
      const response = await searchTagihan(storedUser.id, query);
      if (response.success) {
        setSearchResults(response.data);
      } else {
        setSearchResults([]);
      }
    } catch (error) {
      console.error('Search error:', error);
      setSearchResults([]);
    } finally {
      setSearchLoading(false);
    }
  };

  const handleItemSelect = (item: any) => {
    navigation.navigate('TagihanDetail', { tagihanId: item.id });
    setSearchResults([]);
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadUserData();
  }, [loadUserData]);

  useEffect(() => {
    loadUserData();
  }, [loadUserData]);

  return (
    <SafeAreaView style={styles.container}>
      <Header
        showSearchBar={true}
        onSearch={handleSearch}
        onItemSelect={handleItemSelect}
        searchResults={searchResults}
        loading={searchLoading}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[Colors.primary]}
          />
        }>
        <View style={styles.content}>
          <BannerSlider refreshing={refreshing} />

          {!loading && (
            <View style={styles.splitCardContainer}>
              <View style={[styles.splitCard, styles.leftCard]}>
                <Text style={styles.cardTitle}>Saldo Anda</Text>
                <Text style={styles.balance}>
                  Rp{Number(balance).toLocaleString('id-ID')}
                </Text>
                <TouchableOpacity
                  style={styles.detailButton}
                  onPress={() => navigation.navigate('HistoryBalance')}>
                  <Text style={styles.detailText}>Detail</Text>
                  <Icon name="chevron-right" size={14} color={Colors.primary} />
                </TouchableOpacity>
              </View>

              <View style={[styles.splitCard, styles.rightCard]}>
                <Text style={styles.cardTitle}>Kode Referral</Text>
                <Text style={styles.referralCode}>{referralCode}</Text>
                <TouchableOpacity style={styles.copyButton}>
                  <Text style={styles.copyText}>Salin</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

        {/* Menu Utama */}
        <View style={styles.menuContainer}>
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => navigation.navigate('Tagihan')}>
            <View style={styles.menuIcon}>
              <Icon name="receipt" size={28} color={Colors.primary} />
            </View>
            <Text style={styles.menuText}>Tagihan</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => navigation.navigate('Topup')}>
            <View style={styles.menuIcon}>
              <Icon
                name="account-balance-wallet"
                size={28}
                color={Colors.primary}
              />
            </View>
            <Text style={styles.menuText}>Topup Saldo</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => navigation.navigate('Withdraw')}>
            <View style={styles.menuIcon}>
              <Icon name="money-off" size={28} color={Colors.primary} />
            </View>
            <Text style={styles.menuText}>Withdraw</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => navigation.navigate('Tiket')}>
            <View style={styles.menuIcon}>
              <Icon name="support-agent" size={28} color={Colors.primary} />
            </View>
            <Text style={styles.menuText}>Tiket Aduan</Text>
          </TouchableOpacity>
        </View>
         </View>
      </ScrollView>
    </SafeAreaView>
  );
};

// Styles tetap sama
const Colors = {
  primary: '#3a7bd5',
  white: '#ffffff',
  dark: '#333333',
  gray: '#888888',
  lightGray: '#f0f0f0',
  cardBorder: '#e0e0e0',
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollView: {
    flex: 1,
    zIndex: 1, // Lower than search results
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 80,
  },
  splitCardContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  splitCard: {
    backgroundColor: Colors.white,
    borderRadius: 8,
    padding: 12,
    width: '48%',
    elevation: 1,
  },
  leftCard: {
    borderRightWidth: 0.5,
    borderRightColor: Colors.cardBorder,
  },
  rightCard: {
    borderLeftWidth: 0.5,
    borderLeftColor: Colors.cardBorder,
  },
  cardTitle: {
    fontSize: 12,
    color: Colors.gray,
    marginBottom: 4,
  },
  balance: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.dark,
    marginVertical: 4,
  },
  referralCode: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.dark,
    marginVertical: 4,
  },
  detailButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  detailText: {
    fontSize: 11,
    color: Colors.primary,
    marginRight: 2,
  },
  copyButton: {
    backgroundColor: Colors.lightGray,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  copyText: {
    fontSize: 11,
    color: Colors.primary,
  },
  menuContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: 8,
    marginBottom: 24,
  },
  menuItem: {
    alignItems: 'center',
    width: '30%',
    marginBottom: 20,
  },
  menuIcon: {
    backgroundColor: Colors.lightGray,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  menuText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.dark,
    textAlign: 'center',
  },
});

export default HomeScreen;
