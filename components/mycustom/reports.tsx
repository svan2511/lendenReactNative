import { getALLExpenses, getMonthlyProfitLoss, getMonthlySummary } from '@/services/protected';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Toast from 'react-native-toast-message';

/* 🎨 SAME COLORS AS PRODUCTS */
const PRIMARY = '#0EA5A4';
const BG = '#F1F5F9';
const CARD = '#FFFFFF';
const DARK = '#020617';
const MUTED = '#64748B';
const DANGER = '#DC2626';
const SUCCESS = '#059669'; // green for profit

export default function Reports() {
  const router = useRouter();

  const [expenses, setExpenses] = useState<any[]>([]);
  const [summary, setSummary] = useState({
    total_expenses: 0,
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
  });
  const [plData, setPlData] = useState<any>(null);
  const [showExpensesList, setShowExpensesList] = useState(false);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);

      const [listRes, sumRes, plRes] = await Promise.all([
        getALLExpenses(),
        getMonthlySummary(),
        getMonthlyProfitLoss(),
      ]);

      if (!listRes?.success) {
        throw new Error(listRes?.message || 'Internal server error!');
      }
      if (!sumRes?.success) {
        throw new Error(sumRes?.message || 'Internal server error!');
      }

      setExpenses(listRes?.expenses || []);
      setSummary(
        sumRes?.summary || {
          total_expenses: 0,
          month: new Date().getMonth() + 1,
          year: new Date().getFullYear(),
        }
      );

      setPlData(plRes?.data || null);
    } catch (err: any) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: err?.message || 'Failed to load reports. Please try again.',
        position: 'top',
        visibilityTime: 2000,
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });

  const renderItem = ({ item }: { item: any }) => (
    <Pressable
      style={styles.card}
      onPress={() =>
        router.push({
          pathname: '/reports/[id]',
          params: { id: item.id },
        })
      }
    >
      <View style={styles.row}>
        <View style={{ flex: 1 }}>
          <Text style={styles.name} numberOfLines={1}>
            {item.title}
          </Text>

          <Text style={styles.meta}>
            ₹{Number(item.amount).toLocaleString('en-IN')} ·{' '}
            {item.category.replace('_', ' ')}
          </Text>

          <View style={styles.badge}>
            <Text style={styles.badgeText}>
              {formatDate(item.expense_date)}
            </Text>
          </View>
        </View>

        <Ionicons name="chevron-forward" size={18} color={MUTED} />
      </View>
    </Pressable>
  );

  if (loading && !refreshing) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={PRIMARY} />
      </View>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: BG }}>
      <FlatList
        data={showExpensesList ? expenses : []}
        renderItem={renderItem}
        keyExtractor={(item) => String(item.id)}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={PRIMARY}
          />
        }
        ListHeaderComponent={
          <>
            {/* Header Card */}
            <View style={styles.header}>
              <Text style={styles.headerTitle}>Reports</Text>
              <Text style={styles.headerSub}>
                Monthly overview & profit/loss
              </Text>
            </View>

            {/* ───────── Profit & Loss Card ───────── */}
            <View style={[styles.reportCard, { borderLeftColor: SUCCESS }]}>
              <Text style={[styles.reportTitle, { color: SUCCESS }]}>
                Monthly Profit & Loss
              </Text>

              {plData ? (
                <>
                  <View style={styles.reportRow}>
                    <Text style={styles.reportLabel}>Total Sales / Revenue</Text>
                    <Text style={[styles.reportValue, { color: PRIMARY }]}>
                      ₹{Number(plData.total_sales || 0).toLocaleString('en-IN')}
                    </Text>
                  </View>

                  <View style={styles.reportRow}>
                    <Text style={styles.reportLabel}>Total Expenses</Text>
                    <Text style={[styles.reportValue, { color: DANGER }]}>
                      ₹{Number(plData.total_expenses || 0).toLocaleString('en-IN')}
                    </Text>
                  </View>

                  <View style={styles.reportTotalRow}>
                    <Text style={styles.reportLabelBold}>Net Profit</Text>
                    <Text
                      style={[
                        styles.reportValueBold,
                        { color: (plData.net_profit || 0) >= 0 ? SUCCESS : DANGER },
                      ]}
                    >
                      {(plData.net_profit || 0) >= 0 ? '₹' : '-₹'}
                      {Math.abs(Number(plData.net_profit || 0)).toLocaleString('en-IN')}
                    </Text>
                  </View>

                  <Text style={styles.reportMonth}>
                    {new Date(plData.year, plData.month - 1).toLocaleString('en-US', { month: 'long' })}{' '}
                    {plData.year}
                  </Text>
                </>
              ) : (
                <Text style={styles.reportEmpty}>
                  Profit & Loss will appear once you have sales data
                </Text>
              )}
            </View>

            {/* ───────── Expenses Summary Card ───────── (now same design) */}
            <View style={[styles.reportCard, { borderLeftColor: DANGER }]}>
              <View style={styles.reportHeaderRow}>
                <Text style={[styles.reportTitle, { color: DANGER }]}>
                  Total Expenses
                </Text>

                <Pressable
                  onPress={() => setShowExpensesList(!showExpensesList)}
                  style={({ pressed }) => [
                    styles.toggleButton,
                    pressed && { backgroundColor: '#fee2e2' }, // light red on press
                  ]}
                >
                  <Text style={styles.toggleText}>
                    {showExpensesList ? 'Hide Details' : 'View Details'}
                  </Text>
                </Pressable>
              </View>

              <View style={styles.reportRow}>
                <Text style={styles.reportLabel}>Amount</Text>
                <Text style={[styles.reportValue, { color: DANGER }]}>
                  ₹{Number(summary.total_expenses).toLocaleString('en-IN')}
                </Text>
              </View>

              <Text style={styles.reportMonth}>
                {new Date(summary.year, summary.month - 1).toLocaleString('en-US', { month: 'long' })}{' '}
                {summary.year}
              </Text>
            </View>

            {/* Show empty state only when list is visible */}
            {showExpensesList && expenses.length === 0 && (
              <View style={styles.empty}>
                <Text style={styles.emptyText}>No expenses added yet</Text>
              </View>
            )}
          </>
        }
        ListFooterComponent={() => <View style={{ height: 100 }} />}
      />

      {/* Floating Add Button */}
      <Pressable
        style={styles.addBtn}
        onPress={() => router.push('/reports/add')}
      >
        <Ionicons name="add" size={22} color="#fff" />
        <Text style={styles.addText}>Add Expense</Text>
      </Pressable>
    </SafeAreaView>
  );
}

/* 🎨 STYLES */
const styles = StyleSheet.create({
  center: {
    flex: 1,
    backgroundColor: BG,
    justifyContent: 'center',
    alignItems: 'center',
  },

  listContent: {
    padding: 12,
  },

  header: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },

  headerTitle: {
    fontSize: 18,
    color: '#fff',
    fontFamily: 'Poppins_600SemiBold_Italic',
  },

  headerSub: {
    fontSize: 12,
    color: '#CBD5E1',
    marginTop: 2,
    fontFamily: 'Poppins_600SemiBold_Italic',
  },

  // ── Unified report card style (used by both P&L and Expenses) ──
  reportCard: {
    backgroundColor: CARD,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
  },

  reportTitle: {
    fontSize: 15,
    fontFamily: 'Poppins_600SemiBold_Italic',
    marginBottom: 12,
  },

  reportHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },

  toggleButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#ECFEFF',
  },

  toggleText: {
    color: PRIMARY,
    fontSize: 13,
    fontFamily: 'Poppins_600SemiBold_Italic',
  },

  reportRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },

  reportLabel: {
    fontSize: 14,
    color: MUTED,
    fontFamily: 'Poppins_600SemiBold_Italic',
  },

  reportValue: {
    fontSize: 14,
    fontFamily: 'Poppins_600SemiBold_Italic',
  },

  reportTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1.5,
    borderTopColor: SUCCESS,
  },

  reportLabelBold: {
    fontSize: 16,
    fontWeight: 'bold',
    color: DARK,
    fontFamily: 'Poppins_600SemiBold_Italic',
  },

  reportValueBold: {
    fontSize: 17,
    fontWeight: 'bold',
    fontFamily: 'Poppins_600SemiBold_Italic',
  },

  reportMonth: {
    fontSize: 11,
    color: MUTED,
    marginTop: 12,
    textAlign: 'center',
    fontFamily: 'Poppins_600SemiBold_Italic',
  },

  reportEmpty: {
    marginTop: 12,
    color: MUTED,
    textAlign: 'center',
    fontSize: 13,
    fontFamily: 'Poppins_600SemiBold_Italic',
  },

  card: {
    backgroundColor: CARD,
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
  },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },

  name: {
    fontSize: 14.5,
    color: DARK,
    fontFamily: 'Poppins_600SemiBold_Italic',
  },

  meta: {
    marginTop: 4,
    fontSize: 12,
    color: MUTED,
    fontFamily: 'Poppins_600SemiBold_Italic',
  },

  badge: {
    marginTop: 6,
    alignSelf: 'flex-start',
    backgroundColor: '#ECFEFF',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },

  badgeText: {
    fontSize: 10,
    color: PRIMARY,
    fontFamily: 'Poppins_600SemiBold_Italic',
  },

  empty: {
    marginTop: 40,
    alignItems: 'center',
  },

  emptyText: {
    color: MUTED,
    fontSize: 13,
    fontFamily: 'Poppins_600SemiBold_Italic',
  },

  addBtn: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 20,
    backgroundColor: PRIMARY,
    borderRadius: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    elevation: 5,
  },

  addText: {
    color: '#fff',
    fontSize: 14,
    fontFamily: 'Poppins_600SemiBold_Italic',
  },
});