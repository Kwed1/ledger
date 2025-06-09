import { configureStore } from '@reduxjs/toolkit'
import { ledgerApi } from '../services/ledger'

export const store = configureStore({
	reducer: {
		[ledgerApi.reducerPath]: ledgerApi.reducer,
	},
	middleware: getDefaultMiddleware =>
		getDefaultMiddleware().concat(ledgerApi.middleware),
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch 