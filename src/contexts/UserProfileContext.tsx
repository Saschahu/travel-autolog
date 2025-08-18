import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Preferences } from '@capacitor/preferences';

export interface UserProfile {
  name: string;
  homeAddress: string;
  email: string;
  preferredEmailApp: string;
  preferredLanguage: 'en' | 'de' | 'no';
  gpsEnabled: boolean;
  localStoragePath: string;
}

interface UserProfileContextType {
  profile: UserProfile;
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
  isLoading: boolean;
}

const defaultProfile: UserProfile = {
  name: '',
  homeAddress: '',
  email: '',
  preferredEmailApp: 'default',
  preferredLanguage: 'de',
  gpsEnabled: false,
  localStoragePath: ''
};

const UserProfileContext = createContext<UserProfileContextType | undefined>(undefined);

export const useUserProfile = () => {
  const context = useContext(UserProfileContext);
  if (!context) {
    throw new Error('useUserProfile must be used within a UserProfileProvider');
  }
  return context;
};

interface UserProfileProviderProps {
  children: ReactNode;
}

export const UserProfileProvider: React.FC<UserProfileProviderProps> = ({ children }) => {
  const [profile, setProfile] = useState<UserProfile>(defaultProfile);
  const [isLoading, setIsLoading] = useState(true);

  // Load profile on mount
  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    const storageKey = 'userProfile';
    try {
      let value: string | null = null;
      try {
        const res = await Preferences.get({ key: storageKey });
        value = res.value ?? null;
      } catch (e) {
        console.warn('Capacitor Preferences.get failed, falling back to localStorage', e);
        value = localStorage.getItem(storageKey);
      }
      // Extra fallback in case value is still null
      if (!value) {
        value = localStorage.getItem(storageKey);
      }
      if (value) {
        const savedProfile = JSON.parse(value);
        setProfile({ ...defaultProfile, ...savedProfile });
      }
    } catch (error) {
      console.error('Error loading user profile:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateProfile = async (updates: Partial<UserProfile>) => {
    const storageKey = 'userProfile';
    console.log('updateProfile called with:', updates);
    try {
      const newProfile = { ...profile, ...updates };
      console.log('New profile:', newProfile);
      setProfile(newProfile);
      
      const serialized = JSON.stringify(newProfile);
      console.log('Serialized profile:', serialized);
      
      // Try Capacitor Preferences first, fallback to localStorage
      let saved = false;
      try {
        await Preferences.set({
          key: storageKey,
          value: serialized
        });
        console.log('Saved via Capacitor Preferences');
        saved = true;
      } catch (e) {
        console.warn('Capacitor Preferences.set failed:', e);
      }
      
      if (!saved) {
        localStorage.setItem(storageKey, serialized);
        console.log('Saved via localStorage fallback');
      }
      
      console.log('Profile update completed successfully');
    } catch (error) {
      console.error('Error saving user profile:', error);
      throw error;
    }
  };

  return (
    <UserProfileContext.Provider value={{ profile, updateProfile, isLoading }}>
      {children}
    </UserProfileContext.Provider>
  );
};