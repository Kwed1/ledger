import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bluetooth, Lock, Shield, HardDrive } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { ledgerService } from '../services/ledger';

// Add Web Bluetooth API type definitions
interface BluetoothDevice {
  id: string;
  name?: string;
  gatt?: {
    connect(): Promise<BluetoothRemoteGATTServer>;
  };
}

interface BluetoothRemoteGATTServer {
  connected: boolean;
  device: BluetoothDevice;
  getPrimaryService(service: string): Promise<BluetoothRemoteGATTService>;
}

interface BluetoothRemoteGATTService {
  getCharacteristic(characteristic: string): Promise<BluetoothRemoteGATTCharacteristic>;
}

interface BluetoothRemoteGATTCharacteristic {
  readValue(): Promise<DataView>;
  writeValue(value: BufferSource): Promise<void>;
}

declare global {
  interface Navigator {
    bluetooth: {
      getAvailability(): Promise<boolean>;
      requestDevice(options: { acceptAllDevices?: boolean; filters?: Array<{ services?: string[] }> }): Promise<BluetoothDevice>;
    };
  }
}

const LedgerConnectionPage = () => {
  const navigate = useNavigate();
  const { setSelectedWallet, setLedgerConnected } = useAuth();
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'error' | 'searching'>('searching');
  const [error, setError] = useState('');
  const [deviceName, setDeviceName] = useState<string | null>(null);
  const [connectionStep, setConnectionStep] = useState<string>('');
  const [isBluetoothAvailable, setIsBluetoothAvailable] = useState<boolean | null>(null);
  const [ledgerAddress, setLedgerAddress] = useState<string>('');

  const checkBluetoothAvailability = async () => {
    try {
      if (!('bluetooth' in navigator)) {
        setIsBluetoothAvailable(false);
        setError('Web Bluetooth API is not available in your browser. Please use Chrome or Edge.');
        return;
      }

      const isAvailable = await (navigator as any).bluetooth.getAvailability();
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

  useEffect(() => {
    checkBluetoothAvailability();
  }, []);

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
      
      // Connect to Ledger device
      await ledgerService.connect();
      
      // Get the first address from the device
      const address = await ledgerService.getAddress();
      setLedgerAddress(address);
      
      // Authenticate with backend
      await ledgerService.authenticateWithBackend();

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white">
      <div className="max-w-md mx-auto px-4 py-16">
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-gray-700/50 p-8 shadow-2xl">
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <HardDrive className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">
              {connectionStatus === 'searching' ? 'Searching for Ledger...' :
               connectionStatus === 'connecting' ? 'Connecting to Ledger...' :
               connectionStatus === 'connected' ? 'Connected to Ledger' :
               'Connection Error'}
            </h2>
            <p className="text-gray-400 text-sm">
              {connectionStep || (
                connectionStatus === 'searching' ? 'Please make sure your Ledger device is turned on and Bluetooth is enabled' :
                connectionStatus === 'connecting' ? 'Establishing secure connection...' :
                connectionStatus === 'connected' ? 'Successfully connected to your Ledger device' :
                'Please check your device and try again'
              )}
            </p>
          </div>

          <div className="space-y-6">
            {/* Bluetooth Status */}
            <div className="bg-gray-700/30 rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <span className="text-gray-300">Bluetooth Status</span>
                <div className={`flex items-center ${
                  isBluetoothAvailable === null ? 'text-gray-400' :
                  isBluetoothAvailable ? 'text-green-400' : 'text-red-400'
                }`}>
                  {isBluetoothAvailable === null ? (
                    <>
                      <div className="w-3 h-3 bg-gray-400 rounded-full mr-2"></div>
                      <span>Checking...</span>
                    </>
                  ) : isBluetoothAvailable ? (
                    <>
                      <div className="w-3 h-3 bg-green-400 rounded-full mr-2"></div>
                      <span>Available</span>
                    </>
                  ) : (
                    <>
                      <div className="w-3 h-3 bg-red-400 rounded-full mr-2"></div>
                      <span>Not Available</span>
                    </>
                  )}
                </div>
              </div>
              <button
                onClick={checkBluetoothAvailability}
                className="w-full py-2 px-4 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 rounded-lg text-sm font-medium transition-all"
              >
                Check Bluetooth Status
              </button>
            </div>

            {/* Connection Status */}
            <div className="bg-gray-700/30 rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <span className="text-gray-300">Connection Status</span>
                <div className={`flex items-center ${
                  connectionStatus === 'connected' ? 'text-green-400' :
                  connectionStatus === 'error' ? 'text-red-400' :
                  'text-blue-400'
                }`}>
                  {connectionStatus === 'searching' && (
                    <>
                      <div className="w-3 h-3 bg-blue-400 rounded-full mr-2 animate-pulse"></div>
                      <span>Searching...</span>
                    </>
                  )}
                  {connectionStatus === 'connecting' && (
                    <>
                      <div className="w-3 h-3 bg-blue-400 rounded-full mr-2 animate-pulse"></div>
                      <span>Connecting...</span>
                    </>
                  )}
                  {connectionStatus === 'connected' && (
                    <>
                      <div className="w-3 h-3 bg-green-400 rounded-full mr-2"></div>
                      <span>Connected</span>
                    </>
                  )}
                  {connectionStatus === 'error' && (
                    <>
                      <div className="w-3 h-3 bg-red-400 rounded-full mr-2"></div>
                      <span>Error</span>
                    </>
                  )}
                </div>
              </div>

              {/* Connection Steps */}
              <div className="space-y-4">
                <div className={`flex items-center space-x-3 ${
                  connectionStatus === 'searching' ? 'text-gray-400' :
                  connectionStatus === 'connected' ? 'text-green-400' :
                  'text-gray-400'
                }`}>
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                    connectionStatus === 'searching' ? 'bg-blue-400/20' :
                    connectionStatus === 'connected' ? 'bg-green-400/20' :
                    'bg-gray-400/20'
                  }`}>
                    <Bluetooth className="w-3 h-3" />
                  </div>
                  <span>Bluetooth Connection</span>
                </div>

                <div className={`flex items-center space-x-3 ${
                  connectionStatus === 'searching' ? 'text-gray-400' :
                  connectionStatus === 'connected' ? 'text-green-400' :
                  'text-gray-400'
                }`}>
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                    connectionStatus === 'searching' ? 'bg-blue-400/20' :
                    connectionStatus === 'connected' ? 'bg-green-400/20' :
                    'bg-gray-400/20'
                  }`}>
                    <Lock className="w-3 h-3" />
                  </div>
                  <span>Device Authentication</span>
                </div>

                <div className={`flex items-center space-x-3 ${
                  connectionStatus === 'searching' ? 'text-gray-400' :
                  connectionStatus === 'connected' ? 'text-green-400' :
                  'text-gray-400'
                }`}>
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                    connectionStatus === 'searching' ? 'bg-blue-400/20' :
                    connectionStatus === 'connected' ? 'bg-green-400/20' :
                    'bg-gray-400/20'
                  }`}>
                    <Shield className="w-3 h-3" />
                  </div>
                  <span>Security Verification</span>
                </div>
              </div>
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-500 text-sm rounded-xl p-4 text-center">
                {error}
              </div>
            )}

            {ledgerAddress && (
              <div className="bg-gray-700/30 rounded-xl p-4">
                <p className="text-sm text-gray-300 mb-2">Connected Address:</p>
                <p className="text-sm font-mono text-cyan-400 break-all">{ledgerAddress}</p>
              </div>
            )}

            {/* Connection Progress */}
            <div className="relative pt-1">
              <div className="overflow-hidden h-2 text-xs flex rounded-xl bg-gray-700/30">
                <div
                  className={`transition-all duration-500 ease-out ${
                    connectionStatus === 'searching' ? 'w-1/3' :
                    connectionStatus === 'connecting' ? 'w-2/3' :
                    connectionStatus === 'connected' ? 'w-full' :
                    'w-0'
                  } ${
                    connectionStatus === 'connected' ? 'bg-green-400' :
                    connectionStatus === 'error' ? 'bg-red-400' :
                    'bg-blue-400'
                  } shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center`}
                ></div>
              </div>
            </div>

            {/* Connection Tips */}
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
              <h3 className="text-blue-400 text-sm font-medium mb-2">Connection Tips</h3>
              <ul className="text-gray-400 text-sm space-y-2">
                <li className="flex items-start">
                  <span className="text-blue-400 mr-2">•</span>
                  Make sure Bluetooth is enabled in your macOS System Preferences
                </li>
                <li className="flex items-start">
                  <span className="text-blue-400 mr-2">•</span>
                  Grant Bluetooth permission to your browser when prompted
                </li>
                <li className="flex items-start">
                  <span className="text-blue-400 mr-2">•</span>
                  Keep your Ledger device unlocked and nearby
                </li>
                <li className="flex items-start">
                  <span className="text-blue-400 mr-2">•</span>
                  Approve any connection requests on your Ledger
                </li>
              </ul>
            </div>

            {/* Connect Button */}
            <button
              onClick={connectLedger}
              disabled={connectionStatus === 'connecting' || connectionStatus === 'searching' || !isBluetoothAvailable}
              className={`w-full py-3 px-4 rounded-xl font-medium transition-all ${
                connectionStatus === 'connecting' || connectionStatus === 'searching' || !isBluetoothAvailable
                  ? 'bg-gray-700/50 text-gray-400 cursor-not-allowed'
                  : connectionStatus === 'error'
                  ? 'bg-red-500/10 hover:bg-red-500/20 text-red-400'
                  : 'bg-blue-500/10 hover:bg-blue-500/20 text-blue-400'
              }`}
            >
              {connectionStatus === 'connecting' || connectionStatus === 'searching'
                ? 'Connecting...'
                : connectionStatus === 'error'
                ? 'Try Again'
                : 'Connect Ledger'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LedgerConnectionPage; 