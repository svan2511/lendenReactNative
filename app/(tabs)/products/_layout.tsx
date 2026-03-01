import { useSession } from '@/contexts/SessionContext';
import { Stack } from 'expo-router';

export default function ProductStack() {
  const { onboarding } = useSession();
  const businessType = onboarding?.business_type ?? null;

  const screenTitle = businessType === 'service' ? 'Services' : 'Products';
  return (
    <Stack
      detachInactiveScreens={false}  // ← Yeh sabse important line – blank screen fix karta hai
      screenOptions={{
        headerStyle: { backgroundColor: '#f8f9fa' },
        headerTintColor: '#333',
        animation: 'slide_from_right',  // optional, agar default animation issue de toh 'none' try kar sakte ho
      }}
    >
      <Stack.Screen name="index" options={{ title: screenTitle }} />
     <Stack.Screen name="[id]" options={{ title: screenTitle }} />
     <Stack.Screen name="add-product" options={{ title: screenTitle }} />
      
    </Stack>
  );
}