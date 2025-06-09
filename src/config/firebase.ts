import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

const firebaseConfig = {
	apiKey: "AIzaSyAIqYflnAJWUYWlqidcRsTk4CfF4fSdzR4",
	authDomain: "test-17f9a.firebaseapp.com",
	projectId: "test-17f9a",
	storageBucket: "test-17f9a.firebasestorage.app",
	messagingSenderId: "357090125237",
	appId: "1:357090125237:web:dec97803ac67d8e6bea5fc"
}

// Initialize Firebase
const app = initializeApp(firebaseConfig)

// Initialize Firebase services
export const auth = getAuth(app)
export const db = getFirestore(app)

export default app 