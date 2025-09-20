import type { User, Session } from '@supabase/supabase-js';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  signUp: (email: string, password: string, firstName?: string, lastName?: string) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  authenticateWithBiometrics: () => Promise<boolean>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('Auth state changed:', event, session?.user?.id);
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string, firstName?: string, lastName?: string) => {
    const redirectUrl = `${window.location.origin}/`;
    
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          first_name: firstName,
          last_name: lastName,
        }
      }
    });

    if (error) {
      toast({
        title: 'Registrierung fehlgeschlagen',
        description: error.message,
        variant: 'destructive'
      });
    } else {
      toast({
        title: 'Registrierung erfolgreich',
        description: 'Bitte überprüfe deine E-Mail für die Bestätigung'
      });
    }

    return { error };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      toast({
        title: 'Anmeldung fehlgeschlagen',
        description: error.message,
        variant: 'destructive'
      });
    } else {
      toast({
        title: 'Anmeldung erfolgreich',
        description: 'Willkommen zurück!'
      });
    }

    return { error };
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Error signing out:', error);
      toast({
        title: 'Fehler beim Abmelden',
        description: error.message,
        variant: 'destructive'
      });
    } else {
      toast({
        title: 'Erfolgreich abgemeldet',
        description: 'Auf Wiedersehen!'
      });
    }
  };

  const authenticateWithBiometrics = async (): Promise<boolean> => {
    try {
      // For now, simulate biometric authentication (will be replaced with real implementation)
      const userConfirmed = window.confirm(
        "Biometrische Authentifizierung simuliert.\n\nIn der echten App würde hier Fingerabdruck/Gesichtserkennung verwendet werden.\n\nMöchtest du fortfahren?"
      );
      
      if (userConfirmed) {
        toast({
          title: 'Authentifizierung erfolgreich',
          description: 'Biometrische Anmeldung bestätigt (simuliert)'
        });
        return true;
      } else {
        toast({
          title: 'Authentifizierung abgebrochen',
          description: 'Biometrische Anmeldung abgebrochen',
          variant: 'destructive'
        });
        return false;
      }
    } catch (error) {
      console.error('Biometric authentication error:', error);
      toast({
        title: 'Authentifizierung nicht möglich',
        description: 'Biometrische Anmeldung nicht verfügbar',
        variant: 'destructive'
      });
      return false;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        signUp,
        signIn,
        signOut,
        authenticateWithBiometrics,
        loading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};