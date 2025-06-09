import { initializeApp } from 'firebase/app'
import {
	signOut as firebaseSignOut,
	getAuth,
	GoogleAuthProvider,
	signInWithPopup
} from 'firebase/auth'
import {
	doc,
	enableIndexedDbPersistence,
	getDoc,
	getFirestore,
	setDoc,
	updateDoc
} from 'firebase/firestore'

// Firebase configuration
const firebaseConfig = {
	apiKey: "AIzaSyAIqYflnAJWUYWlqidcRsTk4CfF4fSdzR4",
	authDomain: "test-17f9a.firebaseapp.com",
	projectId: "test-17f9a",
	storageBucket: "test-17f9a.appspot.com",
	messagingSenderId: "357090125237",
	appId: "1:357090125237:web:dec97803ac67d8e6bea5fc"
}

// Initialize Firebase
const app = initializeApp(firebaseConfig)
const auth = getAuth(app)
const db = getFirestore(app)

// Enable offline persistence
enableIndexedDbPersistence(db).catch((err) => {
	if (err.code === 'failed-precondition') {
		console.warn('Multiple tabs open, persistence can only be enabled in one tab at a time.')
	} else if (err.code === 'unimplemented') {
		console.warn('The current browser does not support persistence.')
	}
})

// Mock user data for development
const mockUserData = {
	uid: 'test-user-123',
	email: 'test@example.com',
	displayName: 'Test User',
	photoURL: 'https://ui-avatars.com/api/?name=Test+User',
	balances: [
		{ coinId: 'bitcoin', amount: 0.5, lastUpdated: new Date().toISOString() },
		{ coinId: 'ethereum', amount: 2.5, lastUpdated: new Date().toISOString() },
		{ coinId: 'cardano', amount: 1000, lastUpdated: new Date().toISOString() },
		{ coinId: 'solana', amount: 50, lastUpdated: new Date().toISOString() },
		{ coinId: 'polygon', amount: 5000, lastUpdated: new Date().toISOString() }
	],
	createdAt: new Date().toISOString(),
	lastLogin: new Date().toISOString()
}

export interface UserBalance {
	coinId: string
	amount: number
	lastUpdated: string
}

export interface UserData {
	uid: string
	email: string
	displayName: string
	photoURL: string
	balances: UserBalance[]
	createdAt: string
	lastLogin: string
}

export const signInWithGoogle = async (): Promise<UserData> => {
	try {
		const provider = new GoogleAuthProvider()
		provider.setCustomParameters({
			prompt: 'select_account'
		})

		const result = await signInWithPopup(auth, provider)
		const user = result.user

		// Check if user exists in Firestore
		const userDoc = await getDoc(doc(db, 'users', user.uid))

		if (!userDoc.exists()) {
			// Create new user document
			const newUserData: UserData = {
				uid: user.uid,
				email: user.email || '',
				displayName: user.displayName || '',
				photoURL: user.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.displayName || 'User')}`,
				balances: [],
				createdAt: new Date().toISOString(),
				lastLogin: new Date().toISOString()
			}

			await setDoc(doc(db, 'users', user.uid), newUserData)
			return newUserData
		} else {
			// Update last login time and user info
			const userData = userDoc.data() as UserData
			await updateDoc(doc(db, 'users', user.uid), {
				lastLogin: new Date().toISOString(),
				displayName: user.displayName || userData.displayName,
				photoURL: user.photoURL || userData.photoURL
			})
			return {
				...userData,
				displayName: user.displayName || userData.displayName,
				photoURL: user.photoURL || userData.photoURL
			}
		}
	} catch (error) {
		console.error('Error signing in with Google:', error)
		// Return mock data for development
		return mockUserData
	}
}

export const logout = async (): Promise<void> => {
	try {
		await firebaseSignOut(auth)
	} catch (error) {
		console.error('Error signing out:', error)
	}
}

export const getUserData = async (uid: string): Promise<UserData | null> => {
	try {
		const userDoc = await getDoc(doc(db, 'users', uid))
		if (userDoc.exists()) {
			return userDoc.data() as UserData
		}
		return null
	} catch (error) {
		console.error('Error getting user data:', error)
		// Return mock data for development
		return mockUserData
	}
}

export const updateUserBalance = async (
	uid: string,
	coinId: string,
	amount: number
): Promise<void> => {
	try {
		const userDoc = await getDoc(doc(db, 'users', uid))
		if (userDoc.exists()) {
			const userData = userDoc.data() as UserData
			const balances = userData.balances || []
			const existingBalance = balances.find(b => b.coinId === coinId)

			if (existingBalance) {
				existingBalance.amount = amount
				existingBalance.lastUpdated = new Date().toISOString()
			} else {
				balances.push({
					coinId,
					amount,
					lastUpdated: new Date().toISOString()
				})
			}

			await updateDoc(doc(db, 'users', uid), { balances })
		}
	} catch (error) {
		console.error('Error updating user balance:', error)
	}
}

export { auth, db }

