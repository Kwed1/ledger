import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { ledgerService } from '../services/ledger';
import { Shield, Wallet, Lock, Key, Eye, EyeOff, ArrowRight } from 'lucide-react';

const AuthPage = () => {
  const navigate = useNavigate();
  const { signIn, isAuthenticated } = useAuth();
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

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/connect-wallet');
    }
  }, [isAuthenticated, navigate]);

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
      await signIn({
        nodeId: formData.nodeId,
        password: formData.password,
        stakerPassword: formData.stakerPassword
      });
    } catch (err) {
      setError('Invalid credentials. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleWalletSelect = async (wallet: 'ledger' | 'safepal' | 'keystone' | 'trezor') => {
    if (wallet === 'ledger') {
      try {
        setIsLoading(true);
        await ledgerService.connect();
        const address = await ledgerService.getAddress();
        await ledgerService.authenticateWithBackend();
        setSelectedWallet(wallet);
        navigate('/dashboard');
      } catch (err) {
        setError('Failed to connect to Ledger. Please make sure your device is connected and unlocked.');
      } finally {
        setIsLoading(false);
      }
    } else {
      setSelectedWallet(wallet);
    }
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
              className="group flex flex-col items-center justify-center p-6 bg-gray-800/50 backdrop-blur-sm rounded-xl hover:bg-gray-700/50 transition-all duration-300 border border-gray-700/50 hover:border-cyan-500/50"
            >
              <div className="w-12 h-12 bg-cyan-500/10 rounded-full flex items-center justify-center mb-3 group-hover:bg-cyan-500/20 transition-colors">
                <Wallet className="w-6 h-6 text-cyan-400" />
              </div>
              <span className="text-white font-medium">Ledger</span>
              <span className="text-xs text-gray-400 mt-1">Hardware Wallet</span>
            </button>
            
            <button
              disabled
              className="group flex flex-col items-center justify-center p-6 bg-gray-800/50 backdrop-blur-sm rounded-xl opacity-50 cursor-not-allowed border border-gray-700/50"
            >
              <div className="w-12 h-12 bg-gray-700/50 rounded-full flex items-center justify-center mb-3">
                <Shield className="w-6 h-6 text-gray-400" />
              </div>
              <span className="text-gray-400 font-medium">SafePal</span>
              <span className="text-xs text-gray-500 mt-1">Coming Soon</span>
            </button>
            
            <button
              disabled
              className="group flex flex-col items-center justify-center p-6 bg-gray-800/50 backdrop-blur-sm rounded-xl opacity-50 cursor-not-allowed border border-gray-700/50"
            >
              <div className="w-12 h-12 bg-gray-700/50 rounded-full flex items-center justify-center mb-3">
                <Key className="w-6 h-6 text-gray-400" />
              </div>
              <span className="text-gray-400 font-medium">Keystone</span>
              <span className="text-xs text-gray-500 mt-1">Coming Soon</span>
            </button>
            
            <button
              disabled
              className="group flex flex-col items-center justify-center p-6 bg-gray-800/50 backdrop-blur-sm rounded-xl opacity-50 cursor-not-allowed border border-gray-700/50"
            >
              <div className="w-12 h-12 bg-gray-700/50 rounded-full flex items-center justify-center mb-3">
                <Lock className="w-6 h-6 text-gray-400" />
              </div>
              <span className="text-gray-400 font-medium">Trezor</span>
              <span className="text-xs text-gray-500 mt-1">Coming Soon</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
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

          <form className="space-y-6" onSubmit={handleSubmit}>
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
                  type="password"
                  required
                  className="block w-full pl-10 pr-3 py-3 bg-gray-700/50 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="Password"
                  value={formData.password}
                  onChange={handleChange}
                />
              </div>

              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Shield className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="stakerPassword"
                  name="stakerPassword"
                  type="password"
                  required
                  className="block w-full pl-10 pr-3 py-3 bg-gray-700/50 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="Staker Password"
                  value={formData.stakerPassword}
                  onChange={handleChange}
                />
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
  );
};

export default AuthPage; 