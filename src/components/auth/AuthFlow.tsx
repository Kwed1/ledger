import { useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { ledgerService } from '../../services/ledger'

interface AuthStep {
	id: number
	title: string
	description: string
}

const authSteps: AuthStep[] = [
	{
		id: 1,
		title: 'Enter User ID',
		description: 'Please enter your user ID to continue.',
	},
	{
		id: 2,
		title: 'Enter Passwords',
		description: 'Please enter your password and validator stake password.',
	},
	{
		id: 3,
		title: 'Connect Ledger',
		description: 'Please connect your Ledger wallet to continue.',
	},
	{
		id: 4,
		title: 'Two-Factor Authentication',
		description: 'Please set up or verify your 2FA.',
	},
]

const AuthFlow = () => {
	const { signIn, connectLedger, setup2FA, verify2FA, skip2FA, userData, isAuthenticated } = useAuth()
	const [currentStep, setCurrentStep] = useState(1)
	const [userId, setUserId] = useState('')
	const [password, setPassword] = useState('')
	const [validatorPassword, setValidatorPassword] = useState('')
	const [ledgerConnected, setLedgerConnected] = useState(false)
	const [ledgerAddress, setLedgerAddress] = useState('')
	const [twoFactorCode, setTwoFactorCode] = useState('')
	const [error, setError] = useState('')
	const [isConnecting, setIsConnecting] = useState(false)

	const handleUserIdSubmit = async (e: React.FormEvent) => {
		e.preventDefault()
		if (!userId) {
			setError('Please enter your user ID')
			return
		}
		setError('')
		setCurrentStep(2)
	}

	const handlePasswordsSubmit = async (e: React.FormEvent) => {
		e.preventDefault()
		if (!password || !validatorPassword) {
			setError('Please enter both passwords')
			return
		}
		try {
			await signIn(userId, password, validatorPassword)
			setError('')
			setCurrentStep(3)
		} catch (err) {
			setError('Invalid credentials')
		}
	}

	const handleLedgerConnect = async () => {
		if (isConnecting) return
		
		setIsConnecting(true)
		setError('')
		
		try {
			// Connect to Ledger device
			await ledgerService.connect()
			
			// Get the first address from the device
			const address = await ledgerService.getAddress()
			setLedgerAddress(address)
			
			// Update the connection status in Firebase
			await connectLedger()
			setLedgerConnected(true)
			
			// Move to the next step
			setCurrentStep(4)
		} catch (err) {
			console.error('Ledger connection error:', err)
			setError(err instanceof Error ? err.message : 'Failed to connect Ledger')
		} finally {
			setIsConnecting(false)
		}
	}

	const handle2FASubmit = async (e: React.FormEvent) => {
		e.preventDefault()
		if (!twoFactorCode) {
			setError('Please enter the 2FA code')
			return
		}
		try {
			const isValid = await verify2FA(twoFactorCode)
			if (!isValid) {
				setError('Invalid 2FA code')
			}
		} catch (err) {
			setError('Failed to verify 2FA')
		}
	}

	const handle2FASetup = async () => {
		try {
			await setup2FA()
		} catch (err) {
			setError('Failed to set up 2FA')
		}
	}

	const handle2FASkip = async () => {
		try {
			await skip2FA()
		} catch (err) {
			setError('Failed to skip 2FA')
		}
	}

	const renderStep = () => {
		switch (currentStep) {
			case 1:
				return (
					<form onSubmit={handleUserIdSubmit} className='space-y-4'>
						<div>
							<label htmlFor='userId' className='block text-sm font-medium text-gray-300'>
								User ID
							</label>
							<input
								type='text'
								id='userId'
								value={userId}
								onChange={e => setUserId(e.target.value)}
								className='mt-1 block w-full rounded-md border-gray-600 bg-gray-700 text-white shadow-sm focus:border-cyan-500 focus:ring-cyan-500'
								placeholder='Enter your user ID'
							/>
						</div>
						<button
							type='submit'
							className='w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-cyan-600 hover:bg-cyan-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500'
						>
							Continue
						</button>
					</form>
				)
			case 2:
				return (
					<form onSubmit={handlePasswordsSubmit} className='space-y-4'>
						<div>
							<label htmlFor='password' className='block text-sm font-medium text-gray-300'>
								Password
							</label>
							<input
								type='password'
								id='password'
								value={password}
								onChange={e => setPassword(e.target.value)}
								className='mt-1 block w-full rounded-md border-gray-600 bg-gray-700 text-white shadow-sm focus:border-cyan-500 focus:ring-cyan-500'
								placeholder='Enter your password'
							/>
						</div>
						<div>
							<label htmlFor='validatorPassword' className='block text-sm font-medium text-gray-300'>
								Validator Stake Password
							</label>
							<input
								type='password'
								id='validatorPassword'
								value={validatorPassword}
								onChange={e => setValidatorPassword(e.target.value)}
								className='mt-1 block w-full rounded-md border-gray-600 bg-gray-700 text-white shadow-sm focus:border-cyan-500 focus:ring-cyan-500'
								placeholder='Enter your validator stake password'
							/>
						</div>
						<button
							type='submit'
							className='w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-cyan-600 hover:bg-cyan-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500'
						>
							Continue
						</button>
					</form>
				)
			case 3:
				return (
					<div className='space-y-4'>
						<p className='text-gray-300'>
							Please connect your Ledger wallet to continue. Make sure it's unlocked and the Cosmos app is open.
						</p>
						{ledgerAddress && (
							<div className='bg-gray-700/50 p-4 rounded-lg'>
								<p className='text-sm text-gray-300'>Connected Address:</p>
								<p className='text-sm font-mono text-cyan-400 break-all'>{ledgerAddress}</p>
							</div>
						)}
						<button
							onClick={handleLedgerConnect}
							disabled={ledgerConnected || isConnecting}
							className='w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-cyan-600 hover:bg-cyan-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed'
						>
							{isConnecting ? 'Connecting...' : ledgerConnected ? 'Ledger Connected' : 'Connect Ledger'}
						</button>
					</div>
				)
			case 4:
				return (
					<form onSubmit={handle2FASubmit} className='space-y-4'>
						{!userData?.has2FA ? (
							<>
								<p className='text-gray-300'>
									You need to set up two-factor authentication to continue. Please enter the code from your authenticator app.
								</p>
								<div className='flex space-x-4'>
									<button
										type='button'
										onClick={handle2FASetup}
										className='flex-1 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-cyan-600 hover:bg-cyan-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500'
									>
										Set Up 2FA
									</button>
									<button
										type='button'
										onClick={handle2FASkip}
										className='flex-1 py-2 px-4 border border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-300 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500'
									>
										Skip for Now
									</button>
								</div>
							</>
						) : (
							<>
								<p className='text-gray-300'>
									Please enter your 2FA code to continue.
								</p>
								<div>
									<label htmlFor='twoFactorCode' className='block text-sm font-medium text-gray-300'>
										2FA Code
									</label>
									<input
										type='text'
										id='twoFactorCode'
										value={twoFactorCode}
										onChange={e => setTwoFactorCode(e.target.value)}
										className='mt-1 block w-full rounded-md border-gray-600 bg-gray-700 text-white shadow-sm focus:border-cyan-500 focus:ring-cyan-500'
										placeholder='Enter 2FA code'
									/>
								</div>
								<button
									type='submit'
									className='w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-cyan-600 hover:bg-cyan-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500'
								>
									Verify
								</button>
							</>
						)}
					</form>
				)
			default:
				return null
		}
	}

	return (
		<div className='min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center'>
			<div className='max-w-md w-full space-y-8 p-8 bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-gray-700/50 shadow-2xl'>
				<div>
					<h2 className='mt-6 text-center text-3xl font-extrabold text-white'>
						{authSteps[currentStep - 1].title}
					</h2>
					<p className='mt-2 text-center text-sm text-gray-400'>
						{authSteps[currentStep - 1].description}
					</p>
				</div>
				{error && (
					<div className='bg-red-500/10 border border-red-500/20 rounded-lg p-4 text-red-400 text-sm'>
						{error}
					</div>
				)}
				{renderStep()}
			</div>
		</div>
	)
}

export default AuthFlow 