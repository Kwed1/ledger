import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
	ArrowDownToLine,
	Bluetooth,
	HardDrive,
	Lock,
	QrCode,
	Shield,
	Smartphone,
	Usb,
	Wallet,
	Wifi,
	Zap,
	CheckCircle,
	XCircle,
	Loader2
} from 'lucide-react';
import { ledgerService } from '../services/ledger';

const LedgerConnectionPage = () => {
	const navigate = useNavigate();
	const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'error' | 'searching'>('searching');
	const [error, setError] = useState('');
	const [deviceName, setDeviceName] = useState<string | null>(null);
	const [connectionStep, setConnectionStep] = useState<string>('');
	const [isBluetoothAvailable, setIsBluetoothAvailable] = useState<boolean | null>(null);

	const connectionMethods = [
		{
			id: 'bluetooth',
			name: 'Bluetooth',
			description: 'Connect via Bluetooth',
			icon: Bluetooth,
			available: true
		},
		{
			id: 'usb',
			name: 'USB',
			description: 'Connect via USB cable',
			icon: Usb,
			available: false
		},
		{
			id: 'wifi',
			name: 'Wi-Fi',
			description: 'Connect via Wi-Fi network',
			icon: Wifi,
			available: false
		}
	];

	const checkBluetoothAvailability = async () => {
		try {
			if (!navigator.bluetooth) {
				setIsBluetoothAvailable(false);
				setError('Web Bluetooth API is not available in your browser. Please use Chrome or Edge.');
				return;
			}

			const isAvailable = await navigator.bluetooth.getAvailability();
			setIsBluetoothAvailable(isAvailable);
			if (!isAvailable) {
				setError('Bluetooth is not available. Please enable Bluetooth in your system settings.');
			} else {
				setError('');
			}
		} catch (err) {
			console.error('Bluetooth availability check error:', err);
			setIsBluetoothAvailable(false);
			setError('Failed to check Bluetooth availability. Please make sure Bluetooth is enabled.');
		}
	};

	const connectLedger = async () => {
		try {
			setConnectionStatus('searching');
			setError('');
			setConnectionStep('Checking Bluetooth availability...');

			if (!navigator.bluetooth) {
				throw new Error('Web Bluetooth API is not available in your browser. Please use Chrome or Edge.');
			}

			const isAvailable = await navigator.bluetooth.getAvailability();
			if (!isAvailable) {
				throw new Error('Bluetooth is not available. Please enable Bluetooth in your system settings.');
			}

			setConnectionStep('Requesting Bluetooth device...');
			setConnectionStatus('connecting');
			await ledgerService.connect();

			setConnectionStep('Device connected successfully');
			setConnectionStatus('connected');
			setDeviceName('Ledger Device');
			navigate('/dashboard');
		} catch (err) {
			console.error('Connection error:', err);
			setConnectionStatus('error');
			if (err instanceof Error) {
				setError(err.message);
			} else {
				setError('Failed to connect to Ledger. Please make sure Bluetooth is enabled and try again.');
			}
			setConnectionStep('');
		}
	};

	const getStatusIcon = () => {
		switch (connectionStatus) {
			case 'connected':
				return <CheckCircle className="w-10 h-10 text-green-500" />;
			case 'error':
				return <XCircle className="w-10 h-10 text-red-500" />;
			case 'connecting':
				return <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />;
			default:
				return <HardDrive className="w-10 h-10 text-blue-500" />;
		}
	};

	return (
		<div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white">
			<div className="max-w-6xl mx-auto px-4 py-16">
				<div className="text-center mb-12">
					<div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-6 transform hover:scale-105 transition-transform">
						{getStatusIcon()}
					</div>
					<h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
						Connect Ledger Device
					</h1>
					<p className="text-gray-400 text-lg">
						{connectionStep || 'Select your preferred connection method'}
					</p>
				</div>

				{/* Connection Methods */}
				<div className="bg-gray-800/30 backdrop-blur-sm rounded-2xl border border-gray-700/30 p-8 mb-12">
					<h2 className="text-2xl font-semibold text-center mb-8">Connection Methods</h2>
					<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
						{connectionMethods.map((method) => (
							<div
								key={method.id}
								onClick={() => method.available && connectLedger()}
								className={`p-6 rounded-xl border ${
									method.available
										? 'border-blue-500/50 cursor-pointer hover:border-blue-500/70'
										: 'border-gray-700/30 cursor-not-allowed opacity-50'
								} transition-all`}
							>
								<div className="flex items-center space-x-4">
									<div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
										method.available
											? 'bg-gradient-to-r from-blue-500 to-purple-600'
											: 'bg-gray-700'
									}`}>
										<method.icon className={`w-6 h-6 ${
											method.available ? 'text-white' : 'text-gray-500'
										}`} />
									</div>
									<div>
										<h3 className={`font-medium ${
											method.available ? 'text-white' : 'text-gray-500'
										}`}>{method.name}</h3>
										<p className={`text-sm ${
											method.available ? 'text-gray-400' : 'text-gray-500'
										}`}>{method.description}</p>
									</div>
								</div>
							</div>
						))}
					</div>
				</div>

				{/* Device Status */}
				{deviceName && (
					<div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-gray-700/50 p-8 mb-12">
						<div className="flex items-center justify-between">
							<div>
								<h3 className="text-xl font-semibold mb-2">Connected Device</h3>
								<p className="text-gray-400">{deviceName}</p>
							</div>
							<div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center">
								<CheckCircle className="w-6 h-6 text-green-500" />
							</div>
						</div>
					</div>
				)}

				{/* Error Message */}
				{error && (
					<div className="bg-red-500/10 backdrop-blur-sm rounded-2xl border border-red-500/20 p-8 mb-12">
						<div className="flex items-center space-x-4">
							<div className="w-12 h-12 bg-red-500/20 rounded-full flex items-center justify-center">
								<XCircle className="w-6 h-6 text-red-500" />
							</div>
							<div>
								<h3 className="text-xl font-semibold mb-2 text-red-500">Connection Error</h3>
								<p className="text-gray-400">{error}</p>
							</div>
						</div>
					</div>
				)}

				{/* Connection Steps */}
				<div className="bg-gray-800/30 backdrop-blur-sm rounded-2xl border border-gray-700/30 p-8">
					<h2 className="text-2xl font-semibold text-center mb-8">Before Connecting</h2>
					<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
						<div className="p-6 rounded-xl border border-gray-700/30">
							<div className="flex items-center space-x-4 mb-4">
								<div className="w-12 h-12 bg-blue-500/20 rounded-full flex items-center justify-center">
									<Shield className="w-6 h-6 text-blue-500" />
								</div>
								<h3 className="font-medium">Security Check</h3>
							</div>
							<ul className="space-y-2 text-gray-400">
								<li className="flex items-center space-x-2">
									<CheckCircle className="w-4 h-4 text-green-500" />
									<span>Device is genuine</span>
								</li>
								<li className="flex items-center space-x-2">
									<CheckCircle className="w-4 h-4 text-green-500" />
									<span>Firmware is up to date</span>
								</li>
								<li className="flex items-center space-x-2">
									<CheckCircle className="w-4 h-4 text-green-500" />
									<span>PIN is set</span>
								</li>
							</ul>
						</div>
						<div className="p-6 rounded-xl border border-gray-700/30">
							<div className="flex items-center space-x-4 mb-4">
								<div className="w-12 h-12 bg-purple-500/20 rounded-full flex items-center justify-center">
									<Smartphone className="w-6 h-6 text-purple-500" />
								</div>
								<h3 className="font-medium">Device Setup</h3>
							</div>
							<ul className="space-y-2 text-gray-400">
								<li className="flex items-center space-x-2">
									<CheckCircle className="w-4 h-4 text-green-500" />
									<span>Bluetooth is enabled</span>
								</li>
								<li className="flex items-center space-x-2">
									<CheckCircle className="w-4 h-4 text-green-500" />
									<span>Device is unlocked</span>
								</li>
								<li className="flex items-center space-x-2">
									<CheckCircle className="w-4 h-4 text-green-500" />
									<span>Ethereum app is open</span>
								</li>
							</ul>
						</div>
					</div>
				</div>

				{/* Back Button */}
				<div className="mt-8 text-center">
					<button
						onClick={() => navigate('/connect-wallet')}
						className="inline-flex items-center space-x-2 text-gray-400 hover:text-white transition-colors"
					>
						<ArrowDownToLine className="w-5 h-5" />
						<span>Back to Wallet Selection</span>
					</button>
				</div>
			</div>
		</div>
	);
};

export default LedgerConnectionPage; 