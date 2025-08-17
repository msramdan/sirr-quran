/**
 * Enhanced Profile Screen with Modern UI
 */
import React, { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Text,
  ActivityIndicator,
  TouchableOpacity,
  RefreshControl,
  Animated,
  Easing,
} from 'react-native';
import Header from '../../components/Header';
import authService from '../../services/auth';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { Colors, FontSizes, FontFamily } from '../../utils/constants';

const ProfileScreen = ({ navigation }: any) => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [scaleValue] = useState(new Animated.Value(1));

  const animateButton = () => {
    Animated.sequence([
      Animated.timing(scaleValue, {
        toValue: 0.95,
        duration: 100,
        easing: Easing.ease,
        useNativeDriver: true,
      }),
      Animated.timing(scaleValue, {
        toValue: 1,
        duration: 100,
        easing: Easing.ease,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const loadProfile = async () => {
    try {
      const storedUser = await authService.getStoredUser();
      if (storedUser?.id) {
        const userDetail = await authService.getUserDetail(storedUser.id);
        setUser(userDetail);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  const handleEdit = () => {
    animateButton();
    navigation.navigate('EditProfile', {
      user,
      onSave: () => {
        loadProfile();
      }
    });
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadProfile();
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.container}>
        <Header showSearchBar={false} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      </View>
    );
  }

  if (!user) {
    return (
      <View style={styles.container}>
        <Header showSearchBar={false} />
        <View style={styles.errorContainer}>
          <Icon name="error-outline" size={48} color={Colors.danger} style={styles.errorIcon} />
          <Text style={styles.errorText}>Gagal memuat data profil</Text>
          <TouchableOpacity
            style={styles.refreshButton}
            onPress={loadProfile}
            activeOpacity={0.7}
          >
            <Text style={styles.refreshText}>Coba Lagi</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Header showSearchBar={false} />

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: 80 }]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[Colors.primary]}
            tintColor={Colors.primary}
            progressBackgroundColor={Colors.white}
          />
        }
      >
        {/* Profile Header with Animation */}
        <Animated.View style={[styles.profileHeader, styles.headerShadow]}>
          <View style={styles.avatarContainer}>
            <Icon
              name="account-circle"
              size={100}
              color={Colors.primary}
              style={styles.avatarShadow}
            />
          </View>
          <Text style={styles.userName}>{user.nama}</Text>
          <Text style={styles.userNumber}>No. Layanan: {user.no_layanan}</Text>

          <View style={styles.statusContainer}>
            <View style={[
              styles.statusBadge,
              user.status_berlangganan === 'Aktif' ? styles.activeBadge : styles.inactiveBadge
            ]}>
              <Text style={styles.statusText}>
                {user.status_berlangganan}
              </Text>
            </View>
          </View>

          <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
            <TouchableOpacity
              style={styles.editButton}
              onPress={handleEdit}
              activeOpacity={0.7}
            >
              <Icon name="edit" size={18} color={Colors.white} />
              <Text style={styles.editButtonText}> Edit Profile</Text>
            </TouchableOpacity>
          </Animated.View>
        </Animated.View>

        {/* Profile Info Card */}
        <Animated.View
          style={[styles.card, styles.cardShadow]}
        >
          <View style={styles.sectionHeader}>
            <Icon name="person-outline" size={FontSizes.xlarge} color={Colors.primary} />
            <Text style={styles.sectionTitle}>Informasi Pribadi</Text>
          </View>

          <InfoRow icon="email" label="Email" value={user.email} />
          <InfoRow icon="phone" label="Nomor WhatsApp" value={user.no_wa} />
          <InfoRow icon="person" label="No. KTP" value={user.no_ktp || '-'} />
          <InfoRow icon="home" label="Alamat" value={user.alamat} />
        </Animated.View>

        {/* Service Info Card */}
        <Animated.View
          style={[styles.card, styles.cardShadow]}
        >
          <View style={styles.sectionHeader}>
            <Icon name="wifi" size={FontSizes.xlarge} color={Colors.primary} />
            <Text style={styles.sectionTitle}>Informasi Layanan</Text>
          </View>

          <InfoRow icon="network-wifi" label="Paket Layanan" value={user.nama_layanan} />
          <InfoRow
            icon="attach-money"
            label="Harga"
            value={`Rp ${user.harga?.toLocaleString('id-ID')}/bulan`}
          />
          <InfoRow icon="calendar-today" label="Tanggal Daftar" value={user.tanggal_daftar} />
        </Animated.View>

        {/* Technical Info Card */}
        <Animated.View
          style={[styles.card, styles.cardShadow]}
        >
          <View style={styles.sectionHeader}>
            <Icon name="settings" size={FontSizes.xlarge} color={Colors.primary} />
            <Text style={styles.sectionTitle}>Informasi Teknis</Text>
          </View>

          <InfoRow icon="settings" label="Mode Koneksi" value={user.mode_user} />
          {user.mode_user === 'PPOE' && (
            <InfoRow icon="account-circle" label="Username PPPoE" value={user.user_pppoe} />
          )}
          <InfoRow
            icon="location-on"
            label="Area"
            value={`${user.nama_area} (${user.kode_area})`}
          />
        </Animated.View>
      </ScrollView>
    </View>
  );
};

// Reusable InfoRow Component
const InfoRow = ({ icon, label, value }: { icon: string, label: string, value: string }) => (
  <View style={styles.infoItem}>
    <View style={styles.infoIconContainer}>
      <Icon name={icon} size={20} color={Colors.gray} />
    </View>
    <View style={styles.infoContent}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoText} numberOfLines={2}>{value}</Text>
    </View>
  </View>
);

// Animation Components
const FadeInUp = {
  from: {
    opacity: 0,
    translateY: 20,
  },
  to: {
    opacity: 1,
    translateY: 0,
  },
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.white,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: Colors.white,
  },
  errorIcon: {
    marginBottom: 16,
  },
  errorText: {
    fontSize: FontSizes.large,
    color: Colors.dark,
    marginBottom: 20,
    fontFamily: FontFamily.medium,
    textAlign: 'center',
  },
  refreshButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    elevation: 2,
  },
  refreshText: {
    fontSize: FontSizes.medium,
    color: Colors.white,
    fontFamily: FontFamily.semiBold,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  profileHeader: {
    alignItems: 'center',
    paddingVertical: 32,
    backgroundColor: Colors.white,
    marginBottom: 16,
    borderRadius: 16,
    marginTop: 12,
  },
  headerShadow: {
    shadowColor: Colors.dark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  avatarContainer: {
    marginBottom: 16,
  },
  avatarShadow: {
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  userName: {
    fontSize: FontSizes.xxlarge,
    fontFamily: FontFamily.semiBold,
    color: Colors.dark,
    marginBottom: 4,
  },
  userNumber: {
    fontSize: FontSizes.medium,
    color: Colors.gray,
    fontFamily: FontFamily.regular,
  },
  statusContainer: {
    marginVertical: 16,
  },
  statusBadge: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    alignSelf: 'center',
  },
  activeBadge: {
    backgroundColor: Colors.lightSuccess,
  },
  inactiveBadge: {
    backgroundColor: Colors.lightDanger,
  },
  statusText: {
    fontSize: FontSizes.medium,
    fontFamily: FontFamily.semiBold,
    color: Colors.dark,
  },
  editButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  editButtonText: {
    color: Colors.white,
    fontSize: FontSizes.medium,
    fontFamily: FontFamily.semiBold,
    marginLeft: 6,
  },
  card: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  cardShadow: {
    shadowColor: Colors.dark,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderGray,
    paddingBottom: 12,
  },
  sectionTitle: {
    fontSize: FontSizes.large,
    fontFamily: FontFamily.semiBold,
    color: Colors.primary,
    marginLeft: 10,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  infoIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.lightPrimary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: FontSizes.small,
    color: Colors.gray,
    marginBottom: 4,
    fontFamily: FontFamily.regular,
  },
  infoText: {
    fontSize: FontSizes.medium,
    color: Colors.dark,
    fontFamily: FontFamily.medium,
    lineHeight: 22,
  },
});

export default ProfileScreen;