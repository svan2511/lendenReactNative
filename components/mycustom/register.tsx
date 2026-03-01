import { registerUser } from '@/services/auth';
import { useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Image,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

const COLORS = {
  primary: '#0EA5A4',
  primaryDark: '#0F766E',
  background: '#F1F5F9',
  card: '#FFFFFF',
  textDark: '#0F172A',
  textMuted: '#64748B',
  border: '#E2E8F0',
  error: '#DC2626',
};

export default function Register() {
  const router = useRouter();

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');


  const scaleAnim = useRef(new Animated.Value(1)).current;

  const pressIn = () =>
    Animated.spring(scaleAnim, { toValue: 0.97, useNativeDriver: true }).start();
  const pressOut = () =>
    Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true }).start();

const handleRegister = async () => {
  setError('');
  setSuccessMessage('');

  if (name.trim().length < 2) {
    setError('Please enter your name.');
    return;
  }

  if (phone.length !== 10) {
    setError('Mobile number must be exactly 10 digits.');
    return;
  }

  try {
    setLoading(true);

    const response = await registerUser({
      name: name.trim(),
      phone,
    });

    if (!response.success) {
      setError(response.message || 'Something went wrong');
      setLoading(false);
      return;
    }

    // ✅ SUCCESS FLOW
    setLoading(false);
    setSuccessMessage(response.message || 'Registered successfully');

    setTimeout(() => {
      router.replace('/(auth)');
    }, 1500);

  } catch (err) {
    console.log(err);
    setLoading(false);
    setError('Network error. Please try again.');
  }
};



  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <View style={styles.wrapper}>
          <View style={styles.card}>

            <Image
              source={require('../../assets/images/splash.png')}
              style={styles.logo}
              resizeMode="contain"
            />

            <Text style={styles.title}>Create your account</Text>
            <Text style={styles.subtitle}>
              Enter your details to get started
            </Text>

            <Text style={styles.label}>Full Name</Text>
            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.input}
                placeholder="Enter your name"
                placeholderTextColor={COLORS.textMuted}
                value={name}
                onChangeText={setName}
              />
            </View>

            <Text style={[styles.label, { marginTop: 16 }]}>
              Mobile Number
            </Text>
            <View style={styles.inputWrapper}>
              <Text style={styles.countryCode}>+91</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter 10-digit number"
                placeholderTextColor={COLORS.textMuted}
                keyboardType="phone-pad"
                maxLength={10}
                value={phone}
                onChangeText={setPhone}
              />
            </View>

            {!!successMessage && (
            <Text style={styles.successText}>{successMessage}</Text>
            )}


            {!!error && <Text style={styles.error}>{error}</Text>}

            <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
              <TouchableOpacity
                activeOpacity={0.9}
                onPressIn={pressIn}
                onPressOut={pressOut}
                onPress={handleRegister}
                disabled={loading}
                style={[styles.button, styles.buttonActive]}
              >
                {loading ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.buttonText}>Create Account</Text>
                )}
              </TouchableOpacity>
            </Animated.View>

            <View style={styles.signupContainer}>
              <Text style={styles.signupText}>Already have an account? </Text>
              <Text
                style={styles.signupLink}
                onPress={() => router.back()}
              >
                Sign In
              </Text>
            </View>

          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

/* ================= STYLES ================= */

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  wrapper: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
  },

  card: {
    backgroundColor: COLORS.card,
    borderRadius: 28,
    padding: 28,
    borderWidth: 1,
    borderColor: COLORS.border,
    elevation: 8,
  },

  logo: {
    width: 170,
    height: 170,
    alignSelf: 'center',
    marginBottom: 0,
  },

  title: {
    fontSize: 20,
    fontFamily: 'Poppins_400Regular_Italic',
    color: COLORS.textDark,
    textAlign: 'center',
  },

  subtitle: {
    fontSize: 13,
    fontFamily: 'Poppins_400Regular_Italic',
    color: COLORS.textMuted,
    textAlign: 'center',
    marginBottom: 22,
    marginTop: 10,
  },

  label: {
    fontSize: 13,
    fontFamily: 'Poppins_600SemiBold_Italic',
    color: COLORS.textDark,
    marginBottom: 8,
  },

  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 54,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 16,
  },

  countryCode: {
    fontSize: 15,
    fontFamily: 'Poppins_600SemiBold_Italic',
    marginRight: 8,
    color: COLORS.textDark,
  },

  input: {
    flex: 1,
    fontSize: 15,
    fontFamily: 'Poppins_400Regular_Italic',
    color: COLORS.textDark,
  },

  error: {
    marginTop: 6,
    color: COLORS.error,
    fontSize: 12,
    fontFamily: 'Poppins_400Regular_Italic',
  },

  button: {
    marginTop: 28,
    height: 52,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },

  buttonActive: {
    backgroundColor: COLORS.primary,
  },

  buttonText: {
    fontSize: 15,
    fontFamily: 'Poppins_600SemiBold_Italic',
    color: '#FFFFFF',
  },

  signupContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 22,
  },

  signupText: {
    fontFamily: 'Poppins_400Regular_Italic',
    fontSize: 13,
    color: COLORS.textMuted,
  },

  signupLink: {
    fontFamily: 'Poppins_600SemiBold_Italic',
    fontSize: 13,
    color: COLORS.primaryDark,
  },
 successText: {
  marginTop: 10,
  paddingVertical: 6,
  paddingHorizontal: 12,
  fontSize: 13,
  color: '#15803D',
  backgroundColor: '#ECFDF5',
  borderRadius: 8,
  fontFamily: 'Poppins_600SemiBold_Italic',
  textAlign: 'center',
  overflow: 'hidden',
},


});
