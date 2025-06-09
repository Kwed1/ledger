import {
	ArrowDownToLine,
	Chrome,
	Eye,
	EyeOff,
	HardDrive,
	Send,
	Shield,
	Smartphone,
	TrendingUp,
	Wallet,
} from 'lucide-react'
import { useEffect, useState } from 'react'
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
} from 'recharts'
import { useAuth } from '../contexts/AuthContext'
import { ledgerService, useGetCoinPricesQuery, useGetHistoricalPricesQuery } from '../services/ledger'

// Import SVG icons
import bitcoinIcon from '../assets/icons/bitcoin.svg'
import ethereumIcon from '../assets/icons/ethereum.svg'
import usdtIcon from '../assets/icons/usdt.svg'

const CryptoWalletInterface = () => {
	const { user, userData, signIn, signOut, updateBalance } = useAuth()
	const [hideBalances, setHideBalances] = useState(false)
	const [selectedTimeframe, setSelectedTimeframe] = useState('24H')
	const [isMobile, setIsMobile] = useState(false)
	const [profileImageError, setProfileImageError] = useState(false)
	const [ledgerStatus, setLedgerStatus] = useState<'disconnected' | 'connecting' | 'connected'>('disconnected')
	const [ledgerAddress, setLedgerAddress] = useState<string>('')
	const [isRefreshingBalances, setIsRefreshingBalances] = useState(false)
	const [portfolioHistory, setPortfolioHistory] = useState<any[]>([])

	const { data: coinPrices = [], isLoading: isLoadingPrices } = useGetCoinPricesQuery('bitcoin,ethereum,cardano,solana,polygon', {
		pollingInterval: 30000,
	})

	const { data: historicalPrices = [], isLoading: isLoadingHistory } = useGetHistoricalPricesQuery(
		{ coinId: 'ethereum', days: 7 },
		{ skip: !ledgerAddress }
	)

	useEffect(() => {
		const checkMobile = () => setIsMobile(window.innerWidth < 768)
		checkMobile()
		window.addEventListener('resize', checkMobile)
		return () => window.removeEventListener('resize', checkMobile)
	}, [])

	useEffect(() => {
		if (historicalPrices.length > 0 && userData?.balances) {
			const history = historicalPrices.map(({ timestamp, price }) => {
				const totalValue = userData.balances.reduce((total, balance) => {
					const coin = coinPrices.find(c => c.id === balance.coinId)
					return total + (coin?.current_price || 0) * balance.amount
				}, 0)
				const ethereumPrice = coinPrices.find(c => c.id === 'ethereum')?.current_price
				return {
					name: new Date(timestamp).toLocaleTimeString(),
					value: totalValue * (price / (ethereumPrice || 1))
				}
			})
			setPortfolioHistory(history)
		}
	}, [historicalPrices, userData?.balances, coinPrices])

	const handleLedgerConnect = async () => {
		if (ledgerStatus === 'connecting') return

		setLedgerStatus('connecting')
		try {
			await ledgerService.connect()
			const address = await ledgerService.getAddress()
			setLedgerAddress(address)
			setLedgerStatus('connected')
			// Get initial balances after connecting
			await refreshBalances(address)
		} catch (error) {
			console.error('Failed to connect to Ledger:', error)
			setLedgerStatus('disconnected')
		}
	}

	const handleLedgerSign = async () => {
		if (ledgerStatus !== 'connected') return

		try {
			const { address, signature } = await ledgerService.authenticateWithBackend()
			console.log('Authentication successful:', { address, signature })
			// Refresh balances after successful authentication
			await refreshBalances(address)
		} catch (error) {
			console.error('Failed to authenticate with Ledger:', error)
		}
	}

	const refreshBalances = async (address: string) => {
		if (isRefreshingBalances) return

		setIsRefreshingBalances(true)
		try {
			const balances = await ledgerService.getBalances(address)
			// Update each balance in the database
			for (const balance of balances) {
				await updateBalance(balance.coinId, balance.amount)
			}
		} catch (error) {
			console.error('Failed to refresh balances:', error)
		} finally {
			setIsRefreshingBalances(false)
		}
	}

	const getCoinLogo = (symbol: string) => {
		const logos: { [key: string]: string } = {
			btc: bitcoinIcon,
			eth: ethereumIcon,
			usdt: usdtIcon,
			usdc: 'https://cryptologos.cc/logos/usd-coin-usdc-logo.svg',
			dai: 'https://cryptologos.cc/logos/multi-collateral-dai-dai-logo.svg',
			ada: 'https://cryptologos.cc/logos/cardano-ada-logo.svg',
			sol: 'https://cryptologos.cc/logos/solana-sol-logo.svg',
			matic: 'https://cryptologos.cc/logos/polygon-matic-logo.svg'
		}
		return logos[symbol.toLowerCase()] || `https://ui-avatars.com/api/?name=${symbol}&background=random`
	}

	const getUserBalance = (coinId: string) => {
		if (!userData?.balances) return 0
		const balance = userData.balances.find(b => b.coinId === coinId)
		return balance?.amount || 0
	}

	const getTotalPortfolioValue = () => {
		if (!coinPrices || !userData?.balances) return 0
		return userData.balances.reduce((total, balance) => {
			const coin = coinPrices.find(c => c.id === balance.coinId)
			return total + (coin?.current_price || 0) * balance.amount
		}, 0)
	}

	const getPortfolioChange = () => {
		if (portfolioHistory.length < 2) return { value: 0, percentage: 0 }
		const currentValue = portfolioHistory[portfolioHistory.length - 1].value
		const previousValue = portfolioHistory[0].value
		const change = currentValue - previousValue
		const percentage = (change / previousValue) * 100
		return { value: change, percentage }
	}

	const cryptoAssets =
		coinPrices?.map(coin => ({
			name: coin.name,
			symbol: coin.symbol.toUpperCase(),
			balance: getUserBalance(coin.id),
			price: coin.current_price,
			change: coin.price_change_percentage_24h,
			logo: getCoinLogo(coin.symbol),
			lastUpdated: new Date(coin.last_updated).toLocaleTimeString(),
		})) || []

	const timeframes = ['1H', '24H', '7D', '1M', '1Y']

	const formatBalance = (balance: number) => {
		return hideBalances ? '••••••' : `$${balance.toLocaleString()}`
	}

	const portfolioChange = getPortfolioChange()

	const pieData = cryptoAssets.map(asset => ({
		name: asset.name,
		value: (asset.balance * asset.price / getTotalPortfolioValue()) * 100,
		color: asset.symbol === 'BTC' ? '#F7931A' :
			asset.symbol === 'ETH' ? '#627EEA' :
			asset.symbol === 'USDT' ? '#26A17B' :
			asset.symbol === 'USDC' ? '#2775CA' :
			asset.symbol === 'DAI' ? '#F5AC37' :
			asset.symbol === 'ADA' ? '#0033AD' :
			asset.symbol === 'SOL' ? '#00FFA3' :
			asset.symbol === 'MATIC' ? '#8247E5' : '#FF6B6B'
	}))

	const getProfileImage = () => {
		if (!user?.photoURL || profileImageError) {
			const name = user?.displayName || user?.email || 'User'
			return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random`
		}
		return user.photoURL
	}

	return (
		<div className='min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white'>
			{/* Header */}
			<div className='sticky top-0 z-50 backdrop-blur-lg bg-gray-900/80 border-b border-gray-700/50'>
				<div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
					<div className='flex items-center justify-between h-16'>
						<div className='flex items-center space-x-3'>
							<div className='w-8 h-8 bg-gradient-to-r from-cyan-400 to-purple-500 rounded-lg flex items-center justify-center'>
								<Wallet className='w-5 h-5 text-white' />
							</div>
							<span className='text-xl font-bold bg-gradient-to-r from-cyan-400 to-purple-500 bg-clip-text text-transparent'>
								CryptoVault
							</span>
						</div>

						<div className='flex items-center space-x-4'>
							{!isMobile && (
								<div className='flex items-center space-x-4'>
									<div className='flex items-center space-x-2'>
										<HardDrive className={`w-4 h-4 ${
											ledgerStatus === 'connected' ? 'text-green-400' : 
											ledgerStatus === 'connecting' ? 'text-yellow-400' : 
											'text-red-400'
										}`} />
										<span className='text-sm text-gray-300'>
											{ledgerStatus === 'connected' ? 'Ledger Connected' :
											 ledgerStatus === 'connecting' ? 'Connecting...' :
											 'Ledger Disconnected'}
										</span>
									</div>
									{ledgerStatus === 'disconnected' && (
										<button
											onClick={handleLedgerConnect}
											className='flex items-center space-x-2 bg-cyan-500 text-white px-4 py-2 rounded-lg font-medium hover:bg-cyan-600 transition-colors'
										>
											<HardDrive className='w-4 h-4' />
											<span>Connect Ledger</span>
										</button>
									)}
									{ledgerStatus === 'connected' && (
										<>
											<button
												onClick={handleLedgerSign}
												className='flex items-center space-x-2 bg-purple-500 text-white px-4 py-2 rounded-lg font-medium hover:bg-purple-600 transition-colors'
											>
												<Shield className='w-4 h-4' />
												<span>Sign Message</span>
											</button>
											<button
												onClick={() => ledgerAddress && refreshBalances(ledgerAddress)}
												disabled={isRefreshingBalances}
												className='flex items-center space-x-2 bg-green-500 text-white px-4 py-2 rounded-lg font-medium hover:bg-green-600 transition-colors disabled:opacity-50'
											>
												<TrendingUp className='w-4 h-4' />
												<span>{isRefreshingBalances ? 'Refreshing...' : 'Refresh Balances'}</span>
											</button>
										</>
									)}
								</div>
							)}

							{user ? (
								<div className='flex items-center space-x-4'>
									<div className='relative'>
										<img
											src={getProfileImage()}
											alt={user.displayName || 'User'}
											className='w-8 h-8 rounded-full object-cover'
											onError={() => setProfileImageError(true)}
										/>
										<div className='absolute -bottom-1 -right-1 w-3 h-3 bg-green-400 rounded-full border-2 border-gray-900'></div>
									</div>
									<span className='text-sm text-gray-300'>
										{user.displayName || user.email}
									</span>
									<button
										onClick={() => signOut()}
										className='flex items-center space-x-2 bg-red-500 text-white px-4 py-2 rounded-lg font-medium hover:bg-red-600 transition-colors'
									>
										<span>Sign Out</span>
									</button>
								</div>
							) : (
								<button
									onClick={() => window.location.reload()}
									className='flex items-center space-x-2 bg-white text-gray-900 px-4 py-2 rounded-lg font-medium hover:bg-gray-100 transition-colors'
								>
									<Chrome className='w-4 h-4' />
									<span>Sign In</span>
								</button>
							)}
						</div>
					</div>
				</div>
			</div>

			<div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8'>
				{isLoadingPrices || isLoadingHistory ? (
					<div className='flex justify-center items-center h-64'>
						<div className='animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-cyan-500'></div>
					</div>
				) : (
					<div className='grid grid-cols-1 lg:grid-cols-12 gap-8'>
						{/* Main Portfolio Section */}
						<div className='lg:col-span-8 space-y-6'>
							{/* Portfolio Overview Card */}
							<div className='bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-sm rounded-2xl border border-gray-700/50 p-6 shadow-2xl'>
								<div className='flex items-center justify-between mb-6'>
									<div>
										<h2 className='text-2xl font-bold text-white mb-1'>
											Portfolio Balance
										</h2>
										<div className='flex items-center space-x-4'>
											<span className='text-4xl font-bold bg-gradient-to-r from-cyan-400 to-purple-500 bg-clip-text text-transparent'>
												{formatBalance(getTotalPortfolioValue())}
											</span>
											<button
												onClick={() => setHideBalances(!hideBalances)}
												className='p-2 rounded-lg hover:bg-gray-700/50 transition-colors'
											>
												{hideBalances ? (
													<Eye className='w-5 h-5' />
												) : (
													<EyeOff className='w-5 h-5' />
												)}
											</button>
										</div>
										{ledgerAddress && (
											<div className='mt-2 text-sm text-gray-400'>
												Address: {ledgerAddress.slice(0, 6)}...{ledgerAddress.slice(-4)}
											</div>
										)}
										<div className='flex items-center space-x-2 mt-2'>
											<TrendingUp className={`w-4 h-4 ${portfolioChange.percentage >= 0 ? 'text-green-400' : 'text-red-400'}`} />
											<span className={`${portfolioChange.percentage >= 0 ? 'text-green-400' : 'text-red-400'} font-medium`}>
												{portfolioChange.percentage >= 0 ? '+' : ''}{formatBalance(portfolioChange.value)} ({portfolioChange.percentage.toFixed(2)}%)
											</span>
											<span className='text-gray-400'>24h</span>
										</div>
									</div>

									<div className='flex space-x-2'>
										<button className='bg-cyan-500 hover:bg-cyan-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors'>
											<Send className='w-4 h-4' />
											<span>Send</span>
										</button>
										<button className='bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors'>
											<ArrowDownToLine className='w-4 h-4' />
											<span>Receive</span>
										</button>
									</div>
								</div>

								{/* Timeframe Selector */}
								<div className='flex space-x-2 mb-6'>
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
								<div className='h-64'>
									<ResponsiveContainer width='100%' height='100%'>
										<LineChart data={portfolioHistory}>
											<CartesianGrid strokeDasharray='3 3' stroke='#374151' />
											<XAxis dataKey='name' stroke='#9CA3AF' />
											<YAxis stroke='#9CA3AF' />
											<Tooltip
												contentStyle={{
													backgroundColor: '#1F2937',
													border: '1px solid #374151',
													borderRadius: '0.5rem',
												}}
											/>
											<Line
												type='monotone'
												dataKey='value'
												stroke='url(#gradient)'
												strokeWidth={3}
												dot={{ fill: '#06B6D4', strokeWidth: 2 }}
											/>
											<defs>
												<linearGradient
													id='gradient'
													x1='0%'
													y1='0%'
													x2='100%'
													y2='0%'
												>
													<stop offset='0%' stopColor='#06B6D4' />
													<stop offset='100%' stopColor='#8B5CF6' />
												</linearGradient>
											</defs>
										</LineChart>
									</ResponsiveContainer>
								</div>
							</div>

							{/* Assets List */}
							<div className='bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-sm rounded-2xl border border-gray-700/50 shadow-2xl'>
								<div className='p-6 border-b border-gray-700/50'>
									<h3 className='text-xl font-bold text-white'>Your Assets</h3>
								</div>

								<div className='divide-y divide-gray-700/50'>
									{cryptoAssets.map(asset => (
										<div
											key={asset.symbol}
											className='p-6 flex items-center justify-between'
										>
											<div className='flex items-center space-x-4'>
												<div className='w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center overflow-hidden'>
													<img
														src={getCoinLogo(asset.symbol)}
														alt={asset.name}
														className='w-8 h-8 object-contain'
														onError={(e) => {
															const target = e.target as HTMLImageElement;
															target.src = `https://ui-avatars.com/api/?name=${asset.symbol}&background=random`;
														}}
													/>
												</div>
												<div>
													<div className='font-semibold text-white'>
														{asset.name}
													</div>
													<div className='text-sm text-gray-400'>
														{asset.symbol}
													</div>
												</div>
											</div>

											<div className='text-right'>
												<div className='font-semibold text-white'>
													{formatBalance(asset.balance * asset.price)}
												</div>
												<div className='text-sm text-gray-400'>
													{hideBalances
														? '••••••'
														: `${asset.balance} ${asset.symbol}`}
												</div>
											</div>

											<div className='text-right'>
												<div className='font-semibold text-white'>
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

											<div className='text-right'>
												<div className='font-semibold text-white'>
													{asset.lastUpdated}
												</div>
											</div>
										</div>
									))}
								</div>
							</div>
						</div>

						{/* Sidebar */}
						<div className='lg:col-span-4 space-y-6'>
							{/* Portfolio Distribution */}
							<div className='bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-sm rounded-2xl border border-gray-700/50 p-6 shadow-2xl'>
								<h3 className='text-xl font-bold text-white mb-6'>
									Portfolio Distribution
								</h3>

								<div className='h-48 mb-6'>
									<ResponsiveContainer width='100%' height='100%'>
										<PieChart>
											<Pie
												data={pieData}
												cx='50%'
												cy='50%'
												innerRadius={40}
												outerRadius={80}
												paddingAngle={5}
												dataKey='value'
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

								<div className='space-y-3'>
									{pieData.map((item, index) => (
										<div
											key={item.name}
											className='flex items-center justify-between'
										>
											<div className='flex items-center space-x-3'>
												<div
													className='w-3 h-3 rounded-full'
													style={{ backgroundColor: item.color }}
												></div>
												<span className='text-gray-300'>{item.name}</span>
											</div>
											<span className='font-semibold text-white'>
												{item.value.toFixed(1)}%
											</span>
										</div>
									))}
								</div>
							</div>

							{/* Security Status */}
							<div className='bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-sm rounded-2xl border border-gray-700/50 p-6 shadow-2xl'>
								<h3 className='text-xl font-bold text-white mb-4'>
									Security Status
								</h3>

								<div className='space-y-4'>
									<div className='flex items-center justify-between p-3 bg-green-500/10 border border-green-500/20 rounded-lg'>
										<div className='flex items-center space-x-3'>
											<HardDrive className='w-5 h-5 text-green-400' />
											<span className='text-green-400 font-medium'>
												Hardware Wallet
											</span>
										</div>
										<div className='w-2 h-2 bg-green-400 rounded-full'></div>
									</div>

									<div className='flex items-center justify-between p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg'>
										<div className='flex items-center space-x-3'>
											<Smartphone className='w-5 h-5 text-blue-400' />
											<span className='text-blue-400 font-medium'>
												2FA Enabled
											</span>
										</div>
										<div className='w-2 h-2 bg-blue-400 rounded-full'></div>
									</div>

									<div className='flex items-center justify-between p-3 bg-purple-500/10 border border-purple-500/20 rounded-lg'>
										<div className='flex items-center space-x-3'>
											<Shield className='w-5 h-5 text-purple-400' />
											<span className='text-purple-400 font-medium'>
												Backup Complete
											</span>
										</div>
										<div className='w-2 h-2 bg-purple-400 rounded-full'></div>
									</div>
								</div>
							</div>
						</div>
					</div>
				)}
			</div>
		</div>
	)
}

export default CryptoWalletInterface 