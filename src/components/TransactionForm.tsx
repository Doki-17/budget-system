import { useState, useEffect } from 'react';
import { useBudgetStore } from '../store/useBudgetStore';

type FormType = 'INCOME' | 'TRANSFER' | 'EXPENSE';

export default function TransactionForm() {
  const { categories, balances, logIncome, logExpense, transferUnallocated, distributeUnallocatedEqually, addIncomeSource, removeIncomeSource } = useBudgetStore() as any;
  const [type, setType] = useState<FormType>('INCOME');

  const [source, setSource] = useState<string>('');
  const [expenseId, setExpenseId] = useState<string>('');
  const [amount, setAmount] = useState<string>('');
  const [description, setDescription] = useState<string>('');

  const [excludedIds, setExcludedIds] = useState<string[]>([]);
  const [includePaidFixed, setIncludePaidFixed] = useState<boolean>(false);

  const [successMsg, setSuccessMsg] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string>('');

  useEffect(() => {
    if (categories.income.length > 0 && !categories.income.includes(source)) setSource(categories.income[0]);
    if (categories.expenses.length > 0 && !categories.expenses.find((e: any) => e.id === expenseId)) setExpenseId(categories.expenses[0].id);
  }, [categories.income, categories.expenses]);

  const showSuccess = (msg: string) => { setSuccessMsg(msg); setErrorMsg(''); setTimeout(() => setSuccessMsg(''), 3500); };
  const showError = (msg: string) => { setErrorMsg(msg); setSuccessMsg(''); setTimeout(() => setErrorMsg(''), 3500); };

  const handleAddSource = () => {
    const newSource = window.prompt("Enter new Income Source (e.g. Salary, Bonus):");
    if (newSource && newSource.trim() !== '') { addIncomeSource(newSource.trim()); setSource(newSource.trim()); }
  };

  const handleRemoveSource = () => {
    if (!source) return;
    if (window.confirm(`Delete "${source}"?`)) removeIncomeSource(source);
  };

  const toggleExclude = (id: string) => setExcludedIds(prev => prev.includes(id) ? prev.filter(eId => eId !== id) : [...prev, id]);

  const handleDistributeEqually = () => {
    if ((balances.unallocated || 0) <= 0) return showError("No available funds to distribute.");

    const eligibleCount = categories.expenses.filter((exp: any) => {
      if (excludedIds.includes(exp.id)) return false;
      const isPaidFixed = exp.frequency === 'monthly' && exp.lastAllocatedMonth === `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;
      if (!includePaidFixed && isPaidFixed) return false;
      return true;
    }).length;

    if (eligibleCount <= 0) return showError("No envelopes available to distribute to based on your current filters.");

    if (window.confirm(`Distribute ₱${(balances.unallocated || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })} equally among ${eligibleCount} envelope(s)?`)) {
      distributeUnallocatedEqually(excludedIds, includePaidFixed);
      showSuccess("Funds distributed equally!");
      setAmount('');
      setExcludedIds([]);
      setIncludePaidFixed(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = parseFloat(amount);
    if (!amount || isNaN(parsed) || parsed <= 0) return showError('Please enter a valid positive amount.');

    if (type === 'INCOME') {
      if (!source) return showError('Please add an income source first.');
      logIncome(source, amount, excludedIds, includePaidFixed);
      showSuccess(`₱${parsed.toLocaleString(undefined, { minimumFractionDigits: 2 })} distributed from ${source}!`);
      setExcludedIds([]);
      setIncludePaidFixed(false);
    } else if (type === 'TRANSFER') {
      if (!expenseId) return showError('Please select a target envelope.');
      if ((balances.unallocated || 0) < parsed) return showError("Not enough available funds!");
      transferUnallocated(expenseId, amount);
      const exp = categories.expenses.find((e: any) => e.id === expenseId);
      showSuccess(`₱${parsed.toLocaleString(undefined, { minimumFractionDigits: 2 })} transferred to ${exp?.name}!`);
    } else {
      if (!expenseId) return showError('Please add an envelope first.');
      if (!description.trim()) return showError('Please add a note for this expense.');
      logExpense(expenseId, amount, description);
      const exp = categories.expenses.find((e: any) => e.id === expenseId);
      showSuccess(`₱${parsed.toLocaleString(undefined, { minimumFractionDigits: 2 })} deducted from ${exp?.name}.`);
      setDescription('');
    }
    setAmount('');
  };

  const handleTabChange = (newType: FormType) => {
    setType(newType);
    setExcludedIds([]);
    setIncludePaidFixed(false);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* 3-Way Mode Switcher */}
      <div className="relative flex bg-slate-100 dark:bg-slate-900 rounded-2xl p-1 shadow-inner border border-slate-200/60 dark:border-slate-800/60">
        <div
          className={`absolute top-1 bottom-1 w-1/3 rounded-xl transition-all duration-300 ease-out shadow-sm ${type === 'INCOME' ? 'left-1 bg-white dark:bg-slate-800 ring-1 ring-slate-200 dark:ring-slate-700' : type === 'TRANSFER' ? 'left-[33.3%] bg-white dark:bg-slate-800 ring-1 ring-slate-200 dark:ring-slate-700' : 'left-[65.6%] w-[33%] bg-white dark:bg-slate-800 ring-1 ring-slate-200 dark:ring-slate-700'
            }`}
        />
        <button onClick={() => handleTabChange('INCOME')} className={`relative z-10 flex-1 flex items-center justify-center py-3 rounded-xl text-sm font-bold transition-colors duration-300 ${type === 'INCOME' ? 'text-teal-600 dark:text-teal-400' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'}`}>
          INCOMING
        </button>
        <button onClick={() => handleTabChange('TRANSFER')} className={`relative z-10 flex-1 flex items-center justify-center py-3 rounded-xl text-sm font-bold transition-colors duration-300 ${type === 'TRANSFER' ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'}`}>
          MOVE FUNDS
        </button>
        <button onClick={() => handleTabChange('EXPENSE')} className={`relative z-10 flex-1 flex items-center justify-center py-3 rounded-xl text-sm font-bold transition-colors duration-300 ${type === 'EXPENSE' ? 'text-rose-600 dark:text-rose-400' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'}`}>
          OUTGOING
        </button>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] dark:shadow-none border border-slate-100 dark:border-slate-700/60 p-6 lg:p-8">
        <p className="text-xs uppercase tracking-wider font-bold text-slate-400 dark:text-slate-500 mb-6 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-current opacity-50"></span>
          {type === 'INCOME' ? 'Record new money in — automatically splits it' : type === 'TRANSFER' ? 'Assign available money to specific envelopes' : 'Record money spent — deducts from envelope'}
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          {type === 'INCOME' ? (
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Money Source</label>
              <div className="flex gap-2">
                <select value={source} onChange={(e) => setSource(e.target.value)} className="flex-1 p-3.5 bg-slate-50 dark:bg-slate-900/50 hover:bg-slate-100 dark:hover:bg-slate-900 focus:bg-white dark:focus:bg-slate-900 border text-sm border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 font-semibold focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500 outline-none transition-all">
                  {categories.income.map((inc: string) => <option key={inc} value={inc}>{inc}</option>)}
                  {categories.income.length === 0 && <option value="" disabled>No sources available</option>}
                </select>
                <button type="button" onClick={handleAddSource} className="px-4 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-sm rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 hover:border-slate-300 dark:hover:border-slate-600 shadow-sm transition-all">+ Add New</button>
                <button type="button" onClick={handleRemoveSource} className="px-4 bg-white dark:bg-slate-800 text-rose-500 dark:text-rose-400 font-semibold text-sm rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-rose-50 dark:hover:bg-rose-950/30 hover:border-rose-200 dark:hover:border-rose-900/50 shadow-sm transition-all">Delete</button>
              </div>
            </div>
          ) : (
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">{type === 'TRANSFER' ? 'Send Money To' : 'Which envelope paid?'}</label>
              <select value={expenseId} onChange={(e) => setExpenseId(e.target.value)} className="w-full p-3.5 bg-slate-50 dark:bg-slate-900/50 hover:bg-slate-100 dark:hover:bg-slate-900 focus:bg-white dark:focus:bg-slate-900 border text-sm border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 font-semibold focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500 outline-none transition-all">
                {categories.expenses.map((exp: any) => <option key={exp.id} value={exp.id}>{exp.name} — {exp.bank}</option>)}
              </select>
            </div>
          )}

          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Amount (₱)</label>
            <div className="relative flex items-center">
              <span className="absolute left-4 text-slate-400 dark:text-slate-500 font-bold text-lg">₱</span>
              <input type="number" step="0.01" min="0" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" className="w-full pl-9 pr-16 py-3.5 bg-slate-50 dark:bg-slate-900/50 hover:bg-slate-100 dark:hover:bg-slate-900 focus:bg-white dark:focus:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 font-bold text-lg focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500 outline-none transition-all box-border" />
              {type === 'TRANSFER' && (
                <button type="button" onClick={() => setAmount(String(balances.unallocated || 0))} className="absolute right-3 text-xs font-bold text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-2.5 py-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 hover:text-slate-700 dark:hover:text-slate-300 shadow-sm transition-all">MAX</button>
              )}
            </div>
            {type === 'TRANSFER' && <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-2.5 ml-1">Available to assign: <span className="text-indigo-600 dark:text-indigo-400">₱{(balances.unallocated || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span></p>}
          </div>

          {/* INCOME SETTINGS (Exclusions & Force Include) */}
          {type === 'INCOME' && categories.expenses.length > 0 && (
            <div className="bg-slate-50 dark:bg-slate-900/30 p-5 rounded-2xl border border-slate-100 dark:border-slate-800">
              <label className="block text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-4">Distribution Rules</label>

              {/* Force Include Paid Fixed Checkbox */}
              <label className="flex items-start gap-3 p-3.5 mb-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm cursor-pointer transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/80">
                <div className="relative flex items-center mt-0.5">
                  <input type="checkbox" checked={includePaidFixed} onChange={(e) => setIncludePaidFixed(e.target.checked)} className="peer appearance-none w-5 h-5 border-2 border-slate-300 dark:border-slate-600 rounded-md checked:bg-teal-500 dark:checked:bg-teal-500 checked:border-teal-500 transition-all cursor-pointer bg-white dark:bg-slate-800" />
                  <svg className="absolute w-3.5 h-3.5 pointer-events-none hidden peer-checked:block text-white top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                </div>
                <div>
                  <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">Fund already-paid monthly bills</span>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-1 leading-relaxed">Allocate money to fixed bills even if they have already been paid this month.</p>
                </div>
              </label>

              <p className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-3 mt-5 border-t border-slate-200/60 dark:border-slate-700/60 pt-5">Skip these envelopes this time (Optional)</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {categories.expenses.map((exp: any) => (
                  <label key={exp.id} className={`flex items-center gap-3 p-2.5 rounded-xl cursor-pointer transition-all border ${excludedIds.includes(exp.id) ? 'bg-white dark:bg-slate-800 border-teal-500 dark:border-teal-500 shadow-sm' : 'bg-white/50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 hover:bg-white dark:hover:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-600'}`}>
                    <div className="relative flex items-center">
                      <input type="checkbox" checked={excludedIds.includes(exp.id)} onChange={() => toggleExclude(exp.id)} className="peer appearance-none w-4 h-4 border-2 border-slate-300 dark:border-slate-600 rounded checked:bg-teal-500 checked:border-teal-500 transition-all cursor-pointer bg-white dark:bg-slate-800" />
                      <svg className="absolute w-3 h-3 pointer-events-none hidden peer-checked:block text-white top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                    </div>
                    <span className={`text-sm font-semibold ${excludedIds.includes(exp.id) ? 'text-slate-800 dark:text-slate-200' : 'text-slate-600 dark:text-slate-400'}`}>{exp.name}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {type === 'EXPENSE' && (
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Short Note / Description</label>
              <input type="text" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="e.g. Cinema tickets" className="w-full p-3.5 bg-slate-50 dark:bg-slate-900/50 hover:bg-slate-100 dark:hover:bg-slate-900 focus:bg-white dark:focus:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 font-medium text-sm focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500 outline-none transition-all box-border" />
            </div>
          )}

          {successMsg && <div className="text-teal-800 dark:text-teal-200 bg-teal-50 dark:bg-teal-900/30 border border-teal-100 dark:border-teal-800 rounded-xl px-4 py-3.5 text-sm font-semibold flex items-center gap-2"><svg className="w-5 h-5 text-teal-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>{successMsg}</div>}
          {errorMsg && <div className="text-rose-800 dark:text-rose-200 bg-rose-50 dark:bg-rose-900/30 border border-rose-100 dark:border-rose-800 rounded-xl px-4 py-3.5 text-sm font-semibold flex items-center gap-2"><svg className="w-5 h-5 text-rose-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>{errorMsg}</div>}

          <button type="submit" className={`w-full py-4 mt-2 rounded-xl text-white font-bold text-sm tracking-wide shadow-md transition-all duration-200 hover:shadow-lg ${type === 'INCOME' ? 'bg-teal-600 hover:bg-teal-500 shadow-teal-500/20 dark:shadow-none' : type === 'TRANSFER' ? 'bg-indigo-600 hover:bg-indigo-500 shadow-indigo-500/20 dark:shadow-none' : 'bg-rose-600 hover:bg-rose-500 shadow-rose-500/20 dark:shadow-none'}`}>
            {type === 'INCOME' ? 'Add & Distribute' : type === 'TRANSFER' ? 'Move Funds' : 'Record Expense'}
          </button>

          {/* DISTRIBUTE EQUALLY OPTION (WITH EXCLUSIONS & FORCE INCLUDE) */}
          {type === 'TRANSFER' && (balances.unallocated || 0) > 0 && (
            <div className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-800 space-y-5">
              <div className="relative flex items-center py-2">
                 <div className="flex-grow border-t border-slate-100 dark:border-slate-800"></div>
                 <span className="flex-shrink-0 mx-4 text-xs font-bold text-slate-300 dark:text-slate-600 uppercase tracking-widest">Or choose quick split</span>
                 <div className="flex-grow border-t border-slate-100 dark:border-slate-800"></div>
              </div>

              <button
                type="button"
                onClick={handleDistributeEqually}
                className="w-full py-4 rounded-xl text-slate-700 dark:text-slate-300 font-bold text-sm tracking-wide shadow-sm border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all duration-200"
              >
                Split Equally Among All
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}