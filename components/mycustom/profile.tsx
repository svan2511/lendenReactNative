import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import Toast from 'react-native-toast-message';

import { useSession } from '@/contexts/SessionContext';
import {
  addProfileApi,
  getProfileApi,
  updateProfileApi,
} from '@/services/protected';

/* 🎨 SAME DESIGN LANGUAGE AS PRODUCTS */
const PRIMARY = '#0EA5A4';
const BG = '#F1F5F9';
const CARD = '#FFFFFF';
const DARK = '#020617';
const MUTED = '#64748B';
const BORDER = '#E2E8F0';

type ShopProfile = {
  shopName: string;
  shopAddress: string;
};

export default function Profile() {

  const {saveProfileData} = useSession();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [profile, setProfile] = useState<ShopProfile | null>(null);
  const [editMode, setEditMode] = useState(false);

  const [shopName, setShopName] = useState('');
  const [shopAddress, setShopAddress] = useState('');
  const [shopPhone, setShopPhone] = useState('');

  /* 🔁 FETCH PROFILE FROM API */
  const fetchProfile = async () => {
    try {
      setLoading(true);

      const res = await getProfileApi();

      if (res.success && res.profile) {
        const profileData = await AsyncStorage.getItem('profiledata');
        if(!profileData) {
          setdataForProfileStorage(res.profile);
        }
        setProfile(res.profile);
        setShopPhone(res.profile.phone);
        setShopName(res.profile.shopName);
        setShopAddress(res.profile.shopAddress);
      } else {
        setProfile(null);
        setShopName('');
        setShopAddress('');
        setShopPhone('');
      }
    } catch (e: any) {
      setProfile(null);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: e?.message || 'Failed to load profile',
        position: 'top',
        visibilityTime: 2000,
      });
    } finally {
      setLoading(false);
    }
  };

  const setdataForProfileStorage = async (pData:any) => {
     await saveProfileData({
          business_name:pData.shopName,
          business_address:pData.shopAddress,
        });
  }

  /* ✅ SAME TAB BEHAVIOR */
  useFocusEffect(
    useCallback(() => {
      fetchProfile();
    }, [])
  );

  /* ✅ SAME EARLY RETURN LOADER */
  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={PRIMARY} />
      </View>
    );
  }

  const saveProfile = async () => {
    if (!shopName.trim()) return;

    try {
      setSaving(true);

      const payload = {
        shopName: shopName.trim(),
        shopAddress: shopAddress.trim(),
      };

      let res;

      if (profile) {
        res = await updateProfileApi(payload);
      } else {
        res = await addProfileApi(payload);
      }

      if (!res?.success) {
      throw new Error(res?.message || 'Internel server error! ');
       }
    
      if (res.success) {
        setProfile({
          shopName: payload.shopName,
          shopAddress: payload.shopAddress,
        });

        await saveProfileData({
          business_name:payload.shopName,
          business_address:payload.shopAddress
        });

        setEditMode(false);

        Toast.show({
          type: 'success',
          text1: 'Success',
          text2: res.message,
          position: 'top',
          visibilityTime: 2000,
        });
      }
    } catch (e: any) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: e?.message || 'Something went wrong',
        position: 'top',
        visibilityTime: 2000,
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: BG }}>
      <ScrollView contentContainerStyle={styles.container}>

        <View style={styles.header}>
          <Text style={styles.headerTitle}>Shop Profile</Text>
          <Text style={styles.headerSub}>
            Manage your business information
          </Text>
        </View>

        {profile && !editMode && (
          <View style={styles.card}>
            <Text style={styles.label}>Shop Name</Text>
            <Text style={styles.value}>{profile.shopName}</Text>

            <Text style={[styles.label, { marginTop: 12 }]}>Address</Text>
            <Text style={styles.value}>
              {profile.shopAddress || 'Not added'}
            </Text>

            <Text style={[styles.label, { marginTop: 12 }]}>Phone</Text>
            <Text style={styles.value}>
              {`+91-${shopPhone}` || 'Not added'}
            </Text>

            <Pressable
              style={styles.editBtn}
              onPress={() => setEditMode(true)}
            >
              <Ionicons name="create-outline" size={16} color={PRIMARY} />
              <Text style={styles.editText}>Edit Profile</Text>
            </Pressable>
          </View>
        )}

        {(!profile || editMode) && (
          <View style={styles.card}>
            <Text style={styles.label}>Shop Name</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter shop name"
              placeholderTextColor={MUTED}
              value={shopName}
              onChangeText={setShopName}
            />

            <Text style={[styles.label, { marginTop: 12 }]}>
              Shop Address
            </Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Enter shop address"
              placeholderTextColor={MUTED}
              value={shopAddress}
              onChangeText={setShopAddress}
              multiline
            />

            <Pressable
              style={styles.saveBtn}
              onPress={saveProfile}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.saveText}>
                  {profile ? 'Update Profile' : 'Save Profile'}
                </Text>
              )}
            </Pressable>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

/* 🎨 STYLES — UNTOUCHED */
const styles = StyleSheet.create({
  center: {
    flex: 1,
    backgroundColor: BG,
    justifyContent: 'center',
    alignItems: 'center',
  },

  container: {
    padding: 12,
    paddingBottom: 80,
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

  card: {
    backgroundColor: CARD,
    borderRadius: 16,
    padding: 14,
  },

  label: {
    fontSize: 12,
    color: MUTED,
    fontFamily: 'Poppins_600SemiBold_Italic',
  },

  value: {
    marginTop: 4,
    fontSize: 14,
    color: DARK,
    fontFamily: 'Poppins_600SemiBold_Italic',
  },

  input: {
    marginTop: 6,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: BORDER,
    fontFamily: 'Poppins_400Regular',
    color: DARK,
  },

  textArea: {
    height: 90,
    textAlignVertical: 'top',
  },

  editBtn: {
    marginTop: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-end',
  },

  editText: {
    color: PRIMARY,
    fontSize: 13,
    fontFamily: 'Poppins_600SemiBold_Italic',
  },

  saveBtn: {
    marginTop: 20,
    backgroundColor: PRIMARY,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },

  saveText: {
    color: '#fff',
    fontSize: 14,
    fontFamily: 'Poppins_600SemiBold_Italic',
  },
});