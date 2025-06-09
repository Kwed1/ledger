import { motion } from 'framer-motion';
import React from 'react';

interface Validator {
  address: string;
  balance: number;
  status: 'active' | 'inactive';
}

interface OtherValidatorsProps {
  validators: Validator[];
}

export const OtherValidators: React.FC<OtherValidatorsProps> = ({ validators }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      <h3 className="text-lg font-semibold text-white mb-4">Other Validators</h3>
      <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2">
        {validators.map((validator, index) => (
          <motion.div
            key={validator.address}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className="flex items-center justify-between p-4 bg-gray-700/50 rounded-xl border border-gray-600/50"
          >
            <div className="flex items-center">
              <div className={`w-3 h-3 rounded-full mr-3 ${
                validator.status === 'active' ? 'bg-green-400' : 'bg-red-400'
              }`} />
              <div>
                <p className="text-sm font-medium text-white">
                  {validator.address.slice(0, 6)}...{validator.address.slice(-4)}
                </p>
                <p className="text-xs text-gray-400">
                  {validator.status === 'active' ? 'Active' : 'Inactive'}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm font-semibold text-white">{validator.balance.toFixed(2)}</p>
              <p className="text-xs text-gray-400">Balance</p>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}; 