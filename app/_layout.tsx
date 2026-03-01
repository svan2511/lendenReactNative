// app/_layout.tsx
import {
  Poppins_400Regular,
  Poppins_400Regular_Italic,
  Poppins_600SemiBold,
  Poppins_600SemiBold_Italic,
  Poppins_700Bold,
  useFonts
} from '@expo-google-fonts/poppins';
//import AsyncStorage from '@react-native-async-storage/async-storage';
import { Slot } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { ActivityIndicator, Platform, Text, View } from 'react-native';


import { SessionProvider } from '@/contexts/SessionContext';
import Toast from 'react-native-toast-message';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_400Regular_Italic,
    Poppins_600SemiBold,
    Poppins_600SemiBold_Italic,
    Poppins_700Bold,
  });

//   const clearAllStorage = async () => {
//   try {
//     await AsyncStorage.clear();
//     console.log('AsyncStorage cleared successfully! All data deleted.');
//   } catch (e) {
//     console.error('Failed to clear AsyncStorage:', e);
//   }
// };

// // Call it (e.g. on component mount, or via a debug button)
// useEffect(() => {
//   clearAllStorage();
// }, []);

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#0EA5A4" />
      </View>
    );
  }

  return (
    <>
      <SessionProvider>
        <Slot />
      </SessionProvider>

      {/* Custom Toast - Only error type, bottom center */}
      <Toast
        position="bottom"
        bottomOffset={Platform.OS === 'ios' ? 100 : 120} // safe from home indicator / navigation bar
        visibilityTime={3000} // visible for 5 seconds
        autoHide={true}
        config={{
          error: ({ text1, text2 }) => (
            <View
              style={{
                backgroundColor: 'rgba(220, 38, 38, 0.94)', // semi-transparent strong red
                paddingVertical: 16,
                paddingHorizontal: 28,
                borderRadius: 20,
                minWidth: '80%',
                maxWidth: '92%',
                alignItems: 'center',
                justifyContent: 'center',
                borderWidth: 1,
                borderColor: '#b91c1c',
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 6 },
                shadowOpacity: 0.30,
                shadowRadius: 12,
                elevation: 10,
              }}
            >
              {/* Optional small warning icon (emoji or icon library) */}
              <Text style={{ fontSize: 24, marginBottom: 8 }}>⚠️</Text>

              <Text
                style={{
                  color: 'white',
                  fontSize: 16,
                  fontFamily: 'Poppins_600SemiBold',
                  textAlign: 'center',
                  marginBottom: 4,
                }}
              >
                {text1 || 'Error'}
              </Text>

              {text2 && (
                <Text
                  style={{
                    color: '#fee2e2',
                    fontSize: 14,
                    fontFamily: 'Poppins_400Regular',
                    textAlign: 'center',
                    lineHeight: 20,
                  }}
                >
                  {text2}
                </Text>
              )}
            </View>
          ),
          success: ({ text1, text2 }) => (
          <View
            style={{
              backgroundColor: 'rgba(16, 185, 129, 0.95)', // elegant emerald green
              paddingVertical: 16,
              paddingHorizontal: 28,
              borderRadius: 20,
              minWidth: '80%',
              maxWidth: '92%',
              alignItems: 'center',
              justifyContent: 'center',
              borderWidth: 1,
              borderColor: '#059669',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 6 },
              shadowOpacity: 0.25,
              shadowRadius: 12,
              elevation: 10,
            }}
          >
            {/* Success Icon */}
            <Text style={{ fontSize: 24, marginBottom: 8 }}>✅</Text>

            <Text
              style={{
                color: 'white',
                fontSize: 16,
                fontFamily: 'Poppins_600SemiBold',
                textAlign: 'center',
                marginBottom: 4,
              }}
            >
              {text1 || 'Success'}
            </Text>

            {text2 && (
              <Text
                style={{
                  color: '#d1fae5',
                  fontSize: 14,
                  fontFamily: 'Poppins_400Regular',
                  textAlign: 'center',
                  lineHeight: 20,
                }}
              >
                {text2}
              </Text>
            )}
          </View>
        ),
        }}
      />
    </>
  );
}