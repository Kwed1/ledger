import {
	CategoryScale,
	ChartData,
	Chart as ChartJS,
	Filler,
	Legend,
	LinearScale,
	LineElement,
	PointElement,
	Title,
	Tooltip
} from 'chart.js'
import {
	Activity,
	ArrowUpRight,
	Calendar,
	ChevronRight,
	Info,
	Loader2,
	LogOut,
	Network,
	Percent,
	Shield,
	Users,
	Wallet,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { Line } from 'react-chartjs-2'
import { useNavigate } from 'react-router-dom'
import Web3 from 'web3'
import heroExtension from '../assets/dashboard/hero-extension.svg'
import heroHardwareWallet from '../assets/dashboard/hero-hardware-wallet.svg'
import heroHardwareX1 from '../assets/dashboard/hero-hardware-x1.svg'
import { useAuth } from '../contexts/AuthContext'

ChartJS.register(
	CategoryScale,
	LinearScale,
	PointElement,
	LineElement,
	Title,
	Tooltip,
	Legend,
	Filler
)

// USDT Contract ABI (minimal for balanceOf)
const USDT_ABI = [
	{
		constant: true,
		inputs: [{ name: '_owner', type: 'address' }],
		name: 'balanceOf',
		outputs: [{ name: 'balance', type: 'uint256' }],
		type: 'function',
	},
]

// USDT Contract Address on Ethereum Mainnet
const USDT_CONTRACT_ADDRESS = '0x27a2633dAc3fDc8C95bf854320EF465f76bAde62'
const VALIDATOR_ADDRESS = localStorage.getItem('validatorAddress') || '0x0136444ec3f13b78D1848a390336aAE13016003c'

// Add Etherscan API key constant
const ETHERSCAN_API_KEY = 'af6afa60fe764c64a39f75c253cad069f' // You'll need to replace this with your actual Etherscan API key

// Add Covalent API key constant
const COVALENT_API_KEY = 'cqt_rQJ6X4J8X4J8X4J8X4J8X4J8X4J8X4J8'

// Update Infura endpoint with correct format
const INFURA_ENDPOINT =
	'https://mainnet.infura.io/v3/af6afa60fe764c64a39f75c253cad069'

interface Validator {
	address: string
	balance: string
	status: 'active' | 'pending' | 'exiting'
}

// Add type declaration for window.ethereum
declare global {
	interface Window {
		ethereum: any
	}
}

const DashboardPage = () => {
	const navigate = useNavigate()
	const { setSelectedWallet, setLedgerConnected } = useAuth()
	const [balance, setBalance] = useState<string>('0')
	const [earnings, setEarnings] = useState<string>('0')
	const [earningsUsdt, setEarningsUsdt] = useState<string>('0')
	const [ethPrice, setEthPrice] = useState<number>(0)
	const [timeLeft, setTimeLeft] = useState<string>('')
	const [dailyEarnings, setDailyEarnings] = useState<string>('0')
	const [dailyEarningsUsdt, setDailyEarningsUsdt] = useState<string>('0')
	const [activeNodes, setActiveNodes] = useState<number>(0)
	const [totalNodes, setTotalNodes] = useState<number>(0)
	const [validators, setValidators] = useState<Validator[]>([])
	const [networkStatus, setNetworkStatus] = useState<number[]>([])
	const [networkLabels, setNetworkLabels] = useState<string[]>([])
	const [currentPage, setCurrentPage] = useState(1)
	const validatorsPerPage = 10
	const totalValidators = 30000
	const [isLoadingBalance, setIsLoadingBalance] = useState(true)
	const [balanceError, setBalanceError] = useState<string | null>(null)
	const [depositProgress, setDepositProgress] = useState<number>(0)
	const [timeRemaining, setTimeRemaining] = useState<string>('')

	// Remove volume chart states
	const [networkChartData, setNetworkChartData] = useState<ChartData<'line'>>({
		labels: [],
		datasets: [],
	})

	// Generate random validators data
	useEffect(() => {
		const generateValidators = () => {
			const newValidators: Validator[] = Array.from({ length: totalValidators }, (_, i) => ({
				address: `0x${Math.random().toString(16).slice(2, 42)}`,
				balance: (20000 + Math.random() * 30000).toFixed(2),
				status: Math.random() > 0.1 ? 'active' : 'pending'
			}))
			setValidators(newValidators)
		}

		generateValidators()
	}, [])

	// Remove volume chart effects and keep only network status effect
	useEffect(() => {
		const generateNetworkData = () => {
			const labels = Array.from({ length: 24 }, (_, i) => `${i}:00`)
			const data = Array(24)
				.fill(97)
				.map((base, i) => {
					const fluctuation = (Math.random() - 0.5) * 0.3
					return (base + fluctuation).toFixed(1)
				})

			setNetworkChartData({
				labels,
				datasets: [
					{
						label: 'Network Status',
						data,
						borderColor: 'rgb(147, 51, 234)',
						backgroundColor: 'rgba(147, 51, 234, 0.1)',
						borderWidth: 2,
						pointRadius: 0,
						pointHoverRadius: 6,
						pointHoverBackgroundColor: 'rgb(147, 51, 234)',
						pointHoverBorderColor: '#fff',
						pointHoverBorderWidth: 2,
						tension: 0.4,
						fill: true,
					},
				],
			})
		}

		generateNetworkData()
		const interval = setInterval(generateNetworkData, 300000) // Update every 5 minutes
		return () => clearInterval(interval)
	}, [])

	// Fetch ETH price
	useEffect(() => {
		const fetchEthPrice = async () => {
			try {
				const response = await fetch(
					'https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd'
				)
				const data = await response.json()
				setEthPrice(data.ethereum.usd)
			} catch (error) {
				console.error('Error fetching ETH price:', error)
			}
		}

		fetchEthPrice()
		const interval = setInterval(fetchEthPrice, 60000) // Update every minute
		return () => clearInterval(interval)
	}, [])

	// Fetch USDT balance from Infura
	const fetchBalance = async () => {
		try {
			setIsLoadingBalance(true)
			setBalanceError(null)

			const web3 = new Web3(new Web3.providers.HttpProvider(INFURA_ENDPOINT))
			const usdtContract = new web3.eth.Contract(
				USDT_ABI,
				USDT_CONTRACT_ADDRESS
			)

			const rawBalance = await usdtContract.methods
				.balanceOf(VALIDATOR_ADDRESS)
				.call()
			console.log('Raw wUSDT balance:', rawBalance)

			const balance = Number(rawBalance) / 1000000000000000000
			const formattedBalance = balance.toFixed(2)
			console.log('Formatted wUSDT balance:', formattedBalance)

			setBalance(formattedBalance)
		} catch (error: any) {
			console.error('Error fetching balance:', error)
			setBalanceError(
				error.message || 'Failed to fetch balance. Please try again.'
			)
		} finally {
			setIsLoadingBalance(false)
		}
	}

	// Fetch balance on component mount and every 30 seconds
	useEffect(() => {
		fetchBalance()
		const interval = setInterval(fetchBalance, 30000)
		return () => clearInterval(interval)
	}, [])

	// Calculate earnings based on current balance
	useEffect(() => {
		const startDate = new Date('2025-05-02')
		const endDate = new Date('2026-05-03')
		const apy = 34.6

		const calculateEarnings = () => {
			const now = new Date()
			const timeElapsed =
				(now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24 * 365)
			const currentBalance = parseFloat(balance)
			const currentEarnings = currentBalance * (apy / 100) * timeElapsed
			setEarnings(currentEarnings.toFixed(2))
			setEarningsUsdt(currentEarnings.toFixed(2))

			// Calculate daily earnings
			const dailyRate = (currentBalance * (apy / 100)) / 365
			setDailyEarnings(dailyRate.toFixed(2))
			setDailyEarningsUsdt(dailyRate.toFixed(2))

			// Calculate time left
			const daysLeft = Math.ceil(
				(endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
			)
			const yearsLeft = Math.floor(daysLeft / 365)
			const monthsLeft = Math.floor((daysLeft % 365) / 30)
			const remainingDays = daysLeft % 30

			setTimeLeft(`${yearsLeft}y ${monthsLeft}m ${remainingDays}d`)
		}

		calculateEarnings()
		const interval = setInterval(calculateEarnings, 1000)
		return () => clearInterval(interval)
	}, [balance])

	// Update the useEffect for deposit progress
	useEffect(() => {
		const startDate = new Date('2025-05-02')
		const endDate = new Date('2026-05-03')
		const now = new Date()

		const totalDuration = endDate.getTime() - startDate.getTime()
		const elapsedDuration = now.getTime() - startDate.getTime()
		const progress = Math.min(
			Math.max((elapsedDuration / totalDuration) * 100, 0),
			100
		)

		setDepositProgress(progress)
	}, [])

	const handleLogout = () => {
		setSelectedWallet('')
		setLedgerConnected(false)
		navigate('/')
	}

	// Calculate pagination
	const indexOfLastValidator = currentPage * validatorsPerPage
	const indexOfFirstValidator = indexOfLastValidator - validatorsPerPage
	const currentValidators = validators.slice(
		indexOfFirstValidator,
		indexOfLastValidator
	)
	const totalPages = Math.ceil(validators.length / validatorsPerPage)

	const handlePageChange = (pageNumber: number) => {
		setCurrentPage(pageNumber)
	}

	// Update chart options to remove drawBorder
	const chartOptions = {
		responsive: true,
		maintainAspectRatio: false,
		interaction: {
			intersect: false,
			mode: 'index' as const,
		},
		plugins: {
			legend: {
				display: false,
			},
			tooltip: {
				backgroundColor: 'rgba(17, 24, 39, 0.8)',
				titleColor: '#fff',
				bodyColor: '#fff',
				borderColor: 'rgba(75, 85, 99, 0.2)',
				borderWidth: 1,
				padding: 12,
				displayColors: false,
				callbacks: {
					label: function(context: any) {
						return `Status: ${context.parsed.y}%`;
					}
				}
			}
		},
		scales: {
			x: {
				grid: {
					display: false
				},
				ticks: {
					color: '#9CA3AF',
					font: {
						size: 12
					},
					maxRotation: 0,
					autoSkip: true,
					maxTicksLimit: 6
				}
			},
			y: {
				min: 96,
				max: 98,
				grid: {
					color: 'rgba(75, 85, 99, 0.1)'
				},
				ticks: {
					color: '#9CA3AF',
					font: {
						size: 12
					},
					callback: function(value: any) {
						return value + '%';
					}
				}
			}
		},
		elements: {
			line: {
				tension: 0.4
			}
		}
	};

	return (
		<div className='min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white p-6 relative overflow-hidden'>
			{/* Background Images */}
			<div className='absolute inset-0 pointer-events-none'>
				{/* Left side images */}
				<div className='absolute left-0 top-0 h-full w-1/4 flex flex-col items-center justify-between py-20'>
					<div className='relative w-full group'>
			
						<img
							src={heroHardwareX1}
							alt=''
							className='w-full h-auto transform -translate-x-1/4 opacity-40 transition-all duration-500 group-hover:opacity-50 group-hover:scale-105'
						/>
					</div>
					<div className='relative w-full group'>
				
						<img
							src={heroExtension}
							alt=''
							className='w-full h-auto transform -translate-x-1/4 opacity-40 transition-all duration-500 group-hover:opacity-50 group-hover:scale-105'
						/>
					</div>
				</div>

				{/* Right side images */}
				<div className='absolute right-0 top-0 h-full w-1/4 flex flex-col items-center justify-between py-20'>
					<div className='relative w-full group'>
						
						<img
							src={heroHardwareWallet}
							alt=''
							className='w-full h-auto transform translate-x-1/4 opacity-40 transition-all duration-500 group-hover:opacity-50 group-hover:scale-105'
						/>
					</div>
					<div className='relative w-full group'>
						<div className='absolute inset-0 bg-gradient-to-l from-gray-900/70 via-gray-900/30 to-transparent backdrop-blur-[2px] transition-all duration-500 group-hover:backdrop-blur-[4px]'></div>
				
					</div>
				</div>

				{/* Center overlay */}
				<div className='absolute inset-0 bg-gradient-to-r from-gray-900/30 via-transparent to-gray-900/30 backdrop-blur-[1px]'></div>
			</div>

			{/* Main Content */}
			<div className='relative z-10'>
				{/* Header */}
				<div className='flex justify-between items-center mb-8'>
					<div>
						<h1 className='text-3xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent mb-2'>
							Validator Dashboard
						</h1>
						<p className='text-gray-400'>
							Track your validator performance and earnings
						</p>
					</div>
					<div className='flex items-center space-x-4'>
						<div className='text-sm text-gray-400'>
							<span className='text-gray-500'>Wallet:</span> {VALIDATOR_ADDRESS}
						</div>
						<button
							onClick={handleLogout}
							className='flex items-center space-x-2 px-6 py-3 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-all duration-300 hover:scale-105'
						>
							<LogOut className='w-5 h-5' />
							<span>Logout</span>
						</button>
					</div>
				</div>

				{/* Balance Cards */}
				<div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8'>
					<div className='bg-gradient-to-br from-gray-800/50 to-gray-900/50 p-6 rounded-2xl border border-gray-700/50 hover:border-gray-600/50 transition-all duration-300'>
						<div className='flex items-center justify-between mb-4'>
							<div className='p-2 bg-blue-500/10 rounded-lg'>
								<Wallet className='w-6 h-6 text-blue-400' />
							</div>
							<span className='text-sm text-gray-400'>Current Balance</span>
						</div>
						{isLoadingBalance ? (
							<div className='flex items-center justify-center h-16'>
								<Loader2 className='w-6 h-6 text-blue-400 animate-spin' />
							</div>
						) : balanceError ? (
							<div className='text-red-400 text-sm'>{balanceError}</div>
						) : (
							<>
								<div className='text-2xl font-bold mb-1'>
									$
									{Number(balance).toLocaleString('en-US', {
										minimumFractionDigits: 2,
										maximumFractionDigits: 2,
									})}
								</div>
								<div className='text-sm text-gray-400'>wUSDT Balance</div>
							</>
						)}
					</div>

					<div className='bg-gradient-to-br from-gray-800/50 to-gray-900/50 p-6 rounded-2xl border border-gray-700/50 hover:border-gray-600/50 transition-all duration-300'>
						<div className='flex items-center justify-between mb-4'>
							<div className='p-2 bg-yellow-500/10 rounded-lg'>
								<ArrowUpRight className='w-6 h-6 text-yellow-400' />
							</div>
							<span className='text-sm text-gray-400'>Total Earnings</span>
						</div>
						<div className='text-3xl font-bold text-yellow-400'>
							$
							{Number(earnings).toLocaleString('en-US', {
								minimumFractionDigits: 2,
								maximumFractionDigits: 2,
							})}
						</div>
						<div className='text-sm text-gray-400 mt-1'>Since May 2, 2025</div>
					</div>

					<div className='bg-gradient-to-br from-gray-800/50 to-gray-900/50 p-6 rounded-2xl border border-gray-700/50 hover:border-gray-600/50 transition-all duration-300'>
						<div className='flex items-center justify-between mb-4'>
							<div className='p-2 bg-blue-500/10 rounded-lg'>
								<Calendar className='w-6 h-6 text-blue-400' />
							</div>
							<span className='text-sm text-gray-400'>Daily Earnings</span>
						</div>
						<div className='text-3xl font-bold text-blue-400'>
							$
							{Number(dailyEarnings).toLocaleString('en-US', {
								minimumFractionDigits: 2,
								maximumFractionDigits: 2,
							})}
						</div>
						<div className='text-sm text-gray-400 mt-1'>
							Projected Monthly: $
							{(Number(dailyEarnings) * 30).toLocaleString('en-US', {
								minimumFractionDigits: 2,
								maximumFractionDigits: 2,
							})}
						</div>
					</div>

					<div className='bg-gradient-to-br from-gray-800/50 to-gray-900/50 p-6 rounded-2xl border border-gray-700/50 hover:border-gray-600/50 transition-all duration-300'>
						<div className='flex items-center justify-between mb-4'>
							<div className='p-2 bg-purple-500/10 rounded-lg'>
								<Percent className='w-6 h-6 text-purple-400' />
							</div>
							<span className='text-sm text-gray-400'>APY</span>
						</div>
						<div className='text-3xl font-bold text-purple-400'>34.6% APR</div>
						<div className='text-sm text-gray-400 mt-1'>Fixed Rate</div>
					</div>
				</div>

				{/* Validator Progress Bar */}
				<div className='w-full bg-gray-800/50 backdrop-blur-sm p-4 rounded-xl mb-8'>
					<div className='max-w-7xl mx-auto'>
						<div className='flex items-center justify-between mb-2'>
							<span className='text-sm text-gray-400'>Validators</span>
							<span className='text-sm text-green-400'>30/30</span>
						</div>
						<div className='w-full bg-gray-700/50 rounded-full h-2.5'>
							<div className='bg-green-500/80 h-2.5 rounded-full' style={{ width: '100%' }}></div>
						</div>
					</div>
				</div>

				{/* Main Content */}
				<div className='grid grid-cols-1 lg:grid-cols-3 gap-8'>
					{/* Network Status Chart */}
					<div className='lg:col-span-2 bg-gradient-to-br from-gray-800/50 to-gray-900/50 p-6 rounded-2xl border border-gray-700/50 hover:border-gray-600/50 transition-all duration-300'>
						<div className='flex items-center justify-between mb-6'>
							<div className='p-2 bg-purple-500/10 rounded-lg'>
								<Activity className='w-6 h-6 text-purple-400' />
							</div>
							<span className='text-sm text-gray-400'>Network Status</span>
						</div>
						<div className='space-y-8'>
							{/* Daily Chart */}
							<div className='relative h-[300px] w-full'>
								<div className='absolute top-0 right-0 text-sm text-gray-400'>
									Daily
								</div>
								<Line
									data={networkChartData}
									options={chartOptions}
								/>
							</div>

							{/* Weekly Chart */}
							<div className='relative h-[300px] w-full'>
								<div className='absolute top-0 right-0 text-sm text-gray-400'>
									Weekly
								</div>
								<Line
									data={{
										labels: Array.from(
											{ length: 7 },
											(_, i) =>
												['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][i]
										),
										datasets: [
											{
												label: 'Weekly Status',
												data: Array(7)
													.fill(97)
													.map((base, i) => {
														const fluctuation = (Math.random() - 0.5) * 0.2
														return (base + fluctuation).toFixed(1)
													}),
												borderColor: 'rgb(59, 130, 246)',
												backgroundColor: 'rgba(59, 130, 246, 0.1)',
												borderWidth: 2,
												pointRadius: 0,
												pointHoverRadius: 6,
												pointHoverBackgroundColor: 'rgb(59, 130, 246)',
												pointHoverBorderColor: '#fff',
												pointHoverBorderWidth: 2,
												tension: 0.4,
												fill: true,
											},
										],
									}}
									options={chartOptions}
								/>
							</div>
						</div>
						<div className='mt-4 flex items-center justify-between text-sm text-gray-400'>
							<div>Last 24 hours</div>
							<div className='flex items-center space-x-2'>
								<div className='w-3 h-3 rounded-full bg-purple-500'></div>
								<span>Network Status</span>
							</div>
						</div>
					</div>

					{/* Validator Info */}
					<div className='bg-gradient-to-br from-gray-900/50 to-gray-800/50 backdrop-blur-xl rounded-2xl border border-gray-700/50 p-8 hover:shadow-xl hover:shadow-purple-500/10 transition-all duration-300'>
						<h2 className='text-2xl font-semibold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent mb-8'>
							Validator Details
						</h2>
						<div className='space-y-6'>
							<div className='bg-gradient-to-br from-gray-800/50 to-gray-900/50 p-6 rounded-2xl border border-gray-700/50 hover:border-gray-600/50 transition-all duration-300'>
								<div className='flex items-center justify-between mb-4'>
									<div className='p-2 bg-purple-500/10 rounded-lg'>
										<Calendar className='w-6 h-6 text-purple-400' />
									</div>
									<span className='text-sm text-gray-400'>Deposit Period</span>
								</div>
								<div className='text-2xl font-bold text-purple-400 mb-2'>
									May 2, 2025 - May 3, 2026
								</div>
								<div className='text-sm text-gray-400 mb-3'>{timeLeft}</div>
								<div className='w-full bg-gray-700/50 rounded-full h-2 mb-1'>
									<div
										className='bg-gradient-to-r from-purple-500 to-purple-600 h-2 rounded-full transition-all duration-500'
										style={{ width: `${depositProgress}%` }}
									/>
								</div>
								<div className='text-xs text-gray-400 text-right'>
									{depositProgress.toFixed(1)}% completed
								</div>
							</div>

							<div className='bg-gradient-to-br from-gray-800/50 to-gray-700/50 rounded-xl p-6 border border-gray-700/50'>
								<div className='flex items-center space-x-4 mb-4'>
									<div className='w-12 h-12 rounded-xl bg-green-500/20 flex items-center justify-center'>
										<Shield className='w-6 h-6 text-green-400' />
									</div>
									<div>
										<p className='text-gray-400 text-sm'>Status</p>
										<p className='text-lg font-semibold text-green-400'>
											Active
										</p>
									</div>
								</div>
							</div>

							<div className='bg-gradient-to-br from-gray-800/50 to-gray-900/50 p-6 rounded-2xl border border-gray-700/50 hover:border-gray-600/50 transition-all duration-300'>
								<div className='flex items-center justify-between mb-4'>
									<div className='p-2 bg-blue-500/10 rounded-lg'>
										<Network className='w-6 h-6 text-blue-400' />
									</div>
									<span className='text-sm text-gray-400'>Active Nodes</span>
								</div>
								<div className='text-3xl font-bold text-white mb-2'>1 / 1</div>
								<div className='text-sm text-gray-400'>Total Validators</div>
							</div>
						</div>
					</div>
				</div>

				{/* Other Validators */}
				<div className='mt-8 bg-gradient-to-br from-gray-900/50 to-gray-800/50 backdrop-blur-xl rounded-2xl border border-gray-700/50 p-8 hover:shadow-xl hover:shadow-blue-500/10 transition-all duration-300'>
					<div className='flex items-center justify-between mb-6'>
						<h2 className='text-2xl font-semibold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent'>
							Other Validators
						</h2>
						<div className='flex items-center space-x-2 text-gray-400'>
							<span className='text-sm'>
								Total Validators: {validators.length.toLocaleString()}
							</span>
						</div>
					</div>
					<div className='space-y-4'>
						{currentValidators.map((validator, index) => (
							<div
								key={index}
								className='bg-gradient-to-br from-gray-800/50 to-gray-700/50 rounded-xl p-6 border border-gray-700/50 hover:scale-[1.02] transition-all duration-300'
							>
								<div className='flex items-center justify-between'>
									<div className='flex items-center space-x-4'>
										<div className='w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center'>
											<Users className='w-5 h-5 text-blue-400' />
										</div>
										<div>
											<p className='text-gray-400 text-sm'>Address</p>
											<p className='text-sm font-medium'>
												{validator.address.slice(0, 6)}...
												{validator.address.slice(-4)}
											</p>
										</div>
									</div>
									<div className='text-right'>
										<p className='text-gray-400 text-sm'>Balance</p>
										<p className='text-sm font-medium text-green-400'>
											{validator.balance} USDT
										</p>
									</div>
									<div className='text-right'>
										<p className='text-gray-400 text-sm'>Status</p>
										<p
											className={`text-sm font-medium ${
												validator.status === 'active'
													? 'text-green-400'
													: validator.status === 'pending'
													? 'text-yellow-400'
													: 'text-red-400'
											}`}
										>
											{validator.status.charAt(0).toUpperCase() +
												validator.status.slice(1)}
										</p>
									</div>
								</div>
							</div>
						))}
					</div>

					{/* Pagination */}
					<div className='mt-8 flex items-center justify-between border-t border-gray-700/50 pt-6'>
						<div className='flex items-center justify-between text-sm text-gray-400 mb-4'>
							<div>
								Showing {(currentPage - 1) * validatorsPerPage + 1} to{' '}
								{Math.min(currentPage * validatorsPerPage, totalValidators)} of{' '}
								{totalValidators.toLocaleString()} validators
							</div>
							<div className='flex items-center space-x-2'>
								<div className='w-3 h-3 rounded-full bg-purple-500'></div>
								<span>Active Validators</span>
							</div>
						</div>
						<div className='flex items-center space-x-3'>
							<button
								onClick={() => handlePageChange(currentPage - 1)}
								disabled={currentPage === 1}
								className='flex items-center space-x-2 px-4 py-2 rounded-xl bg-gradient-to-r from-gray-800/50 to-gray-700/50 text-gray-400 hover:from-gray-700/50 hover:to-gray-600/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 border border-gray-700/50 hover:border-gray-600/50'
							>
								<ChevronRight className='w-4 h-4 rotate-180' />
								<span>Previous</span>
							</button>
							<div className='flex items-center space-x-2'>
								{Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
									const pageNumber = i + 1
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
									)
								})}
								{totalPages > 5 && (
									<>
										<span className='text-gray-400'>...</span>
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
								className='flex items-center space-x-2 px-4 py-2 rounded-xl bg-gradient-to-r from-gray-800/50 to-gray-700/50 text-gray-400 hover:from-gray-700/50 hover:to-gray-600/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 border border-gray-700/50 hover:border-gray-600/50'
							>
								<span>Next</span>
								<ChevronRight className='w-4 h-4' />
							</button>
						</div>
					</div>
				</div>

				{/* Additional Info */}
				<div className='mt-8 bg-gradient-to-br from-gray-900/50 to-gray-800/50 backdrop-blur-xl rounded-2xl border border-gray-700/50 p-8 hover:shadow-xl hover:shadow-blue-500/10 transition-all duration-300'>
					<div className='flex items-start space-x-6'>
						<div className='w-14 h-14 rounded-xl bg-blue-500/20 flex items-center justify-center flex-shrink-0'>
							<Info className='w-7 h-7 text-blue-400' />
						</div>
						<div>
							<h3 className='text-xl font-semibold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent mb-4'>
								About Your Validator
							</h3>
							<p className='text-gray-400 text-sm leading-relaxed'>
								Your validator is actively participating in the Ethereum
								network, helping to secure the network and earn rewards. The
								current APY of 34.6% is calculated based on network conditions
								and validator performance. Earnings are automatically compounded
								and will be available for withdrawal at the end of the deposit
								period. The validator will continue to earn rewards until May 3,
								2026, at which point you can withdraw your initial deposit and
								accumulated earnings.
							</p>
						</div>
					</div>
				</div>

				{/* Remove the volume charts section */}
				<div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
					{/* Remove these cards */}
				</div>
			</div>
		</div>
	)
}

export default DashboardPage
