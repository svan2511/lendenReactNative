import { addCustomerApi } from '@/services/protected';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';


export default function AddCustomer() {
  const router = useRouter();

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');

  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleAdd = async () => {
    if (!name.trim()) {
      setError('Customer name is required');
      return;
    }

    if (phone.length !== 10) {
      setError('Phone number must be exactly 10 digits');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const res = await addCustomerApi({
        name,
        phone,
        address: address || undefined,
      });

      if (res.success) {
        setSuccess(true);

        setTimeout(() => {
          router.back();
        }, 800);
      } else {
        setError(res.message || 'Failed to add customer');
      }
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>Add Customer</Text>

        {success && (
          <View style={styles.successBox}>
            <Text style={styles.successText}>
              Customer added successfully
            </Text>
          </View>
        )}

        <View style={styles.field}>
          <Text style={styles.label}>Customer Name</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter full name"
            placeholderTextColor="#9CA3AF"
            value={name}
            onChangeText={text => {
              setName(text);
              setError('');
            }}
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Phone Number</Text>
          <TextInput
            style={styles.input}
            placeholder="10 digit mobile number"
            placeholderTextColor="#9CA3AF"
            keyboardType="number-pad"
            maxLength={10}
            value={phone}
            onChangeText={text => {
              const numericValue = text.replace(/[^0-9]/g, '');
              setPhone(numericValue);
              setError('');
            }}
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Address (optional)</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter address"
            placeholderTextColor="#9CA3AF"
            value={address}
            onChangeText={setAddress}
            multiline
          />
        </View>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <Pressable
          style={[styles.button, loading && { opacity: 0.7 }]}
          onPress={handleAdd}
          disabled={loading}
        >
          <Text style={styles.buttonText}>
            {loading ? 'Saving...' : 'Save Customer'}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

/* -------------------- STYLES (UNCHANGED) -------------------- */

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    padding: 16,
    justifyContent: 'center',
  },

  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 18,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },

  title: {
    fontFamily: 'Poppins_600SemiBold_Italic',
    fontSize: 18,
    color: '#0F172A',
    marginBottom: 14,
    textAlign: 'center',
  },

  successBox: {
    backgroundColor: '#ECFDF5',
    borderRadius: 10,
    paddingVertical: 8,
    marginBottom: 12,
  },

  successText: {
    textAlign: 'center',
    color: '#047857',
    fontSize: 12,
    fontFamily: 'Poppins_600SemiBold_Italic',
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
    fontFamily: 'Poppins_600SemiBold_Italic',
    fontSize: 14,
    color: '#0F172A',
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },

  errorText: {
    fontFamily: 'Poppins_600SemiBold_Italic',
    fontSize: 12,
    color: '#DC2626',
    marginBottom: 10,
    textAlign: 'center',
  },

  button: {
    marginTop: 6,
    backgroundColor: '#2563EB',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },

  buttonText: {
    fontFamily: 'Poppins_600SemiBold_Italic',
    fontSize: 14,
    color: '#FFFFFF',
  },
});
