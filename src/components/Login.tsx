import React, { useState } from 'react';
import { useBudgetStore } from '../store/useBudgetStore';

export default function Login() {
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
        if (loginError) setError('Invalid email or password.');
        setLoading(false);
    };

    return (
        <div className="min-h-screen bg-[#EBEED5] flex items-center justify-center p-4">
            <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md border border-[#B1B4C8]/30">
                <div className="text-center mb-8">
                    <div className="w-16 h-16 rounded-2xl bg-[#B0C49C] mx-auto flex items-center justify-center shadow-md text-[#3F4E40] font-bold text-3xl mb-4">B</div>
                    <h1 className="text-2xl font-bold text-[#41386B]">BudgetFlow</h1>
                    <p className="text-sm text-[#7A70BA] font-medium mt-1">Sign in to access your finances</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                    <div>
                        <label className="block text-sm font-bold text-[#41386B] mb-1.5">Email</label>
                        <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="w-full p-3 bg-white border border-[#B1B4C8] rounded-xl focus:ring-2 focus:ring-[#7A70BA] outline-none font-semibold text-[#41386B]" placeholder="you@example.com" />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-[#41386B] mb-1.5">Password</label>
                        <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="w-full p-3 bg-white border border-[#B1B4C8] rounded-xl focus:ring-2 focus:ring-[#7A70BA] outline-none font-semibold text-[#41386B]" placeholder="••••••••" />
                    </div>

                    {error && <p className="text-sm font-bold text-rose-500 text-center bg-rose-50 p-2 rounded-lg">{error}</p>}

                    <button type="submit" disabled={loading} className="w-full py-3.5 rounded-xl text-white font-bold tracking-widest uppercase shadow-md transition-all duration-200 bg-[#41386B] hover:bg-[#7A70BA] disabled:opacity-70">
                        {loading ? 'Authenticating...' : 'Secure Login'}
                    </button>
                </form>
            </div>
        </div>
    );
}