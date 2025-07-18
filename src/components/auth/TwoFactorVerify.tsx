import { Shield, X } from 'lucide-react'
import React, { useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'

interface TwoFactorVerifyModalProps {
	isOpen: boolean
	onClose: () => void
	onSuccess: () => void
}

const TwoFactorVerifyModal: React.FC<TwoFactorVerifyModalProps> = ({
	isOpen,
	onClose,
	onSuccess,
}) => {
	const { verify2FA } = useAuth()
	const [code, setCode] = useState('')
	const [error, setError] = useState('')
	const [isLoading, setIsLoading] = useState(false)

	const handleVerify = async () => {
		try {
			setIsLoading(true)
			setError('')
			const isValid = await verify2FA(code)
			if (isValid) {
				onSuccess()
			} else {
				setError('Invalid code. Please try again.')
			}
		} catch (err) {
			setError('Something went wrong. Please try again.')
		} finally {
			setIsLoading(false)
		}
	}

	if (!isOpen) return null

	return (
		<div className='fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50'>
			<div className='bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-sm rounded-2xl border border-gray-700/50 p-8 w-full max-w-md mx-4 shadow-2xl'>
				<div className='flex justify-between items-center mb-8'>
					<div className='flex items-center space-x-3'>
						<div className='w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center'>
							<Shield className='w-6 h-6 text-white' />
						</div>
						<h2 className='text-2xl font-bold text-white'>
							Two-Factor Verification
						</h2>
					</div>
					<button
						onClick={onClose}
						className='text-gray-400 hover:text-white transition-colors'
					>
						<X className='w-5 h-5' />
					</button>
				</div>

				{error && (
					<div className='bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-xl p-4 mb-6'>
						{error}
					</div>
				)}

				<div className='space-y-6'>
					<div className='text-gray-300 text-sm'>
						<p className='mb-6'>
							Enter the 6-digit code from your authenticator app to continue.
						</p>
					</div>

					<div className='space-y-4'>
						<div>
							<label
								htmlFor='code'
								className='block text-sm font-medium text-gray-300 mb-2'
							>
								6-digit code
							</label>
							<input
								type='text'
								id='code'
								value={code}
								onChange={e =>
									setCode(e.target.value.replace(/\D/g, '').slice(0, 6))
								}
								className='w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all'
								placeholder='000000'
								maxLength={6}
							/>
						</div>

						<button
							onClick={handleVerify}
							disabled={isLoading || code.length !== 6}
							className='w-full py-3 px-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl font-medium hover:from-blue-600 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-[1.02] disabled:hover:scale-100'
						>
							{isLoading ? (
								<div className='w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto' />
							) : (
								'Verify'
							)}
						</button>
					</div>
				</div>
			</div>
		</div>
	)
}

export default TwoFactorVerifyModal
