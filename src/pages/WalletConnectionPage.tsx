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
  Zap,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { ledgerService } from '../services/ledger';
import TransportWebHID from "@ledgerhq/hw-transport-webhid";
import Eth from "@ledgerhq/hw-app-eth";
import Web3 from 'web3';

const WalletConnectionPage = () => {
  const navigate = useNavigate();
  const { setSelectedWallet, setLedgerConnected } = useAuth();
  const [selectedConnection, setSelectedConnection] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'error' | 'searching'>('searching');
  const [error, setError] = useState('');
  const [deviceName, setDeviceName] = useState<string | null>(null);
  const [connectionStep, setConnectionStep] = useState<string>('');
  const [showPermissionDialog, setShowPermissionDialog] = useState(false);

  const connectLedger = async () => {
    try {
      setConnectionStatus('searching');
      setError('');
      setConnectionStep('Connecting to Ledger...');

      // Check if WebHID is supported
      if (!navigator.hid) {
        throw new Error('WebHID is not supported in your browser. Please use Chrome or Edge.');
      }

      // Request HID device
      setConnectionStep('Requesting device access...');
      const devices = await navigator.hid.requestDevice({
        filters: [{ vendorId: 0x2c97 }] // Ledger vendor ID
      });

      if (devices.length === 0) {
        throw new Error('No Ledger device selected. Please select your device and try again.');
      }

      // Connect to Ledger via WebHID
      setConnectionStep('Establishing connection...');
      const transport = await TransportWebHID.create();
      const ethApp = new Eth(transport);

      setConnectionStep('Getting Ethereum address...');
      setConnectionStatus('connecting');

      // Get Ethereum address
      const path = "44'/60'/0'/0/0";
      const { address } = await ethApp.getAddress(path);

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
        if (err.message.includes('Access denied') || err.message.includes('User cancelled')) {
          setError('Access to Ledger device was denied. Please make sure to:');
          setShowPermissionDialog(true);
        } else if (err.message.includes('WebHID is not supported')) {
          setError('Your browser does not support WebHID. Please use Chrome or Edge.');
        } else {
          setError(err.message);
        }
      } else {
        setError('Failed to connect to Ledger. Please make sure your device is connected and unlocked.');
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
            <div
              onClick={() => handleWalletSelect('ledger')}
              className="p-6 rounded-xl border border-blue-500/50 cursor-pointer hover:border-blue-500/70 transition-all"
            >
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 rounded-lg flex items-center justify-center bg-gradient-to-r from-blue-500 to-purple-600">
                  <Usb className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-medium text-white">USB</h3>
                  <p className="text-sm text-gray-400">Connect via USB cable</p>
                </div>
              </div>
            </div>

            <div className="p-6 rounded-xl border border-gray-700/30 cursor-not-allowed opacity-50">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 rounded-lg flex items-center justify-center bg-gray-700">
                  <Bluetooth className="w-6 h-6 text-gray-500" />
                </div>
                <div>
                  <h3 className="font-medium text-gray-500">Bluetooth</h3>
                  <p className="text-sm text-gray-500">Connect via Bluetooth</p>
                </div>
              </div>
            </div>

            <div className="p-6 rounded-xl border border-gray-700/30 cursor-not-allowed opacity-50">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 rounded-lg flex items-center justify-center bg-gray-700">
                  <Wifi className="w-6 h-6 text-gray-500" />
                </div>
                <div>
                  <h3 className="font-medium text-gray-500">Wi-Fi</h3>
                  <p className="text-sm text-gray-500">Connect via Wi-Fi network</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {error && (
          <div className="mt-8 bg-red-500/10 border border-red-500/20 text-red-500 text-sm rounded-xl p-4">
            <div className="flex items-start space-x-3">
              <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium mb-2">{error}</p>
                {showPermissionDialog && (
                  <ul className="list-disc list-inside space-y-1 text-red-400/80">
                    <li>Select your Ledger device in the browser dialog</li>
                    <li>Make sure your Ledger is unlocked</li>
                    <li>Open the Ethereum app on your Ledger</li>
                    <li>Click "Allow" on your Ledger when prompted</li>
                  </ul>
                )}
              </div>
            </div>
          </div>
        )}

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