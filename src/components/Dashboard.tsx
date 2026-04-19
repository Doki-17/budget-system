import React, { useState } from 'react';
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
  const currentMonthName = new Date().toLocaleString('default', { month: 'short' }); // e.g. "Apr"

  const isFixedMonthly = exp.type === 'fixed' && exp.frequency === 'monthly';
  const isPaidThisMonth = isFixedMonthly && exp.paidMonths?.includes(currentMonthKey);

  const priorityColors = {
    High: 'bg-rose-100 text-rose-700 border-rose-200',
    Medium: 'bg-amber-100 text-amber-700 border-amber-200',
    Low: 'bg-sky-100 text-sky-700 border-sky-200',
  };

  return (
    <div className="group relative bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 border border-[#B1B4C8]/30 flex flex-col">
      <div className="h-2 bg-[#7A70BA] w-full" />
      <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <button onClick={() => onEdit(exp)} className="px-3 py-1 text-xs font-bold bg-[#EBEED5] rounded-md text-[#41386B] hover:bg-[#B0C49C] shadow-sm">EDIT</button>
        <button onClick={() => { if (window.confirm(`Delete ${exp.name}?`)) onDelete(exp.id) }} className="px-3 py-1 text-xs font-bold bg-[#EBEED5] rounded-md text-[#41386B] hover:bg-rose-300 shadow-sm">DEL</button>
      </div>

      <div className="p-5 flex-1 flex flex-col gap-4">
        <div className="flex items-start justify-between pr-16">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <p className="text-xs font-bold uppercase tracking-widest text-[#B1B4C8]">{exp.name}</p>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${priorityColors[exp.priority || 'Medium']}`}>{exp.priority || 'Medium'}</span>
            </div>
            <p className={`text-3xl font-bold tracking-tight ${isNegative ? 'text-rose-500' : 'text-[#41386B]'}`}>
              {isNegative ? '-' : ''}₱{Math.abs(balance).toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </p>
          </div>
        </div>

        {/* Action / Status Row */}
        <div className="mt-auto flex items-center justify-between pt-4 border-t border-[#B1B4C8]/20">
          <span className="text-xs font-bold px-3 py-1 rounded-full bg-[#B1B4C8]/20 text-[#41386B]">{exp.bank}</span>

          {/* DYNAMIC FOOTER BASED ON TYPE */}
          {exp.type === 'variable' && exp.percentage !== undefined ? (
            <span className="text-xs font-bold text-[#7A70BA]">{exp.percentage}% of income</span>
          ) : isFixedMonthly ? (
            isPaidThisMonth ? (
              <span className="text-xs font-bold text-[#41386B] bg-[#B0C49C] px-2 py-1 rounded-md">✅ {currentMonthName} Paid</span>
            ) : (
              <button
                onClick={() => { if (window.confirm(`Pay ₱${exp.amount} for ${currentMonthName}?`)) onMarkPaid(exp.id, currentMonthKey) }}
                className="text-xs font-bold text-white bg-[#41386B] hover:bg-[#7A70BA] px-3 py-1.5 rounded-md shadow-sm transition-colors"
              >
                Pay {currentMonthName} Bill
              </button>
            )
          ) : exp.amount !== undefined ? (
            <span className="text-xs font-bold text-[#7A70BA]">₱{exp.amount.toLocaleString()}/mo</span>
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
      id: editItem ? editItem.id : `cat_${Date.now()}`, name, type, bank, frequency, priority, lastAllocatedMonth: editItem ? editItem.lastAllocatedMonth : null, paidMonths: editItem ? editItem.paidMonths : [], amount: type === 'fixed' ? numVal : undefined, percentage: type === 'variable' ? numVal : undefined,
    };
    editItem ? updateExpense(editItem.id, payload) : addExpense(payload);
    setIsModalOpen(false);
  };

  const priorityWeight = { High: 3, Medium: 2, Low: 1 };
  const sortedExpenses = [...categories.expenses].sort((a, b) => (priorityWeight[b.priority as PriorityLevel] || 0) - (priorityWeight[a.priority as PriorityLevel] || 0));

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-[#41386B] text-white rounded-2xl p-6 shadow-md border-b-4 border-[#7A70BA]">
          <p className="text-xs font-bold uppercase tracking-widest text-[#B1B4C8]">Total Savings</p>
          <p className="text-3xl font-bold mt-1">₱{(totalBalance + (balances.unallocated || 0)).toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
        </div>
        <div className="bg-[#B0C49C] text-[#41386B] rounded-2xl p-6 shadow-md border-b-4 border-[#EBEED5]">
          <p className="text-xs font-bold uppercase tracking-widest opacity-80">Total Income</p>
          <p className="text-3xl font-bold mt-1">₱{totalIncome.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
        </div>
        <div className="bg-[#7A70BA] text-white rounded-2xl p-6 shadow-md border-b-4 border-[#41386B]">
          <p className="text-xs font-bold uppercase tracking-widest text-[#EBEED5]">Total Spent</p>
          <p className="text-3xl font-bold mt-1">₱{totalExpenses.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
        </div>
      </div>

      {(balances.unallocated || 0) > 0 && (
        <div className="bg-gradient-to-r from-[#B0C49C] to-[#EBEED5] border-2 border-[#7A70BA] rounded-2xl p-5 flex items-center justify-between shadow-md">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-[#41386B]">Unallocated Funds (Ready to Assign)</p>
            <p className="text-3xl font-bold text-[#41386B] mt-1">₱{balances.unallocated.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
          </div>
          <div className="text-right hidden sm:block">
            <p className="text-sm font-bold text-[#41386B]">Extra Money!</p>
            <p className="text-xs text-[#7A70BA]">Go to Log Transaction to transfer</p>
          </div>
        </div>
      )}

      <div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <h3 className="text-sm font-bold uppercase tracking-widest text-[#7A70BA]">Your Wallet Buckets</h3>
          <div className="flex items-center gap-3">
            <span className={`text-xs font-bold px-3 py-1.5 rounded-lg border ${totalAllocatedPercentage > 100 ? 'bg-rose-100 text-rose-700 border-rose-300' : 'bg-[#EBEED5] text-[#41386B] border-[#B0C49C]'}`}>
              Allocated: {totalAllocatedPercentage}% / 100%
            </span>
            <button onClick={() => openModal()} className="text-sm font-bold text-white bg-[#41386B] hover:bg-[#7A70BA] px-5 py-2.5 rounded-lg transition-colors shadow-sm">
              + Add Wallet
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {sortedExpenses.map((exp: any) => (
            <StatCard key={exp.id} exp={exp} balance={balances[exp.id] ?? 0} onEdit={openModal} onDelete={deleteExpense} onMarkPaid={markAsPaid} />
          ))}
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#41386B]/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden border-2 border-[#7A70BA]">
            <div className="flex justify-between items-center p-5 border-b border-[#B1B4C8]/30 bg-[#EBEED5]/50">
              <h2 className="text-lg font-bold text-[#41386B]">{editItem ? 'Edit Wallet' : 'New Wallet Bucket'}</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-sm font-bold text-[#7A70BA] hover:text-[#41386B] px-2 py-1 bg-white rounded-md border border-[#B1B4C8]">X Close</button>
            </div>
            <form onSubmit={handleSave} className="p-5 space-y-5">
              <div>
                <label className="block text-sm font-bold text-[#41386B] mb-1.5">Bucket Name</label>
                <input type="text" required value={name} onChange={(e) => setName(e.target.value)} className="w-full p-3 bg-white border border-[#B1B4C8] rounded-xl focus:ring-2 focus:ring-[#7A70BA] outline-none font-semibold text-[#41386B]" placeholder="e.g. Car Fund" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-[#41386B] mb-1.5">Target Bank</label>
                  <div className="flex gap-2">
                    <select value={bank} onChange={(e) => setBank(e.target.value as BankName)} className="flex-1 p-3 bg-white border border-[#B1B4C8] rounded-xl focus:ring-2 focus:ring-[#7A70BA] outline-none font-semibold text-[#41386B]">
                      {(categories.banks || ['GCash', 'BPI', 'PayMaya', 'WISE']).map((b: string) => <option key={b} value={b}>{b}</option>)}
                    </select>
                    <button type="button" onClick={handleAddBank} className="px-3 bg-[#EBEED5] text-[#41386B] font-bold rounded-xl border border-[#B1B4C8] hover:bg-[#B0C49C]">+</button>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-bold text-[#41386B] mb-1.5">Priority</label>
                  <select value={priority} onChange={(e) => setPriority(e.target.value as PriorityLevel)} className="w-full p-3 bg-white border border-[#B1B4C8] rounded-xl focus:ring-2 focus:ring-[#7A70BA] outline-none font-semibold text-[#41386B]">
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-[#41386B] mb-1.5">Deduction Type</label>
                  <select value={type} onChange={(e) => setType(e.target.value as ExpenseType)} className="w-full p-3 bg-white border border-[#B1B4C8] rounded-xl focus:ring-2 focus:ring-[#7A70BA] outline-none font-semibold text-[#41386B]">
                    <option value="variable">Percentage (%)</option>
                    <option value="fixed">Fixed Amount (₱)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-[#41386B] mb-1.5">{type === 'variable' ? 'Percentage %' : 'Amount ₱'}</label>
                  <input type="number" required step="0.01" min="0" value={val} onChange={(e) => setVal(e.target.value)} className="w-full p-3 bg-white border border-[#B1B4C8] rounded-xl focus:ring-2 focus:ring-[#7A70BA] outline-none font-semibold text-[#41386B]" placeholder={type === 'variable' ? "e.g. 15" : "e.g. 1000"} />
                </div>
              </div>
              {type === 'variable' && (
                <div className={`p-3 rounded-lg border ${isOverBudget ? 'bg-rose-50 border-rose-300' : 'bg-[#EBEED5]/50 border-[#B0C49C]'}`}>
                  <p className={`text-xs font-bold ${isOverBudget ? 'text-rose-600' : 'text-[#41386B]'}`}>
                    Projected Allocation: {projectedPercentage}% / 100% {isOverBudget && " ⚠️ Exceeds 100%!"}
                  </p>
                </div>
              )}
              <div>
                <label className="block text-sm font-bold text-[#41386B] mb-1.5">Frequency</label>
                <select value={frequency} onChange={(e) => setFrequency(e.target.value as FrequencyType)} className="w-full p-3 bg-white border border-[#B1B4C8] rounded-xl focus:ring-2 focus:ring-[#7A70BA] outline-none font-semibold text-[#41386B]">
                  <option value="per-income">Every Income</option>
                  <option value="monthly">Once a Month</option>
                </select>
              </div>
              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-3 rounded-xl font-bold text-[#41386B] bg-[#B1B4C8]/30 hover:bg-[#B1B4C8]/50 transition-colors">Cancel</button>
                <button type="submit" disabled={type === 'variable' && isOverBudget} className={`flex-1 py-3 rounded-xl font-bold text-white transition-colors ${type === 'variable' && isOverBudget ? 'bg-gray-400 cursor-not-allowed' : 'bg-[#41386B] hover:bg-[#7A70BA]'}`}>
                  {editItem ? 'Save Changes' : 'Create Wallet'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}