import { createExpenseApi } from '@/services/protected';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native';

const BG = '#F8FAFC';
const CARD = '#FFFFFF';
const DARK = '#0F172A';
const MUTED = '#64748B';
const BORDER = '#E5E7EB';
const PRIMARY = '#2563EB';
const ERROR = '#DC2626';

export default function AddExpenseScreen() {
  const router = useRouter();

  /* ---------------- STATE ---------------- */
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('other');
  const [paymentMode, setPaymentMode] = useState('cash');
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const categories = [
    'rent',
    'electricity',
    'purchase_stock',
    'salary',
    'transport',
    'marketing',
    'maintenance',
    'other',
  ];

  const paymentModes = ['cash', 'upi', 'bank', 'card'];

  /* ---------------- SAVE ---------------- */
  const handleSubmit = async () => {
    if (!title.trim() || !amount.trim()) {
      setError('Title and amount are required');
      return;
    }

    const amountNum = Number(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      setError('Enter a valid amount');
      return;
    }

    setError('');
    setLoading(true);

    try {
      await createExpenseApi({
        title: title.trim(),
        amount: amountNum,
        expense_date: date.toISOString().split('T')[0],
        category,
        payment_mode: paymentMode,
        description: description.trim() || undefined,
      });

      router.back(); // ✅ clean success flow (same as Add Product)
    } catch (err: any) {
      setError(
        err?.response?.data?.message ||
          err?.message ||
          'Failed to add expense'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        style={{ flex: 1, backgroundColor: BG }}
        contentContainerStyle={{ padding: 14 }}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={styles.headerCard}>
          <Text style={styles.title}>Add New Expense</Text>
          <Text style={styles.subTitle}>
            Record business expense
          </Text>
        </View>

        {/* Form Card */}
        <View style={styles.card}>
          {/* Title */}
          <View style={styles.field}>
            <Text style={styles.label}>Expense Title</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Shop Rent"
              placeholderTextColor="#9CA3AF"
              value={title}
              onChangeText={(t) => {
                setTitle(t);
                setError('');
              }}
            />
          </View>

          {/* Amount */}
          <View style={styles.field}>
            <Text style={styles.label}>Amount (₹)</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter amount"
              placeholderTextColor="#9CA3AF"
              keyboardType="numeric"
              value={amount}
              onChangeText={(t) => {
                setAmount(t);
                setError('');
              }}
            />
          </View>

          {/* Date */}
          <View style={styles.field}>
            <Text style={styles.label}>Expense Date</Text>
            <Pressable
              style={styles.dateBtn}
              onPress={() => setShowDatePicker(true)}
            >
              <Text style={styles.dateText}>
                {date.toLocaleDateString('en-GB', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              </Text>
              <Ionicons
                name="calendar-outline"
                size={18}
                color={MUTED}
              />
            </Pressable>
          </View>

          {showDatePicker && (
            <DateTimePicker
              value={date}
              mode="date"
              display="default"
              onChange={(e, selectedDate) => {
                setShowDatePicker(false);
                if (selectedDate) setDate(selectedDate);
              }}
            />
          )}

          {/* Category */}
          <View style={styles.field}>
            <Text style={styles.label}>Category</Text>
            <View style={styles.chipRow}>
              {categories.map((cat) => (
                <Pressable
                  key={cat}
                  style={[
                    styles.chip,
                    category === cat && styles.chipActive,
                  ]}
                  onPress={() => setCategory(cat)}
                >
                  <Text
                    style={[
                      styles.chipText,
                      category === cat &&
                        styles.chipTextActive,
                    ]}
                  >
                    {cat.replace('_', ' ')}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          {/* Payment Mode */}
          <View style={styles.field}>
            <Text style={styles.label}>Payment Mode</Text>
            <View style={styles.chipRow}>
              {paymentModes.map((mode) => (
                <Pressable
                  key={mode}
                  style={[
                    styles.chip,
                    paymentMode === mode &&
                      styles.chipActive,
                  ]}
                  onPress={() => setPaymentMode(mode)}
                >
                  <Text
                    style={[
                      styles.chipText,
                      paymentMode === mode &&
                        styles.chipTextActive,
                    ]}
                  >
                    {mode.toUpperCase()}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          {/* Description */}
          <View style={styles.field}>
            <Text style={styles.label}>
              Description (optional)
            </Text>
            <TextInput
              style={[styles.input, { height: 90 }]}
              placeholder="Any notes..."
              placeholderTextColor="#9CA3AF"
              multiline
              value={description}
              onChangeText={setDescription}
            />
          </View>

          {error ? (
            <Text style={styles.errorText}>{error}</Text>
          ) : null}

          {/* Save Button */}
          <Pressable
            style={[
              styles.saveBtn,
              loading && { opacity: 0.6 },
            ]}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.saveText}>
                Save Expense
              </Text>
            )}
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

/* ---------------- STYLES (MATCHED WITH ADD PRODUCT) ---------------- */
const styles = StyleSheet.create({
  headerCard: {
    backgroundColor: CARD,
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
  },
  title: {
    fontFamily: 'Poppins_600SemiBold_Italic',
    fontSize: 18,
    color: DARK,
  },
  subTitle: {
    fontFamily: 'Poppins_600SemiBold_Italic',
    fontSize: 12,
    color: MUTED,
    marginTop: 2,
  },

  card: {
    backgroundColor: CARD,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: BORDER,
  },

  field: {
    marginBottom: 14,
  },

  label: {
    fontFamily: 'Poppins_600SemiBold_Italic',
    fontSize: 12,
    color: '#475569',
    marginBottom: 6,
  },

  input: {
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontFamily: 'Poppins_600SemiBold_Italic',
    fontSize: 14,
    color: DARK,
    backgroundColor: '#F9FAFB',
  },

  dateBtn: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#F9FAFB',
  },

  dateText: {
    fontFamily: 'Poppins_600SemiBold_Italic',
    fontSize: 14,
    color: DARK,
  },

  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },

  chip: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: BORDER,
    paddingVertical: 8,
    paddingHorizontal: 14,
    backgroundColor: '#F9FAFB',
  },

  chipActive: {
    backgroundColor: '#EFF6FF',
    borderColor: PRIMARY,
  },

  chipText: {
    fontFamily: 'Poppins_600SemiBold_Italic',
    fontSize: 12,
    color: MUTED,
    textTransform: 'capitalize',
  },

  chipTextActive: {
    color: PRIMARY,
  },

  errorText: {
    fontFamily: 'Poppins_600SemiBold_Italic',
    fontSize: 12,
    color: ERROR,
    textAlign: 'center',
    marginBottom: 10,
  },

  saveBtn: {
    backgroundColor: PRIMARY,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },

  saveText: {
    fontFamily: 'Poppins_600SemiBold_Italic',
    fontSize: 14,
    color: '#FFFFFF',
  },
});