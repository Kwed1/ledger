import { Secret, TOTP } from 'otpauth'
import React, { createContext, useContext, useEffect, useState } from 'react'

interface UserData {
  balances: any[];
  has2FA: boolean;
  twoFactorEnabled: boolean;
  twoFactorSecret?: string;
  last2FAPrompt?: string;
  ledgerAddress?: string;
}

interface AuthContextType {
  isAuthenticated: boolean;
  user: any;
  userData: UserData | null;
  signIn: (credentials: { nodeId: string; password: string; stakerPassword: string }) => Promise<boolean>;
  signOut: () => void;
  updateBalance: (balances: UserData['balances']) => void;
  selectedWallet: string | null;
  isLedgerConnected: boolean;
  setSelectedWallet: (wallet: string | null) => void;
  setLedgerConnected: (connected: boolean) => void;
  setup2FA: () => Promise<{ secret: string; qrCode: string }>;
  verify2FA: (code: string) => Promise<boolean>;
  skip2FA: () => Promise<boolean>;
  enable2FA: (secret: string, code: string) => Promise<void>;
  disable2FA: (code: string) => Promise<void>;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [selectedWallet, setSelectedWallet] = useState<string | null>(null);
  const [isLedgerConnected, setLedgerConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for existing session
    const session = localStorage.getItem('authSession');
    if (session) {
      try {
        const { user, userData, timestamp } = JSON.parse(session);
        const now = new Date().getTime();
        if (now - timestamp < 10 * 60 * 1000) { // 10 minutes
          setUser(user);
          setUserData(userData);
          setIsAuthenticated(true);
        } else {
          // Session expired
          localStorage.removeItem('authSession');
          setUser(null);
          setUserData(null);
          setIsAuthenticated(false);
        }
      } catch (error) {
        console.error('Error parsing session:', error);
        localStorage.removeItem('authSession');
        setUser(null);
        setUserData(null);
        setIsAuthenticated(false);
      }
    }
    setIsLoading(false);
  }, []);

  const signIn = async (credentials: { nodeId: string; password: string; stakerPassword: string }) => {
    try {
      // Validate credentials
      if (credentials.nodeId !== 'user-6645' ||
          credentials.password !== 'zxfg554' ||
          credentials.stakerPassword !== 'pkygh465') {
        throw new Error('Invalid credentials');
      }

      const user = {
        nodeId: credentials.nodeId,
      };

      // Check if 2FA is already set up
      const twoFactorKey = localStorage.getItem('twoFactorKey');
      const has2FA = !!twoFactorKey;

      const userData: UserData = {
        balances: [],
        has2FA,
        twoFactorEnabled: has2FA,
        twoFactorSecret: twoFactorKey || undefined
      };

      setUser(user);
      setUserData(userData);

      // Save session to localStorage with 10-minute expiration
      localStorage.setItem('authSession', JSON.stringify({
        user,
        userData,
        timestamp: new Date().getTime()
      }));

      // If 2FA is enabled, we don't set isAuthenticated to true yet
      // It will be set to true only after successful 2FA verification
      if (has2FA) {
        setIsAuthenticated(false);
        return false; // Indicate that 2FA verification is needed
      } else {
        setIsAuthenticated(true);
        return true; // No 2FA needed
      }
    } catch (error) {
      console.error('Authentication error:', error);
      throw error;
    }
  };

  const signOut = () => {
    setUser(null);
    setUserData(null);
    setIsAuthenticated(false);
    setSelectedWallet(null);
    setLedgerConnected(false);
    localStorage.removeItem('authSession');
  };

  const updateBalance = (balances: UserData['balances']) => {
    setUserData(prev => prev ? {
      ...prev,
      balances
    } : null);
  };

  const setup2FA = async () => {
    try {
      const totp = new TOTP({
        issuer: 'YourApp',
        label: user?.nodeId || 'User',
        period: 30,
        secret: new Secret({ size: 20 }) // Generate a random 20-byte secret
      });

      const qrCode = totp.toString();
      
      return { secret: totp.secret.base32, qrCode };
    } catch (error) {
      console.error('Error setting up 2FA:', error);
      throw error;
    }
  };

  const verify2FA = async (code: string) => {
    try {
      const twoFactorKey = localStorage.getItem('twoFactorKey');
      if (!twoFactorKey) {
        throw new Error('No 2FA secret found');
      }

      const totp = new TOTP({
        issuer: 'YourApp',
        label: user?.nodeId || 'User',
        period: 30,
        secret: twoFactorKey
      });

      // Validate the code
      const delta = totp.validate({ token: code, window: 1 });
      if (delta !== null) {
        setIsAuthenticated(true);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error verifying 2FA:', error);
      throw error;
    }
  };

  const skip2FA = async () => {
    try {
      // Only allow skipping if 2FA is not set up
      const twoFactorKey = localStorage.getItem('twoFactorKey');
      if (!twoFactorKey) {
        setIsAuthenticated(true);
        return true;
      } else {
        throw new Error('2FA verification is required');
      }
    } catch (error) {
      console.error('Error skipping 2FA:', error);
      throw error;
    }
  };

  const enable2FA = async (secret: string, code: string) => {
    try {
      const totp = new TOTP({
        issuer: 'YourApp',
        label: user?.nodeId || 'User',
        period: 30,
        secret: secret
      });

      // Validate the code
      const delta = totp.validate({ token: code, window: 1 });
      if (delta === null) {
        throw new Error('Invalid 2FA code');
      }

      if (userData) {
        const updatedUserData = {
          ...userData,
          twoFactorEnabled: true,
          twoFactorSecret: secret
        };
        setUserData(updatedUserData);
      }
    } catch (error) {
      console.error('Error enabling 2FA:', error);
      throw error;
    }
  };

  const disable2FA = async (code: string) => {
    try {
      if (!userData?.twoFactorSecret) {
        throw new Error('No 2FA secret found');
      }

      const totp = new TOTP({
        issuer: 'YourApp',
        label: user?.nodeId || 'User',
        period: 30,
        secret: userData.twoFactorSecret
      });

      // Validate the code
      const delta = totp.validate({ token: code, window: 1 });
      if (delta === null) {
        throw new Error('Invalid 2FA code');
      }

      if (userData) {
        const updatedUserData = {
          ...userData,
          twoFactorEnabled: false,
          twoFactorSecret: undefined
        };
        setUserData(updatedUserData);
      }
    } catch (error) {
      console.error('Error disabling 2FA:', error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{
      isAuthenticated,
      user,
      userData,
      signIn,
      signOut,
      updateBalance,
      selectedWallet,
      isLedgerConnected,
      setSelectedWallet,
      setLedgerConnected,
      setup2FA,
      verify2FA,
      skip2FA,
      enable2FA,
      disable2FA,
      isLoading
    }}>
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