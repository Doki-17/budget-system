import { useState, useEffect } from 'react';
import Dashboard from './components/Dashboard';
import TransactionForm from './components/TransactionForm';
import History from './components/History';
import Login from './components/Login';
import { useBudgetStore } from './store/useBudgetStore';

type Tab = 'dashboard' | 'transactions' | 'history';

const navItems = [
  { id: 'dashboard' as Tab, label: 'Overview', description: 'Financial snapshot' },
  { id: 'transactions' as Tab, label: 'Add Activity', description: 'Log new transactions' },
  { id: 'history' as Tab, label: 'Recent Activity', description: 'View all logs' },
];

const pageTitles: Record<Tab, string> = { dashboard: 'Overview', transactions: 'Add Activity', history: 'Recent Activity' };

function App() {
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { checkAuth, user, isLoading, logout } = useBudgetStore() as any;

  // Dark mode setup
  const [isDarkMode, setIsDarkMode] = useState(() => {
    return localStorage.getItem('theme') === 'dark' ||
      (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches);
  });

  useEffect(() => {
    const html = document.documentElement;
    if (isDarkMode) {
      html.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      html.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  const toggleTheme = () => setIsDarkMode(!isDarkMode);

  useEffect(() => {
    checkAuth();
  }, []);

  if (isLoading) return <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center text-teal-700 dark:text-teal-400 font-bold">Loading BudgetFlow...</div>;
  if (!user) return <Login isDarkMode={isDarkMode} toggleTheme={toggleTheme} />;

  const closeSidebar = () => setIsSidebarOpen(false);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col md:flex-row font-sans text-slate-800 dark:text-slate-100 selection:bg-teal-100 dark:selection:bg-teal-900/50">
      
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-slate-800/40 dark:bg-slate-950/80 backdrop-blur-sm z-40 md:hidden transition-opacity" 
          onClick={closeSidebar} 
        />
      )}

      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-72 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col shadow-xl md:shadow-none transition-transform duration-300 md:relative md:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="px-6 py-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-500 dark:bg-teal-600 flex items-center justify-center shadow-md shadow-teal-500/20 text-white font-bold text-xl">B</div>
            <div>
              <h1 className="text-base font-bold text-slate-800 dark:text-slate-100 leading-tight">BudgetFlow</h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">Personal Finance</p>
            </div>
          </div>
          <button onClick={closeSidebar} className="md:hidden text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 p-1 bg-slate-50 dark:bg-slate-800 rounded-lg">
             <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
             </svg>
          </button>
        </div>

        <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto">
          {navItems.map((item) => (
            <button 
              key={item.id} 
              onClick={() => { setActiveTab(item.id); closeSidebar(); }} 
              className={`w-full flex items-center gap-3.5 px-4 py-3.5 rounded-xl text-left transition-all duration-200 ${activeTab === item.id ? 'bg-teal-50/80 dark:bg-teal-500/10 text-teal-700 dark:text-teal-400 shadow-sm ring-1 ring-teal-500/10 dark:ring-teal-500/20' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50'}`}
            >
              <div>
                <p className={`text-sm font-semibold ${activeTab === item.id ? 'text-teal-700 dark:text-teal-400' : 'text-slate-700 dark:text-slate-300'}`}>{item.label}</p>
                <p className={`text-xs mt-0.5 ${activeTab === item.id ? 'text-teal-600/70 dark:text-teal-500/70' : 'text-slate-500 dark:text-slate-500'}`}>{item.description}</p>
              </div>
            </button>
          ))}
        </nav>

        <div className="px-4 py-4 border-t border-slate-100 dark:border-slate-800">
          <div className="flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700/60">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-8 h-8 rounded-full bg-teal-100 dark:bg-teal-900/50 flex items-center justify-center text-teal-700 dark:text-teal-400 text-xs font-bold">U</div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 truncate">My Account</p>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">{user.email}</p>
              </div>
            </div>
            <button onClick={logout} className="text-xs font-bold text-slate-400 dark:text-slate-500 hover:text-rose-500 dark:hover:text-rose-400 p-1 transition-colors">OUT</button>
          </div>
        </div>
      </aside>

      <main className="flex-1 flex flex-col min-h-screen max-w-full min-w-0 bg-slate-50 dark:bg-slate-950">
        <header className="bg-white/90 dark:bg-slate-900/90 border-b border-slate-200 dark:border-slate-800 px-4 md:px-8 py-4 flex items-center justify-between sticky top-0 z-30 shadow-sm backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <button onClick={() => setIsSidebarOpen(true)} className="md:hidden p-2 -ml-2 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">{pageTitles[activeTab]}</h2>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={toggleTheme} className="p-2 text-slate-500 dark:text-slate-400 hover:text-teal-600 dark:hover:text-teal-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors border border-transparent dark:border-slate-700">
               {isDarkMode ? (
                  // Sun Icon
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
               ) : (
                  // Moon Icon
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                  </svg>
               )}
            </button>
            <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 hidden sm:block bg-slate-50 dark:bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700">
              {new Date().toLocaleDateString('en-PH', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </div>
          </div>
        </header>

        <div className="flex-1 p-4 md:p-8 overflow-y-auto">
          <div className="max-w-5xl mx-auto w-full">
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