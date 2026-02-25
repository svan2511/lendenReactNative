import { useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { useSession } from '@/contexts/SessionContext';
import { submitOnboarding } from '@/services/protected';
import { useRouter } from 'expo-router';

const { width } = Dimensions.get('window');

const PRIMARY = '#0EA5A4';
const PRIMARY_LIGHT = '#E6FFFA';
const TEXT_DARK = '#0F172A';
const TEXT_MUTED = '#64748B';
const BORDER = '#E2E8F0';
const BG = '#F1F5F9';

export default function OnboardingScreen() {
  const { saveOnboarding } = useSession();
  const router = useRouter();

  const [businessType, setBusinessType] = useState<string | null>(null);
  const [hasStock, setHasStock] = useState<boolean | null>(null);
  const [hasAppointments, setHasAppointments] = useState<boolean | null>(null);
  const [hasStaff, setHasStaff] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const isFormComplete =
    businessType !== null &&
    hasStock !== null &&
    hasAppointments !== null;

 const handleSubmit = async () => {
    if (!isFormComplete || loading) return;

    setErrorMessage(null);
    setLoading(true);

    try {
      const payload = {
        business_type: businessType!,
        has_stock: hasStock!,
        has_appointments: hasAppointments!,
        has_staff: hasStaff ?? false,
      };

      const res = await submitOnboarding(payload);

      if (!res?.success) {
        setErrorMessage(res?.message || 'Failed to save your preferences');
        return;
      }

      // Save the exact data we just sent (fast & reliable)
      await saveOnboarding(payload);

      router.replace('/(tabs)');

    } catch (e: any) {
      //console.error('Onboarding submit failed:', e);

      const msg =
        e?.response?.data?.message ||
        e?.message ||
        'Something went wrong while saving. Please try again.';

      setErrorMessage(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.welcomeTitle}>Welcome 👋</Text>
        <Text style={styles.welcomeSubtitle}>
          Let’s quickly tailor the app for your business.
        </Text>

        <View style={styles.formCard}>
          <Text style={styles.questionLabel}>
            1. What kind of business do you have?
          </Text>

          <View style={styles.options}>
            {[
              { label: 'Selling products (shop, retail)', value: 'product' },
              { label: 'Offering services (repair, teaching)', value: 'service' },
              { label: 'Both products + services', value: 'both' },
              { label: 'Freelance or consulting', value: 'freelance' },
            ].map((opt) => (
              <TouchableOpacity
                key={opt.value}
                style={[
                  styles.optionItem,
                  businessType === opt.value && styles.optionSelected,
                ]}
                onPress={() => setBusinessType(opt.value)}
              >
                <Text
                  style={[
                    styles.optionTxt,
                    businessType === opt.value && styles.optionTxtSelected,
                  ]}
                >
                  {opt.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.questionLabel}>
            2. Do you keep stock / inventory?
          </Text>

          <View style={styles.yesNoRow}>
            {[true, false].map((val) => (
              <TouchableOpacity
                key={String(val)}
                style={[
                  styles.yesNoBtn,
                  hasStock === val && styles.yesNoSelected,
                ]}
                onPress={() => setHasStock(val)}
              >
                <Text
                  style={[
                    styles.yesNoTxt,
                    hasStock === val && styles.yesNoTxtSelected,
                  ]}
                >
                  {val ? 'Yes' : 'No'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.questionLabel}>
            3. Do customers book appointments?
          </Text>

          <View style={styles.yesNoRow}>
            {[true, false].map((val) => (
              <TouchableOpacity
                key={String(val)}
                style={[
                  styles.yesNoBtn,
                  hasAppointments === val && styles.yesNoSelected,
                ]}
                onPress={() => setHasAppointments(val)}
              >
                <Text
                  style={[
                    styles.yesNoTxt,
                    hasAppointments === val && styles.yesNoTxtSelected,
                  ]}
                >
                  {val ? 'Yes' : 'No'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.questionLabel}>
            4. Do you have staff? (optional)
          </Text>

          <View style={styles.yesNoRow}>
            {[true, false].map((val) => (
              <TouchableOpacity
                key={String(val)}
                style={[
                  styles.yesNoBtn,
                  hasStaff === val && styles.yesNoSelected,
                ]}
                onPress={() => setHasStaff(val)}
              >
                <Text
                  style={[
                    styles.yesNoTxt,
                    hasStaff === val && styles.yesNoTxtSelected,
                  ]}
                >
                  {val ? 'Yes' : 'No'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity
            style={[
              styles.submitBtn,
              isFormComplete && styles.submitActive,
            ]}
            disabled={!isFormComplete || loading}
            onPress={handleSubmit}
          >

            {errorMessage && (
              <Text style={{ color: 'red', textAlign: 'center', marginVertical: 12, fontSize: 14 }}>
                {errorMessage}
              </Text>
            )}


            
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.submitTxt}>Continue</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG },

  content: {
    paddingHorizontal: 18,
    paddingTop: 70,
    paddingBottom: 100,
  },

  welcomeTitle: {
    fontSize: 30,
    fontFamily: 'Poppins_700Bold_Italic',
    color: TEXT_DARK,
    textAlign: 'center',
    marginBottom: 8,
  },

  welcomeSubtitle: {
    fontSize: 16,
    fontFamily: 'Poppins_400Regular_Italic',
    color: TEXT_MUTED,
    textAlign: 'center',
    marginBottom: 30,
  },

  formCard: {
    width: width - 24,
    alignSelf: 'center',
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: BORDER,
  },

  questionLabel: {
    fontSize: 15,
    fontFamily: 'Poppins_600SemiBold_Italic',
    color: TEXT_DARK,
    marginBottom: 14,
    marginTop: 28,
  },

  options: { gap: 14 },

  optionItem: {
    paddingVertical: 15,
    paddingHorizontal: 18,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: BORDER,
  },

  optionSelected: {
    backgroundColor: PRIMARY_LIGHT,
    borderColor: PRIMARY,
  },

  optionTxt: {
    fontSize: 15,
    fontFamily: 'Poppins_400Regular_Italic',
    color: TEXT_MUTED,
  },

  optionTxtSelected: {
    color: PRIMARY,
    fontFamily: 'Poppins_600SemiBold_Italic',
  },

  yesNoRow: {
    flexDirection: 'row',
    gap: 14,
  },

  yesNoBtn: {
    flex: 1,
    paddingVertical: 15,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: BORDER,
    alignItems: 'center',
  },

  yesNoSelected: {
    backgroundColor: PRIMARY,
    borderColor: PRIMARY,
  },

  yesNoTxt: {
    fontSize: 15,
    fontFamily: 'Poppins_500Medium_Italic',
    color: TEXT_MUTED,
  },

  yesNoTxtSelected: {
    color: '#fff',
    fontFamily: 'Poppins_600SemiBold_Italic',
  },

  submitBtn: {
    marginTop: 45,
    height: 56,
    borderRadius: 16,
    backgroundColor: '#CBD5E1',
    justifyContent: 'center',
    alignItems: 'center',
  },

  submitActive: {
    backgroundColor: PRIMARY,
  },

  submitTxt: {
    fontSize: 16,
    fontFamily: 'Poppins_600SemiBold_Italic',
    color: '#fff',
  },
});