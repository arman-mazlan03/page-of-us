'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { motion } from 'framer-motion';

export default function VerifyLoginPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying');
    const [message, setMessage] = useState('Verifying your login...');

    useEffect(() => {
        verifyLogin();
    }, []);

    const verifyLogin = async () => {
        try {
            const token = searchParams.get('token');
            const uid = searchParams.get('uid');

            if (!token || !uid) {
                setStatus('error');
                setMessage('Invalid verification link.');
                return;
            }

            // Get user document
            const userDoc = await getDoc(doc(db, 'users', uid));

            if (!userDoc.exists()) {
                setStatus('error');
                setMessage('User not found.');
                return;
            }

            const userData = userDoc.data();

            // Check if token matches
            if (userData.loginToken !== token) {
                setStatus('error');
                setMessage('Invalid or expired verification link.');
                return;
            }

            // Check if token is expired
            if (userData.loginTokenExpiry < Date.now()) {
                setStatus('error');
                setMessage('Verification link has expired. Please log in again.');
                return;
            }

            // Check if token was already used
            if (userData.loginTokenUsed) {
                setStatus('error');
                setMessage('This verification link has already been used.');
                return;
            }

            // Token is valid - mark as used (but keep it valid for the session)
            await updateDoc(doc(db, 'users', uid), {
                emailVerifiedAt: new Date().toISOString(),
            });

            setStatus('success');
            setMessage('Email verified successfully! Redirecting to login...');

            // Redirect to login page after 2 seconds
            setTimeout(() => {
                router.push('/login');
            }, 2000);

        } catch (error) {
            console.error('Verification error:', error);
            setStatus('error');
            setMessage('An error occurred during verification.');
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-100 via-pink-100 to-rose-100 flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full"
            >
                {status === 'verifying' && (
                    <div className="text-center">
                        <div className="w-16 h-16 mx-auto mb-4">
                            <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-purple-500"></div>
                        </div>
                        <h1 className="text-2xl font-bold text-gray-800 mb-2">Verifying...</h1>
                        <p className="text-gray-600">{message}</p>
                    </div>
                )}

                {status === 'success' && (
                    <div className="text-center">
                        <div className="w-16 h-16 mx-auto mb-4 bg-green-100 rounded-full flex items-center justify-center">
                            <span className="text-4xl">✅</span>
                        </div>
                        <h1 className="text-2xl font-bold text-green-600 mb-2">Success!</h1>
                        <p className="text-gray-600">{message}</p>
                    </div>
                )}

                {status === 'error' && (
                    <div className="text-center">
                        <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
                            <span className="text-4xl">❌</span>
                        </div>
                        <h1 className="text-2xl font-bold text-red-600 mb-2">Verification Failed</h1>
                        <p className="text-gray-600 mb-6">{message}</p>
                        <button
                            onClick={() => router.push('/login')}
                            className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg font-semibold hover:from-purple-600 hover:to-pink-600 transition-all"
                        >
                            Back to Login
                        </button>
                    </div>
                )}
            </motion.div>
        </div>
    );
}
