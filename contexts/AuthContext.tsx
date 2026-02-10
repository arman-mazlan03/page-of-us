'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import {
    User,
    onAuthStateChanged,
    signInWithEmailAndPassword,
    signOut as firebaseSignOut,
    sendEmailVerification,
} from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { doc, setDoc, getDoc, updateDoc } from 'firebase/firestore';

interface AuthContextType {
    user: User | null;
    loading: boolean;
    signIn: (email: string, password: string) => Promise<void>;
    signOut: () => Promise<void>;
    isSessionValid: () => boolean;
    sessionExpiry: number | null;
    needsEmailVerification: boolean;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    loading: true,
    signIn: async () => { },
    signOut: async () => { },
    isSessionValid: () => false,
    sessionExpiry: null,
    needsEmailVerification: false,
});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [sessionExpiry, setSessionExpiry] = useState<number | null>(null);
    const [needsEmailVerification, setNeedsEmailVerification] = useState(false);

    // Get allowed emails from environment (comma-separated)
    const ALLOWED_EMAILS = (process.env.NEXT_PUBLIC_ALLOWED_EMAILS || '')
        .split(',')
        .map(email => email.trim())
        .filter(Boolean);
    const SESSION_DURATION = parseInt(process.env.NEXT_PUBLIC_SESSION_DURATION || '3600000'); // 1 hour

    // Check if session is still valid
    const isSessionValid = () => {
        if (!sessionExpiry) return false;
        return Date.now() < sessionExpiry;
    };

    // Sign in function - 1 hour session with auto-logout
    const signIn = async (email: string, password: string) => {
        // Check if email is in the allowed list
        if (!ALLOWED_EMAILS.includes(email)) {
            throw new Error('This email is not authorized to access this site.');
        }

        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            // Reload user to get the latest emailVerified status
            await user.reload();

            // Check if email is verified (only for first-time users)
            if (!user.emailVerified) {
                await sendEmailVerification(user);
                await firebaseSignOut(auth);
                setNeedsEmailVerification(true);

                throw new Error('Email not verified. A verification email has been sent. Please verify your email and try again.');
            }

            // Email is verified - grant access for 1 hour
            const currentTime = Date.now();
            const expiry = currentTime + SESSION_DURATION;

            await setDoc(doc(db, 'users', user.uid), {
                email: user.email,
                lastLogin: new Date().toISOString(),
                sessionExpiry: expiry,
            }, { merge: true });

            setSessionExpiry(expiry);
            setNeedsEmailVerification(false);

        } catch (error: any) {
            throw error;
        }
    };

    // Sign out function
    const signOut = async () => {
        try {
            // Clear session info
            if (user) {
                await updateDoc(doc(db, 'users', user.uid), {
                    sessionExpiry: null,
                    lastLogout: new Date().toISOString(),
                });
            }

            await firebaseSignOut(auth);
            setSessionExpiry(null);
            setNeedsEmailVerification(false);
        } catch (error) {
            console.error('Error signing out:', error);
            throw error;
        }
    };


    // Monitor auth state
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            if (firebaseUser) {
                try {
                    // Check if session is still valid
                    const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
                    const userData = userDoc.data();

                    // If sessionExpiry exists and is valid, use it
                    if (userData?.sessionExpiry && userData.sessionExpiry > Date.now()) {
                        setUser(firebaseUser);
                        setSessionExpiry(userData.sessionExpiry);
                    }
                    // If no sessionExpiry or expired, but user is authenticated, create new session
                    else if (firebaseUser.emailVerified) {
                        // User is authenticated but session expired or missing
                        // Create new session
                        const expiry = Date.now() + SESSION_DURATION;
                        await setDoc(doc(db, 'users', firebaseUser.uid), {
                            email: firebaseUser.email,
                            sessionExpiry: expiry,
                            lastLogin: new Date().toISOString(),
                        }, { merge: true });

                        setUser(firebaseUser);
                        setSessionExpiry(expiry);
                    } else {
                        // Email not verified - sign out
                        await firebaseSignOut(auth);
                        setUser(null);
                        setSessionExpiry(null);
                    }
                } catch (error) {
                    console.error('Error checking session:', error);
                    // On error, still set user if authenticated
                    setUser(firebaseUser);
                    // Create new session
                    const expiry = Date.now() + SESSION_DURATION;
                    setSessionExpiry(expiry);
                }
            } else {
                setUser(null);
                setSessionExpiry(null);
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    // Auto-logout when session expires
    useEffect(() => {
        if (!sessionExpiry) return;

        const checkSession = setInterval(() => {
            if (!isSessionValid()) {
                console.log('Session expired (1 hour) - logging out');
                signOut();
            }
        }, 60000); // Check every minute

        return () => clearInterval(checkSession);
    }, [sessionExpiry]);

    return (
        <AuthContext.Provider
            value={{
                user,
                loading,
                signIn,
                signOut,
                isSessionValid,
                sessionExpiry,
                needsEmailVerification,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}
