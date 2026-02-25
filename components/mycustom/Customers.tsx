import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Toast from 'react-native-toast-message';
import { getCustomers } from '../../utils/storage';

const PRIMARY = '#0EA5A4';

export default function Customers() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true); // ✅ loader state
  const [errorMsg, setErrorMsg] = useState(false);
  const router = useRouter();


    useFocusEffect(
      useCallback(() => {
        loadCustomers();
      }, [])
    );

  const loadCustomers = async () => {
    setLoading(true);
    try{
    const data = await getCustomers();
    setCustomers(data || []);
    }catch(e: any) {
       setErrorMsg(true);
      Toast.show({
      type: 'error',
      text1: 'Error',
      text2: e?.message ||
        'Failed to load products. Please try again later.',
      position: 'top',
      visibilityTime: 2000,
    });
    }
    finally{
    setLoading(false);
    }

  };

  const openCustomer = (id: string | number) => {
    router.push(`/customers/${id}`);
  };

  // ✅ SAME loader behavior as Dashboard
  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={PRIMARY} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Customers</Text>
        <Text style={styles.headerSub}>
          Full details of all customers
        </Text>
      </View>

      {/* List */}
      {customers.map((customer) => {
        const pending = Number(customer.total_remaining ?? 0);

        return (
          <Pressable
            key={customer.id}
            onPress={() => openCustomer(customer.id)}
            style={({ pressed }) => [
              styles.card,
              pressed && { opacity: 0.9 },
            ]}
          >
            <View style={styles.row}>
              <View style={{ flex: 1 }}>
                <Text style={styles.name}>{customer.name}</Text>
                <Text style={styles.phone}>{customer.phone}</Text>
              </View>

              {pending > 0 && (
                <View style={styles.pendingBox}>
                  <Text style={styles.pendingLabel}>Pending</Text>
                  <Text style={styles.pendingAmount}>
                    ₹{pending.toFixed(2)}
                  </Text>
                </View>
              )}
            </View>
          </Pressable>
        );
      })}

      {customers.length === 0 && !errorMsg && (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>
            No customers found
          </Text>
        </View>
      )}
    </ScrollView>
  );
}

// ───────────────────── STYLES ─────────────────────
const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
  },

  container: {
    flex: 1,
    backgroundColor: '#F1F5F9',
    padding: 12,
  },

  header: {
    backgroundColor: '#1E293B',
    borderRadius: 14,
    padding: 14,
    marginBottom: 14,
  },

  headerTitle: {
    fontSize: 18,
    color: '#FFFFFF',
    fontFamily: 'Poppins_600SemiBold_Italic',
  },

  headerSub: {
    marginTop: 2,
    fontSize: 12,
    color: '#CBD5E1',
    fontFamily: 'Poppins_600SemiBold_Italic',
  },

  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
  },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  name: {
    fontSize: 14,
    color: '#020617',
    fontFamily: 'Poppins_600SemiBold_Italic',
  },

  phone: {
    marginTop: 2,
    fontSize: 12,
    color: '#64748B',
    fontFamily: 'Poppins_600SemiBold_Italic',
  },

  pendingBox: {
    backgroundColor: '#FEF2F2',
    borderRadius: 12,
    paddingVertical: 6,
    paddingHorizontal: 10,
    alignItems: 'flex-end',
  },

  pendingLabel: {
    fontSize: 10,
    color: '#991B1B',
    fontFamily: 'Poppins_600SemiBold_Italic',
  },

  pendingAmount: {
    fontSize: 14,
    color: '#DC2626',
    fontFamily: 'Poppins_600SemiBold_Italic',
  },

  empty: {
    marginTop: 40,
    alignItems: 'center',
  },

  emptyText: {
    fontSize: 13,
    color: '#64748B',
    fontFamily: 'Poppins_600SemiBold_Italic',
  },
});