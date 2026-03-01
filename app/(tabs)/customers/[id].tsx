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
  View,
} from 'react-native';
import Toast from 'react-native-toast-message';

const FONT = 'Poppins_600SemiBold_Italic';

/* -------------------- TYPES -------------------- */
type OrderItem = {
  id: number;
  product_name: string;
  quantity: string;
  unit_price: number;
  total_price: number;
  unit_type: string;
};

type Order = {
  id: number;
  show_id: string;
  date: string;
  total: number;
  paid: number;
  balance: number;
  items: OrderItem[];
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

  const [itemsModal, setItemsModal] = useState(false);
  const [selectedItems, setSelectedItems] = useState<OrderItem[]>([]);

  const [confirmPaidModal, setConfirmPaidModal] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);

  const { id } = useLocalSearchParams<{ id: string }>();

  useEffect(() => {
    if (id) fetchCustomerDetails(id);
  }, [id]);

  const fetchCustomerDetails = async (id: string) => {
    try {
      setLoading(true);
      const res = await getSingleCustomer(id);
      if (res.success) setData(res.customer);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkOrderAsFullyPaid = async () => {
    if (!selectedOrderId) return;
    try {
      const res = await markBillAsPaidApi(selectedOrderId);
      if (!res?.success) throw new Error(res?.message);
      Toast.show({ type: 'success', text1: 'Order marked as paid' });
    } catch (e: any) {
      Toast.show({ type: 'error', text1: e?.message || 'Something went wrong' });
    } finally {
      setConfirmPaidModal(false);
      setSelectedOrderId(null);
      fetchCustomerDetails(id);
    }
  };

  const openItemsModal = (items: OrderItem[]) => {
    setSelectedItems(items);
    setItemsModal(true);
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

  const renderOrder = ({ item }: { item: Order }) => {
    const hasPending = item.balance > 0;

    return (
      <View style={styles.orderCard}>
        {/* HEADER */}
        <View style={styles.orderHeader}>
          <View>
            <Text style={styles.orderId}>Order #{item.show_id}</Text>
            <Text style={styles.orderDate}>{item.date}</Text>
          </View>

          {item.items?.length > 0 && (
            <Pressable onPress={() => openItemsModal(item.items)}>
              <Text style={styles.viewItemsText}>
                View items ({item.items.length})
              </Text>
            </Pressable>
          )}
        </View>

        <Row label="Total" value={`₹ ${item.total}`} />
        <Row label="Paid" value={`₹ ${item.paid}`} />
        

        <Text style={[styles.value, hasPending ? styles.pending : styles.paid]}>
          Balance: ₹ {item.balance}
        </Text>

        {hasPending && (
          <Pressable
            style={styles.markPaidButton}
            onPress={() => {
              setSelectedOrderId(item.id);
              setConfirmPaidModal(true);
            }}
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

      <View style={styles.customerCard}>
        <Ionicons name="person-circle-outline" size={54} color="#1e293b" />
        <View>
          <Text style={styles.customerName}>{customer.name}</Text>
          <Text style={styles.customerPhone}>{customer.phone}</Text>
        </View>
      </View>

      <View style={styles.summaryRow}>
        <SummaryBox label="Orders" value={summary.totalOrders} />
        <SummaryBox label="Total" value={`₹ ${summary.totalAmount}`} />
        <SummaryBox label="Paid" value={`₹ ${summary.totalPaid}`} />
        <SummaryBox
          label="Pending"
          value={`₹ ${summary.totalPending}`}
          highlight
        />
      </View>

      <FlatList
        data={orders}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderOrder}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
      />

      {/* ITEMS MODAL */}
      <Modal transparent visible={itemsModal} animationType="fade">
        <View style={styles.overlay}>
          <View style={styles.itemsModalBox}>
            <Text style={styles.itemsModalTitle}>Order Items</Text>

            {selectedItems.map((it) => (
              <View key={it.id} style={styles.modalItemRow}>
                <View>
                  <Text style={styles.itemName}>{it.product_name}</Text>
                  <Text style={styles.itemQty}>
                    {it.quantity}
                    {it.unit_type === 'weight' ? ' kg' : ''} × ₹ {it.unit_price}
                  </Text>
                </View>
                <Text style={styles.itemTotal}>₹ {it.total_price}</Text>
              </View>
            ))}

            <Pressable onPress={() => setItemsModal(false)}>
              <Text style={styles.closeText}>Close</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* CONFIRM PAID */}
      <Modal transparent visible={confirmPaidModal} animationType="fade">
        <View style={styles.overlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Mark Order as Paid?</Text>
            <View style={styles.modalActions}>
              <Pressable onPress={() => setConfirmPaidModal(false)}>
                <Text style={styles.cancelText}>Cancel</Text>
              </Pressable>
              <Pressable onPress={handleMarkOrderAsFullyPaid}>
                <Text style={[styles.confirmText, { color: '#16a34a' }]}>
                  Mark Paid
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

/* -------------------- SMALL COMPONENTS -------------------- */
const Row = ({ label, value }: { label: string; value: string }) => (
  <View style={styles.orderRow}>
    <Text style={styles.label}>{label}</Text>
    <Text style={styles.value}>{value}</Text>
  </View>
);

function SummaryBox({ label, value, highlight = false }: any) {
  return (
    <View style={[styles.summaryBox, highlight && { backgroundColor: '#fee2e2' }]}>
      <Text style={styles.summaryLabel}>{label}</Text>
      <Text style={[styles.summaryValue, highlight && { color: '#dc2626' }]}>
        {value}
      </Text>
    </View>
  );
}

/* -------------------- STYLES -------------------- */
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc', padding: 16 },
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  customerCard: {
    flexDirection: 'row',
    gap: 12,
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 14,
    marginBottom: 16,
    elevation: 2,
  },

  customerName: { fontFamily: FONT, fontSize: 18 },
  customerPhone: { fontSize: 14, color: '#475569' },

  summaryRow: { flexDirection: 'row', marginBottom: 6 },
  summaryBox: {
    flex: 1,
    backgroundColor: '#fff',
    paddingVertical: 12,
    marginHorizontal: 4,
    borderRadius: 12,
    alignItems: 'center',
  },

  summaryLabel: { fontSize: 12, color: '#64748b' },
  summaryValue: { fontFamily: FONT, fontSize: 14 },

  orderCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 14,
    marginBottom: 14,
    elevation: 2,
  },

  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },

  orderId: { fontFamily: FONT, fontSize: 14 },
  orderDate: { fontSize: 12, color: '#64748b' ,fontFamily: FONT },

  viewItemsText: {
    fontSize: 12,
    color: '#1a73f0',
    fontFamily: FONT,
  },

  orderRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 },
  label: { fontSize: 13, color: '#475569' , fontFamily: FONT },
  value: { fontFamily: FONT, fontSize: 13 },

  pending: { color: '#dc2626' },
  paid: { color: '#16a34a' ,marginTop:5 },

  markPaidButton: {
    marginTop: 12,
    backgroundColor: '#dcfce7',
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },

  markPaidText: { fontFamily: FONT, color: '#166534' },

  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  itemsModalBox: {
    width: '85%',
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 18,
  },

  itemsModalTitle: { fontFamily: FONT, fontSize: 16, marginBottom: 14 },

  modalItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },

  itemName: { fontFamily: FONT, fontSize: 13 },
  itemQty: { fontSize: 12, color: '#64748b' },
  itemTotal: { fontFamily: FONT, fontSize: 13 },

  closeText: {
    marginTop: 10,
    textAlign: 'center',
    fontFamily: FONT,
    color: '#2563eb',
  },

  modalBox: {
    backgroundColor: '#fff',
    width: '85%',
    borderRadius: 16,
    padding: 20,
  },

  modalTitle: { fontFamily: FONT, fontSize: 16, marginBottom: 20 },
  modalActions: { flexDirection: 'row', justifyContent: 'space-between' },
  cancelText: { color: '#64748b' },
  confirmText: { fontFamily: FONT },
});