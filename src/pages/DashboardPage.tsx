import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { LogOut, TrendingUp, Clock, Wallet, Calendar, Percent, ArrowUpRight, Info, Server, Activity, Users, Shield, ChevronRight, Network, DollarSign, Loader2 } from 'lucide-react';
import { ledgerService } from '../services/ledger';
import Web3 from 'web3';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface Validator {
  address: string;
  balance: number;
  status: 'active' | 'pending' | 'exiting';
}

const DashboardPage = () => {
  const navigate = useNavigate();
  const { setSelectedWallet, setLedgerConnected } = useAuth();
  const [balance, setBalance] = useState<string>('0');
  const [earnings, setEarnings] = useState<string>('0');
  const [earningsUsdt, setEarningsUsdt] = useState<string>('0');
  const [ethPrice, setEthPrice] = useState<number>(0);
  const [timeLeft, setTimeLeft] = useState<string>('');
  const [dailyEarnings, setDailyEarnings] = useState<string>('0');
  const [dailyEarningsUsdt, setDailyEarningsUsdt] = useState<string>('0');
  const [activeNodes, setActiveNodes] = useState<number>(0);
  const [totalNodes, setTotalNodes] = useState<number>(0);
  const [otherValidators, setOtherValidators] = useState<Validator[]>([]);
  const [networkStatus, setNetworkStatus] = useState<number[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const validatorsPerPage = 10;
  const [isLoadingBalance, setIsLoadingBalance] = useState(true);
  const [balanceError, setBalanceError] = useState<string | null>(null);

  // Generate random validators data
  useEffect(() => {
    const generateRandomAddress = () => {
      return '0x' + Array.from({ length: 40 }, () => 
        Math.floor(Math.random() * 16).toString(16)
      ).join('');
    };

    const validators: Validator[] = Array.from({ length: 100 }, () => ({
      address: generateRandomAddress(),
      balance: Math.floor(Math.random() * 20) + 20, // Random balance between 20-40 ETH
      status: ['active', 'pending', 'exiting'][Math.floor(Math.random() * 3)] as Validator['status']
    }));

    setOtherValidators(validators);
  }, []);

  // Generate network status data
  useEffect(() => {
    const generateNetworkData = () => {
      return Array.from({ length: 24 }, () => 
        Math.floor(Math.random() * 20) + 80 // Random value between 80-100
      );
    };

    setNetworkStatus(generateNetworkData());
  }, []);

  // Fetch ETH price
  useEffect(() => {
    const fetchEthPrice = async () => {
      try {
        const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd');
        const data = await response.json();
        setEthPrice(data.ethereum.usd);
      } catch (error) {
        console.error('Error fetching ETH price:', error);
      }
    };

    fetchEthPrice();
    const interval = setInterval(fetchEthPrice, 60000); // Update every minute
    return () => clearInterval(interval);
  }, []);

  // Calculate earnings based on current balance
  useEffect(() => {
    const startDate = new Date('2024-05-02');
    const endDate = new Date('2026-05-03');
    const apy = 34.6; // 34.6% APY

    const calculateEarnings = () => {
      const now = new Date();
      const timeElapsed = (now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24 * 365); // in years
      const currentBalance = parseFloat(balance);
      const currentEarnings = currentBalance * (apy / 100) * timeElapsed;
      setEarnings(currentEarnings.toFixed(4));
      setEarningsUsdt((currentEarnings * ethPrice).toFixed(2));

      // Calculate daily earnings
      const dailyRate = (currentBalance * (apy / 100)) / 365;
      setDailyEarnings(dailyRate.toFixed(4));
      setDailyEarningsUsdt((dailyRate * ethPrice).toFixed(2));

      // Calculate time left
      const daysLeft = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      const yearsLeft = Math.floor(daysLeft / 365);
      const monthsLeft = Math.floor((daysLeft % 365) / 30);
      const remainingDays = daysLeft % 30;

      setTimeLeft(`${yearsLeft}y ${monthsLeft}m ${remainingDays}d`);
    };

    calculateEarnings();
    const interval = setInterval(calculateEarnings, 1000);
    return () => clearInterval(interval);
  }, [balance, ethPrice]);

  // Fetch balance from Ledger
  useEffect(() => {
    const fetchBalance = async () => {
      setIsLoadingBalance(true);
      setBalanceError(null);
      try {
        const web3 = new Web3(Web3.givenProvider || 'https://mainnet.infura.io/v3/YOUR-PROJECT-ID');
        const address = await ledgerService.getAddress();
        if (!address) {
          throw new Error('Failed to get Ledger address');
        }
        const balance = await web3.eth.getBalance(address);
        setBalance(web3.utils.fromWei(balance, 'ether'));
      } catch (error) {
        console.error('Error fetching balance:', error);
        setBalanceError('Failed to fetch balance from Ledger. Please check your connection.');
        setBalance('0');
      } finally {
        setIsLoadingBalance(false);
      }
    };

    fetchBalance();
    const interval = setInterval(fetchBalance, 30000); // Update every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const handleLogout = () => {
    setSelectedWallet('');
    setLedgerConnected(false);
    navigate('/');
  };

  // Network status chart data
  const networkChartData = {
    labels: Array.from({ length: 24 }, (_, i) => `${i}:00`),
    datasets: [
      {
        label: 'Network Status',
        data: networkStatus,
        borderColor: '#3B82F6',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        fill: true,
        tension: 0.4,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        display: false,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(255, 255, 255, 0.1)',
        },
        ticks: {
          color: '#9CA3AF',
        },
      },
      x: {
        grid: {
          color: 'rgba(255, 255, 255, 0.1)',
        },
        ticks: {
          color: '#9CA3AF',
        },
      },
    },
  };

  // Calculate pagination
  const indexOfLastValidator = currentPage * validatorsPerPage;
  const indexOfFirstValidator = indexOfLastValidator - validatorsPerPage;
  const currentValidators = otherValidators.slice(indexOfFirstValidator, indexOfLastValidator);
  const totalPages = Math.ceil(otherValidators.length / validatorsPerPage);

  const handlePageChange = (pageNumber: number) => {
    setCurrentPage(pageNumber);
  };

  return (
    <div className="min-h-screen bg-[#0A0F1C] text-white">
      {/* Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-1/2 -right-1/2 w-full h-full bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-1/2 -left-1/2 w-full h-full bg-gradient-to-tr from-green-500/10 to-yellow-500/10 rounded-full blur-3xl"></div>
      </div>

      <div className="relative max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent mb-2">
              Validator Dashboard
            </h1>
            <p className="text-gray-400">Track your validator performance and earnings</p>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center space-x-2 px-6 py-3 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-all duration-300 hover:scale-105"
          >
            <LogOut className="w-5 h-5" />
            <span>Logout</span>
          </button>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="group bg-gradient-to-br from-blue-500/20 to-blue-600/20 rounded-2xl border border-blue-500/30 p-6 hover:scale-105 transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/20">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-blue-500/30 flex items-center justify-center group-hover:bg-blue-500/40 transition-all duration-300">
                <Wallet className="w-6 h-6 text-blue-400" />
              </div>
              <span className="text-blue-400 text-sm font-medium">Current Balance</span>
            </div>
            {isLoadingBalance ? (
              <div className="flex items-center space-x-2">
                <Loader2 className="w-6 h-6 text-blue-400 animate-spin" />
                <span className="text-gray-400">Loading...</span>
              </div>
            ) : balanceError ? (
              <div className="text-red-400 text-sm">{balanceError}</div>
            ) : (
              <>
                <p className="text-3xl font-bold">{balance} ETH</p>
                <p className="text-sm text-gray-400 mt-1">≈ ${(parseFloat(balance) * ethPrice).toFixed(2)}</p>
              </>
            )}
          </div>

          <div className="group bg-gradient-to-br from-green-500/20 to-green-600/20 rounded-2xl border border-green-500/30 p-6 hover:scale-105 transition-all duration-300 hover:shadow-lg hover:shadow-green-500/20">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-green-500/30 flex items-center justify-center group-hover:bg-green-500/40 transition-all duration-300">
                <Percent className="w-6 h-6 text-green-400" />
              </div>
              <span className="text-green-400 text-sm font-medium">APY</span>
            </div>
            <p className="text-3xl font-bold text-green-400">34.6%</p>
          </div>

          <div className="group bg-gradient-to-br from-purple-500/20 to-purple-600/20 rounded-2xl border border-purple-500/30 p-6 hover:scale-105 transition-all duration-300 hover:shadow-lg hover:shadow-purple-500/20">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-purple-500/30 flex items-center justify-center group-hover:bg-purple-500/40 transition-all duration-300">
                <Clock className="w-6 h-6 text-purple-400" />
              </div>
              <span className="text-purple-400 text-sm font-medium">Time Remaining</span>
            </div>
            <p className="text-3xl font-bold text-purple-400">{timeLeft}</p>
          </div>

          <div className="group bg-gradient-to-br from-yellow-500/20 to-yellow-600/20 rounded-2xl border border-yellow-500/30 p-6 hover:scale-105 transition-all duration-300 hover:shadow-lg hover:shadow-yellow-500/20">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-yellow-500/30 flex items-center justify-center group-hover:bg-yellow-500/40 transition-all duration-300">
                <DollarSign className="w-6 h-6 text-yellow-400" />
              </div>
              <span className="text-yellow-400 text-sm font-medium">Total Earnings</span>
            </div>
            <p className="text-3xl font-bold text-yellow-400">${earningsUsdt}</p>
            <p className="text-sm text-gray-400 mt-1">≈ {earnings} ETH</p>
          </div>
        </div>

        {/* Daily Earnings Card */}
        <div className="mb-8 bg-gradient-to-br from-gray-900/50 to-gray-800/50 backdrop-blur-xl rounded-2xl border border-gray-700/50 p-6 hover:shadow-xl hover:shadow-blue-500/10 transition-all duration-300">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                <p className="text-gray-400 text-sm">Daily Earnings</p>
                <p className="text-2xl font-bold text-blue-400">${dailyEarningsUsdt}</p>
                <p className="text-sm text-gray-400">≈ {dailyEarnings} ETH</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-gray-400 text-sm">Projected Monthly</p>
              <p className="text-2xl font-bold text-blue-400">${(parseFloat(dailyEarningsUsdt) * 30).toFixed(2)}</p>
              <p className="text-sm text-gray-400">≈ {(parseFloat(dailyEarnings) * 30).toFixed(4)} ETH</p>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Network Status Chart */}
          <div className="lg:col-span-2 bg-gradient-to-br from-gray-900/50 to-gray-800/50 backdrop-blur-xl rounded-2xl border border-gray-700/50 p-8 hover:shadow-xl hover:shadow-blue-500/10 transition-all duration-300">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-semibold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">Network Status</h2>
              <div className="flex items-center space-x-2 text-green-400 bg-green-500/10 px-4 py-2 rounded-full">
                <Network className="w-5 h-5" />
                <span className="text-sm font-medium">Active</span>
              </div>
            </div>
            <div className="h-[300px]">
              <Line data={networkChartData} options={chartOptions} />
            </div>
          </div>

          {/* Validator Info */}
          <div className="bg-gradient-to-br from-gray-900/50 to-gray-800/50 backdrop-blur-xl rounded-2xl border border-gray-700/50 p-8 hover:shadow-xl hover:shadow-purple-500/10 transition-all duration-300">
            <h2 className="text-2xl font-semibold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent mb-8">Validator Details</h2>
            <div className="space-y-6">
              <div className="bg-gradient-to-br from-gray-800/50 to-gray-700/50 rounded-xl p-6 border border-gray-700/50">
                <div className="flex items-center space-x-4 mb-4">
                  <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center">
                    <Calendar className="w-6 h-6 text-blue-400" />
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm">Deposit Period</p>
                    <p className="text-lg font-semibold">May 2, 2024 - May 3, 2026</p>
                  </div>
                </div>
                <div className="h-2 bg-gray-700/50 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-blue-500 to-purple-600 rounded-full transition-all duration-500"
                    style={{ width: '0%' }}
                  ></div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-gray-800/50 to-gray-700/50 rounded-xl p-6 border border-gray-700/50">
                <div className="flex items-center space-x-4 mb-4">
                  <div className="w-12 h-12 rounded-xl bg-green-500/20 flex items-center justify-center">
                    <Shield className="w-6 h-6 text-green-400" />
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm">Status</p>
                    <p className="text-lg font-semibold text-green-400">Active</p>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-gray-800/50 to-gray-700/50 rounded-xl p-6 border border-gray-700/50">
                <div className="flex items-center space-x-4 mb-4">
                  <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center">
                    <Server className="w-6 h-6 text-purple-400" />
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm">Active Nodes</p>
                    <p className="text-lg font-semibold text-purple-400">{activeNodes} / {totalNodes}</p>
                  </div>
                </div>
                <div className="h-2 bg-gray-700/50 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-purple-500 to-purple-600 rounded-full transition-all duration-500"
                    style={{ width: `${(activeNodes / totalNodes) * 100}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Other Validators */}
        <div className="mt-8 bg-gradient-to-br from-gray-900/50 to-gray-800/50 backdrop-blur-xl rounded-2xl border border-gray-700/50 p-8 hover:shadow-xl hover:shadow-blue-500/10 transition-all duration-300">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-semibold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">Other Validators</h2>
            <div className="flex items-center space-x-2 text-gray-400">
              <span className="text-sm">Total Validators: {otherValidators.length}</span>
            </div>
          </div>
          <div className="space-y-4">
            {currentValidators.map((validator, index) => (
              <div key={index} className="bg-gradient-to-br from-gray-800/50 to-gray-700/50 rounded-xl p-6 border border-gray-700/50 hover:scale-[1.02] transition-all duration-300">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
                      <Users className="w-5 h-5 text-blue-400" />
                    </div>
                    <div>
                      <p className="text-gray-400 text-sm">Address</p>
                      <p className="text-sm font-medium">{validator.address.slice(0, 6)}...{validator.address.slice(-4)}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-gray-400 text-sm">Balance</p>
                    <p className="text-sm font-medium text-green-400">{validator.balance} ETH</p>
                  </div>
                  <div className="text-right">
                    <p className="text-gray-400 text-sm">Status</p>
                    <p className={`text-sm font-medium ${
                      validator.status === 'active' ? 'text-green-400' :
                      validator.status === 'pending' ? 'text-yellow-400' :
                      'text-red-400'
                    }`}>
                      {validator.status.charAt(0).toUpperCase() + validator.status.slice(1)}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          <div className="mt-8 flex items-center justify-between border-t border-gray-700/50 pt-6">
            <div className="text-sm text-gray-400">
              Showing <span className="text-white font-medium">{indexOfFirstValidator + 1}</span> to <span className="text-white font-medium">{Math.min(indexOfLastValidator, otherValidators.length)}</span> of <span className="text-white font-medium">{otherValidators.length}</span> validators
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-gradient-to-r from-gray-800/50 to-gray-700/50 text-gray-400 hover:from-gray-700/50 hover:to-gray-600/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 border border-gray-700/50 hover:border-gray-600/50"
              >
                <ChevronRight className="w-4 h-4 rotate-180" />
                <span>Previous</span>
              </button>
              <div className="flex items-center space-x-2">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const pageNumber = i + 1;
                  return (
                    <button
                      key={pageNumber}
                      onClick={() => handlePageChange(pageNumber)}
                      className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                        currentPage === pageNumber
                          ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/20'
                          : 'bg-gradient-to-r from-gray-800/50 to-gray-700/50 text-gray-400 hover:from-gray-700/50 hover:to-gray-600/50'
                      } transition-all duration-300 border border-gray-700/50 hover:border-gray-600/50`}
                    >
                      {pageNumber}
                    </button>
                  );
                })}
                {totalPages > 5 && (
                  <>
                    <span className="text-gray-400">...</span>
                    <button
                      onClick={() => handlePageChange(totalPages)}
                      className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                        currentPage === totalPages
                          ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/20'
                          : 'bg-gradient-to-r from-gray-800/50 to-gray-700/50 text-gray-400 hover:from-gray-700/50 hover:to-gray-600/50'
                      } transition-all duration-300 border border-gray-700/50 hover:border-gray-600/50`}
                    >
                      {totalPages}
                    </button>
                  </>
                )}
              </div>
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-gradient-to-r from-gray-800/50 to-gray-700/50 text-gray-400 hover:from-gray-700/50 hover:to-gray-600/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 border border-gray-700/50 hover:border-gray-600/50"
              >
                <span>Next</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Additional Info */}
        <div className="mt-8 bg-gradient-to-br from-gray-900/50 to-gray-800/50 backdrop-blur-xl rounded-2xl border border-gray-700/50 p-8 hover:shadow-xl hover:shadow-blue-500/10 transition-all duration-300">
          <div className="flex items-start space-x-6">
            <div className="w-14 h-14 rounded-xl bg-blue-500/20 flex items-center justify-center flex-shrink-0">
              <Info className="w-7 h-7 text-blue-400" />
            </div>
            <div>
              <h3 className="text-xl font-semibold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent mb-4">About Your Validator</h3>
              <p className="text-gray-400 text-sm leading-relaxed">
                Your validator is actively participating in the Ethereum network, helping to secure the network and earn rewards.
                The current APY of 34.6% is calculated based on network conditions and validator performance.
                Earnings are automatically compounded and will be available for withdrawal at the end of the deposit period.
                The validator will continue to earn rewards until May 3, 2026, at which point you can withdraw your initial deposit
                and accumulated earnings.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage; 