'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { motion } from 'framer-motion';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');

    const { signIn } = useAuth();
    const router = useRouter();

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setError('');
        setMessage('');
        setLoading(true);

        try {
            await signIn(email, password);
            router.push('/map');
        } catch (err: any) {
            if (err.message.includes('verification')) {
                setMessage(err.message);
            } else {
                setError(err.message || 'Failed to sign in. Please check your credentials.');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 via-rose-50 to-purple-50 p-4">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="w-full max-w-md"
            >
                {/* Card */}
                <div className="bg-white/80 backdrop-blur-lg rounded-3xl shadow-2xl p-8 border border-white/20">
                    {/* Header */}
                    <div className="text-center mb-8">
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                            className="text-6xl mb-4"
                        >
                            📖
                        </motion.div>
                        <h1 className="text-3xl font-bold text-gray-800 mb-2">
                            Our Memory Book
                        </h1>
                        <p className="text-gray-600 text-sm">
                            A private collection of our cherished memories
                        </p>
                    </div>

                    {/* Login Form */}
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Email Input */}
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                                Email Address
                            </label>
                            <input
                                id="email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-rose-400 focus:border-transparent outline-none transition-all bg-white/50"
                                placeholder="your-email@example.com"
                                disabled={loading}
                            />
                        </div>

                        {/* Password Input */}
                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                                Password
                            </label>
                            <input
                                id="password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-rose-400 focus:border-transparent outline-none transition-all bg-white/50"
                                placeholder="••••••••"
                                disabled={loading}
                            />
                        </div>

                        {/* Error Message */}
                        {error && (
                            <motion.div
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm"
                            >
                                {error}
                            </motion.div>
                        )}

                        {/* Info Message */}
                        {message && (
                            <motion.div
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-xl text-sm"
                            >
                                {message}
                            </motion.div>
                        )}

                        {/* Submit Button */}
                        <motion.button
                            type="submit"
                            disabled={loading}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className="w-full bg-gradient-to-r from-rose-400 to-purple-500 text-white font-semibold py-3 px-6 rounded-xl shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? (
                                <span className="flex items-center justify-center">
                                    <svg className="animate-spin h-5 w-5 mr-3" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                    </svg>
                                    Signing in...
                                </span>
                            ) : (
                                'Sign In'
                            )}
                        </motion.button>
                    </form>

                    {/* Footer */}
                    <div className="mt-6 text-center">
                        <p className="text-xs text-gray-500">
                            🔒 This is a private website accessible only to authorized users
                        </p>
                    </div>
                </div>

                {/* Session Info */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4 }}
                    className="mt-6 text-center text-sm text-gray-600"
                >
                    <p>Session duration: 5 hours</p>
                    <p className="text-xs mt-1">Email verification required</p>
                </motion.div>
            </motion.div>
        </div>
    );
}
