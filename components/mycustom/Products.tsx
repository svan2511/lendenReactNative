import { deleteSingleProduct } from '@/services/protected';
import { getProducts } from '@/utils/storage';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { memo, useCallback, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import Toast from 'react-native-toast-message';

const PRIMARY = '#0EA5A4';
const BG = '#F1F5F9';
const CARD = '#FFFFFF';
const DARK = '#020617';
const MUTED = '#64748B';
const DANGER = '#DC2626';

// ── Extracted stable header component ──
const ListHeader = memo(({ searchQuery, setSearchQuery, productsLength, errorMsg, loading }: {
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  productsLength: number;
  errorMsg: boolean;
  loading: boolean;
}) => (
  <>
    <View style={styles.header}>
      <Text style={styles.headerTitle}>Products</Text>
      <Text style={styles.headerSub}>Manage all your products</Text>
    </View>

    {/* Search Bar */}
    <View style={styles.searchContainer}>
      <Ionicons
        name="search-outline"
        size={20}
        color={MUTED}
        style={styles.searchIcon}
      />
      <TextInput
        style={styles.searchInput}
        placeholder="Search products..."
        placeholderTextColor={MUTED}
        value={searchQuery}
        onChangeText={setSearchQuery}
        autoCapitalize="none"
        autoCorrect={false}
        returnKeyType="search"
      />
      {searchQuery.length > 0 && (
        <Pressable
          onPress={() => setSearchQuery('')}
          style={styles.clearButton}
        >
          <Ionicons name="close-circle" size={20} color={MUTED} />
        </Pressable>
      )}
    </View>

    {productsLength === 0 && !loading && (
      <View style={styles.empty}>
        <Text style={styles.emptyText}>
          {searchQuery
            ? 'No products match your search'
            : 'No products found'}
        </Text>
      </View>
    )}
  </>
));

export default function Products() {
  const router = useRouter();

  const [products, setProducts] = useState<any[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [showDelete, setShowDelete] = useState(false);
  const [errorMsg, setErrorMsg] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false); // 🔹 loader state

  useFocusEffect(
    useCallback(() => {
      fetchProducts();
    }, [])
  );

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const fetchedProducts = await getProducts();
      setProducts(fetchedProducts || []);
      setFilteredProducts(fetchedProducts || []);
    } catch (e: any) {
      setErrorMsg(true);
      setProducts([]);
      setFilteredProducts([]);
      console.log(e?.message);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: e?.message || 'Failed to load products. Please try again later.',
        position: 'top',
        visibilityTime: 2000,
      });
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredProducts(products);
      return;
    }

    const lowerQuery = searchQuery.toLowerCase().trim();
    const filtered = products.filter((item) =>
      item.name.toLowerCase().includes(lowerQuery)
    );

    setFilteredProducts(filtered);
  }, [searchQuery, products]);

  const openEdit = (id: number) => {
    router.push(`/products/${id}`);
  };

  const confirmDelete = (id: number) => {
    setDeleteId(id);
    setShowDelete(true);
  };

  const deleteProduct = async () => {
    if (!deleteId) return;

    setDeleteLoading(true); // 🔹 show loader

    try {
      const data = await deleteSingleProduct(deleteId);

      if (!data?.success) {
        throw new Error(data?.message || 'Internal server error!');
      }

      if (data.success) {
        setProducts((prev) => prev.filter((p) => p.id !== data.product));
      }
    } catch (e: any) {
      console.log('Delete failed', e);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: e?.message || 'Failed to delete product. Please try again later.',
        position: 'top',
        visibilityTime: 2000,
      });
    } finally {
      setShowDelete(false);
      setDeleteId(null);
      setDeleteLoading(false); // 🔹 hide loader
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={PRIMARY} />
      </View>
    );
  }

  const renderProduct = ({ item }: { item: any }) => (
    <View style={styles.card}>
      <View style={styles.row}>
        <View style={{ flex: 1 }}>
          <Text style={styles.name}>{item.name}</Text>
          <Text style={styles.meta}>
            ₹{Number(item.price).toFixed(2)}
            {item.type === 'product' && (
              <>
                {' '}· Qty {item.quantity}{' '}
                {item.unitType === 'weight' ? 'kg' : 'pcs'}
              </>
            )}
          </Text>

          <View style={styles.badge}>
            <Text style={styles.badgeText}>
              {item.unitType === 'weight' ? 'WEIGHT BASED' : 'FIXED UNIT'}
            </Text>
          </View>
          {item.type === 'product' && item.quantity <= 2 && (
            <View style={styles.stockbadge}>
              <Text style={styles.OutOfStock}>
                Out of Stock
              </Text>
            </View>
          )}
        </View>

        <View style={styles.actions}>
          <Pressable onPress={() => openEdit(item.id)} style={styles.editBtn}>
            <Ionicons name="create-outline" size={16} color={PRIMARY} />
          </Pressable>

          <Pressable
            onPress={() => confirmDelete(item.id)}
            style={styles.deleteBtn}
          >
            <Ionicons name="trash-outline" size={16} color={DANGER} />
          </Pressable>
        </View>
      </View>
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: BG }} keyboardShouldPersistTaps="handled">
      <FlatList
        data={filteredProducts}
        renderItem={renderProduct}
        keyExtractor={(item) => String(item.id)}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <ListHeader
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            productsLength={filteredProducts.length}
            errorMsg={errorMsg}
            loading={loading}
          />
        }
        ListFooterComponent={() => <View style={{ height: 100 }} />}
      />

      {/* Floating Add Button */}
      <Pressable
        style={styles.addBtn}
        onPress={() =>
          router.push({
            pathname: '/products/add-product',
            params: { returnTo: '/products' },
          })
        }
      >
        <Ionicons name="add" size={22} color="#fff" />
        <Text style={styles.addText}>Add Product</Text>
      </Pressable>

      {/* Delete Confirmation Modal */}
      <Modal transparent visible={showDelete} animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Ionicons name="alert-circle-outline" size={42} color={DANGER} />

            <Text style={styles.modalTitle}>Delete Product?</Text>

            <Text style={styles.modalText}>
              This action cannot be undone.
            </Text>

            <View style={styles.modalActions}>
              <Pressable
                style={styles.cancelBtn}
                onPress={() => setShowDelete(false)}
              >
                <Text style={styles.cancelText}>Cancel</Text>
              </Pressable>

              <Pressable
                style={styles.confirmBtn}
                onPress={deleteProduct}
                disabled={deleteLoading} // 🔹 disable while loading
              >
                {deleteLoading ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.confirmText}>Delete</Text>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

/* 🎨 STYLES (unchanged) */
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

  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: CARD,
    borderRadius: 12,
    paddingHorizontal: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    height: 48,
  },

  searchIcon: {
    marginRight: 8,
  },

  searchInput: {
    flex: 1,
    fontSize: 14,
    color: DARK,
    fontFamily: 'Poppins_400Regular',
  },

  clearButton: {
    padding: 4,
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
  OutOfStock:{
    fontSize: 10,
    color: DANGER,
    fontFamily: 'Poppins_600SemiBold_Italic',
  },
  stockbadge: {
    marginTop: 6,
    alignSelf: 'flex-start',
    backgroundColor: '#f1250620',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },

  actions: {
    flexDirection: 'row',
    gap: 10,
  },

  editBtn: {
    backgroundColor: '#ECFEFF',
    padding: 8,
    borderRadius: 10,
  },

  deleteBtn: {
    backgroundColor: '#FEF2F2',
    padding: 8,
    borderRadius: 10,
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },

  addText: {
    color: '#fff',
    fontSize: 14,
    fontFamily: 'Poppins_600SemiBold_Italic',
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  modalBox: {
    backgroundColor: '#fff',
    width: '85%',
    borderRadius: 18,
    padding: 20,
    alignItems: 'center',
  },

  modalTitle: {
    marginTop: 12,
    fontSize: 16,
    color: DARK,
    fontFamily: 'Poppins_600SemiBold_Italic',
  },

  modalText: {
    marginTop: 6,
    fontSize: 12,
    color: MUTED,
    textAlign: 'center',
    fontFamily: 'Poppins_600SemiBold_Italic',
  },

  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },

  cancelBtn: {
    backgroundColor: '#E5E7EB',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 12,
  },

  cancelText: {
    color: DARK,
    fontSize: 13,
    fontFamily: 'Poppins_600SemiBold_Italic',
  },

  confirmBtn: {
    backgroundColor: DANGER,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 12,
  },

  confirmText: {
    color: '#fff',
    fontSize: 13,
    fontFamily: 'Poppins_600SemiBold_Italic',
  },
});