import { Eye, EyeOff, HardDrive, Key, Lock, Shield, Smartphone, Wallet } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import TwoFactorAuthModal from '../components/auth/TwoFactorAuthModal';
import { useAuth } from '../contexts/AuthContext';
import { ledgerService } from '../services/ledger';

const AuthPage = () => {
  const navigate = useNavigate();
  const { signIn, isAuthenticated, userData } = useAuth();
  const [formData, setFormData] = useState({
    nodeId: '',
    password: '',
    stakerPassword: ''
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showWalletSelection, setShowWalletSelection] = useState(false);
  const [selectedWallet, setSelectedWallet] = useState<'ledger' | 'safepal' | 'keystone' | 'trezor' | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showStakerPassword, setShowStakerPassword] = useState(false);
  const [show2FAModal, setShow2FAModal] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      // Check if we need to show 2FA setup
      if (!userData?.has2FA && !userData?.last2FAPrompt) {
        setShow2FAModal(true);
      } else {
        navigate('/connect-wallet');
      }
    }
  }, [isAuthenticated, userData, navigate]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await signIn(formData);
    } catch (err) {
      setError('Invalid credentials. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleWalletSelect = async (wallet: 'ledger' | 'safepal' | 'keystone' | 'trezor') => {
    if (wallet === 'ledger') {
      try {
        await ledgerService.connect();
        const address = await ledgerService.getAddress();
        await ledgerService.authenticateWithBackend();
        navigate('/dashboard');
      } catch (err) {
        setError('Failed to connect to Ledger');
      }
    }
    setSelectedWallet(wallet);
  };

  const handle2FASuccess = () => {
    setShow2FAModal(false);
    navigate('/connect-wallet');
  };

  if (showWalletSelection) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black flex items-center justify-center p-4">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center">
            <div className="mb-6">
              <div className="w-16 h-16 bg-cyan-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Wallet className="w-8 h-8 text-cyan-400" />
              </div>
              <h2 className="text-3xl font-bold text-white mb-2">Select Wallet</h2>
              <p className="text-gray-400">Choose your preferred wallet to continue</p>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => handleWalletSelect('ledger')}
              className="p-4 bg-gray-800/50 border border-gray-700/50 rounded-xl hover:bg-gray-700/50 transition-colors"
            >
              <div className="flex flex-col items-center space-y-2">
                <HardDrive className="w-8 h-8 text-cyan-400" />
                <span className="text-white font-medium">Ledger</span>
              </div>
            </button>
            
            <button
              onClick={() => handleWalletSelect('safepal')}
              className="p-4 bg-gray-800/50 border border-gray-700/50 rounded-xl hover:bg-gray-700/50 transition-colors"
            >
              <div className="flex flex-col items-center space-y-2">
                <Smartphone className="w-8 h-8 text-blue-400" />
                <span className="text-white font-medium">SafePal</span>
              </div>
            </button>
            
            <button
              onClick={() => handleWalletSelect('keystone')}
              className="p-4 bg-gray-800/50 border border-gray-700/50 rounded-xl hover:bg-gray-700/50 transition-colors"
            >
              <div className="flex flex-col items-center space-y-2">
                <Shield className="w-8 h-8 text-purple-400" />
                <span className="text-white font-medium">Keystone</span>
              </div>
            </button>
            
            <button
              onClick={() => handleWalletSelect('trezor')}
              className="p-4 bg-gray-800/50 border border-gray-700/50 rounded-xl hover:bg-gray-700/50 transition-colors"
            >
              <div className="flex flex-col items-center space-y-2">
                <Wallet className="w-8 h-8 text-green-400" />
                <span className="text-white font-medium">Trezor</span>
              </div>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
        <div className="max-w-md w-full mx-4">
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-gray-700/50 p-8 shadow-2xl">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Shield className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">
                SafePal Authentication
              </h2>
              <p className="text-gray-400 text-sm">
                Enter your credentials to access the dashboard
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-4">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Key className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="nodeId"
                    name="nodeId"
                    type="text"
                    required
                    className="block w-full pl-10 pr-3 py-3 bg-gray-700/50 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    placeholder="Node ID"
                    value={formData.nodeId}
                    onChange={handleChange}
                  />
                </div>

                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    required
                    className="block w-full pl-10 pr-10 py-3 bg-gray-700/50 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    placeholder="Password"
                    value={formData.password}
                    onChange={handleChange}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5 text-gray-400" />
                    ) : (
                      <Eye className="h-5 w-5 text-gray-400" />
                    )}
                  </button>
                </div>

                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Shield className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="stakerPassword"
                    name="stakerPassword"
                    type={showStakerPassword ? "text" : "password"}
                    required
                    className="block w-full pl-10 pr-10 py-3 bg-gray-700/50 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    placeholder="Staker Password"
                    value={formData.stakerPassword}
                    onChange={handleChange}
                  />
                  <button
                    type="button"
                    onClick={() => setShowStakerPassword(!showStakerPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  >
                    {showStakerPassword ? (
                      <EyeOff className="h-5 w-5 text-gray-400" />
                    ) : (
                      <Eye className="h-5 w-5 text-gray-400" />
                    )}
                  </button>
                </div>
              </div>

              {error && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-500 text-sm rounded-xl p-3 text-center">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 px-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl font-medium hover:from-blue-600 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-800 transition-all transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto" />
                ) : (
                  'Sign in'
                )}
              </button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-400">
                Secure authentication powered by SafePal
              </p>
            </div>
          </div>
        </div>
      </div>

      <TwoFactorAuthModal
        isOpen={show2FAModal}
        onClose={() => setShow2FAModal(false)}
        onSuccess={handle2FASuccess}
      />
    </>
  );
};

export default AuthPage; 