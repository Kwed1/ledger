import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ledgerService } from '../services/ledger';
import { Wallet, Bluetooth, AlertCircle } from 'lucide-react';

const LedgerPage = () => {
  const navigate = useNavigate();
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState('');
  const [isBluetoothAvailable, setIsBluetoothAvailable] = useState(false);

  useEffect(() => {
    checkBluetoothAvailability();
  }, []);

  const checkBluetoothAvailability = async () => {
    try {
      if ('bluetooth' in navigator) {
        const available = await navigator.bluetooth.getAvailability();
        setIsBluetoothAvailable(available);
      } else {
        setIsBluetoothAvailable(false);
        setError('Bluetooth is not supported in your browser');
      }
    } catch (err) {
      setIsBluetoothAvailable(false);
      setError('Failed to check Bluetooth availability');
    }
  };

  const handleConnect = async () => {
    setIsConnecting(true);
    setError('');

    try {
      await ledgerService.connect();
      const address = await ledgerService.getAddress();
      await ledgerService.authenticateWithBackend();
      navigate('/dashboard');
    } catch (err) {
      setError('Failed to connect to Ledger. Please make sure your device is connected and unlocked.');
    } finally {
      setIsConnecting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <div className="mb-6">
            <div className="w-16 h-16 bg-cyan-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Wallet className="w-8 h-8 text-cyan-400" />
            </div>
            <h2 className="text-3xl font-bold text-white mb-2">Connect Ledger</h2>
            <p className="text-gray-400">Connect your Ledger device to continue</p>
          </div>
        </div>

        <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50">
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                isBluetoothAvailable ? 'bg-green-500/10' : 'bg-red-500/10'
              }`}>
                <Bluetooth className={`w-5 h-5 ${
                  isBluetoothAvailable ? 'text-green-400' : 'text-red-400'
                }`} />
              </div>
              <div>
                <h3 className="text-white font-medium">Bluetooth Status</h3>
                <p className="text-sm text-gray-400">
                  {isBluetoothAvailable ? 'Bluetooth is available' : 'Bluetooth is not available'}
                </p>
              </div>
            </div>

            {error && (
              <div className="flex items-center space-x-2 bg-red-500/10 border border-red-500/20 text-red-500 text-sm rounded-lg p-3">
                <AlertCircle className="w-4 h-4" />
                <span>{error}</span>
              </div>
            )}

            <button
              onClick={handleConnect}
              disabled={isConnecting || !isBluetoothAvailable}
              className="w-full py-3 px-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl font-medium hover:from-blue-600 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-800 transition-all transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              {isConnecting ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Connecting...</span>
                </div>
              ) : (
                'Connect Ledger'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LedgerPage; 