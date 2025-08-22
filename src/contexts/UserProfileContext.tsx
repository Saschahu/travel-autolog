import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Preferences } from '@capacitor/preferences';
import { ReportSignature } from '@/types/signature';

export interface UserProfile {
  name: string;
  homeAddress: string;
  email: string;
  preferredEmailApp: string;
  preferredLanguage: 'en' | 'de' | 'no';
  gpsEnabled: boolean;
  localStoragePath: string;
  signature?: string; // Base64 encoded image (deprecated)
  signatureImage?: string; // Base64 encoded signature image (deprecated)
  reportSignature?: ReportSignature | null; // New signature system
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
  localStoragePath: '',
  signature: undefined,
  signatureImage: undefined,
  reportSignature: null
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

  console.log('UserProfileProvider render:', { isLoading });

  // Load profile on mount
  useEffect(() => {
    console.log('UserProfileProvider: useEffect triggered');
    loadProfile();
  }, []);

  const loadProfile = async () => {
    console.log('UserProfile: Loading profile...');
    const storageKey = 'userProfile';
    try {
      let value: string | null = null;
      try {
        const res = await Preferences.get({ key: storageKey });
        value = res.value ?? null;
        console.log('UserProfile: Got from Capacitor:', value);
      } catch (e) {
        console.warn('UserProfile: Capacitor Preferences.get failed, falling back to localStorage', e);
        value = localStorage.getItem(storageKey);
      }
      // Extra fallback in case value is still null
      if (!value) {
        value = localStorage.getItem(storageKey);
        console.log('UserProfile: Got from localStorage fallback:', value);
      }
      if (value) {
        const savedProfile = JSON.parse(value);
        console.log('UserProfile: Parsed saved profile:', savedProfile);
        setProfile({ ...defaultProfile, ...savedProfile });
        console.log('UserProfile: Profile loaded successfully');
      } else {
        console.log('UserProfile: No saved profile, using defaults');
      }
    } catch (error) {
      console.error('UserProfile: Error loading profile:', error);
    } finally {
  console.log('UserProfile: Setting loading to false');
      setIsLoading(false);
    }
  };

  // Safety timeout to prevent infinite loading
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (isLoading) {
        console.warn('UserProfile: Loading timeout, forcing completion');
        setIsLoading(false);
      }
    }, 3000);
    
    return () => clearTimeout(timeout);
  }, [isLoading]);

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