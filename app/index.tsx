// app/index.tsx
import { Redirect } from 'expo-router';
import { useEffect, useRef } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';

import { useSession } from '@/contexts/SessionContext';

export default function AuthGate() {
  const { sessionReady, isLoggedIn, isOnboarded } = useSession();
  const hasDecided = useRef(false);

  useEffect(() => {
    if (!sessionReady || hasDecided.current) return;

    hasDecided.current = true;

    console.log('[AuthGate] Deciding route → loggedIn:', isLoggedIn, 'onboarded:', isOnboarded);
  }, [sessionReady, isLoggedIn, isOnboarded]);

  if (!sessionReady) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#0EA5A4" />
        <Text style={{ marginTop: 16, color: '#0EA5A4' }}>Initializing session...</Text>
      </View>
    );
  }

  if (!isLoggedIn) {
    return <Redirect href="/(auth)" />;
  }

  if (!isOnboarded) {
    return <Redirect href="/(auth)/onboarding" />;
  }

  return <Redirect href="/(tabs)" />;
}