import { Stack } from 'expo-router';

export default function ProfileStack() {
  return (
    <Stack
      detachInactiveScreens={false}  // ← Yeh sabse important line – blank screen fix karta hai
      screenOptions={{
        headerStyle: { backgroundColor: '#f8f9fa' },
        headerTintColor: '#333',
        animation: 'slide_from_right',  // optional, agar default animation issue de toh 'none' try kar sakte ho
      }}
    >
      <Stack.Screen name="index" options={{ title: 'Profile' }} />
   
    </Stack>
  );
}