import {
	Navigate,
	Route,
	BrowserRouter as Router,
	Routes,
} from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import AuthPage from './pages/AuthPage'
import { CryptoWalletInterface } from './pages/CryptoWalletInterface'
import LedgerConnectionPage from './pages/LedgerConnectionPage'
import WalletConnectionPage from './pages/WalletConnectionPage'
import DashboardPage from './pages/DashboardPage'

const PrivateRoute = ({ children }: { children: React.ReactNode }) => {
	const { isAuthenticated } = useAuth()
	return isAuthenticated ? <>{children}</> : <Navigate to='/auth' />
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
							<PrivateRoute>
								<DashboardPage />
							</PrivateRoute>
						}
					/>
					<Route path='*' element={<Navigate to='/auth' />} />
				</Routes>
			</Router>
		</AuthProvider>
	)
}

export default App
