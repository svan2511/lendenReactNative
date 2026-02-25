import { Stack } from 'expo-router';

export default function BillingStack() {
  return (
    <Stack
      detachInactiveScreens={false}  // ← Yeh sabse important line – blank screen fix karta hai
      screenOptions={{
        headerStyle: { backgroundColor: '#f8f9fa' },
        headerTintColor: '#333',
        animation: 'slide_from_right',  // optional, agar default animation issue de toh 'none' try kar sakte ho
      }}
    >
      <Stack.Screen name="index" options={{ title: 'Billing' }} />
      <Stack.Screen name="add-customer" options={{ title: 'Billing' }} />
      <Stack.Screen name="add-items" options={{ title: 'Add Items' }} />
      <Stack.Screen name="preview-invoice" options={{ title: 'Billing' }} />
      <Stack.Screen name="add-product" options={{ title: 'Billing' }} />
    </Stack>
  );
}