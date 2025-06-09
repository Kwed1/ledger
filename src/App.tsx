import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import AuthPage from './pages/AuthPage';
import WalletConnectionPage from './pages/WalletConnectionPage';
import LedgerConnectionPage from './pages/LedgerConnectionPage';
import CryptoWalletInterface from './pages/CryptoWalletInterface';
import { useAuth } from './contexts/AuthContext';

const PrivateRoute = ({ children }: { children: React.ReactNode }) => {
	const { isAuthenticated } = useAuth();
	return isAuthenticated ? <>{children}</> : <Navigate to="/auth" />;
};

const App = () => {
	return (
		<AuthProvider>
			<Router>
				<Routes>
					<Route path="/auth" element={<AuthPage />} />
					<Route
						path="/connect-wallet"
						element={
							<PrivateRoute>
								<WalletConnectionPage />
							</PrivateRoute>
						}
					/>
					<Route
						path="/ledger"
						element={
							<PrivateRoute>
								<LedgerConnectionPage />
							</PrivateRoute>
						}
					/>
					<Route
						path="/dashboard"
						element={
							<PrivateRoute>
								<CryptoWalletInterface />
							</PrivateRoute>
						}
					/>
					<Route path="/" element={<Navigate to="/auth" />} />
					<Route path="*" element={<Navigate to="/auth" />} />
				</Routes>
			</Router>
		</AuthProvider>
	);
};

export default App;
