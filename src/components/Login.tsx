import React, { useState } from 'react';
import { useBudgetStore } from '../store/useBudgetStore';

export default function Login({ isDarkMode, toggleTheme }: { isDarkMode?: boolean; toggleTheme?: () => void }) {
    const { login } = useBudgetStore() as any;
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        const { error: loginError } = await login(email, password);
        if (loginError) setError('Invalid email or password. Please try again.');
        setLoading(false);
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-4 selection:bg-teal-100 dark:selection:bg-teal-900/50">
            {/* Dark mode toggle absolute corner */}
            {toggleTheme && (
                <button onClick={toggleTheme} className="absolute top-6 right-6 p-2 text-slate-500 dark:text-slate-400 hover:text-teal-600 dark:hover:text-teal-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors border border-transparent dark:border-slate-800">
                   {isDarkMode ? (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                      </svg>
                   ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                      </svg>
                   )}
                </button>
            )}

            <div className="bg-white dark:bg-slate-900 p-8 sm:p-10 rounded-3xl shadow-xl shadow-slate-200/50 dark:shadow-none w-full max-w-md border border-slate-100 dark:border-slate-800">
                <div className="text-center mb-10">
                    <div className="w-16 h-16 rounded-2xl bg-teal-500 mx-auto flex items-center justify-center shadow-lg shadow-teal-500/20 text-white font-bold text-3xl mb-5">B</div>
                    <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">BudgetFlow</h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400 font-medium mt-2">Welcome back! Please sign in.</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Email Address</label>
                        <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="w-full p-3.5 bg-slate-50 dark:bg-slate-950 hover:bg-slate-100 dark:hover:bg-slate-900 focus:bg-white dark:focus:bg-slate-900 border text-sm border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500 dark:focus:border-teal-500 outline-none font-medium text-slate-800 dark:text-slate-100 transition-all cursor-text box-border" placeholder="you@example.com" />
                    </div>
                    <div>
                        <div className="flex items-center justify-between mb-2">
                             <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">Password</label>
                        </div>
                        <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="w-full p-3.5 bg-slate-50 dark:bg-slate-950 hover:bg-slate-100 dark:hover:bg-slate-900 focus:bg-white dark:focus:bg-slate-900 border text-sm border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500 dark:focus:border-teal-500 outline-none font-medium text-slate-800 dark:text-slate-100 transition-all cursor-text box-border" placeholder="••••••••" />
                    </div>

                    {error && <div className="text-sm font-medium text-rose-600 dark:text-rose-400 text-center bg-rose-50 dark:bg-rose-950/30 border border-rose-100 dark:border-rose-900/50 p-3 rounded-xl">{error}</div>}

                    <button type="submit" disabled={loading} className="w-full py-4 mt-2 rounded-xl text-white font-bold text-sm tracking-wide shadow-md shadow-teal-500/20 dark:shadow-none transition-all duration-200 bg-teal-600 hover:bg-teal-500 hover:shadow-lg disabled:opacity-70 disabled:hover:shadow-md">
                        {loading ? 'Authenticating...' : 'Sign In'}
                    </button>
                </form>
            </div>
        </div>
    );
}