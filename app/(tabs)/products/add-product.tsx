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
  const { returnTo, existingItems: existingItemsParam } = useLocalSearchParams();
  
  const { onboarding } = useSession();

  /* ---------------- BUSINESS TYPE ---------------- */
  const businessType = onboarding?.business_type;
  const has_stock = onboarding?.has_stock;
  const isBothBusiness = businessType === 'both';

  // Agar both nahi hai to locked rahega, both mein user choose karega
  const [itemType, setItemType] = useState<'product' | 'service'>(
    businessType === 'service' ? 'service' : 'product'
  );

  /* ---------------- STATE ---------------- */
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [quantity, setQuantity] = useState('');
  const [unitType, setUnitType] = useState<'weight' | 'fixed'>(
    itemType === 'service' ? 'fixed' : 'weight'
  );
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Locked type based on current selection
  const type: 'product' | 'service' = itemType;

  /* ---------------- PARSE EXISTING ITEMS ---------------- */
  let existingItems: any[] = [];
  if (existingItemsParam) {
    try {
      existingItems = JSON.parse(existingItemsParam as string);
    } catch {
      existingItems = [];
    }
  }

  // Reset form on focus
  useFocusEffect(
    useCallback(() => {
      setName('');
      setPrice('');
      setQuantity('');
      setUnitType(itemType === 'service' ? 'fixed' : 'weight');
      setError('');
      setLoading(false);
    }, [itemType]) // itemType change hone pe reset
  );

  /* ---------------- SAVE ---------------- */
  const handleSave = async () => {
    if (!name.trim() || !price.trim()) {
      setError('All fields are required');
      return;
    }

    if (itemType === 'product' && has_stock && !quantity.trim()) {
      setError('All fields are required');
      return;
    }

    setLoading(true);

    try {
      const newProduct = {
        name: name.trim(),
        price: Number(price),
        quantity: itemType === 'product' ? Number(quantity) : undefined,
        type,
        unitType: itemType === 'service' ? 'fixed' : unitType,
      };

      const savedId = await addProduct(newProduct);

      const backParams = {
        newlyAddedProductId: savedId,
        ...(existingItems ? { existingItems } : {}),
      };

      router.replace({
        pathname: '/products',
        params: backParams,
      });
    } catch (err:any) {
      setError(err.message || 'Failed to save');
      console.log(err);
    } finally {
      setLoading(false);
    }
  };

  /* ---------------- QUANTITY LABEL ---------------- */
  const quantityLabel =
    unitType === 'fixed'
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
            Add New {itemType === 'service' ? 'Service' : 'Product'}
          </Text>
          <Text style={styles.subTitle}>Add item and continue billing</Text>
        </View>

        {/* Card */}
        <View style={styles.card}>
          {/* Item Type Selector - Sirf both business mein dikhega */}
          {isBothBusiness && (
            <View style={styles.typeRow}>
              <Pressable
                style={[
                  styles.typeBtn,
                  itemType === 'product' && styles.typeActive,
                ]}
                onPress={() => {
                  setItemType('product');
                  setUnitType('weight');
                }}
              >
                <Text
                  style={[
                    styles.typeText,
                    itemType === 'product' && styles.typeTextActive,
                  ]}
                >
                  Product
                </Text>
              </Pressable>

              <Pressable
                style={[
                  styles.typeBtn,
                  itemType === 'service' && styles.typeActive,
                ]}
                onPress={() => {
                  setItemType('service');
                  setUnitType('fixed');
                }}
              >
                <Text
                  style={[
                    styles.typeText,
                    itemType === 'service' && styles.typeTextActive,
                  ]}
                >
                  Service
                </Text>
              </Pressable>
            </View>
          )}

          {/* Name */}
          <View style={styles.field}>
            <Text style={styles.label}>
              {itemType === 'service' ? 'Service Name' : 'Product Name'}
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

          {/* Quantity - sirf product aur has_stock mein */}
          {itemType === 'product' && has_stock && (
            <View style={styles.field}>
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
            </View>
          )}

          {/* WEIGHT / FIXED - sirf product mein dikhega */}
          {itemType === 'product' && (
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

          {/* Save Button */}
          <Pressable
            style={[styles.saveBtn, loading && { opacity: 0.6 }]}
            onPress={handleSave}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.saveText}>
                Save {itemType === 'service' ? 'Service' : 'Product'}
              </Text>
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