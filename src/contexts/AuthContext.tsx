import { Secret, TOTP } from 'otpauth'
import React, { createContext, useContext, useEffect, useState } from 'react'

interface UserData {
  balances: Array<{
    coinId: string;
    amount: number;
  }>;
  has2FA: boolean;
  twoFactorSecret?: string;
  twoFactorEnabled: boolean;
  last2FAPrompt?: string;
  ledgerAddress?: string;
}

interface AuthContextType {
  isAuthenticated: boolean;
  user: any;
  userData: UserData | null;
  signIn: (credentials: { nodeId: string; password: string; stakerPassword: string }) => Promise<void>;
  signOut: () => void;
  updateBalance: (balances: UserData['balances']) => void;
  selectedWallet: string | null;
  isLedgerConnected: boolean;
  setSelectedWallet: (wallet: string) => void;
  setLedgerConnected: (connected: boolean) => void;
  setup2FA: () => Promise<{ secret: string; qrCode: string }>;
  verify2FA: (code: string) => Promise<boolean>;
  skip2FA: () => Promise<void>;
  enable2FA: (secret: string, code: string) => Promise<void>;
  disable2FA: (code: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [selectedWallet, setSelectedWallet] = useState<string | null>(null);
  const [isLedgerConnected, setLedgerConnected] = useState(false);

  useEffect(() => {
    // Check for existing session
    const session = localStorage.getItem('authSession');
    if (session) {
      const { user, userData, timestamp } = JSON.parse(session);
      const now = new Date().getTime();
      if (now - timestamp < 24 * 60 * 60 * 1000) { // 24 hours
        setUser(user);
        setUserData(userData);
        setIsAuthenticated(true);
      } else {
        localStorage.removeItem('authSession');
      }
    }
  }, []);

  const signIn = async (credentials: { nodeId: string; password: string; stakerPassword: string }) => {
    try {
      // Here you would typically make an API call to authenticate
      const user = {
        nodeId: credentials.nodeId,
        // Add other user data as needed
      };

      const userData: UserData = {
        balances: [],
        has2FA: false,
        twoFactorEnabled: false,
        // Add other user data as needed
      };

      // Check if user has 2FA enabled
      if (userData.twoFactorEnabled && userData.twoFactorSecret) {
        // In a real implementation, you would verify the 2FA code here
        const isVerified = await verify2FA('123456'); // This should be the actual code from the user
        if (!isVerified) {
          throw new Error('Invalid 2FA code');
        }
      }

      setUser(user);
      setUserData(userData);
      setIsAuthenticated(true);

      // Save session to localStorage
      localStorage.setItem('authSession', JSON.stringify({
        user,
        userData,
        timestamp: new Date().getTime()
      }));
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
      // Generate a new TOTP instance
      const totp = new TOTP({
        issuer: 'YourApp',
        label: user?.nodeId || 'user',
        algorithm: 'SHA1',
        digits: 6,
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
      if (!userData?.twoFactorSecret) {
        throw new Error('No 2FA secret found');
      }

      // Create a TOTP instance with the stored secret
      const totp = new TOTP({
        issuer: 'YourApp',
        label: user?.nodeId || 'user',
        algorithm: 'SHA1',
        digits: 6,
        period: 30,
        secret: userData.twoFactorSecret
      });

      // Validate the code
      const delta = totp.validate({ token: code, window: 1 });
      return delta !== null;
    } catch (error) {
      console.error('Error verifying 2FA:', error);
      throw error;
    }
  };

  const skip2FA = async () => {
    try {
      if (userData) {
        const updatedUserData = {
          ...userData,
          last2FAPrompt: new Date().toISOString()
        };
        setUserData(updatedUserData);
        // In a real implementation, this would update the user data in your backend
      }
    } catch (error) {
      console.error('Error skipping 2FA:', error);
      throw error;
    }
  };

  const enable2FA = async (secret: string, code: string) => {
    try {
      // Create a TOTP instance with the provided secret
      const totp = new TOTP({
        issuer: 'YourApp',
        label: user?.nodeId || 'user',
        algorithm: 'SHA1',
        digits: 6,
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
          has2FA: true,
          twoFactorEnabled: true,
          twoFactorSecret: secret
        };
        setUserData(updatedUserData);
        // In a real implementation, this would update the user data in your backend
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

      // Create a TOTP instance with the stored secret
      const totp = new TOTP({
        issuer: 'YourApp',
        label: user?.nodeId || 'user',
        algorithm: 'SHA1',
        digits: 6,
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
          has2FA: false,
          twoFactorEnabled: false,
          twoFactorSecret: undefined
        };
        setUserData(updatedUserData);
        // In a real implementation, this would update the user data in your backend
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
      disable2FA
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