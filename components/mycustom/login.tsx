import { loginUser } from '@/services/auth';
import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Animated,
    Dimensions,
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

const { width } = Dimensions.get('window');

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

export default function LoginScreen() {
  const router = useRouter();

  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(40)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 700,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 700,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleContinue = async() => {
    setError('');

    if (phone.length !== 10) {
      setError('Enter a valid 10-digit mobile number');
      return;
    }
    try {
        setLoading(true);
    
      const response = await loginUser({
            phone
            });
    
        if ( !response.success) {
          setError(response.message || 'Something went wrong');
          setLoading(false);
          return;
        }
    
        // ✅ Success → go to login
        
        setTimeout(() => {
      setLoading(false);
            router.push({
        pathname: '/(auth)/otp',
        params: { phone },
        });
    }, 900);
    
      } catch (err) {
        console.log(err);
        setLoading(false);
        setError('Network error. Please try again.');
      }
   
  };

  const pressIn = () =>
    Animated.spring(scaleAnim, { toValue: 0.97, useNativeDriver: true }).start();
  const pressOut = () =>
    Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true }).start();

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <View style={styles.backgroundCircle1} />
        <View style={styles.backgroundCircle2} />

        <Animated.View
          style={[
            styles.wrapper,
            { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
          ]}
        >
          <View style={styles.card}>
            <Image
              source={require('../../assets/images/splash.png')}
              style={styles.logo}
              resizeMode="contain"
            />

            <Text style={styles.title}>Sign in to your account</Text>
            <Text style={styles.subtitle}>
              Enter your mobile number to continue
            </Text>

            <Text style={styles.label}>Mobile Number</Text>

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

            {!!error && <Text style={styles.error}>{error}</Text>}

            <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
              <TouchableOpacity
                activeOpacity={0.9}
                onPressIn={pressIn}
                onPressOut={pressOut}
                onPress={handleContinue}
                disabled={phone.length !== 10 || loading}
                style={[
                  styles.button,
                  phone.length === 10 && styles.buttonActive,
                ]}
              >
                {loading ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.buttonText}>Continue</Text>
                )}
              </TouchableOpacity>
            </Animated.View>

            <View style={styles.signupContainer}>
              <Text style={styles.signupText}>Don’t have an account? </Text>
              <Text
                style={styles.signupLink}
                onPress={() => router.push('/(auth)/RegisterScreen')}
              >
                Sign Up
              </Text>
            </View>
          </View>
        </Animated.View>
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
    marginTop: 24,
    height: 52,
    borderRadius: 14,
    backgroundColor: '#CBD5E1',
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

  backgroundCircle1: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: COLORS.primary,
    opacity: 0.05,
    top: -60,
    right: -60,
  },

  backgroundCircle2: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: COLORS.primaryDark,
    opacity: 0.05,
    bottom: -50,
    left: -50,
  },
});
