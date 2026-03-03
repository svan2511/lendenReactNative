import { useSession } from '@/contexts/SessionContext';
import { getDashboardData, logoutApi } from '@/services/protected';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';

const { width } = Dimensions.get('window');

const PRIMARY = '#0EA5A4';
const ACCENT = '#14B8A6';
const TEXT_DARK = '#111827';
const TEXT_MUTED = '#6B7280';
const CARD_BG = '#FFFFFF';
const BG = '#F9FAFB';

type DashboardResponse = {
  total_sales: number;
  cash_in: number;
  cash_remaining: number;
  bills_full_paid: number;
  bills_partial: number;
  total_bills_today: number;
  low_stock_count: number;
  customers_with_pending:number;
};

export default function Dashboard() {
  const insets = useSafeAreaInsets();
  const { onboarding, logout } = useSession();

  const [data, setData] = useState<DashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [logoutLoading, setLogoutLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userName, setUserName] = useState<string | null>(null);

  // ✅ ADDED MODAL STATE
  const [logoutModalVisible, setLogoutModalVisible] = useState(false);

  const loadDashboard = async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await getDashboardData();
      const userString = await AsyncStorage.getItem('user');

      if (userString) {
        const user = JSON.parse(userString);
        setUserName(user.name);
      }

      setData(res.data);
    } catch (err: any) {
      setError(err.message || 'Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadDashboard();
    }, [])
  );

  const handleLogout = async () => {
    setLogoutModalVisible(false);
    setLogoutLoading(true);
    try {
      const response = await logoutApi();
      if (response.success) {
        Toast.show({
          type: 'success',
          text1: 'Logged Out',
          text2: 'See you soon!',
          position: 'top',
        });

        await logout();
        router.replace('/(auth)');
      }
    } catch (err: any) {
      Toast.show({
        type: 'error',
        text1: 'Logout Failed',
        text2: err.message || 'Please try again',
        position: 'top',
      });
    } finally {
      setLogoutLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.center, { paddingBottom: insets.bottom }]}>
        <ActivityIndicator size="large" color={PRIMARY} />
      </View>
    );
  }

  if (error || !data) {
    return (
      <View style={[styles.center, { paddingBottom: insets.bottom }]}>
        <Text style={{ color: 'red' }}>{error || 'No data found'}</Text>
      </View>
    );
  }

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: BG,
        paddingBottom: insets.bottom + 20,
      }}
    >
      {/* Header */}
      <View
      style={[
        styles.header,
        { paddingTop: insets.top + 10 } // ✅ THIS FIXES THE CUT ISSUE
      ]}
    >
        <Text style={styles.headerTitle}>Dashboard</Text>
        <Pressable
          onPress={() => setLogoutModalVisible(true)} // ✅ UPDATED TO OPEN MODAL
          disabled={logoutLoading}
          style={({ pressed }) => [
            styles.logoutBtn,
            pressed && styles.logoutBtnPressed,
          ]}
        >
          {logoutLoading ? (
            <ActivityIndicator color="#dc2626" size="small" />
          ) : (
            <>
              <Ionicons name="log-out-outline" size={22} color="#dc2626" />
              <Text style={styles.logoutText}>Logout</Text>
            </>
          )}
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.welcomeCard}>
          <Text style={styles.greeting}>
            Good Morning, {userName || 'User'} 🌿
          </Text>
          <Text style={styles.subtitle}>
            Here’s your business overview for today.
          </Text>
        </View>

        <View style={styles.overviewCard}>
          <Text style={styles.cardTitle}>Today’s Overview</Text>

          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>Total Sales</Text>
              <Text style={styles.statValue}>₹{data.total_sales}</Text>
            </View>

            <View style={styles.statBox}>
              <Text style={styles.statLabel}>Cash Receive</Text>
              <Text style={styles.statValue}>₹{data.cash_in}</Text>
            </View>
          </View>

          <View style={styles.statsRow}>
            <View style={styles.statBoxRemain}>
              <Text style={styles.statLabelRemain}>Cash Remain</Text>
              <Text style={styles.statValueRemain}>
                ₹{data.cash_remaining}
              </Text>
            </View>

            <View style={styles.statBox}>
              <Text style={styles.statLabel}>Total Bills</Text>
              <Text style={styles.statValue}>
                {data.total_bills_today}
              </Text>
            </View>
          </View>

          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>Full Paid Bills</Text>
              <Text style={styles.statValue}>
                {data.bills_full_paid}
              </Text>
            </View>

            <View style={styles.statBox}>
              <Text style={styles.statLabel}>Partial Bills</Text>
              <Text style={styles.statValue}>
                {data.bills_partial}
              </Text>
            </View>
          </View>
        </View>

        {onboarding?.has_stock && (
          <Pressable
            style={({ pressed }) => [
              styles.card,
              pressed && { opacity: 0.85 },
            ]}
            onPress={() => router.push('/products')}
          >
            <Text style={styles.cardTitle}>Low Stock Items</Text>
            <View style={styles.infoPillRed}>
              <Text style={styles.infoTextRed}>
                {data.low_stock_count > 0 ? data.low_stock_count : 'No'} items running low ⚠️
              </Text>
            </View>
          </Pressable>
        )}

        {onboarding?.has_appointments && (
          <View style={styles.card}>
          <Text style={styles.cardTitle}>Today’s Appointments</Text>
          <View style={styles.infoPillBlue}>
            <Text style={styles.infoTextBlue}>
              🚀 Feature coming soon
            </Text>
          </View>
        </View>
        )}

        <Pressable
          style={({ pressed }) => [
            styles.card,
            pressed && { opacity: 0.85 },
          ]}
          onPress={() => router.push('/customers')}
        >
          <Text style={styles.cardTitle}>
            Outstanding Payments
          </Text>
          <View style={styles.infoPillRed}>
            <Text style={styles.infoTextRed}>
             {data.customers_with_pending > 0 ? data.customers_with_pending : 'No'} customers have unpaid dues ⚠️
            </Text>
          </View>
        </Pressable>
      </ScrollView>

      {/* ✅ LOGOUT MODAL ADDED */}
      <Modal
        transparent
        visible={logoutModalVisible}
        animationType="fade"
        onRequestClose={() => setLogoutModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Confirm Logout</Text>
            <Text style={styles.modalText}>
              Are you sure you want to logout?
            </Text>

            <View style={styles.modalButtons}>
              <Pressable
                style={styles.cancelBtn}
                onPress={() => setLogoutModalVisible(false)}
              >
                <Text style={styles.cancelText}>Cancel</Text>
              </Pressable>

              <Pressable
                style={styles.confirmBtn}
                onPress={handleLogout}
              >
                <Text style={styles.confirmText}>Logout</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: BG,
  },

  scrollContent: {
    padding: 20,
    paddingBottom: 100,
  },

  header: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',
  paddingHorizontal: 20,
  paddingTop: 16, // keep this
  paddingBottom: 12,
  backgroundColor: BG,
},

  headerTitle: {
    fontSize: 24,
    fontFamily: 'Poppins_700Bold_Italic',
    color: TEXT_DARK,
  },

  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fee2e2',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 12,
    gap: 6,
  },

  logoutBtnPressed: {
    opacity: 0.7,
  },

  logoutText: {
    color: '#dc2626',
    fontSize: 14,
    fontFamily: 'Poppins_600SemiBold_Italic',
  },

  // ... rest of your styles remain unchanged ...
  welcomeCard: {
    backgroundColor: CARD_BG,
    borderRadius: 20,
    padding: 24,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 6,
  },

  greeting: {
    fontSize: 20,
    fontFamily: 'Poppins_700Bold_Italic',
    color: TEXT_DARK,
    marginBottom: 6,
  },

  subtitle: {
    fontSize: 16,
    fontFamily: 'Poppins_400Regular_Italic',
    color: TEXT_MUTED,
  },

  overviewCard: {
    backgroundColor: CARD_BG,
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 4,
  },

  cardTitle: {
    fontSize: 18,
    fontFamily: 'Poppins_600SemiBold_Italic',
    color: TEXT_DARK,
    marginBottom: 16,
  },

  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 14,
  },

  statBox: {
    flex: 1,
    marginHorizontal: 4,
    backgroundColor: '#F3FAF9',
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
  },

  statBoxRemain: {
    flex: 1,
    marginHorizontal: 4,
    backgroundColor: '#ef1212c6',
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
  },

  statLabel: {
    fontSize: 14,
    color: ACCENT,
    fontFamily: 'Poppins_400Regular_Italic',
    marginBottom: 6,
  },

  statLabelRemain: {
    fontSize: 14,
    color: '#ffffff',
    fontFamily: 'Poppins_400Regular_Italic',
    marginBottom: 6,
  },

  statValue: {
    fontSize: 18,
    color: TEXT_DARK,
    fontFamily: 'Poppins_600SemiBold_Italic',
  },

  statValueRemain: {
    fontSize: 18,
    color: '#ffffff',
    fontFamily: 'Poppins_600SemiBold_Italic',
  },

  card: {
    backgroundColor: CARD_BG,
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },

  infoPillRed: {
    backgroundColor: '#FEE2E2',
    padding: 14,
    borderRadius: 16,
    marginTop: 8,
  },

  infoTextRed: {
    color: '#B91C1C',
    fontSize: 14,
    fontFamily: 'Poppins_400Regular_Italic',
  },

  infoPillBlue: {
    backgroundColor: '#DBEAFE',
    padding: 14,
    borderRadius: 16,
    marginTop: 8,
  },

  infoTextBlue: {
    color: '#1D4ED8',
    fontSize: 14,
    fontFamily: 'Poppins_400Regular_Italic',
  },
   modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  modalContainer: {
    width: width * 0.85,
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
  },

  modalTitle: {
    fontSize: 18,
    fontFamily: 'Poppins_600SemiBold_Italic',
    marginBottom: 10,
    color: TEXT_DARK,
  },

  modalText: {
    fontSize: 14,
    fontFamily: 'Poppins_400Regular_Italic',
    color: TEXT_MUTED,
    marginBottom: 20,
  },

  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },

  cancelBtn: {
    paddingVertical: 8,
    paddingHorizontal: 14,
  },

  cancelText: {
    color: TEXT_MUTED,
    fontFamily: 'Poppins_500Medium_Italic',
  },

  confirmBtn: {
    backgroundColor: '#dc2626',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 10,
  },

  confirmText: {
    color: '#fff',
    fontFamily: 'Poppins_600SemiBold_Italic',
  },
});