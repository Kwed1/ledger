import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { HardDrive, Lock, Shield, Usb, Wallet, AlertCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { ledgerService } from '../services/ledger';
import TransportWebHID from "@ledgerhq/hw-transport-webhid";
import Eth from "@ledgerhq/hw-app-eth";
import Web3 from 'web3';

const LedgerConnectionPage = () => {
  const navigate = useNavigate();
  const { setSelectedWallet, setLedgerConnected } = useAuth();
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'error' | 'searching'>('searching');
  const [error, setError] = useState('');
  const [connectionStep, setConnectionStep] = useState<string>('');
  const [ledgerAddress, setLedgerAddress] = useState<string>('');
  const [balance, setBalance] = useState<string>('');
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
      setLedgerAddress(address);

      // Get balance
      setConnectionStep('Checking balance...');
      const web3 = new Web3("https://mainnet.infura.io/v3/YOUR_INFURA_PROJECT_ID");
      const balanceWei = await web3.eth.getBalance(address);
      const balanceEth = web3.utils.fromWei(balanceWei, 'ether');
      setBalance(balanceEth);

      setConnectionStep('Device connected successfully');
      setConnectionStatus('connected');
      
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white">
      <div className="max-w-md mx-auto px-4 py-16">
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-gray-700/50 p-8 shadow-2xl">
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Usb className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">
              {connectionStatus === 'searching' ? 'Searching for Ledger...' :
               connectionStatus === 'connecting' ? 'Connecting to Ledger...' :
               connectionStatus === 'connected' ? 'Connected to Ledger' :
               'Connection Error'}
            </h2>
            <p className="text-gray-400 text-sm">
              {connectionStep || (
                connectionStatus === 'searching' ? 'Please make sure your Ledger device is connected via USB' :
                connectionStatus === 'connecting' ? 'Establishing secure connection...' :
                connectionStatus === 'connected' ? 'Successfully connected to your Ledger device' :
                'Please check your device and try again'
              )}
            </p>
          </div>

          <div className="space-y-6">
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
                    <Usb className="w-3 h-3" />
                  </div>
                  <span>USB Connection</span>
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
              <div className="bg-red-500/10 border border-red-500/20 text-red-500 text-sm rounded-xl p-4">
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

            {ledgerAddress && (
              <div className="bg-gray-700/30 rounded-xl p-4">
                <p className="text-sm text-gray-300 mb-2">Connected Address:</p>
                <p className="text-sm font-mono text-cyan-400 break-all">{ledgerAddress}</p>
                {balance && (
                  <p className="text-sm text-gray-300 mt-2">
                    Balance: <span className="text-green-400">{balance} ETH</span>
                  </p>
                )}
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
                  Connect your Ledger device via USB cable
                </li>
                <li className="flex items-start">
                  <span className="text-blue-400 mr-2">•</span>
                  Make sure your Ledger device is unlocked
                </li>
                <li className="flex items-start">
                  <span className="text-blue-400 mr-2">•</span>
                  Open the Ethereum app on your Ledger
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
              disabled={connectionStatus === 'connecting' || connectionStatus === 'searching'}
              className={`w-full py-3 px-4 rounded-xl font-medium transition-all ${
                connectionStatus === 'connecting' || connectionStatus === 'searching'
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