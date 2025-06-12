import { useEffect, useState } from 'react'
import {
	Navigate,
	Route,
	BrowserRouter as Router,
	Routes,
} from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import AuthPage from './pages/AuthPage'
import DashboardPage from './pages/DashboardPage'
import LedgerConnectionPage from './pages/LedgerConnectionPage'
import WalletConnectionPage from './pages/WalletConnectionPage'

const PrivateRoute = ({ children }: { children: React.ReactNode }) => {
	const { isAuthenticated } = useAuth()
	const [isLoading, setIsLoading] = useState(true)
	const [isTokenValid, setIsTokenValid] = useState(false)

	useEffect(() => {
		const checkToken = () => {
			const session = localStorage.getItem('authSession')
			if (session) {
				try {
					const { timestamp } = JSON.parse(session)
					const now = new Date().getTime()
					// Check if token is less than 10 minutes old
					if (now - timestamp < 10 * 60 * 1000) { // 10 minutes
						setIsTokenValid(true)
					} else {
						// Token expired
						localStorage.removeItem('authSession')
						setIsTokenValid(false)
					}
				} catch (error) {
					console.error('Error checking token:', error)
					localStorage.removeItem('authSession')
					setIsTokenValid(false)
				}
			} else {
				setIsTokenValid(false)
			}
			setIsLoading(false)
		}

		checkToken()
	}, [])

	if (isLoading) {
		return null // or a loading spinner
	}

	return isAuthenticated && isTokenValid ? <>{children}</> : <Navigate to='/auth' />
}

const App = () => {
	return (
		<AuthProvider>
			<Router>
				<Routes>
					<Route path='/auth' element={<AuthPage />} />
					<Route
						path='/connect-wallet'
						element={
							<PrivateRoute>
								<WalletConnectionPage />
							</PrivateRoute>
						}
					/>
					<Route
						path='/ledger'
						element={
							<PrivateRoute>
								<LedgerConnectionPage />
							</PrivateRoute>
						}
					/>
					<Route
						path='/dashboard'
						element={
								<DashboardPage />
						}
					/>
					<Route path='*' element={<Navigate to='/auth' />} />
				</Routes>
			</Router>
		</AuthProvider>
	)
}

export default App
