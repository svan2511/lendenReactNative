
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from "expo-router";
import Toast from 'react-native-toast-message';


const BASE_URL = 'http://192.168.1.5:8000/api'; // 👈 change once

//const BASE_URL = process.env.EXPO_PUBLIC_BASE_URL!;

type ApiMethod = 'GET' | 'POST' | 'PUT' | 'DELETE';



interface ApiOptions {
  method?: ApiMethod;
  body?: any;
  headers?: Record<string, string>;
}

export async function apiRequest<T = any>(
  endpoint: string,
  options: ApiOptions = {}
): Promise<T> {
  const { method = 'POST', body, headers } = options;

  try {
    const res = await fetch(`${BASE_URL}${endpoint}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    // ── Handle 401 Unauthorized ──
    if (res.status === 401) {
      // Clear auth token
     
     await AsyncStorage.multiRemove(['authToken', 'user']);
     console.log(res.status , "i am in 401 updated");
      // Show toast message
      Toast.show({
        type: 'error',
        text1: 'Session Expired',
        text2: 'Please login again',
        position: 'top',
        visibilityTime: 4000,
        autoHide: true,
      });
      
      router.replace('/(auth)'); // ← change to your exact login route (e.g. '/login' or '/auth/login')
      return { success: false, message: 'Session Expired' } as T;
    }

    const data = await res.json();

    return data as T;
  } catch (error) {
    console.log(error);
    throw new Error('Network error');
  }
}
