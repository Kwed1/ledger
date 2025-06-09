import TransportWebHID from "@ledgerhq/hw-transport-webhid";
import Eth from "@ledgerhq/hw-app-eth";
import Web3 from "web3";
import { useAuth } from '../contexts/AuthContext'
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

const INFURA_PROJECT_ID = 'YOUR_INFURA_PROJECT_ID' // Replace with your Infura project ID
const web3 = new Web3(`https://mainnet.infura.io/v3/${INFURA_PROJECT_ID}`)

export class LedgerService {
	private transport: any = null
	private ethApp: Eth | null = null

	async connect(): Promise<void> {
		try {
			const transport = await TransportWebHID.create()
			this.transport = transport
			this.ethApp = new Eth(transport)
		} catch (error) {
			console.error('Failed to connect to Ledger:', error)
			throw new Error('Failed to connect to Ledger device')
		}
	}

	async getAddress(): Promise<string> {
		if (!this.ethApp) {
			throw new Error('Ledger not connected')
		}

		try {
			// Get Ethereum address using standard path
			const path = "44'/60'/0'/0/0"
			const { address } = await this.ethApp.getAddress(path)
			return address
		} catch (error) {
			console.error('Failed to get address:', error)
			throw new Error('Failed to get address from Ledger')
		}
	}

	async getBalance(address: string): Promise<string> {
		try {
			const balance = await web3.eth.getBalance(address)
			return web3.utils.fromWei(balance, 'ether')
		} catch (error) {
			console.error('Failed to get balance:', error)
			throw new Error('Failed to get balance')
		}
	}

	async authenticateWithBackend(address: string): Promise<void> {
		if (!this.ethApp) {
			throw new Error('Ledger not connected')
		}

		try {
			// Sign a message for backend authentication
			const message = 'Authenticate with backend'
			const path = "44'/60'/0'/0/0"
			const signature = await this.ethApp.signPersonalMessage(path, message)
			
			// Here you would typically send the signature to your backend
			// and verify it there
			console.log('Message signed:', signature)
		} catch (error) {
			console.error('Failed to authenticate with backend:', error)
			throw new Error('Failed to authenticate with backend')
		}
	}

	async disconnect(): Promise<void> {
		if (this.transport) {
			await this.transport.close()
			this.transport = null
			this.ethApp = null
		}
	}
}

export const ledgerService = new LedgerService() 