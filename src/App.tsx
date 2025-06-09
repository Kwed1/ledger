import AuthFlow from './components/auth/AuthFlow'
import CryptoWalletInterface from './components/CryptoWalletInterface'
import { useAuth } from './contexts/AuthContext'

function App() {
	const { user, loading } = useAuth()

	if (loading) {
		return (
			<div className='min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center'>
				<div className='animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-cyan-500'></div>
			</div>
		)
	}

	return user ? <CryptoWalletInterface /> : <AuthFlow />
}

export default App
