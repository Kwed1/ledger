import Eth from '@ledgerhq/hw-app-eth'
import TransportWebHID from '@ledgerhq/hw-transport-webhid'
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import { ethers } from 'ethers'

export interface CoinPrice {
	id: string
	symbol: string
	name: string
	current_price: number
	price_change_percentage_24h: number
	last_updated: string
}

export interface Balance {
	coinId: string
	amount: number
	lastUpdated: string
}

export interface HistoricalPrice {
	timestamp: number
	price: number
}

export const ledgerApi = createApi({
	reducerPath: 'ledgerApi',
	baseQuery: fetchBaseQuery({ baseUrl: 'https://api.coingecko.com/api/v3' }),
	endpoints: (builder) => ({
		getCoinPrices: builder.query<CoinPrice[], string>({
			query: (coinIds) => ({
				url: '/simple/price',
				params: {
					ids: coinIds,
					vs_currencies: 'usd',
					include_24hr_change: true,
					include_last_updated_at: true,
				},
			}),
			transformResponse: (response: any) => {
				return Object.entries(response).map(([id, data]: [string, any]) => ({
					id,
					symbol: id.toUpperCase(),
					name: id.charAt(0).toUpperCase() + id.slice(1),
					current_price: data.usd,
					price_change_percentage_24h: data.usd_24h_change,
					last_updated: new Date(data.last_updated_at * 1000).toISOString(),
				}))
			},
		}),
		getHistoricalPrices: builder.query<HistoricalPrice[], { coinId: string; days: number }>({
			query: ({ coinId, days }) => ({
				url: `/coins/${coinId}/market_chart`,
				params: {
					vs_currency: 'usd',
					days: days,
				},
			}),
			transformResponse: (response: any) => {
				return response.prices.map(([timestamp, price]: [number, number]) => ({
					timestamp,
					price,
				}))
			},
		}),
	}),
})

export const { useGetCoinPricesQuery, useGetHistoricalPricesQuery } = ledgerApi

class LedgerService {
	private transport: TransportWebHID | null = null
	private ethApp: Eth | null = null
	private provider: ethers.JsonRpcProvider | null = null

	async connect(): Promise<void> {
		try {
			const transport = await TransportWebHID.create()
			if (!(transport instanceof TransportWebHID)) {
				throw new Error('Failed to create WebHID transport')
			}
			this.transport = transport
			this.ethApp = new Eth(transport)
			// Send a simple command to check if the device is responsive
			await this.transport.send(0xE0, 0x01, 0, 0)
		} catch (error) {
			console.error('Failed to connect to Ledger:', error)
			throw new Error('Failed to connect to Ledger device')
		}
	}

	async disconnect(): Promise<void> {
		if (this.transport) {
			await this.transport.close()
			this.transport = null
			this.ethApp = null
		}
	}

	async getAddress(): Promise<string> {
		if (!this.ethApp) {
			throw new Error('Ledger not connected')
		}

		try {
			const { address } = await this.ethApp.getAddress("44'/60'/0'/0/0")
			return address
		} catch (error) {
			console.error('Failed to get address from Ledger:', error)
			throw new Error('Failed to get address from Ledger')
		}
	}

	async signMessage(message: string): Promise<string> {
		if (!this.ethApp) {
			throw new Error('Ledger not connected')
		}

		try {
			const messageHex = ethers.toUtf8Bytes(message)
			const { r, s, v } = await this.ethApp.signPersonalMessage("44'/60'/0'/0/0", Buffer.from(messageHex).toString('hex'))
			return '0x' + r + s.slice(2) + v.toString(16).padStart(2, '0')
		} catch (error) {
			console.error('Failed to sign message with Ledger:', error)
			throw new Error('Failed to sign message with Ledger')
		}
	}

	async getBalances(address: string): Promise<Balance[]> {
		if (!this.provider) {
			this.provider = new ethers.JsonRpcProvider('https://eth-mainnet.g.alchemy.com/v2/YOUR-API-KEY')
		}

		try {
			// Get ETH balance
			const ethBalance = await this.provider.getBalance(address)
			const ethBalanceInEth = Number(ethers.formatEther(ethBalance))

			// Get ERC20 token balances
			const tokenAddresses = {
				'usdt': '0xdAC17F958D2ee523a2206206994597C13D831ec7',
				'usdc': '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
				'dai': '0x6B175474E89094C44Da98b954EedeAC495271d0F'
			}

			const balances: Balance[] = [
				{
					coinId: 'ethereum',
					amount: ethBalanceInEth,
					lastUpdated: new Date().toISOString()
				}
			]

			// Get ERC20 balances
			for (const [symbol, tokenAddress] of Object.entries(tokenAddresses)) {
				const tokenContract = new ethers.Contract(
					tokenAddress,
					['function balanceOf(address) view returns (uint256)'],
					this.provider
				)
				const balance = await tokenContract.balanceOf(address)
				balances.push({
					coinId: symbol,
					amount: Number(ethers.formatUnits(balance, 18)),
					lastUpdated: new Date().toISOString()
				})
			}

			return balances
		} catch (error) {
			console.error('Failed to get balances:', error)
			throw new Error('Failed to get balances')
		}
	}

	async getTransactionHistory(address: string): Promise<any[]> {
		if (!this.provider) {
			this.provider = new ethers.JsonRpcProvider('https://eth-mainnet.g.alchemy.com/v2/YOUR-API-KEY')
		}

		try {
			// Get the last 100 transactions
			const response = await fetch(`https://api.etherscan.io/api?module=account&action=txlist&address=${address}&startblock=0&endblock=99999999&page=1&offset=100&sort=desc&apikey=YOUR-ETHERSCAN-API-KEY`)
			const data = await response.json()
			return data.result
		} catch (error) {
			console.error('Failed to get transaction history:', error)
			throw new Error('Failed to get transaction history')
		}
	}

	async authenticateWithBackend(): Promise<{ address: string; signature: string }> {
		const address = await this.getAddress()
		const message = `Login to MyApp at ${new Date().toISOString()}`
		const signature = await this.signMessage(message)

		try {
			const response = await fetch('/api/auth/ledger', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({ address, signature }),
			})

			if (!response.ok) {
				throw new Error('Failed to authenticate with backend')
			}

			return { address, signature }
		} catch (error) {
			console.error('Failed to authenticate with backend:', error)
			throw new Error('Failed to authenticate with backend')
		}
	}

	isConnected(): boolean {
		return this.transport !== null
	}
}

export const ledgerService = new LedgerService() 