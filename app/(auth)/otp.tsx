import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { useSession } from '@/contexts/SessionContext';
import { loginUser, verifyOtp } from '@/services/auth';
import { getOnboarding } from '@/services/protected';

const OTP_LENGTH = 6;
const RESEND_SECONDS = 30;

export default function OtpVerificationScreen() {
  const router = useRouter();
  const { phone } = useLocalSearchParams<{ phone: string }>();
  const { login , saveOnboarding } = useSession();

  const [otp, setOtp] = useState<string[]>(Array(OTP_LENGTH).fill(''));
  const [countdown, setCountdown] = useState(RESEND_SECONDS);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState('');
  const [focusedIndex, setFocusedIndex] = useState<number | null>(null);

  const inputRefs = useRef<TextInput[]>([]);
  const shakeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setInterval(() => {
      setCountdown(prev => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [countdown]);

  useEffect(() => {
    if (!error) return;

    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 10, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 6, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 50, useNativeDriver: true }),
    ]).start();
  }, [error]);

  const handleChange = (text: string, index: number) => {
    setError('');
    if (text && !/^\d$/.test(text)) return;

    const nextOtp = [...otp];
    nextOtp[index] = text;
    setOtp(nextOtp);

    if (text && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleBackspace = (index: number) => {
    if (otp[index] === '' && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const onVerifyPress = async () => {
      if (otp.join('').length < OTP_LENGTH) {
        setError('Please enter the complete OTP');
        return;
      }

      try {
        setVerifying(true);
        setError('');

        const response = await verifyOtp({
          phone,
          otp: otp.join(''),
        });

        if (!response?.success) {
          setError(response?.message || 'Invalid OTP or server error');
          setVerifying(false);
          return;
        }

        const token = response.data.token;
        const user = response.data.user;

        await login(token, user);

        setVerifying(false);

        // ────────────────────────────────
        //   Try local cache first
        // ────────────────────────────────
        const cached = await AsyncStorage.getItem('onboardingData');
        if (cached) {
          try {
            const parsed = JSON.parse(cached);
            if (parsed?.business_type) {
              router.replace('/(tabs)');
              return;
            }
          } catch {}
        }

        // No valid cache → check server
        try {
          const onboardingRes = await getOnboarding();

          if (onboardingRes?.success && onboardingRes?.onboarding) {
            await saveOnboarding(onboardingRes.onboarding);
            router.replace('/(tabs)');
          } else {
            router.replace('/(auth)/onboarding');
          }
        } catch (statusErr: any) {
          console.error('onboarding status check failed:', statusErr);

          let msg = 'Unable to load your business setup.';
          if (statusErr?.response?.status === 401) {
            msg = 'Session issue detected. Completing setup again...';
          }
          setError(msg);
          router.replace('/(auth)/onboarding');
        }

      } catch (err: any) {
        //console.error('OTP error:', err);
        const message =
          err?.response?.data?.message ||
          err?.message ||
          'Network or server error. Please try again.';
        setError(message);
        setVerifying(false);
      }
    };

  const onResendPress = async () => {
    if (countdown > 0) return;

    try {
      setError('');
      setOtp(Array(OTP_LENGTH).fill(''));

      await loginUser({ phone });

      setCountdown(RESEND_SECONDS);
      inputRefs.current[0]?.focus();
    } catch (err) {
      console.log(err);
      setError('Failed to resend OTP. Try again.');
    }
  };

  const isReady = otp.every(v => v !== '');

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Animated.View style={[styles.card, { transform: [{ translateX: shakeAnim }] }]}>
        <Text style={styles.title}>Verify your mobile number</Text>
        <Text style={styles.subtitle}>
          Enter the 6-digit code sent to your phone
        </Text>

        <View style={styles.otpRow}>
          {otp.map((digit, i) => (
            <TextInput
              key={i}
              ref={ref => ref && (inputRefs.current[i] = ref)}
              style={[
                styles.otpCell,
                digit && styles.otpFilled,
                focusedIndex === i && styles.otpFocused,
                error && styles.otpError,
              ]}
              value={digit}
              onFocus={() => setFocusedIndex(i)}
              onBlur={() => setFocusedIndex(null)}
              onChangeText={text => handleChange(text, i)}
              onKeyPress={({ nativeEvent }) =>
                nativeEvent.key === 'Backspace' && handleBackspace(i)
              }
              keyboardType="number-pad"
              maxLength={1}
              autoFocus={i === 0}
              textAlign="center"
              caretHidden
              textContentType="oneTimeCode"
            />
          ))}
        </View>

        {!!error && <Text style={styles.errorText}>{error}</Text>}

        <Pressable
          style={[styles.button, isReady && !verifying && styles.buttonActive]}
          disabled={!isReady || verifying}
          onPress={onVerifyPress}
        >
          <Text style={styles.buttonText}>
            {verifying ? 'Verifying…' : 'Continue'}
          </Text>
        </Pressable>

        <View style={styles.divider} />

        <View style={styles.resendArea}>
          {countdown > 0 ? (
            <Text style={styles.resendText}>
              Didn’t receive the code?{' '}
              <Text style={styles.timer}>Resend in {countdown}s</Text>
            </Text>
          ) : (
            <Pressable onPress={onResendPress}>
              <Text style={styles.resendLink}>Resend OTP</Text>
            </Pressable>
          )}
        </View>
      </Animated.View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 24,
    justifyContent: 'center',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 28,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 10,
  },
  title: {
    fontSize: 20,
    fontFamily: 'Poppins_600SemiBold_Italic',
    color: '#0F172A',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    fontFamily: 'Poppins_400Regular_Italic',
    color: '#64748B',
    textAlign: 'center',
    marginTop: 6,
    marginBottom: 32,
    lineHeight: 20,
  },
  otpRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 9,
    marginBottom: 14,
  },
  otpCell: {
    width: 44,
    height: 52,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#cbd5e1ce',
    backgroundColor: '#FFFFFF',
    fontSize: 20,
    fontFamily: 'Poppins_600SemiBold_Italic',
    color: '#0F172A',
    paddingVertical: 0,
  },
  otpFocused: {
    borderColor: '#6491f37a',
  },
  otpFilled: {
    borderColor: '#6491f37a',
    backgroundColor: '#F0F7FF',
    color: '#2563EB',
  },
  otpError: {
    borderColor: '#dc262660',
  },
  errorText: {
    fontSize: 13,
    fontFamily: 'Poppins_400Regular_Italic',
    color: '#DC2626',
    textAlign: 'center',
    marginBottom: 16,
  },
  button: {
    height: 48,
    borderRadius: 12,
    backgroundColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  buttonActive: {
    backgroundColor: '#2563EB',
  },
  buttonText: {
    fontSize: 15,
    fontFamily: 'Poppins_600SemiBold_Italic',
    color: '#FFFFFF',
  },
  divider: {
    height: 1,
    backgroundColor: '#E2E8F0',
    marginVertical: 12,
  },
  resendArea: {
    alignItems: 'center',
    paddingTop: 4,
  },
  resendText: {
    fontSize: 13,
    fontFamily: 'Poppins_400Regular_Italic',
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 18,
  },
  timer: {
    fontFamily: 'Poppins_600SemiBold_Italic',
    color: '#0F172A',
  },
  resendLink: {
    fontSize: 13,
    fontFamily: 'Poppins_600SemiBold_Italic',
    color: '#2563EB',
  },
});