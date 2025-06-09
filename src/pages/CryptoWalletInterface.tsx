import { useEffect, useState } from 'react';
import {
  ArrowDownToLine,
  Eye,
  EyeOff,
  HardDrive,
  Send,
  Shield,
  Smartphone,
  TrendingUp,
  Wallet,
} from 'lucide-react';
import {
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useAuth } from '../contexts/AuthContext';
import { useGetCoinPricesQuery } from '../services/ledger';

const CryptoWalletInterface = () => {
  const { logout } = useAuth();
  const { user, userData } = useAuth();
  const [hideBalances, setHideBalances] = useState(false);
  const [selectedTimeframe, setSelectedTimeframe] = useState('24H');
  const [isMobile, setIsMobile] = useState(false);
  const [profileImageError, setProfileImageError] = useState(false);

  // Fetch coin prices from Ledger with polling
  const { data: coinPrices, isLoading: isLoadingPrices } =
    useGetCoinPricesQuery('bitcoin,ethereum,cardano,solana,polygon', {
      pollingInterval: 30000, // Update every 30 seconds
    });

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const getCoinLogo = (symbol: string) => {
    const logos: { [key: string]: string } = {
      btc: '₿',
      eth: 'Ξ',
      ada: '₳',
      sol: '◎',
      matic: '⬡',
    };
    return logos[symbol.toLowerCase()] || symbol;
  };

  const getUserBalance = (coinId: string) => {
    return userData?.balances?.find(b => b.coinId === coinId)?.amount || 0;
  };

  const calculateTotalBalance = () => {
    if (!coinPrices || !userData?.balances) return 0;
    return userData.balances.reduce((total, balance) => {
      const coin = coinPrices.find(c => c.id === balance.coinId);
      return total + (coin?.current_price || 0) * balance.amount;
    }, 0);
  };

  const cryptoAssets =
    coinPrices?.map(coin => ({
      name: coin.name,
      symbol: coin.symbol.toUpperCase(),
      balance: getUserBalance(coin.id),
      price: coin.current_price,
      change: coin.price_change_percentage_24h,
      logo: getCoinLogo(coin.symbol),
      lastUpdated: new Date(coin.last_updated).toLocaleTimeString(),
    })) || [];

  const timeframes = ['1H', '24H', '7D', '1M', '1Y'];

  const formatBalance = (balance: number) => {
    return hideBalances ? '••••••' : `$${balance.toLocaleString()}`;
  };

  const portfolioData = [
    { name: '12AM', value: 45230 },
    { name: '4AM', value: 46120 },
    { name: '8AM', value: 44890 },
    { name: '12PM', value: 47650 },
    { name: '4PM', value: 49120 },
    { name: '8PM', value: 48340 },
    { name: '12AM', value: 52847 },
  ];

  const pieData = [
    { name: 'Bitcoin', value: 45.2, color: '#F7931A' },
    { name: 'Ethereum', value: 28.7, color: '#627EEA' },
    { name: 'Cardano', value: 12.3, color: '#0033AD' },
    { name: 'Solana', value: 8.1, color: '#00FFA3' },
    { name: 'Others', value: 5.7, color: '#FF6B6B' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white">
      {/* Header */}
      <div className="sticky top-0 z-50 backdrop-blur-lg bg-gray-900/80 border-b border-gray-700/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <Wallet className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
                SafePal
              </span>
            </div>

            <div className="flex items-center space-x-4">
              {!isMobile && (
                <div className="flex items-center space-x-2">
                  <HardDrive className="w-4 h-4 text-green-400" />
                  <span className="text-sm text-gray-300">
                    Ledger Connected
                  </span>
                </div>
              )}

              <button
                onClick={logout}
                className="flex items-center space-x-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 px-4 py-2 rounded-xl font-medium transition-all"
              >
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {isLoadingPrices ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-cyan-500"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Main Portfolio Section */}
            <div className="lg:col-span-8 space-y-6">
              {/* Portfolio Overview Card */}
              <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-sm rounded-2xl border border-gray-700/50 p-6 shadow-2xl">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-2xl font-bold text-white mb-1">
                      Portfolio Balance
                    </h2>
                    <div className="flex items-center space-x-4">
                      <span className="text-4xl font-bold bg-gradient-to-r from-cyan-400 to-purple-500 bg-clip-text text-transparent">
                        {formatBalance(calculateTotalBalance())}
                      </span>
                      <button
                        onClick={() => setHideBalances(!hideBalances)}
                        className="p-2 rounded-lg hover:bg-gray-700/50 transition-colors"
                      >
                        {hideBalances ? (
                          <Eye className="w-5 h-5" />
                        ) : (
                          <EyeOff className="w-5 h-5" />
                        )}
                      </button>
                    </div>
                    <div className="flex items-center space-x-2 mt-2">
                      <TrendingUp className="w-4 h-4 text-green-400" />
                      <span className="text-green-400 font-medium">
                        +$2,847.23 (5.67%)
                      </span>
                      <span className="text-gray-400">24h</span>
                    </div>
                  </div>

                  <div className="flex space-x-2">
                    <button className="bg-cyan-500 hover:bg-cyan-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors">
                      <Send className="w-4 h-4" />
                      <span>Send</span>
                    </button>
                    <button className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors">
                      <ArrowDownToLine className="w-4 h-4" />
                      <span>Receive</span>
                    </button>
                  </div>
                </div>

                {/* Timeframe Selector */}
                <div className="flex space-x-2 mb-6">
                  {timeframes.map(tf => (
                    <button
                      key={tf}
                      onClick={() => setSelectedTimeframe(tf)}
                      className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                        selectedTimeframe === tf
                          ? 'bg-cyan-500 text-white'
                          : 'bg-gray-700/50 text-gray-300 hover:bg-gray-600/50'
                      }`}
                    >
                      {tf}
                    </button>
                  ))}
                </div>

                {/* Portfolio Chart */}
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={portfolioData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                      <XAxis dataKey="name" stroke="#9CA3AF" />
                      <YAxis stroke="#9CA3AF" />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#1F2937',
                          border: '1px solid #374151',
                          borderRadius: '0.5rem',
                        }}
                      />
                      <Line
                        type="monotone"
                        dataKey="value"
                        stroke="url(#gradient)"
                        strokeWidth={3}
                        dot={{ fill: '#06B6D4', strokeWidth: 2 }}
                      />
                      <defs>
                        <linearGradient
                          id="gradient"
                          x1="0%"
                          y1="0%"
                          x2="100%"
                          y2="0%"
                        >
                          <stop offset="0%" stopColor="#06B6D4" />
                          <stop offset="100%" stopColor="#8B5CF6" />
                        </linearGradient>
                      </defs>
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Assets List */}
              <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-sm rounded-2xl border border-gray-700/50 shadow-2xl">
                <div className="p-6 border-b border-gray-700/50">
                  <h3 className="text-xl font-bold text-white">Your Assets</h3>
                </div>

                <div className="divide-y divide-gray-700/50">
                  {cryptoAssets.map(asset => (
                    <div
                      key={asset.symbol}
                      className="p-6 flex items-center justify-between"
                    >
                      <div className="flex items-center space-x-4">
                        <div className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center text-xl">
                          {asset.logo}
                        </div>
                        <div>
                          <div className="font-semibold text-white">
                            {asset.name}
                          </div>
                          <div className="text-sm text-gray-400">
                            {asset.symbol}
                          </div>
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="font-semibold text-white">
                          {formatBalance(asset.balance * asset.price)}
                        </div>
                        <div className="text-sm text-gray-400">
                          {hideBalances
                            ? '••••••'
                            : `${asset.balance} ${asset.symbol}`}
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="font-semibold text-white">
                          {formatBalance(asset.price)}
                        </div>
                        <div
                          className={`text-sm ${
                            asset.change >= 0
                              ? 'text-green-400'
                              : 'text-red-400'
                          }`}
                        >
                          {asset.change >= 0 ? '+' : ''}
                          {asset.change.toFixed(2)}%
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="font-semibold text-white">
                          {asset.lastUpdated}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-4 space-y-6">
              {/* Portfolio Distribution */}
              <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-sm rounded-2xl border border-gray-700/50 p-6 shadow-2xl">
                <h3 className="text-xl font-bold text-white mb-6">
                  Portfolio Distribution
                </h3>

                <div className="h-48 mb-6">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={40}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#1F2937',
                          border: '1px solid #374151',
                          borderRadius: '0.5rem',
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                <div className="space-y-3">
                  {pieData.map((item, index) => (
                    <div
                      key={item.name}
                      className="flex items-center justify-between"
                    >
                      <div className="flex items-center space-x-3">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: item.color }}
                        ></div>
                        <span className="text-gray-300">{item.name}</span>
                      </div>
                      <span className="font-semibold text-white">
                        {item.value}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Security Status */}
              <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-sm rounded-2xl border border-gray-700/50 p-6 shadow-2xl">
                <h3 className="text-xl font-bold text-white mb-4">
                  Security Status
                </h3>

                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <HardDrive className="w-5 h-5 text-green-400" />
                      <span className="text-green-400 font-medium">
                        Hardware Wallet
                      </span>
                    </div>
                    <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Smartphone className="w-5 h-5 text-blue-400" />
                      <span className="text-blue-400 font-medium">
                        2FA Enabled
                      </span>
                    </div>
                    <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-purple-500/10 border border-purple-500/20 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Shield className="w-5 h-5 text-purple-400" />
                      <span className="text-purple-400 font-medium">
                        Backup Complete
                      </span>
                    </div>
                    <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-sm rounded-2xl border border-gray-700/50 p-6 shadow-2xl">
                <h3 className="text-xl font-bold text-white mb-4">
                  Quick Actions
                </h3>

                <div className="grid grid-cols-2 gap-3">
                  <button className="p-4 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 rounded-xl text-white font-medium transition-all transform hover:scale-105">
                    Buy Crypto
                  </button>
                  <button className="p-4 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 rounded-xl text-white font-medium transition-all transform hover:scale-105">
                    Sell Crypto
                  </button>
                  <button className="p-4 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 rounded-xl text-white font-medium transition-all transform hover:scale-105">
                    Stake
                  </button>
                  <button className="p-4 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 rounded-xl text-white font-medium transition-all transform hover:scale-105">
                    Swap
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CryptoWalletInterface; 