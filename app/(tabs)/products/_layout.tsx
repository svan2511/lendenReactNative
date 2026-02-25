import { Stack } from 'expo-router';

export default function ProductStack() {
  return (
    <Stack
      detachInactiveScreens={false}  // ← Yeh sabse important line – blank screen fix karta hai
      screenOptions={{
        headerStyle: { backgroundColor: '#f8f9fa' },
        headerTintColor: '#333',
        animation: 'slide_from_right',  // optional, agar default animation issue de toh 'none' try kar sakte ho
      }}
    >
      <Stack.Screen name="index" options={{ title: 'Products' }} />
     <Stack.Screen name="[id]" options={{ title: 'Single Product' }} />
     <Stack.Screen name="add-product" options={{ title: 'Add Product' }} />
      
    </Stack>
  );
}