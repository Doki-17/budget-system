import React, { useState, useEffect } from 'react';
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
    const newSource = window.prompt("Enter new Income Source:");
    if (newSource && newSource.trim() !== '') { addIncomeSource(newSource.trim()); setSource(newSource.trim()); }
  };

  const handleRemoveSource = () => {
    if (!source) return;
    if (window.confirm(`Delete "${source}"?`)) removeIncomeSource(source);
  };

  const toggleExclude = (id: string) => setExcludedIds(prev => prev.includes(id) ? prev.filter(eId => eId !== id) : [...prev, id]);

  const handleDistributeEqually = () => {
    if ((balances.unallocated || 0) <= 0) return showError("No unallocated funds to distribute.");

    // Quick validation check
    const eligibleCount = categories.expenses.filter((exp: any) => {
      if (excludedIds.includes(exp.id)) return false;
      const isPaidFixed = exp.frequency === 'monthly' && exp.lastAllocatedMonth === `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;
      if (!includePaidFixed && isPaidFixed) return false;
      return true;
    }).length;

    if (eligibleCount <= 0) return showError("No wallets available to distribute to based on your current filters.");

    if (window.confirm(`Are you sure you want to distribute ₱${(balances.unallocated || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })} equally among ${eligibleCount} wallet(s)?`)) {
      distributeUnallocatedEqually(excludedIds, includePaidFixed);
      showSuccess("Funds distributed equally to selected wallets!");
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
      if (!expenseId) return showError('Please select a target wallet.');
      if ((balances.unallocated || 0) < parsed) return showError("You don't have enough unallocated funds!");
      transferUnallocated(expenseId, amount);
      const exp = categories.expenses.find((e: any) => e.id === expenseId);
      showSuccess(`₱${parsed.toLocaleString(undefined, { minimumFractionDigits: 2 })} transferred to ${exp?.name}!`);
    } else {
      if (!expenseId) return showError('Please add a wallet bucket first.');
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
      <div className="relative flex bg-[#EBEED5] rounded-2xl p-1 shadow-inner border border-[#B1B4C8]/30">
        <div
          className={`absolute top-1 bottom-1 w-1/3 rounded-xl transition-all duration-300 ease-out shadow-md ${type === 'INCOME' ? 'left-1 bg-[#B0C49C]' : type === 'TRANSFER' ? 'left-[33.3%] bg-[#7A70BA]' : 'left-[65.6%] w-[33%] bg-[#41386B]'
            }`}
        />
        <button onClick={() => handleTabChange('INCOME')} className={`relative z-10 flex-1 flex items-center justify-center py-3 rounded-xl text-sm font-bold transition-colors duration-300 ${type === 'INCOME' ? 'text-[#41386B]' : 'text-[#7A70BA] hover:text-[#41386B]'}`}>
          LOG INCOME
        </button>
        <button onClick={() => handleTabChange('TRANSFER')} className={`relative z-10 flex-1 flex items-center justify-center py-3 rounded-xl text-sm font-bold transition-colors duration-300 ${type === 'TRANSFER' ? 'text-white' : 'text-[#7A70BA] hover:text-[#41386B]'}`}>
          TRANSFER
        </button>
        <button onClick={() => handleTabChange('EXPENSE')} className={`relative z-10 flex-1 flex items-center justify-center py-3 rounded-xl text-sm font-bold transition-colors duration-300 ${type === 'EXPENSE' ? 'text-white' : 'text-[#7A70BA] hover:text-[#41386B]'}`}>
          LOG EXPENSE
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-[#B1B4C8]/30 p-6 lg:p-8">
        <p className="text-xs uppercase tracking-widest font-bold text-[#B1B4C8] mb-6">
          {type === 'INCOME' ? 'New Income Entry — auto-distributes' : type === 'TRANSFER' ? 'Assign Unallocated Funds to a Wallet' : 'New Expense — deducts from wallet'}
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          {type === 'INCOME' ? (
            <div>
              <label className="block text-sm font-bold text-[#41386B] mb-2">Income Source</label>
              <div className="flex gap-2">
                <select value={source} onChange={(e) => setSource(e.target.value)} className="flex-1 p-3 bg-white border border-[#B1B4C8] rounded-xl text-[#41386B] font-bold focus:ring-2 focus:ring-[#7A70BA] outline-none transition">
                  {categories.income.map((inc: string) => <option key={inc} value={inc}>{inc}</option>)}
                  {categories.income.length === 0 && <option value="" disabled>No sources available</option>}
                </select>
                <button type="button" onClick={handleAddSource} className="px-4 bg-[#EBEED5] text-[#41386B] font-bold rounded-xl border border-[#B1B4C8] hover:bg-[#B0C49C]">+ Add</button>
                <button type="button" onClick={handleRemoveSource} className="px-4 bg-rose-50 text-rose-600 font-bold rounded-xl border border-rose-200 hover:bg-rose-100">Del</button>
              </div>
            </div>
          ) : (
            <div>
              <label className="block text-sm font-bold text-[#41386B] mb-2">{type === 'TRANSFER' ? 'Target Wallet' : 'Expense Category'}</label>
              <select value={expenseId} onChange={(e) => setExpenseId(e.target.value)} className="w-full p-3 bg-white border border-[#B1B4C8] rounded-xl text-[#41386B] font-bold focus:ring-2 focus:ring-[#7A70BA] outline-none transition">
                {categories.expenses.map((exp: any) => <option key={exp.id} value={exp.id}>{exp.name} — {exp.bank}</option>)}
              </select>
            </div>
          )}

          <div>
            <label className="block text-sm font-bold text-[#41386B] mb-2">Amount (₱)</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#7A70BA] font-bold text-lg">₱</span>
              <input type="number" step="0.01" min="0" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" className="w-full pl-9 pr-4 py-3 bg-white border border-[#B1B4C8] rounded-xl text-[#41386B] font-bold text-lg focus:ring-2 focus:ring-[#7A70BA] outline-none transition" />
              {type === 'TRANSFER' && (
                <button type="button" onClick={() => setAmount(String(balances.unallocated || 0))} className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-[#7A70BA] bg-[#EBEED5] px-2 py-1 rounded hover:bg-[#B0C49C]">MAX</button>
              )}
            </div>
            {type === 'TRANSFER' && <p className="text-xs font-bold text-[#7A70BA] mt-2">Available to assign: ₱{(balances.unallocated || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>}
          </div>

          {/* INCOME SETTINGS (Exclusions & Force Include) */}
          {type === 'INCOME' && categories.expenses.length > 0 && (
            <div className="bg-[#EBEED5]/30 p-4 rounded-xl border border-[#B1B4C8]/30">
              <label className="block text-xs font-bold text-[#7A70BA] uppercase tracking-wider mb-3">Distribution Preferences</label>

              {/* Force Include Paid Fixed Checkbox */}
              <label className="flex items-start gap-3 p-3 mb-4 bg-white rounded-lg border border-[#B1B4C8]/50 cursor-pointer transition-colors hover:bg-gray-50">
                <div className="relative flex items-center mt-0.5">
                  <input type="checkbox" checked={includePaidFixed} onChange={(e) => setIncludePaidFixed(e.target.checked)} className="peer appearance-none w-5 h-5 border-2 border-[#B1B4C8] rounded checked:bg-[#7A70BA] checked:border-[#7A70BA] transition-all cursor-pointer" />
                  <svg className="absolute w-3.5 h-3.5 pointer-events-none hidden peer-checked:block text-white top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                </div>
                <div>
                  <span className="text-sm font-bold text-[#41386B]">Include Fully-Funded Monthly Bills</span>
                  <p className="text-xs text-[#7A70BA] font-medium mt-0.5">Continue distributing funds to your "Once a Month" fixed bills even if they have already received their allocation for the current month.</p>
                </div>
              </label>

              <p className="text-xs font-bold text-[#7A70BA] uppercase tracking-wider mb-2 mt-4 border-t border-[#B1B4C8]/30 pt-4">Exclude specific wallets (Optional)</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {categories.expenses.map((exp: any) => (
                  <label key={exp.id} className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors border ${excludedIds.includes(exp.id) ? 'bg-white border-[#7A70BA]' : 'hover:bg-white border-transparent'}`}>
                    <div className="relative flex items-center">
                      <input type="checkbox" checked={excludedIds.includes(exp.id)} onChange={() => toggleExclude(exp.id)} className="peer appearance-none w-5 h-5 border-2 border-[#B1B4C8] rounded checked:bg-[#7A70BA] checked:border-[#7A70BA] transition-all cursor-pointer" />
                      <svg className="absolute w-3.5 h-3.5 pointer-events-none hidden peer-checked:block text-white top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                    </div>
                    <span className={`text-sm font-bold ${excludedIds.includes(exp.id) ? 'text-[#41386B]' : 'text-[#7A70BA]'}`}>{exp.name}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {type === 'EXPENSE' && (
            <div>
              <label className="block text-sm font-bold text-[#41386B] mb-2">Description / Note</label>
              <input type="text" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What was this for? e.g. Dinner date" className="w-full p-3 bg-white border border-[#B1B4C8] rounded-xl text-[#41386B] font-semibold focus:ring-2 focus:ring-[#7A70BA] outline-none transition" />
            </div>
          )}

          {successMsg && <div className="text-[#41386B] bg-[#B0C49C] border border-[#EBEED5] rounded-xl px-4 py-3 text-sm font-bold animate-pulse">SUCCESS: {successMsg}</div>}
          {errorMsg && <div className="text-white bg-rose-500 rounded-xl px-4 py-3 text-sm font-bold">ERROR: {errorMsg}</div>}

          <button type="submit" className={`w-full py-4 mt-2 rounded-xl text-white font-bold text-sm tracking-widest uppercase shadow-md transition-all duration-200 ${type === 'INCOME' ? 'bg-[#B0C49C] hover:bg-[#7A70BA]' : type === 'TRANSFER' ? 'bg-[#7A70BA] hover:bg-[#41386B]' : 'bg-[#41386B] hover:bg-[#7A70BA]'}`}>
            {type === 'INCOME' ? 'Distribute Income' : type === 'TRANSFER' ? 'Transfer Funds' : 'Log Expense'}
          </button>

          {/* DISTRIBUTE EQUALLY OPTION (WITH EXCLUSIONS & FORCE INCLUDE) */}
          {type === 'TRANSFER' && (balances.unallocated || 0) > 0 && (
            <div className="mt-4 pt-5 border-t border-[#B1B4C8]/30 space-y-4">
              <p className="text-xs font-bold text-[#B1B4C8] uppercase tracking-wider text-center">OR</p>

              {categories.expenses.length > 0 && (
                <div className="bg-[#EBEED5]/30 p-4 rounded-xl border border-[#B1B4C8]/30">
                  <label className="block text-xs font-bold text-[#7A70BA] uppercase tracking-wider mb-3">Distribution Preferences</label>

                  {/* Force Include Paid Fixed Checkbox */}
                  <label className="flex items-start gap-3 p-3 mb-4 bg-white rounded-lg border border-[#B1B4C8]/50 cursor-pointer transition-colors hover:bg-gray-50">
                    <div className="relative flex items-center mt-0.5">
                      <input type="checkbox" checked={includePaidFixed} onChange={(e) => setIncludePaidFixed(e.target.checked)} className="peer appearance-none w-5 h-5 border-2 border-[#B1B4C8] rounded checked:bg-[#7A70BA] checked:border-[#7A70BA] transition-all cursor-pointer" />
                      <svg className="absolute w-3.5 h-3.5 pointer-events-none hidden peer-checked:block text-white top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                    </div>
                    <div>
                      <span className="text-sm font-bold text-[#41386B]">Include Fully-Funded Monthly Bills</span>
                      <p className="text-xs text-[#7A70BA] font-medium mt-0.5">Continue distributing funds to your "Once a Month" fixed bills even if they have already received their allocation for the current month.</p>
                    </div>
                  </label>

                  <p className="text-xs font-bold text-[#7A70BA] uppercase tracking-wider mb-2 mt-4 border-t border-[#B1B4C8]/30 pt-4">Exclude specific wallets (Optional)</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {categories.expenses.map((exp: any) => (
                      <label key={exp.id} className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors border ${excludedIds.includes(exp.id) ? 'bg-white border-[#7A70BA]' : 'hover:bg-white border-transparent'}`}>
                        <div className="relative flex items-center">
                          <input type="checkbox" checked={excludedIds.includes(exp.id)} onChange={() => toggleExclude(exp.id)} className="peer appearance-none w-5 h-5 border-2 border-[#B1B4C8] rounded checked:bg-[#7A70BA] checked:border-[#7A70BA] transition-all cursor-pointer" />
                          <svg className="absolute w-3.5 h-3.5 pointer-events-none hidden peer-checked:block text-white top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                        </div>
                        <span className={`text-sm font-bold ${excludedIds.includes(exp.id) ? 'text-[#41386B]' : 'text-[#7A70BA]'}`}>{exp.name}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              <button
                type="button"
                onClick={handleDistributeEqually}
                className="w-full py-4 rounded-xl text-[#41386B] font-bold text-sm tracking-widest uppercase shadow-sm border-2 border-[#B0C49C] bg-[#EBEED5] hover:bg-[#B0C49C] transition-all duration-200"
              >
                Distribute Equally
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}