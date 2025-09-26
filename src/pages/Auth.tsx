import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/auth-context.helpers';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Fingerprint, Mail, Lock, User, Building2, Smartphone } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const Auth = () => {
  const { signIn, signUp, user, authenticateWithBiometrics, loading } = useAuth();
  const navigate = useNavigate();
  
  const [loginData, setLoginData] = useState({
    email: '',
    password: ''
  });
  
  const [signupData, setSignupData] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    company: ''
  });

  const [isLoading, setIsLoading] = useState(false);
  const [showBiometrics, setShowBiometrics] = useState(false);

  useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);

  useEffect(() => {
    // Check if returning user should use biometrics
    const hasUsedBiometrics = localStorage.getItem('biometrics_enabled');
    if (hasUsedBiometrics && !user) {
      setShowBiometrics(true);
    }
  }, [user]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    const { error } = await signIn(loginData.email, loginData.password);
    
    if (!error) {
      // Enable biometrics for future logins
      localStorage.setItem('biometrics_enabled', 'true');
    }
    
    setIsLoading(false);
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    await signUp(signupData.email, signupData.password, signupData.firstName, signupData.lastName);
    setIsLoading(false);
  };

  const handleBiometricAuth = async () => {
    setIsLoading(true);
    const success = await authenticateWithBiometrics();
    
    if (success) {
      // After successful biometric auth, perform automatic login with stored credentials
      // In a real app, you'd have secure token storage here
      const storedEmail = localStorage.getItem('user_email');
      if (storedEmail) {
        // This would typically use a secure token, not password
        console.log('Biometric auth successful for user:', storedEmail);
        navigate('/');
      }
    }
    setIsLoading(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/20 to-secondary/20">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/20 to-secondary/20 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <div className="flex items-center justify-center mb-4">
            <Smartphone className="h-8 w-8 text-primary mr-2" />
            <h1 className="text-2xl font-bold">Travel AutoLog</h1>
          </div>
          <p className="text-muted-foreground">
            Sichere Arbeitszeit-Erfassung mit biometrischer Authentifizierung
          </p>
        </CardHeader>
        
        <CardContent>
          {showBiometrics ? (
            <div className="space-y-4 text-center">
              <Fingerprint className="h-16 w-16 text-primary mx-auto" />
              <h3 className="text-lg font-semibold">Biometrische Anmeldung</h3>
              <p className="text-sm text-muted-foreground">
                Verwende deinen Fingerabdruck oder Gesichtserkennung für schnellen und sicheren Zugang
              </p>
              <Button 
                onClick={handleBiometricAuth}
                disabled={isLoading}
                className="w-full"
                size="lg"
              >
                <Fingerprint className="h-5 w-5 mr-2" />
                {isLoading ? 'Authentifiziere...' : 'Mit Biometrie anmelden'}
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setShowBiometrics(false)}
                className="w-full"
              >
                Passwort verwenden
              </Button>
            </div>
          ) : (
            <Tabs defaultValue="login" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login">Anmelden</TabsTrigger>
                <TabsTrigger value="signup">Registrieren</TabsTrigger>
              </TabsList>
              
              <TabsContent value="login" className="space-y-4">
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="login-email">E-Mail</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="login-email"
                        type="email"
                        placeholder="deine@email.com"
                        value={loginData.email}
                        onChange={(e) => setLoginData(prev => ({ ...prev, email: e.target.value }))}
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="login-password">Passwort</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="login-password"
                        type="password"
                        placeholder="••••••••"
                        value={loginData.password}
                        onChange={(e) => setLoginData(prev => ({ ...prev, password: e.target.value }))}
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>
                  
                  <Button type="submit" disabled={isLoading} className="w-full">
                    {isLoading ? 'Anmeldung...' : 'Anmelden'}
                  </Button>
                </form>
              </TabsContent>
              
              <TabsContent value="signup" className="space-y-4">
                <form onSubmit={handleSignup} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="signup-firstname">Vorname</Label>
                      <div className="relative">
                        <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="signup-firstname"
                          type="text"
                          placeholder="Max"
                          value={signupData.firstName}
                          onChange={(e) => setSignupData(prev => ({ ...prev, firstName: e.target.value }))}
                          className="pl-10"
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="signup-lastname">Nachname</Label>
                      <Input
                        id="signup-lastname"
                        type="text"
                        placeholder="Mustermann"
                        value={signupData.lastName}
                        onChange={(e) => setSignupData(prev => ({ ...prev, lastName: e.target.value }))}
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="signup-company">Firma (optional)</Label>
                    <div className="relative">
                      <Building2 className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="signup-company"
                        type="text"
                        placeholder="Deine Firma GmbH"
                        value={signupData.company}
                        onChange={(e) => setSignupData(prev => ({ ...prev, company: e.target.value }))}
                        className="pl-10"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="signup-email">E-Mail</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="signup-email"
                        type="email"
                        placeholder="deine@email.com"
                        value={signupData.email}
                        onChange={(e) => setSignupData(prev => ({ ...prev, email: e.target.value }))}
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="signup-password">Passwort</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="signup-password"
                        type="password"
                        placeholder="••••••••"
                        value={signupData.password}
                        onChange={(e) => setSignupData(prev => ({ ...prev, password: e.target.value }))}
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>
                  
                  <Button type="submit" disabled={isLoading} className="w-full">
                    {isLoading ? 'Registrierung...' : 'Registrieren'}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          )}
        </CardContent>
      </Card>
    </div>
  );
};