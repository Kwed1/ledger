import { Shield, X } from 'lucide-react'
import { QRCodeSVG } from 'qrcode.react'
import React, { useEffect, useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'

interface TwoFactorAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const TwoFactorAuthModal: React.FC<TwoFactorAuthModalProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const { userData, setup2FA, verify2FA, enable2FA, skip2FA } = useAuth();
  const [step, setStep] = useState<'setup' | 'verify'>('setup');
  const [secret, setSecret] = useState('');
  const [qrCode, setQrCode] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen && !userData?.has2FA) {
      handleSetup();
    }
  }, [isOpen]);

  const handleSetup = async () => {
    try {
      setIsLoading(true);
      setError('');
      const { secret, qrCode } = await setup2FA();
      setSecret(secret);
      setQrCode(qrCode);
      setStep('verify');
    } catch (err) {
      setError('Failed to set up 2FA. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerify = async () => {
    try {
      setIsLoading(true);
      setError('');
      await enable2FA(secret, code);
      onSuccess();
    } catch (err) {
      setError('Invalid code. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSkip = async () => {
    try {
      setIsLoading(true);
      setError('');
      await skip2FA();
      onClose();
    } catch (err) {
      setError('Failed to skip 2FA. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-2xl border border-gray-700/50 p-6 w-full max-w-md mx-4">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-500/10 rounded-xl flex items-center justify-center">
              <Shield className="w-5 h-5 text-blue-400" />
            </div>
            <h2 className="text-xl font-bold text-white">
              {userData?.has2FA ? 'Verify 2FA' : 'Set Up 2FA'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-xl p-3 mb-4">
            {error}
          </div>
        )}

        {!userData?.has2FA ? (
          <div className="space-y-6">
            <div className="text-gray-300 text-sm">
              <p className="mb-4">
                Scan the QR code with your authenticator app (like Google Authenticator) to set up two-factor authentication.
              </p>
              <div className="bg-white p-4 rounded-xl flex justify-center">
                <QRCodeSVG value={qrCode} size={200} />
              </div>
              <p className="mt-4 text-gray-400">
                Or enter this code manually: <span className="font-mono text-white">{secret}</span>
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label htmlFor="code" className="block text-sm font-medium text-gray-300 mb-2">
                  Enter 6-digit code
                </label>
                <input
                  type="text"
                  id="code"
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="000000"
                  maxLength={6}
                />
              </div>

              <div className="flex space-x-4">
                <button
                  onClick={handleVerify}
                  disabled={isLoading || code.length !== 6}
                  className="flex-1 py-3 px-4 bg-blue-500 text-white rounded-xl font-medium hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? 'Verifying...' : 'Verify & Enable'}
                </button>
                <button
                  onClick={handleSkip}
                  disabled={isLoading}
                  className="flex-1 py-3 px-4 border border-gray-600 text-gray-300 rounded-xl font-medium hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 focus:ring-offset-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Skip for Now
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="text-gray-300 text-sm">
              <p className="mb-4">
                Enter the 6-digit code from your authenticator app to verify your identity.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label htmlFor="code" className="block text-sm font-medium text-gray-300 mb-2">
                  Enter 6-digit code
                </label>
                <input
                  type="text"
                  id="code"
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="000000"
                  maxLength={6}
                />
              </div>

              <button
                onClick={handleVerify}
                disabled={isLoading || code.length !== 6}
                className="w-full py-3 px-4 bg-blue-500 text-white rounded-xl font-medium hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Verifying...' : 'Verify'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TwoFactorAuthModal; 