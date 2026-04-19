import React, { useState, useEffect } from 'react';
import Dashboard from './components/Dashboard';
import TransactionForm from './components/TransactionForm';
import History from './components/History';
import Login from './components/Login';
import { useBudgetStore } from './store/useBudgetStore';

type Tab = 'dashboard' | 'transactions' | 'history';

const navItems = [
  { id: 'dashboard' as Tab, label: 'Dashboard', description: 'Wallet overview' },
  { id: 'transactions' as Tab, label: 'Log Transaction', description: 'Add income or expense' },
  { id: 'history' as Tab, label: 'Audit Logs', description: 'View all entries' },
];

const pageTitles: Record<Tab, string> = { dashboard: 'Dashboard', transactions: 'Log Transaction', history: 'Audit Logs' };

function App() {
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const { checkAuth, user, isLoading, logout } = useBudgetStore() as any;

  useEffect(() => {
    checkAuth();
  }, []);

  if (isLoading) return <div className="min-h-screen bg-[#EBEED5] flex items-center justify-center text-[#41386B] font-bold">Loading BudgetFlow...</div>;
  if (!user) return <Login />;

  return (
    <div className="min-h-screen bg-[#EBEED5] bg-opacity-60 flex flex-col md:flex-row font-sans text-[#41386B]">
      <aside className="w-full md:w-72 bg-[#3F4E40] border-r border-[#3F4E40] flex flex-col shadow-xl md:min-h-screen">
        <div className="px-6 py-5 border-b border-white/10 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#B0C49C] flex items-center justify-center shadow-md text-[#3F4E40] font-bold text-xl">B</div>
            <div>
              <h1 className="text-base font-bold text-[#EBEED5] leading-tight">BudgetFlow</h1>
              <p className="text-xs text-[#B0C49C]">Personal Finance</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          {navItems.map((item) => (
            <button key={item.id} onClick={() => setActiveTab(item.id)} className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-xl text-left transition-all duration-200 ${activeTab === item.id ? 'bg-[#B0C49C] text-[#3F4E40] shadow-md' : 'text-[#EBEED5] hover:bg-[#B0C49C]/20'}`}>
              <div>
                <p className={`text-sm font-bold ${activeTab === item.id ? 'text-[#3F4E40]' : 'text-[#EBEED5]'}`}>{item.label}</p>
                <p className={`text-xs ${activeTab === item.id ? 'text-[#3F4E40]/70' : 'text-[#B0C49C]'}`}>{item.description}</p>
              </div>
            </button>
          ))}
        </nav>

        <div className="px-4 py-4 border-t border-white/10">
          <div className="flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl bg-black/20 border border-white/5">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-8 h-8 rounded-full bg-[#B0C49C] flex items-center justify-center text-[#3F4E40] text-xs font-bold">JE</div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-[#EBEED5] truncate">Jude Emmanuel</p>
                <p className="text-[10px] text-[#B0C49C] truncate">{user.email}</p>
              </div>
            </div>
            <button onClick={logout} className="text-xs font-bold text-rose-300 hover:text-rose-400 p-1">OUT</button>
          </div>
        </div>
      </aside>

      <main className="flex-1 flex flex-col min-h-screen">
        <header className="bg-[#3F4E40] border-b border-[#3F4E40] px-6 md:px-8 py-4 flex items-center justify-between sticky top-0 z-10 shadow-md">
          <h2 className="text-xl font-bold text-[#EBEED5]">{pageTitles[activeTab]}</h2>
          <div className="text-xs font-bold text-[#3F4E40] hidden sm:block bg-[#B0C49C] px-3 py-1.5 rounded-lg">
            {new Date().toLocaleDateString('en-PH', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </div>
        </header>

        <div className="flex-1 p-6 md:p-8 overflow-y-auto">
          <div className="max-w-5xl mx-auto">
            {activeTab === 'dashboard' && <Dashboard />}
            {activeTab === 'transactions' && <TransactionForm />}
            {activeTab === 'history' && <History />}
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;