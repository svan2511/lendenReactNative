import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, ReactNode, useContext, useEffect, useState } from 'react';

export type OnboardingData = {
  business_type: string;
  has_stock: boolean;
  has_appointments: boolean;
  has_staff: boolean;
} | null;

export type ProfileData = {
  business_name: string;
  business_address: string;
} | null;


type SessionContextType = {
  isLoggedIn: boolean;
  sessionReady: boolean;
  onboarding: OnboardingData;
  isOnboarded: boolean;
  login: (token: string, user: any) => Promise<void>;
  saveOnboarding: (data: OnboardingData) => Promise<void>;
  saveProfileData: (data: ProfileData) => Promise<void>;
  logout: () => Promise<void>;
};

const SessionContext = createContext<SessionContextType | undefined>(undefined);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [onboarding, setOnboarding] = useState<OnboardingData>(null);
   const [profile, setProfile] = useState<ProfileData>(null);
  const [sessionReady, setSessionReady] = useState(false);

  useEffect(() => {
    const loadSession = async () => {
      try {
        const [token, userJson, onboardingJson] = await AsyncStorage.multiGet([
          'authToken',
          'user',
          'onboardingData',
        ]);

        setIsLoggedIn(!!token[1]);

        if (onboardingJson[1]) {
          try {
            setOnboarding(JSON.parse(onboardingJson[1]));
          } catch (parseErr) {
            console.warn('Invalid onboarding cache', parseErr);
          }
        }
      } catch (e) {
        console.error('Session load error:', e);
      } finally {
        setSessionReady(true);
      }
    };

    loadSession();
  }, []);

  const login = async (token: string, user: any) => {
    console.log('loggedin user token is :' , token);
    try {
      await AsyncStorage.multiSet([
        ['authToken', token],
        ['user', JSON.stringify(user)],
      ]);
      setIsLoggedIn(true);
    } catch (e) {
      console.error('Login save error:', e);
    }
  };

  const saveOnboarding = async (data: OnboardingData) => {
    if (!data) return;
    try {
      await AsyncStorage.setItem('onboardingData', JSON.stringify(data));
      setOnboarding(data);
    } catch (e) {
      console.error('Save onboarding error:', e);
    }
  };

  const saveProfileData = async (data: ProfileData) => {
    if (!data) return;
    try {
      await AsyncStorage.setItem('profiledata', JSON.stringify(data));
      setProfile(data);
    } catch (e) {
      console.error('Save Profile error:', e);
    }
  };

  const logout = async () => {
    try {
      await AsyncStorage.multiRemove(['authToken', 'user' , 'onboardingData','profiledata']);
      setIsLoggedIn(false);
      setOnboarding(null);
    } catch (e) {
      console.error('Logout error:', e);
    }
  };

  const isOnboarded = !!onboarding;

  return (
    <SessionContext.Provider
      value={{ isLoggedIn, sessionReady, onboarding, isOnboarded, login, saveOnboarding, logout , saveProfileData }}
    >
      {children}
    </SessionContext.Provider>
  );
}

export const useSession = () => {
  const context = useContext(SessionContext);
  if (!context) throw new Error('useSession must be used within SessionProvider');
  return context;
};