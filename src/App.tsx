import { Navigate, Route, BrowserRouter as Router, Routes } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import AuthPage from './pages/AuthPage'
import { CryptoWalletInterface } from './pages/CryptoWalletInterface'
import WalletConnectionPage from './pages/WalletConnectionPage'

const App = () => {
	return (
		<AuthProvider>
			<Router>
				<Routes>
					<Route path="/auth" element={<AuthPage />} />
					<Route path="/connect-wallet" element={<WalletConnectionPage />} />
					<Route path="/dashboard" element={<CryptoWalletInterface />} />
					<Route path="*" element={<Navigate to="/auth" replace />} />
				</Routes>
			</Router>
		</AuthProvider>
	);
};

export default App;
