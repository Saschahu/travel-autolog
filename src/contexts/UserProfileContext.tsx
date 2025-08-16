import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Preferences } from '@capacitor/preferences';

export interface UserProfile {
  name: string;
  homeAddress: string;
  preferredLanguage: 'en' | 'de' | 'no';
  gpsEnabled: boolean;
}

interface UserProfileContextType {
  profile: UserProfile;
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
  isLoading: boolean;
}

const defaultProfile: UserProfile = {
  name: '',
  homeAddress: '',
  preferredLanguage: 'de',
  gpsEnabled: false
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
    try {
      const { value } = await Preferences.get({ key: 'userProfile' });
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
    try {
      const newProfile = { ...profile, ...updates };
      setProfile(newProfile);
      await Preferences.set({
        key: 'userProfile',
        value: JSON.stringify(newProfile)
      });
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