import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowDownToLine,
  Bluetooth,
  Eye,
  EyeOff,
  HardDrive,
  Lock,
  QrCode,
  Send,
  Shield,
  Smartphone,
  TrendingUp,
  Usb,
  Wallet,
  Wifi,
  Zap
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { ledgerService } from '../services/ledger';

const WalletConnectionPage = () => {
  const navigate = useNavigate();
  const { setSelectedWallet, setLedgerConnected } = useAuth();
  const [selectedConnection, setSelectedConnection] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'error' | 'searching'>('searching');
  const [error, setError] = useState('');
  const [deviceName, setDeviceName] = useState<string | null>(null);
  const [connectionStep, setConnectionStep] = useState<string>('');
  const [isBluetoothAvailable, setIsBluetoothAvailable] = useState<boolean | null>(null);

  const connectionMethods = [
    {
      id: 'bluetooth',
      name: 'Bluetooth',
      description: 'Connect via Bluetooth',
      icon: Bluetooth,
      available: true
    },
    {
      id: 'usb',
      name: 'USB',
      description: 'Connect via USB cable',
      icon: Usb,
      available: false
    },
    {
      id: 'wifi',
      name: 'Wi-Fi',
      description: 'Connect via Wi-Fi network',
      icon: Wifi,
      available: false
    }
  ];

  const checkBluetoothAvailability = async () => {
    try {
      if (!navigator.bluetooth) {
        setIsBluetoothAvailable(false);
        setError('Web Bluetooth API is not available in your browser. Please use Chrome or Edge.');
        return;
      }

      const isAvailable = await navigator.bluetooth.getAvailability();
      setIsBluetoothAvailable(isAvailable);
      if (!isAvailable) {
        setError('Bluetooth is not available. Please enable Bluetooth in your system settings.');
      } else {
        setError('');
      }
    } catch (err) {
      console.error('Bluetooth availability check error:', err);
      setIsBluetoothAvailable(false);
      setError('Failed to check Bluetooth availability. Please make sure Bluetooth is enabled.');
    }
  };

  const connectLedger = async () => {
    try {
      setConnectionStatus('searching');
      setError('');
      setConnectionStep('Checking Bluetooth availability...');

      if (!navigator.bluetooth) {
        throw new Error('Web Bluetooth API is not available in your browser. Please use Chrome or Edge.');
      }

      const isAvailable = await navigator.bluetooth.getAvailability();
      if (!isAvailable) {
        throw new Error('Bluetooth is not available. Please enable Bluetooth in your system settings.');
      }

      setConnectionStep('Requesting Bluetooth device...');
      setConnectionStatus('connecting');
      await ledgerService.connect();

      setConnectionStep('Device connected successfully');
      setConnectionStatus('connected');
      setDeviceName('Ledger Device');
      
      setSelectedWallet('ledger');
      setLedgerConnected(true);
      navigate('/dashboard');
    } catch (err) {
      console.error('Connection error:', err);
      setConnectionStatus('error');
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Failed to connect to Ledger. Please make sure Bluetooth is enabled and try again.');
      }
      setConnectionStep('');
    }
  };

  const handleWalletSelect = (wallet: string) => {
    setSelectedConnection(wallet);
    if (wallet === 'ledger') {
      connectLedger();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white">
      <div className="max-w-6xl mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-6 transform hover:scale-105 transition-transform">
            <Wallet className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
            Connect Your Wallet
          </h1>
          <p className="text-gray-400 text-lg">Select your preferred hardware wallet to continue</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          {/* Ledger Card */}
          <div 
            onClick={() => handleWalletSelect('ledger')}
            className="bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-gray-700/50 p-8 cursor-pointer hover:border-blue-500/50 transition-all transform hover:scale-[1.02] group relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-purple-600/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="relative">
              <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                <HardDrive className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-2xl font-semibold text-center mb-3">Ledger</h3>
              <p className="text-gray-400 text-center mb-4">Connect your Ledger device</p>
              <div className="flex items-center justify-center text-blue-400 text-sm">
                <Zap className="w-4 h-4 mr-2" />
                <span>Recommended</span>
              </div>
            </div>
          </div>

          {/* SafePal Card */}
          <div className="bg-gray-800/30 backdrop-blur-sm rounded-2xl border border-gray-700/30 p-8 opacity-50 cursor-not-allowed relative overflow-hidden">
            <div className="relative">
              <div className="w-20 h-20 bg-gray-700 rounded-xl flex items-center justify-center mx-auto mb-6">
                <Shield className="w-10 h-10 text-gray-500" />
              </div>
              <h3 className="text-2xl font-semibold text-center mb-3 text-gray-500">SafePal</h3>
              <p className="text-gray-500 text-center mb-4">Hardware wallet with mobile app</p>
              <div className="flex items-center justify-center text-gray-500 text-sm">
                <Lock className="w-4 h-4 mr-2" />
                <span>Coming soon</span>
              </div>
            </div>
          </div>

          {/* Trezor Card */}
          <div className="bg-gray-800/30 backdrop-blur-sm rounded-2xl border border-gray-700/30 p-8 opacity-50 cursor-not-allowed relative overflow-hidden">
            <div className="relative">
              <div className="w-20 h-20 bg-gray-700 rounded-xl flex items-center justify-center mx-auto mb-6">
                <Smartphone className="w-10 h-10 text-gray-500" />
              </div>
              <h3 className="text-2xl font-semibold text-center mb-3 text-gray-500">Trezor</h3>
              <p className="text-gray-500 text-center mb-4">Advanced security features</p>
              <div className="flex items-center justify-center text-gray-500 text-sm">
                <Lock className="w-4 h-4 mr-2" />
                <span>Coming soon</span>
              </div>
            </div>
          </div>
        </div>

        {/* Connection Methods */}
        <div className="bg-gray-800/30 backdrop-blur-sm rounded-2xl border border-gray-700/30 p-8">
          <h2 className="text-2xl font-semibold text-center mb-8">Connection Methods</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {connectionMethods.map((method) => (
              <div
                key={method.id}
                onClick={() => method.available && handleWalletSelect(method.id)}
                className={`p-6 rounded-xl border ${
                  method.available
                    ? 'border-blue-500/50 cursor-pointer hover:border-blue-500/70'
                    : 'border-gray-700/30 cursor-not-allowed opacity-50'
                } transition-all`}
              >
                <div className="flex items-center space-x-4">
                  <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                    method.available
                      ? 'bg-gradient-to-r from-blue-500 to-purple-600'
                      : 'bg-gray-700'
                  }`}>
                    <method.icon className={`w-6 h-6 ${
                      method.available ? 'text-white' : 'text-gray-500'
                    }`} />
                  </div>
                  <div>
                    <h3 className={`font-medium ${
                      method.available ? 'text-white' : 'text-gray-500'
                    }`}>{method.name}</h3>
                    <p className={`text-sm ${
                      method.available ? 'text-gray-400' : 'text-gray-500'
                    }`}>{method.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* QR Code Option */}
        <div className="mt-8 text-center">
          <button className="inline-flex items-center space-x-2 text-gray-400 hover:text-white transition-colors">
            <QrCode className="w-5 h-5" />
            <span>Scan QR Code</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default WalletConnectionPage; 