import { getSingleExpense } from '@/services/protected';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

const FONT = 'Poppins_600SemiBold_Italic';

export default function ExpenseDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const [expense, setExpense] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) {
      router.back();
      return;
    }

    const fetchExpense = async () => {
      try {
        const res = await getSingleExpense(id);
        const singleExpense = res?.expense || res?.data || null;
        setExpense(singleExpense);
      } catch (e) {
        console.error(e);
        router.back();
      } finally {
        setLoading(false);
      }
    };

    fetchExpense();
  }, [id]);

  if (loading) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator size="large" color="#2563EB" />
      </SafeAreaView>
    );
  }

  if (!expense) {
    return (
      <SafeAreaView style={styles.center}>
        <Text style={styles.errorText}>Expense not found</Text>
      </SafeAreaView>
    );
  }

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });

  return (
    <SafeAreaView style={styles.container}>
      {/* STACK HEADER ONLY */}
      <Stack.Screen
        options={{
          title: 'Expense Details',
          headerTitleStyle: {
            fontFamily: FONT,
            fontSize: 16,
          },
        }}
      />

      <ScrollView contentContainerStyle={styles.content}>
        {/* AMOUNT CARD */}
        <View style={styles.amountCard}>
          <Text style={styles.amountLabel}>Total Expense</Text>
          <Text style={styles.amount}>
            ₹ {Number(expense.amount || 0).toLocaleString('en-IN')}
          </Text>
        </View>

        {/* DETAILS CARD */}
        <View style={styles.card}>
          <Detail label="Title" value={expense.title} />
          <Detail
            label="Date"
            value={expense.expense_date ? formatDate(expense.expense_date) : '—'}
          />

          <View style={styles.row}>
            <InfoChip label="Category" value={expense.category} />
            <InfoChip label="Payment" value={expense.payment_mode} />
          </View>

          {expense.description ? (
            <View style={styles.descBox}>
              <Text style={styles.descLabel}>Description</Text>
              <Text style={styles.descText}>{expense.description}</Text>
            </View>
          ) : null}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

/* ---------------- SMALL COMPONENTS ---------------- */

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value || '—'}</Text>
    </View>
  );
}

function InfoChip({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.chip}>
      <Text style={styles.chipLabel}>{label}</Text>
      <Text style={styles.chipValue}>
        {value ? value.replace('_', ' ').toUpperCase() : '—'}
      </Text>
    </View>
  );
}

/* ---------------- STYLES ---------------- */

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },

  amountCard: {
    backgroundColor: '#EFF6FF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  amountLabel: {
    fontFamily: FONT,
    fontSize: 12,
    color: '#64748B',
  },
  amount: {
    fontFamily: FONT,
    fontSize: 26,
    color: '#DC2626',
    marginTop: 6,
  },

  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },

  detailRow: {
    marginBottom: 14,
  },
  label: {
    fontFamily: FONT,
    fontSize: 12,
    color: '#64748B',
    marginBottom: 4,
  },
  value: {
    fontFamily: FONT,
    fontSize: 14,
    color: '#0F172A',
  },

  row: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 6,
  },
  chip: {
    flex: 1,
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  chipLabel: {
    fontSize: 11,
    color: '#64748B',
    marginBottom: 2,
  },
  chipValue: {
    fontFamily: FONT,
    fontSize: 12,
    color: '#0F172A',
  },

  descBox: {
    marginTop: 16,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 12,
  },
  descLabel: {
    fontFamily: FONT,
    fontSize: 12,
    color: '#64748B',
    marginBottom: 4,
  },
  descText: {
    fontFamily: FONT,
    fontSize: 13,
    color: '#0F172A',
  },

  errorText: {
    fontFamily: FONT,
    fontSize: 14,
    color: '#DC2626',
  },
});