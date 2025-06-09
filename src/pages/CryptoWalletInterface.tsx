import { motion } from 'framer-motion'
import { HardDrive, Shield, Wallet } from 'lucide-react'
import React, { useEffect, useState } from 'react'
import { NetworkStatus } from '../components/validator/NetworkStatus'
import { OtherValidators } from '../components/validator/OtherValidators'
import { ValidatorStatus } from '../components/validator/ValidatorStatus'

interface Validator {
  address: string;
  balance: number;
  status: 'active' | 'inactive';
}

// Generate mock network data
const generateMockNetworkData = () => {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return months.map(month => ({
    month,
    value: Math.floor(Math.random() * 100)
  }));
};

// Generate mock validators
const generateMockValidators = (count: number): Validator[] => {
  return Array.from({ length: count }, (_, i) => ({
    address: `0x${Math.random().toString(16).slice(2, 42)}`,
    balance: Math.random() * 1000,
    status: Math.random() > 0.2 ? 'active' as const : 'inactive' as const
  }));
};

export const CryptoWalletInterface: React.FC = () => {
  const [networkData] = useState(generateMockNetworkData());
  const [validators, setValidators] = useState<Validator[]>([]);

  useEffect(() => {
    // Update validators list every 5 minutes
    const updateValidators = () => {
      setValidators(generateMockValidators(100));
    };

    updateValidators();
    const interval = setInterval(updateValidators, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black">
      {/* Header */}
      <div className="sticky top-0 z-50 backdrop-blur-lg bg-gray-900/80 border-b border-gray-700/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <Wallet className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
                Validator Dashboard
              </span>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <HardDrive className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-400">
                  Connect Ledger
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-8"
        >
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Shield className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">Validator Dashboard</h1>
            <p className="text-gray-400">
              Connect your Ledger device to start monitoring
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
              <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-gray-700/50 p-6 shadow-2xl">
                <ValidatorStatus
                  startDate={new Date('2024-05-02')}
                  endDate={new Date('2026-05-03')}
                  annualPercentage={34.6}
                />
              </div>
              <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-gray-700/50 p-6 shadow-2xl">
                <NetworkStatus data={networkData} />
              </div>
            </div>
            <div className="lg:col-span-1">
              <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-gray-700/50 p-6 shadow-2xl">
                <OtherValidators validators={validators} />
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}; 