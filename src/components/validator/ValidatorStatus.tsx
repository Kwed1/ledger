import { motion } from 'framer-motion'
import { Shield } from 'lucide-react'
import React, { useEffect, useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { ledgerService } from '../../services/ledger'

interface ValidatorStatusProps {
  startDate: Date;
  endDate: Date;
  annualPercentage: number;
}

export const ValidatorStatus: React.FC<ValidatorStatusProps> = ({
  startDate,
  endDate,
  annualPercentage
}) => {
  const { userData } = useAuth();
  const [balance, setBalance] = useState<number>(0);
  const [earnings, setEarnings] = useState<number>(0);
  const [timeElapsed, setTimeElapsed] = useState<{ days: number; hours: number }>({ days: 0, hours: 0 });
  const [isConnected, setIsConnected] = useState<boolean>(false);

  useEffect(() => {
    const fetchBalance = async () => {
      if (userData?.ledgerAddress) {
        try {
          const balances = await ledgerService.getBalances(userData.ledgerAddress);
          const ethBalance = balances.find(b => b.coinId === 'ethereum');
          setBalance(ethBalance?.amount || 0);
          setIsConnected(true);
        } catch (error) {
          console.error('Error fetching balance:', error);
          setIsConnected(false);
        }
      }
    };

    fetchBalance();
    const interval = setInterval(fetchBalance, 30000); // Update every 30 seconds

    return () => clearInterval(interval);
  }, [userData?.ledgerAddress]);

  useEffect(() => {
    const updateEarnings = () => {
      const now = new Date();
      const elapsed = now.getTime() - startDate.getTime();
      const days = Math.floor(elapsed / (1000 * 60 * 60 * 24));
      const hours = Math.floor((elapsed % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

      const dailyRate = (balance * annualPercentage) / 100 / 365;
      const earned = dailyRate * (days + hours / 24);

      setEarnings(earned);
      setTimeElapsed({ days, hours });
    };

    updateEarnings();
    const interval = setInterval(updateEarnings, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [balance, startDate, annualPercentage]);

  const totalEarnings = (balance * annualPercentage) / 100 * (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24 * 365);

  if (!isConnected || !userData?.ledgerAddress) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        <div className="text-center">
          <div className="w-32 h-32 mx-auto mb-4">
            <div className="w-full h-full rounded-full border-4 border-dashed border-gray-600 flex items-center justify-center">
              <Shield className="w-12 h-12 text-gray-600" />
            </div>
          </div>
          <h2 className="text-xl font-semibold text-white mb-2">Connect Your Ledger</h2>
          <p className="text-gray-400">
            Connect your Ledger device to view validator status and earnings
          </p>
        </div>

        <div className="bg-gray-700/50 rounded-xl p-4 space-y-4">
          <div>
            <p className="text-sm text-gray-400">Balance</p>
            <p className="text-white">--</p>
          </div>
          <div>
            <p className="text-sm text-gray-400">Annual Percentage</p>
            <p className="text-white">--</p>
          </div>
          <div>
            <p className="text-sm text-gray-400">Time Elapsed</p>
            <p className="text-white">--</p>
          </div>
        </div>

        <div className="bg-gray-700/50 rounded-xl p-4">
          <div className="flex justify-between items-center mb-2">
            <p className="text-sm text-gray-400">Earned</p>
            <p className="text-lg font-semibold text-white">--</p>
          </div>
          <div className="flex justify-between items-center">
            <p className="text-sm text-gray-400">Forecast</p>
            <p className="text-lg font-semibold text-white">--</p>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="text-center">
        <h2 className="text-xl font-semibold text-white mb-2">Validator Status</h2>
        <div className="relative w-32 h-32 mx-auto">
          <svg className="w-full h-full" viewBox="0 0 100 100">
            <circle
              className="text-gray-700"
              strokeWidth="10"
              stroke="currentColor"
              fill="transparent"
              r="40"
              cx="50"
              cy="50"
            />
            <circle
              className="text-blue-500"
              strokeWidth="10"
              strokeDasharray={251.2}
              strokeDashoffset={251.2 - (251.2 * earnings) / totalEarnings}
              strokeLinecap="round"
              stroke="currentColor"
              fill="transparent"
              r="40"
              cx="50"
              cy="50"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <p className="text-2xl font-bold text-white">{balance.toFixed(4)}</p>
              <p className="text-sm text-gray-400">Balance</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-gray-700/50 rounded-xl p-4 space-y-4">
        <div>
          <p className="text-sm text-gray-400">Validation Period</p>
          <p className="text-white">
            {startDate.toLocaleDateString()} - {endDate.toLocaleDateString()}
          </p>
        </div>
        <div>
          <p className="text-sm text-gray-400">Annual Percentage</p>
          <p className="text-white">{annualPercentage}%</p>
        </div>
        <div>
          <p className="text-sm text-gray-400">Time Elapsed</p>
          <p className="text-white">{timeElapsed.days} days, {timeElapsed.hours} hours</p>
        </div>
      </div>

      <div className="bg-gray-700/50 rounded-xl p-4">
        <div className="flex justify-between items-center mb-2">
          <p className="text-sm text-gray-400">Earned</p>
          <p className="text-lg font-semibold text-white">{earnings.toFixed(4)}</p>
        </div>
        <div className="flex justify-between items-center">
          <p className="text-sm text-gray-400">Forecast</p>
          <p className="text-lg font-semibold text-white">{totalEarnings.toFixed(4)}</p>
        </div>
      </div>
    </motion.div>
  );
}; 