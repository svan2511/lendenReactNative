import { useSession } from '@/contexts/SessionContext';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { addProduct } from '../../../utils/storage';

export default function AddProduct() {
  const router = useRouter();
  const { customerId , existingItems: existingItemsParam } = useLocalSearchParams();
  
  const { onboarding } = useSession();

  /* ---------------- BUSINESS TYPE ---------------- */
  const isServiceBusiness = onboarding?.business_type === 'service';
  const has_stock = onboarding?.has_stock;

  /* ---------------- STATE ---------------- */
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [quantity, setQuantity] = useState('');
  const [unitType, setUnitType] = useState<'weight' | 'fixed'>(
    isServiceBusiness ? 'fixed' : 'weight'
  );
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Locked type
  const type: 'product' | 'service' = isServiceBusiness ? 'service' : 'product';

  /* ---------------- PARSE EXISTING ITEMS ---------------- */
  let existingItems: any[] = [];
  if (existingItemsParam) {
    try {
      existingItems = JSON.parse(existingItemsParam as string);
    } catch {
      existingItems = [];
    }
  }

  // ── Reset form when screen is focused ──
  useFocusEffect(
    useCallback(() => {
      setName('');
      setPrice('');
      setQuantity('');
      setUnitType(isServiceBusiness ? 'fixed' : 'weight');
      setError('');
      setLoading(false);
    }, [isServiceBusiness])
  );

  /* ---------------- SAVE ---------------- */
 const handleSave = async () => {
  if (!name.trim() || !price.trim()) {
    setError('All fields are required');
    return;
  }
  if(!isServiceBusiness && has_stock && !quantity.trim()){
    setError('All fields are required');
    return;
  }

  setLoading(true);

  try {
    const newProduct = {
      name: name.trim(),
      price: Number(price),
      quantity: Number(quantity),
      type,
      unitType,
    };

    const savedId = await addProduct(newProduct);

    // FIXED: Forward the exact existingItems string + new ID
    // This is what was breaking old items (they were being lost)
    router.replace({
      pathname: '/billing/add-items',
      params: {
        customerId: customerId,
        newlyAddedProductId: savedId,
        existingItems: existingItemsParam || '[]',   // ← THIS LINE WAS THE FIX
      },
    });
  
  } catch (err) {
    setError('Failed to save product');
    console.error(err);
  } finally {
    setLoading(false);
  }
};

  /* ---------------- QUANTITY LABEL ---------------- */
  const quantityLabel =
    isServiceBusiness || unitType === 'fixed'
      ? 'Total Quantity in shop (units)'
      : 'Total Quantity in shop (kg)';

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.headerCard}>
          <Text style={styles.title}>
            Add New {isServiceBusiness ? 'Service' : 'Product'}
          </Text>
          <Text style={styles.subTitle}>Add item and continue billing</Text>
        </View>

        {/* Card */}
        <View style={styles.card}>
          {/* Name */}
          <View style={styles.field}>
            <Text style={styles.label}>
              {isServiceBusiness ? 'Service Name' : 'Product Name'}
            </Text>
            <TextInput
              style={styles.input}
              placeholder="Enter name"
              placeholderTextColor="#9CA3AF"
              value={name}
              onChangeText={t => {
                setName(t);
                setError('');
              }}
            />
          </View>

          {/* Price */}
          <View style={styles.field}>
            <Text style={styles.label}>
              Price {unitType === 'weight' ? '(per kg)' : ''}
            </Text>
            <TextInput
              style={styles.input}
              placeholder="Enter price"
              placeholderTextColor="#9CA3AF"
              keyboardType="numeric"
              value={price}
              onChangeText={t => {
                setPrice(t);
                setError('');
              }}
            />
          </View>

          {/* Quantity */}
         {!isServiceBusiness && has_stock && <View style={styles.field}>
            <Text style={styles.label}>{quantityLabel}</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter quantity"
              placeholderTextColor="#9CA3AF"
              keyboardType="numeric"
              value={quantity}
              onChangeText={t => {
                setQuantity(t);
                setError('');
              }}
            />
          </View>}

          {/* WEIGHT / FIXED (ONLY PRODUCT BUSINESS) */}
          {!isServiceBusiness && (
            <View style={styles.typeRow}>
              <Pressable
                style={[
                  styles.typeBtn,
                  unitType === 'weight' && styles.typeActive,
                ]}
                onPress={() => setUnitType('weight')}
              >
                <Text
                  style={[
                    styles.typeText,
                    unitType === 'weight' && styles.typeTextActive,
                  ]}
                >
                  Weight (kg)
                </Text>
              </Pressable>

              <Pressable
                style={[
                  styles.typeBtn,
                  unitType === 'fixed' && styles.typeActive,
                ]}
                onPress={() => setUnitType('fixed')}
              >
                <Text
                  style={[
                    styles.typeText,
                    unitType === 'fixed' && styles.typeTextActive,
                  ]}
                >
                  Fixed Price
                </Text>
              </Pressable>
            </View>
          )}

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          {/* ---------------- SAVE BUTTON WITH LOADER ---------------- */}
          <Pressable
            style={[styles.saveBtn, loading && { opacity: 0.6 }]}
            onPress={handleSave}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.saveText}>Save & Add to Bill</Text>
            )}
          </Pressable>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
/* ---------------- STYLES (UNCHANGED) ---------------- */
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC', padding: 14 },
  headerCard: { backgroundColor: '#FFFFFF', borderRadius: 14, padding: 14, marginBottom: 12 },
  title: { fontFamily: 'Poppins_600SemiBold_Italic', fontSize: 18, color: '#0F172A' },
  subTitle: { fontFamily: 'Poppins_600SemiBold_Italic', fontSize: 12, color: '#64748B', marginTop: 2 },
  card: { backgroundColor: '#FFFFFF', borderRadius: 14, padding: 16, borderWidth: 1, borderColor: '#E5E7EB' },
  field: { marginBottom: 14 },
  label: { fontFamily: 'Poppins_600SemiBold_Italic', fontSize: 12, color: '#475569', marginBottom: 6 },
  input: { borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontFamily: 'Poppins_600SemiBold_Italic', fontSize: 14, color: '#0F172A', backgroundColor: '#F9FAFB' },
  typeRow: { flexDirection: 'row', gap: 10, marginBottom: 14 },
  typeBtn: { flex: 1, borderRadius: 10, borderWidth: 1, borderColor: '#E5E7EB', paddingVertical: 10, alignItems: 'center', backgroundColor: '#F9FAFB' },
  typeActive: { backgroundColor: '#EFF6FF', borderColor: '#2563EB' },
  typeText: { fontFamily: 'Poppins_600SemiBold_Italic', fontSize: 12, color: '#64748B' },
  typeTextActive: { color: '#2563EB' },
  errorText: { fontFamily: 'Poppins_600SemiBold_Italic', fontSize: 12, color: '#DC2626', textAlign: 'center', marginBottom: 10 },
  saveBtn: { backgroundColor: '#2563EB', borderRadius: 10, paddingVertical: 12, alignItems: 'center' },
  saveText: { fontFamily: 'Poppins_600SemiBold_Italic', fontSize: 14, color: '#FFFFFF' },
});
