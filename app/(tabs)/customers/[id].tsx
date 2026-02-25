import { getSingleCustomer, markBillAsPaidApi } from '@/services/protected';
import { Ionicons } from '@expo/vector-icons';
import { Stack, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View
} from 'react-native';
import Toast from 'react-native-toast-message';

const FONT = 'Poppins_600SemiBold_Italic';

/* -------------------- TYPES -------------------- */
type Order = {
  id: number;
  show_id:string,
  date: string;
  total: number;
  paid: number;
  balance: number;
};

type CustomerData = {
  customer: {
    name: string;
    phone: string;
  };
  summary: {
    totalOrders: number;
    totalAmount: number;
    totalPaid: number;
    totalPending: number;
  };
  orders: Order[];
};

/* -------------------- COMPONENT -------------------- */
export default function CustomerDetailsScreen() {
  const [data, setData] = useState<CustomerData | null>(null);
  const [loading, setLoading] = useState(true);
  const [paymentModal, setPaymentModal] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [confirmPaidModal, setConfirmPaidModal] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);

  const { id } = useLocalSearchParams<{ id: string }>();

  useEffect(() => {
    if (id) fetchCustomerDetails(id);
  }, [id]);

  const fetchCustomerDetails = async (id: string) => {
    try {
      setLoading(true);
      const response = await getSingleCustomer(id);
      if (response.success) {
        setData(response.customer);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

 
  const handleMarkOrderAsFullyPaid = async () => {
    if (!selectedOrderId) return;

    try {
      const res = await markBillAsPaidApi(selectedOrderId);
       if (!res?.success) {
      throw new Error(res?.message || 'Internel server error! ');
       }
      Toast.show({
        type: 'success',
        text1: 'Order marked as paid',
        text2: 'Balance updated successfully',
      });
      
    } catch (e: any) {
      Toast.show({
        type: 'error',
        text1: 'Failed to mark as paid',
        text2: e?.message || 'Something went wrong',
      });
    }finally{
      setConfirmPaidModal(false);
      setSelectedOrderId(null);
      fetchCustomerDetails(id);
    }
  };

  const openConfirmPaidModal = (orderId: number) => {
   // console.log(orderId);
    setSelectedOrderId(orderId);
    setConfirmPaidModal(true);
  };

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="#1e293b" />
      </View>
    );
  }

  if (!data) return null;

  const { customer, summary, orders } = data;

  /* -------------------- ORDER CARD -------------------- */
  const renderOrder = ({ item }: { item: Order }) => {
    const hasPending = item.balance > 0;

    return (
      <View style={styles.orderCard}>
        <View style={styles.orderHeader}>
          <Text style={styles.orderId}>Order #{item.show_id}</Text>
          <Text style={styles.orderDate}>{item.date}</Text>
        </View>

        <View style={styles.orderRow}>
          <Text style={styles.label}>Total</Text>
          <Text style={styles.value}>₹ {item.total}</Text>
        </View>

        <View style={styles.orderRow}>
          <Text style={styles.label}>Paid</Text>
          <Text style={styles.value}>₹ {item.paid}</Text>
        </View>

        <View style={styles.orderRow}>
          <Text style={[styles.value, hasPending ? styles.pending : styles.paid]}>
            Balance: ₹ {item.balance}
          </Text>
        </View>

        {/* NEW: Mark as Fully Paid button – only when there's pending amount */}
        {hasPending && (
          <Pressable
            style={styles.markPaidButton}
            onPress={() => openConfirmPaidModal(item.id)}
          >
            <Text style={styles.markPaidText}>Mark as Paid</Text>
          </Pressable>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: 'Customer Details' }} />

      {/* CUSTOMER CARD */}
      <View style={styles.customerCard}>
        <Ionicons name="person-circle-outline" size={54} color="#1e293b" />
        <View>
          <Text style={styles.customerName}>{customer.name}</Text>
          <Text style={styles.customerPhone}>{customer.phone}</Text>
        </View>
      </View>

      {/* SUMMARY */}
      <View style={styles.summaryRow}>
        <SummaryBox label="Orders" value={summary.totalOrders} />
        <SummaryBox label="Total" value={`₹ ${summary.totalAmount}`} />
        <SummaryBox label="Paid" value={`₹ ${summary.totalPaid}`} />
        <SummaryBox label="Pending" value={`₹ ${summary.totalPending}`} highlight />
      </View>

      {/* RECEIVE PAYMENT (existing partial payment) */}
      {summary.totalPending > 0 && (
        <Pressable onPress={() => setPaymentModal(true)}>
          <Text style={styles.receivePaymentText}>Receive payment</Text>
        </Pressable>
      )}

      {/* ORDERS LIST */}
      <FlatList
        data={orders}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderOrder}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
      />


      {/* NEW: Confirm Mark Order as Fully Paid Modal */}
      <Modal transparent visible={confirmPaidModal} animationType="fade">
        <View style={styles.overlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Mark Order as Paid?</Text>
            <Text style={styles.modalSubtitle}>
              This will mark Order #{selectedOrderId} as fully paid.
            </Text>

            <View style={styles.modalActions}>
              <Pressable onPress={() => {
                setConfirmPaidModal(false);
                setSelectedOrderId(null);
              }}>
                <Text style={styles.cancelText}>Cancel</Text>
              </Pressable>
              <Pressable onPress={handleMarkOrderAsFullyPaid}>
                <Text style={[styles.confirmText, { color: '#16a34a' }]}>Mark Paid</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

/* -------------------- SUMMARY BOX -------------------- */
function SummaryBox({
  label,
  value,
  highlight = false,
}: {
  label: string;
  value: string | number;
  highlight?: boolean;
}) {
  return (
    <View
      style={[
        styles.summaryBox,
        highlight && { backgroundColor: '#fee2e2' },
      ]}
    >
      <Text style={styles.summaryLabel}>{label}</Text>
      <Text
        style={[
          styles.summaryValue,
          highlight && { color: '#dc2626' },
        ]}
      >
        {value}
      </Text>
    </View>
  );
}

/* -------------------- STYLES -------------------- */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
    padding: 16,
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  customerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 14,
    marginBottom: 16,
    elevation: 2,
  },
  customerName: {
    fontFamily: FONT,
    fontSize: 18,
    color: '#0f172a',
  },
  customerPhone: {
    fontSize: 14,
    color: '#475569',
    marginTop: 2,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  summaryBox: {
    flex: 1,
    backgroundColor: '#ffffff',
    paddingVertical: 12,
    marginHorizontal: 4,
    borderRadius: 12,
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 4,
  },
  summaryValue: {
    fontFamily: FONT,
    fontSize: 14,
    color: '#0f172a',
  },
  receivePaymentText: {
    fontSize: 13,
    color: '#2563eb',
    fontFamily: FONT,
    textAlign: 'right',
    marginBottom: 12,
  },
  orderCard: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 14,
    marginBottom: 14,
    elevation: 2,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  orderId: {
    fontFamily: FONT,
    fontSize: 14,
    color: '#0f172a',
  },
  orderDate: {
    fontSize: 12,
    color: '#64748b',
  },
  orderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  label: {
    fontSize: 13,
    color: '#475569',
  },
  value: {
    fontFamily: FONT,
    fontSize: 13,
    color: '#0f172a',
  },
  pending: {
    color: '#dc2626',
  },
  paid: {
    color: '#16a34a',
  },

  // ── NEW STYLES ──
  markPaidButton: {
    marginTop: 12,
    backgroundColor: '#dcfce7',
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  markPaidText: {
    fontFamily: FONT,
    color: '#166534',
    fontSize: 13,
  },

  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBox: {
    backgroundColor: '#ffffff',
    width: '85%',
    borderRadius: 16,
    padding: 20,
  },
  modalTitle: {
    fontFamily: FONT,
    fontSize: 16,
    color: '#0f172a',
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#475569',
    marginBottom: 24,
  },
  input: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    padding: 12,
    marginBottom: 18,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cancelText: {
    fontFamily: FONT,
    color: '#64748b',
  },
  confirmText: {
    fontFamily: FONT,
    color: '#2563eb',
  },
});