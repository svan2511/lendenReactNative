import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  SectionList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useSession } from '@/contexts/SessionContext';
import Toast from 'react-native-toast-message';
import { getCustomers } from '../../../utils/storage';

/* 🎨 Professional, calm business colors */
const BG = '#F8FAFC';
const CARD = '#FFFFFF';
const BORDER = '#E5E7EB';
const ROW_BG = '#F1F5F9';

const PRIMARY = '#1E293B';
const MUTED = '#64748B';
const ACCENT = '#2563EB';
const ACCENT_SOFT = '#EFF6FF';
const LOADER_COLOR = "#0EA5A4";

export default function SelectCustomer() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const { onboarding } = useSession();

  const [customers, setCustomers] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState(false);

  useFocusEffect(
    useCallback(() => {
      const loadCustomers = async () => {
        setLoading(true);
        try {
          const data = await getCustomers();
          setCustomers(Array.isArray(data) ? data : []);
        } catch (err:any) {
          //console.log(err);
          setErrorMsg(true);
          Toast.show({
                type: 'error',
                text1: 'Error',
                text2: err?.message ||
                  'Failed to load products. Please try again later.',
                position: 'top',
                visibilityTime: 8000,
              });
        } finally {
          setLoading(false);
        }
      };

      loadCustomers();
    }, [])
  );

  /* 🔹 Filter + group customers A–Z (HOOK MUST ALWAYS RUN) */
  const sections = useMemo(() => {
    const filtered = customers.filter(c =>
      (c?.name || '').toLowerCase().includes(search.toLowerCase()) ||
      (c?.phone || '').includes(search)
    );

    const grouped: Record<string, any[]> = {};

    filtered.forEach(c => {
      const letter = c?.name?.charAt(0)?.toUpperCase() || '#';
      if (!grouped[letter]) grouped[letter] = [];
      grouped[letter].push(c);
    });

    return Object.keys(grouped)
      .sort()
      .map(letter => ({
        title: letter,
        data: grouped[letter],
      }));
  }, [customers, search]);

  // ✅ Loader AFTER all hooks (fixes hook order error)
  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={LOADER_COLOR} />
      </View>
    );
  }

  /* ✅ Decide billing flow based on onboarding */
  const handleCustomerSelect = (customerId: number) => {
    if (!onboarding) {
      router.push({
        pathname: '/billing/add-items',
        params: { customerId },
      });
      return;
    }

    const { has_stock, business_type } = onboarding;

    // if (!has_stock && business_type === 'service') {
    //   router.push({
    //     pathname: '/billing/add-services',
    //     params: { customerId },
    //   });
    //   return;
    // }

    router.push({
      pathname: '/billing/add-items',
      params: { customerId },
    });
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <SectionList
        sections={sections}
        keyExtractor={item => item.id.toString()}
        stickySectionHeadersEnabled
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120 }}
        ListHeaderComponent={
          <>
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.title}>
                Customers · {customers.length}
              </Text>
              <Text style={styles.subtitle}>
                Select a customer to continue billing
              </Text>
            </View>

            {/* Search */}
            <View style={styles.searchBox}>
              <Ionicons name="search-outline" size={18} color={MUTED} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search by name or phone"
                placeholderTextColor={MUTED}
                value={search}
                onChangeText={setSearch}
              />
            </View>
          </>
        }
        renderSectionHeader={({ section }) => (
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionText}>{section.title}</Text>
          </View>
        )}
        ListEmptyComponent={
          <Text style={styles.empty}>{!setErrorMsg && 'No customers found'}</Text>
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            activeOpacity={0.7}
            style={styles.row}
            onPress={() => handleCustomerSelect(item.id)}
          >
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {item.name?.charAt(0)?.toUpperCase() || '?'}
              </Text>
            </View>

            <View style={{ flex: 1 }}>
              <Text style={styles.name}>
                {item.name || 'Unnamed'}
              </Text>
              <Text style={styles.phone}>
                {item.phone || 'No phone'}
              </Text>
            </View>

            <Ionicons name="chevron-forward" size={18} color={MUTED} />
          </TouchableOpacity>
        )}
      />

      {/* Add Button */}
      <TouchableOpacity
        activeOpacity={0.85}
        style={[styles.addBtn, { bottom: insets.bottom + 16 }]}
        onPress={() => router.push('/billing/add-customer')}
      >
        <Ionicons name="add" size={18} color="#fff" />
        <Text style={styles.addText}>Add Customer</Text>
      </TouchableOpacity>
    </View>
  );
}

/* 🧩 Styles – unchanged */
const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: BG,
  },

  container: {
    flex: 1,
    backgroundColor: BG,
    paddingHorizontal: 16,
  },

  header: {
    marginTop: 12,
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    color: PRIMARY,
    fontFamily: 'Poppins_600SemiBold_Italic',
  },
  subtitle: {
    marginTop: 2,
    fontSize: 13,
    color: MUTED,
    fontFamily: 'Poppins_400Regular',
  },

  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: CARD,
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: PRIMARY,
    fontFamily: 'Poppins_400Regular',
  },

  sectionHeader: {
    backgroundColor: BG,
    paddingVertical: 6,
  },
  sectionText: {
    fontSize: 13,
    color: MUTED,
    fontFamily: 'Poppins_600SemiBold_Italic',
  },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: ROW_BG,
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: BORDER,
  },

  avatar: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: ACCENT_SOFT,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: ACCENT,
    fontSize: 14,
    fontFamily: 'Poppins_600SemiBold_Italic',
  },

  name: {
    fontSize: 14.5,
    color: PRIMARY,
    fontFamily: 'Poppins_600SemiBold_Italic',
  },
  phone: {
    fontSize: 12.5,
    color: MUTED,
    marginTop: -2,
    fontFamily: 'Poppins_400Regular',
  },

  empty: {
    marginTop: 40,
    textAlign: 'center',
    fontSize: 13,
    color: MUTED,
  },

  addBtn: {
    position: 'absolute',
    left: 16,
    right: 16,
    backgroundColor: ACCENT,
    borderRadius: 12,
    paddingVertical: 14,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  addText: {
    color: '#fff',
    fontSize: 14,
    fontFamily: 'Poppins_600SemiBold_Italic',
  },
});