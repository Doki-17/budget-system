import { useState } from 'react';
import { useBudgetStore, type Expense, type BankName, type ExpenseType, type FrequencyType, type PriorityLevel } from '../store/useBudgetStore';

interface StatCardProps {
  exp: Expense;
  balance: number;
  onEdit: (exp: Expense) => void;
  onDelete: (id: string) => void;
  onMarkPaid: (id: string, monthKey: string) => void;
}

function StatCard({ exp, balance, onEdit, onDelete, onMarkPaid }: StatCardProps) {
  const isNegative = balance < 0;

  // Date tracking for fixed monthly bills
  const currentMonthKey = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;
  const currentMonthName = new Date().toLocaleString('default', { month: 'short' });

  const isFixed = exp.type === 'fixed';
  const isPaidThisMonth = isFixed && (exp.paidMonths || []).includes(currentMonthKey);

  const priorityColors = {
    High: 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-900/50',
    Medium: 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-900/50',
    Low: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/50',
  };

  return (
    <div className="group relative bg-white dark:bg-slate-800 rounded-3xl overflow-hidden shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] dark:shadow-none hover:shadow-lg dark:hover:shadow-[0_4px_20px_-4px_rgba(0,0,0,0.2)] transition-all duration-300 border border-slate-100 dark:border-slate-700/60 flex flex-col">
      <div className="h-2 bg-teal-500 w-full" />
      <div className="absolute top-4 right-4 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
        <button onClick={() => onEdit(exp)} className="px-3 py-1.5 text-[11px] font-bold bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-600 hover:text-teal-600 dark:hover:text-teal-400 shadow-sm transition-all focus:opacity-100">EDIT</button>
        <button onClick={() => { if (window.confirm(`Delete ${exp.name}?`)) onDelete(exp.id) }} className="px-3 py-1.5 text-[11px] font-bold bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-rose-50 dark:hover:bg-rose-950/50 hover:border-rose-200 dark:hover:border-rose-800/80 hover:text-rose-600 dark:hover:text-rose-400 shadow-sm transition-all focus:opacity-100">DEL</button>
      </div>

      <div className="p-6 flex-1 flex flex-col gap-4">
        <div className="flex items-start justify-between pr-16">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">{exp.name}</p>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${priorityColors[exp.priority || 'Medium']}`}>{exp.priority || 'Medium'}</span>
            </div>
            <p className={`text-3xl font-bold tracking-tight ${isNegative ? 'text-rose-500 dark:text-rose-400' : 'text-slate-800 dark:text-slate-100'}`}>
              {isNegative ? '-' : ''}₱{Math.abs(balance).toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </p>
          </div>
        </div>

        {/* Action / Status Row */}
        <div className="mt-auto flex items-center justify-between pt-5 border-t border-slate-100 dark:border-slate-700/60">
          <span className="text-[11px] font-bold px-2.5 py-1 rounded-md bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400">{exp.bank}</span>

          {/* DYNAMIC FOOTER BASED ON TYPE */}
          {exp.type === 'variable' && exp.percentage !== undefined ? (
            <span className="text-[11px] font-bold text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-900/30 px-2.5 py-1 rounded-md">Gets {exp.percentage}%</span>
          ) : isFixed ? (
            isPaidThisMonth ? (
              <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-900/50 px-2.5 py-1 rounded-md flex items-center gap-1">
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                Paid for {currentMonthName}
              </span>
            ) : (
              <button
                onClick={() => { if (window.confirm(`Mark ₱${exp.amount?.toLocaleString()} as paid for ${currentMonthName}?`)) onMarkPaid(exp.id, currentMonthKey) }}
                className="text-[11px] font-bold text-white bg-teal-600 hover:bg-teal-500 dark:bg-teal-600 dark:hover:bg-teal-500 px-3 py-1.5 rounded-lg shadow-sm shadow-teal-500/20 dark:shadow-none transition-all"
              >
                Pay for {currentMonthName}
              </button>
            )
          ) : exp.amount !== undefined ? (
            <span className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/30 px-2.5 py-1 rounded-md">₱{exp.amount.toLocaleString()}/mo</span>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { balances, categories, auditLogs, addExpense, updateExpense, deleteExpense, addBank, markAsPaid } = useBudgetStore() as any;
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editItem, setEditItem] = useState<Expense | null>(null);

  const [name, setName] = useState('');
  const [bank, setBank] = useState<BankName>(categories.banks?.[0] || 'GCash');
  const [type, setType] = useState<ExpenseType>('variable');
  const [frequency, setFrequency] = useState<FrequencyType>('per-income');
  const [priority, setPriority] = useState<PriorityLevel>('Medium');
  const [val, setVal] = useState<string>('');

  const totalBalance = Object.entries(balances).filter(([key]) => key !== 'unallocated').reduce((sum, [_, val]) => sum + Number(val), 0);
  const totalIncome = auditLogs.filter((l: any) => l.type === 'INCOME').reduce((s: number, l: any) => s + l.amount, 0);
  const totalExpenses = auditLogs.filter((l: any) => l.type === 'EXPENSE').reduce((s: number, l: any) => s + l.amount, 0);

  const totalAllocatedPercentage = categories.expenses.filter((e: any) => e.type === 'variable').reduce((sum: number, curr: any) => sum + (curr.percentage || 0), 0);
  const currentItemPercentage = editItem?.type === 'variable' ? (editItem.percentage || 0) : 0;
  const inputPercentage = type === 'variable' ? (parseFloat(val) || 0) : 0;
  const projectedPercentage = totalAllocatedPercentage - currentItemPercentage + inputPercentage;
  const isOverBudget = projectedPercentage > 100;

  const handleAddBank = () => {
    const newBank = window.prompt("Enter new bank/wallet name:");
    if (newBank && newBank.trim() !== '') {
      if (addBank) addBank(newBank.trim());
      setBank(newBank.trim());
    }
  };

  const openModal = (item?: Expense) => {
    if (item) {
      setEditItem(item); setName(item.name); setBank(item.bank); setType(item.type); setFrequency(item.frequency); setPriority(item.priority || 'Medium'); setVal(item.type === 'fixed' ? String(item.amount || '') : String(item.percentage || ''));
    } else {
      setEditItem(null); setName(''); setBank(categories.banks?.[0] || 'GCash'); setType('variable'); setFrequency('per-income'); setPriority('Medium'); setVal('');
    }
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (type === 'variable' && isOverBudget) return alert("Exceeds 100%!");
    const numVal = parseFloat(val);
    const payload: Expense = {
      id: editItem ? editItem.id : `cat_${Date.now()}`, name, type, bank, frequency: type === 'fixed' ? 'monthly' : 'per-income', priority, lastAllocatedMonth: editItem ? editItem.lastAllocatedMonth : null, paidMonths: editItem ? editItem.paidMonths : [], amount: type === 'fixed' ? numVal : undefined, percentage: type === 'variable' ? numVal : undefined,
    };
    editItem ? updateExpense(editItem.id, payload) : addExpense(payload);
    setIsModalOpen(false);
  };

  const priorityWeight = { High: 3, Medium: 2, Low: 1 };
  const sortedExpenses = [...categories.expenses].sort((a, b) => (priorityWeight[b.priority as PriorityLevel] || 0) - (priorityWeight[a.priority as PriorityLevel] || 0));

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-teal-600 dark:bg-emerald-900/50 text-white rounded-3xl p-6 shadow-md shadow-teal-600/10 dark:shadow-none border-b-4 border-teal-700 dark:border-emerald-800">
          <p className="text-[11px] font-bold uppercase tracking-wider opacity-80">Total Savings</p>
          <p className="text-3xl font-bold mt-1.5">₱{(totalBalance + (balances.unallocated || 0)).toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
        </div>
        <div className="bg-indigo-50 dark:bg-indigo-950/30 text-indigo-900 dark:text-indigo-100 rounded-3xl p-6 shadow-sm border border-indigo-100 dark:border-indigo-900/50">
          <p className="text-[11px] font-bold uppercase tracking-wider text-indigo-500 dark:text-indigo-400">Total Incoming</p>
          <p className="text-3xl font-bold mt-1.5">₱{totalIncome.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
        </div>
        <div className="bg-rose-50 dark:bg-rose-950/30 text-rose-900 dark:text-rose-100 rounded-3xl p-6 shadow-sm border border-rose-100 dark:border-rose-900/50">
          <p className="text-[11px] font-bold uppercase tracking-wider text-rose-500 dark:text-rose-400">Total Outgoing</p>
          <p className="text-3xl font-bold mt-1.5">₱{totalExpenses.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
        </div>
      </div>

      {(balances.unallocated || 0) > 0 && (
        <div className="bg-gradient-to-r from-teal-50 to-emerald-50 dark:from-teal-950/40 dark:to-emerald-950/40 border border-teal-100 dark:border-teal-900/50 rounded-3xl p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between shadow-sm gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-teal-600 dark:text-teal-400 flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
              Available to Budget
            </p>
            <p className="text-4xl font-bold text-teal-800 dark:text-teal-300 mt-2 tracking-tight">₱{balances.unallocated.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
          </div>
          <div className="text-left sm:text-right bg-white dark:bg-slate-800/80 px-4 py-3 rounded-xl shadow-sm border border-teal-100 dark:border-teal-900/60">
            <p className="text-sm font-bold text-slate-700 dark:text-slate-200">You have extra money!</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Go to 'Add Activity' &gt; 'Move'</p>
          </div>
        </div>
      )}

      <div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">My Envelopes</h3>
          <div className="flex items-center gap-3">
            <span className={`text-[11px] font-bold px-3 py-1.5 rounded-lg border ${totalAllocatedPercentage > 100 ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-900' : 'bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700'}`}>
              Splits: {totalAllocatedPercentage}% / 100%
            </span>
            <button onClick={() => openModal()} className="text-sm font-bold text-white bg-slate-800 dark:bg-teal-600 hover:bg-teal-600 dark:hover:bg-teal-500 px-5 py-2.5 rounded-xl transition-all shadow-sm shadow-slate-200 dark:shadow-none">
              + New Envelope
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {sortedExpenses.map((exp: any) => (
            <StatCard key={exp.id} exp={exp} balance={balances[exp.id] ?? 0} onEdit={openModal} onDelete={deleteExpense} onMarkPaid={markAsPaid} />
          ))}
          
          {categories.expenses.length === 0 && (
             <div className="col-span-full py-16 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-3xl flex flex-col items-center justify-center text-center">
                 <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800/50 rounded-full flex items-center justify-center mb-4">
                     <svg className="w-8 h-8 text-slate-300 dark:text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>
                 </div>
                 <h4 className="text-sm font-bold text-slate-700 dark:text-slate-200">No Envelopes Yet</h4>
                 <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm">Create an envelope to start organizing where your money goes automatically.</p>
                 <button onClick={() => openModal()} className="mt-4 text-xs font-bold text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-900/30 px-4 py-2 flex items-center gap-1 rounded-lg border border-teal-100 dark:border-teal-900/50 hover:bg-teal-100 dark:hover:bg-teal-900/60 transition-colors">
                    + Add Your First Envelope
                 </button>
             </div>
          )}
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-800/40 dark:bg-slate-950/80 backdrop-blur-sm p-4 overflow-y-auto pt-20 pb-20">
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-xl w-full max-w-md overflow-hidden border border-slate-200 dark:border-slate-800 my-auto">
            <div className="flex justify-between items-center p-5 border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-950/50">
              <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">{editItem ? 'Edit Envelope' : 'New Envelope'}</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-xs font-bold text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 px-2.5 py-1.5 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm transition-colors">Close</button>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Envelope Name</label>
                <input type="text" required value={name} onChange={(e) => setName(e.target.value)} className="w-full p-3.5 bg-slate-50 dark:bg-slate-950 hover:bg-slate-100 dark:hover:bg-slate-900 focus:bg-white dark:focus:bg-slate-900 border text-sm border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500 dark:focus:border-teal-500 outline-none font-medium text-slate-800 dark:text-slate-100 transition-all box-border" placeholder="e.g. Groceries, Car Fund" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Stored In</label>
                  <div className="flex gap-2">
                    <select value={bank} onChange={(e) => setBank(e.target.value as BankName)} className="flex-1 p-3.5 bg-slate-50 dark:bg-slate-950 hover:bg-slate-100 dark:hover:bg-slate-900 focus:bg-white dark:focus:bg-slate-900 border text-sm border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500 dark:focus:border-teal-500 outline-none font-medium text-slate-800 dark:text-slate-100 transition-all box-border">
                      {(categories.banks || ['GCash', 'BPI', 'PayMaya', 'WISE']).map((b: string) => <option key={b} value={b}>{b}</option>)}
                    </select>
                    <button type="button" onClick={handleAddBank} className="px-3 bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-bold rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 shadow-sm">+</button>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Importance</label>
                  <select value={priority} onChange={(e) => setPriority(e.target.value as PriorityLevel)} className="w-full p-3.5 bg-slate-50 dark:bg-slate-950 hover:bg-slate-100 dark:hover:bg-slate-900 focus:bg-white dark:focus:bg-slate-900 border text-sm border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500 dark:focus:border-teal-500 outline-none font-medium text-slate-800 dark:text-slate-100 transition-all box-border">
                    <option value="High">High Priority</option>
                    <option value="Medium">Medium Priority</option>
                    <option value="Low">Low Priority</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">How to deduct</label>
                  <select value={type} onChange={(e) => setType(e.target.value as ExpenseType)} className="w-full p-3.5 bg-slate-50 dark:bg-slate-950 hover:bg-slate-100 dark:hover:bg-slate-900 focus:bg-white dark:focus:bg-slate-900 border text-sm border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500 dark:focus:border-teal-500 outline-none font-medium text-slate-800 dark:text-slate-100 transition-all box-border">
                    <option value="variable">Percentage (%)</option>
                    <option value="fixed">Fixed Amount (₱)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">{type === 'variable' ? 'Take %' : 'Take ₱'}</label>
                  <input type="number" required step="0.01" min="0" value={val} onChange={(e) => setVal(e.target.value)} className="w-full p-3.5 bg-slate-50 dark:bg-slate-950 hover:bg-slate-100 dark:hover:bg-slate-900 focus:bg-white dark:focus:bg-slate-900 border text-sm border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500 dark:focus:border-teal-500 outline-none font-medium text-slate-800 dark:text-slate-100 transition-all box-border" placeholder={type === 'variable' ? "e.g. 15" : "e.g. 1000"} />
                </div>
              </div>
              {type === 'variable' && (
                <div className={`p-4 rounded-xl border ${isOverBudget ? 'bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-900/50' : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800'}`}>
                  <p className={`text-[11px] font-bold ${isOverBudget ? 'text-rose-600 dark:text-rose-400' : 'text-slate-500 dark:text-slate-400'}`}>
                    Projected Percentage Split: {projectedPercentage}% / 100% {isOverBudget && " ⚠️ Exceeds 100%!"}
                  </p>
                </div>
              )}
              {type === 'fixed' && (
                <div className="p-4 rounded-xl border border-amber-200 dark:border-amber-900/50 bg-amber-50 dark:bg-amber-950/30 flex items-start gap-2.5">
                  <svg className="w-4 h-4 mt-0.5 shrink-0 text-amber-500 dark:text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  <p className="text-[11px] font-semibold text-amber-700 dark:text-amber-400 leading-relaxed">Half of the set amount is automatically funded into this envelope each time you log income. Hit <strong>Pay for [Month]</strong> on the card once the full amount is ready to mark it as settled.</p>
                </div>
              )}
              <div className="pt-2 flex gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-3.5 rounded-xl font-bold text-sm text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">Cancel</button>
                <button type="submit" disabled={type === 'variable' && isOverBudget} className={`flex-1 py-3.5 rounded-xl font-bold text-sm text-white shadow-md transition-all ${type === 'variable' && isOverBudget ? 'bg-slate-300 dark:bg-slate-700 shadow-none cursor-not-allowed' : 'bg-teal-600 hover:bg-teal-500 shadow-teal-500/20 dark:shadow-none'}`}>
                  {editItem ? 'Save Updates' : 'Create Envelope'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}