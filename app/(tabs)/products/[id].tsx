import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
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
import Toast from 'react-native-toast-message';

// Import your storage functions (update these later for real API)
import { useSession } from '@/contexts/SessionContext';
import { getProductById, updateProduct } from '@/utils/storage';

export default function EditProduct() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
    const { onboarding } = useSession();
    const has_stock = onboarding?.has_stock;
     const isServiceBusiness = onboarding?.business_type === 'service';

  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [quantity, setQuantity] = useState('');
  const [unitType, setUnitType] = useState<'weight' | 'fixed'>('weight');
  const [type, setType] = useState<'product' | 'service'>('product');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const loadProduct = async () => {
      if (!id || isNaN(Number(id))) {
        setError('Invalid product ID');
        setLoading(false);
        return;
      }

      try {
        const product = await getProductById(Number(id));
        if (!product) {
          setError('Product not found');
          return;
        }

        // ── IMPORTANT: Set all fields correctly ──
        setName(product.name || '');
        setPrice(product.price != null ? String(product.price) : '');
        setQuantity(product.quantity != null ? String(product.quantity) : '');

        // Handle unit_type / unitType key mismatch
        const loadedUnitType = product.unit_type || product.unitType || 'weight';
        setUnitType(loadedUnitType === 'fixed' ? 'fixed' : 'weight');

        // Type (product/service)
        setType(product.type || 'product');

      } catch (err) {
        setError('Failed to load product');
        console.error('Load error:', err);
      } finally {
        setLoading(false);
      }
    };

    loadProduct();
  }, [id]);

  const handleUpdate = async () => {
    if (!name.trim() || !price.trim() || !quantity.trim()) {
      setError('All fields are required');
      return;
    }

    setSaving(true);
    setError('');

    try {
      const updatedProduct = {
        id: Number(id),
        name: name.trim(),
        price: Number(price),
        quantity: Number(quantity),
        type,
        unit_type: unitType,   // normalize to match your storage/API
      };

      await updateProduct(updatedProduct);

      // Go back to products list (or use router.back() if preferred)
      router.replace('/products');
      // Alternative: router.back();  // if you want to return to previous screen
    } catch (err:any) {
      setError('Failed to update product');
      console.log('Update error:', err);
       Toast.show({
              type: 'error',
              text1: 'Error',
              text2: err?.message || 'Failed to update products. Please try again later.',
              position: 'top',
              visibilityTime: 2000,
            });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2563EB" />
      </View>
    );
  }

  if (error && !name) {  // Show error only if nothing loaded
    return (
      <View style={styles.center}>
        <Text style={{ color: '#DC2626', fontSize: 16 }}>{error}</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.container}>
        <View style={styles.headerCard}>
          <Text style={styles.title}>Edit {type === 'service' ? 'Service' : 'Product'}</Text>
          <Text style={styles.subTitle}>Update item details</Text>
        </View>

        <View style={styles.card}>
          {/* Name */}
          <View style={styles.field}>
            <Text style={styles.label}>
              {type === 'service' ? 'Service Name' : 'Product Name'}
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

          {/* Quantity - now properly filled */}
         { has_stock && <View style={styles.field}>
            <Text style={styles.label}>
              Quantity ({unitType === 'weight' ? 'kg' : 'units'})
            </Text>
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

          {/* Weight / Fixed toggle - only for products */}
          {type !== 'service' && (
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

          <Pressable
            style={[styles.saveBtn, saving && { opacity: 0.6 }]}
            onPress={handleUpdate}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.saveText}>Update {isServiceBusiness ? 'Service' : 'Product'}</Text>
            )}
          </Pressable>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

/* Styles - same as your AddProduct screen */
const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F8FAFC' },
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