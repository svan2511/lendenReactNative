import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View
} from 'react-native';
import { getCustomers, getProducts } from '../../../utils/storage';

export default function AddItems() {
  const { customerId, newlyAddedProductId, existingItems: existingItemsParam } = useLocalSearchParams();
  const router = useRouter();

  const [customer, setCustomer] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [items, setItems] = useState<any[]>([]);
  const [productSearch, setProductSearch] = useState('');
  const [total, setTotal] = useState(0);
  const [loadingProducts, setLoadingProducts] = useState(true);

  let existingItems: any[] = [];
  if (existingItemsParam) {
    try {
      existingItems = JSON.parse(existingItemsParam as string);
    } catch (e) {
      existingItems = [];
    }
  }

  const initializeItem = (product: any) => {
    const price = Number(product.price) || 0;
    if (product.unitType === 'weight') {
      const grams = Number(product.grams) || 1000;
      return {
        ...product,
        grams,
        calculatedPrice: Number(product.calculatedPrice) || (price * grams) / 1000,
        quantity: 1,
      };
    }
    return {
      ...product,
      calculatedPrice: Number(product.calculatedPrice) || price,
      quantity: 1,  // always default to 1 when adding new item (fixed unit)
    };
  };

  const loadData = async (autoAddId?: string) => {
    setLoadingProducts(true);
    const custs = await getCustomers();
    setCustomer(custs.find(c => c.id == customerId));

    const prods = await getProducts();
    setProducts(prods);
     setLoadingProducts(false);

    let updatedItems = existingItems.map(initializeItem);

    if (autoAddId) {
      const newProduct = prods.find(x => String(x.id) === autoAddId);
      if (newProduct) updatedItems.push(initializeItem(newProduct));
    }

    setItems(updatedItems);
    calculateTotal(updatedItems);
   
  };

  useFocusEffect(
    useCallback(() => {
      loadData(newlyAddedProductId as string | undefined);
    }, [newlyAddedProductId])
  );

  const addItem = (product: any) => {
    const updated = [...items, initializeItem(product)];
    setItems(updated);
    calculateTotal(updated);
  };

  const updateGrams = (index: number, value: string) => {
    const grams = Number(value) || 0;
    const updated = [...items];
    updated[index].grams = grams;
    updated[index].calculatedPrice = (Number(updated[index].price) || 0) * grams / 1000;
    setItems(updated);
    calculateTotal(updated);
  };

  const updateQuantity = (index: number, value: string) => {
    let qty = Number(value);
    const updated = [...items];

    // For fixed price products: force integer, no decimals allowed
    if (updated[index].unitType !== 'weight') {
      qty = Math.floor(qty); // remove decimal part
      qty = Math.max(1, qty); // minimum 1
    } else {
      // For weight: allow decimal if you ever use quantity for weight (optional)
      qty = Math.max(1, qty);
    }

    updated[index].quantity = isNaN(qty) ? 1 : qty;
    updated[index].calculatedPrice = (Number(updated[index].price) || 0) * updated[index].quantity;
    setItems(updated);
    calculateTotal(updated);
  };

  const removeItem = (index: number) => {
    const updated = items.filter((_, i) => i !== index);
    setItems(updated);
    calculateTotal(updated);
  };

  const calculateTotal = (list: any[]) => {
    let sum = 0;
    list.forEach(item => {
      if (item.unitType === 'fixed') {
        sum += (Number(item.price) || 0) * (Number(item.quantity) || 1);
      } else {
        sum += Number(item.calculatedPrice) || 0;
      }
    });
    setTotal(Number(sum.toFixed(2)));
  };

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(productSearch.toLowerCase())
  );

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={100}
    >
      <View style={styles.container}>
        <View style={styles.headerCard}>
          <View style={styles.headerRow}>
            <View>
              <Text style={styles.title}>Add Items</Text>
              <Text style={styles.subTitle}>{customer?.name}</Text>
            </View>

            <Pressable
              onPress={() =>
                router.push({
                  pathname: '/billing/add-product',
                  params: { customerId: customerId, fromInvoice: '1', existingItems: JSON.stringify(items) },
                })
              }
            >
              <Ionicons name="add-circle-outline" size={26} color="#2563EB" />
            </Pressable>
          </View>
        </View>

        <View style={styles.searchBox}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search products or services..."
            placeholderTextColor="#9CA3AF"
            value={productSearch}
            onChangeText={setProductSearch}
          />
        </View>

       {loadingProducts && filteredProducts.length === 0 && <View >
        <ActivityIndicator size="large" color="#0EA5A4" style={{ transform: [{ scale: 0.7 }] }}/>
      </View>}

       
      <FlatList
        data={filteredProducts}
        keyExtractor={item => item.id.toString()}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <Pressable style={styles.productItem} onPress={() => addItem(item)}>
            <View>
              <Text style={styles.productName}>{item.name}</Text>
              <Text style={styles.productMeta}>
                ₹{item.price} {item.unitType === 'weight' ? '/ kg' : ''}
              </Text>
            </View>
            <Text style={styles.addText}>ADD</Text>
          </Pressable>
        )}
      />

        {items.length > 0 && (
          <View style={styles.selectedCard}>
            <Text style={styles.sectionTitle}>Selected Items</Text>

            <ScrollView style={{ maxHeight: 250 }}>
              {items.map((item, index) => (
                <View key={index} style={styles.itemRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.itemName}>{item.name}</Text>
                    {item.unitType === 'weight' && item.type === "product" && (
                      <Text style={styles.itemPrice}>₹{item.price} / kg</Text>
                    )}
                    {item.unitType === 'fixed' && item.type === "product" && (
                      <Text style={styles.itemPrice}>₹{item.price} / unit</Text>
                    )}
                  </View>

                  {item.unitType === 'weight' ? (
                    <View style={styles.weightBox}>
                      {item.type === "product" && <TextInput
                        style={styles.weightInput}
                        value={String(item.grams)}
                        keyboardType="numeric"
                        onChangeText={v => updateGrams(index, v)}
                        maxLength={6}
                      />}
                      {item.type === "product" &&  <Text style={styles.unitText}>gm</Text> }
                      <Text style={styles.itemTotal}>
                        ₹{Number(item.calculatedPrice || 0).toFixed(2)}
                      </Text>
                    </View>
                  ) : (
                    <View style={styles.quantityBox}>
                      {item.type === "product" &&  <TextInput
                        style={styles.quantityInput}
                        value={String(item.quantity || 1)}
                        keyboardType="numeric"
                        onChangeText={v => updateQuantity(index, v)}
                        maxLength={4}
                      />}
                      {item.type === "product" &&  <Text style={styles.unitText}>unit</Text>}
                      <Text style={styles.itemTotal}>
                        ₹{Number(item.calculatedPrice || 0).toFixed(2)}
                      </Text>
                    </View>
                  )}

                  <Pressable style={styles.removeBtn} onPress={() => removeItem(index)}>
                    <Ionicons name="trash-outline" size={16} color="#DC2626" />
                  </Pressable>
                </View>
              ))}
            </ScrollView>
          </View>
        )}

        <View style={styles.footer}>
          <Text style={styles.totalText}>Total ₹{total}</Text>

          <Pressable
            disabled={items.length === 0}
            style={[styles.previewBtn, items.length === 0 && { opacity: 0.4 }]}
            onPress={() =>
              router.push({
                pathname: '/billing/preview-invoice',
                params: { customerId, items: JSON.stringify(items), total },
              })
            }
          >
            <Text style={styles.previewText}>Preview Invoice</Text>
          </Pressable>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

/* ---------------- STYLES ---------------- */
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC', padding: 14 },
  headerCard: { backgroundColor: '#FFFFFF', borderRadius: 14, padding: 14, marginBottom: 12 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontFamily: 'Poppins_600SemiBold_Italic', fontSize: 18, color: '#0F172A' },
  subTitle: { fontFamily: 'Poppins_600SemiBold_Italic', fontSize: 12, color: '#64748B' },
  searchBox: { backgroundColor: '#FFFFFF', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 8, marginBottom: 10, borderWidth: 1, borderColor: '#E5E7EB' },
  searchInput: { fontFamily: 'Poppins_600SemiBold_Italic', fontSize: 13, color: '#0F172A' },
  productItem: { backgroundColor: '#FFFFFF', borderRadius: 12, padding: 12, marginBottom: 8, flexDirection: 'row', justifyContent: 'space-between' },
  productName: { fontFamily: 'Poppins_600SemiBold_Italic', fontSize: 14, color: '#0F172A' },
  productMeta: { fontFamily: 'Poppins_600SemiBold_Italic', fontSize: 11, color: '#64748B' },
  addText: { fontFamily: 'Poppins_600SemiBold_Italic', fontSize: 12, color: '#2563EB' },
  selectedCard: { backgroundColor: '#FFFFFF', borderRadius: 14, padding: 14, marginTop: 10, borderWidth: 1, borderColor: '#E5E7EB' },
  sectionTitle: { fontFamily: 'Poppins_600SemiBold_Italic', fontSize: 14, marginBottom: 10 },
  itemRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  itemName: { fontFamily: 'Poppins_600SemiBold_Italic', fontSize: 13 },
  itemPrice: { fontFamily: 'Poppins_600SemiBold_Italic', fontSize: 11, color: '#64748B' },
  weightBox: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  weightInput: {
    width: 70,
    height: 36,
    textAlign: 'center',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    fontFamily: 'Poppins_600SemiBold_Italic',
    fontSize: 14,
    paddingVertical: 0,
    backgroundColor: '#F9FAFB',
  },
  quantityBox: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  quantityInput: {
    width: 70,
    height: 36,
    textAlign: 'center',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    fontFamily: 'Poppins_600SemiBold_Italic',
    fontSize: 14,
    paddingVertical: 0,
    backgroundColor: '#F9FAFB',
  },
  unitText: { fontFamily: 'Poppins_600SemiBold_Italic', fontSize: 12, color: '#64748B' },
  itemTotal: { fontFamily: 'Poppins_600SemiBold_Italic', fontSize: 14 },
  removeBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#FEF2F2', alignItems: 'center', justifyContent: 'center' },
  footer: { backgroundColor: '#FFFFFF', borderRadius: 14, padding: 14, marginTop: 12 },
  totalText: { fontFamily: 'Poppins_600SemiBold_Italic', fontSize: 16, marginBottom: 10 },
  previewBtn: { backgroundColor: '#2563EB', borderRadius: 10, paddingVertical: 10, alignItems: 'center' },
  previewText: { fontFamily: 'Poppins_600SemiBold_Italic', fontSize: 13, color: '#FFFFFF' },

loadingText: {
  marginTop: 10,
  fontFamily: 'Poppins_600SemiBold_Italic',
  fontSize: 13,
  color: '#64748B',
},
});