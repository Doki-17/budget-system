import { create } from 'zustand';
import { supabase } from '../utils/supabase';

// --- TYPES ---
export type BankName = string;
export type FrequencyType = 'monthly' | 'per-income';
export type ExpenseType = 'fixed' | 'variable';
export type LogType = 'INCOME' | 'EXPENSE' | 'TRANSFER';
export type PriorityLevel = 'High' | 'Medium' | 'Low';

export interface DistributionItem { name: string; amount: number; bank: BankName; }

export interface Expense {
  id: string;
  name: string;
  type: ExpenseType;
  bank: BankName;
  frequency: FrequencyType;
  lastAllocatedMonth: string | null;
  paidMonths: string[];
  priority: PriorityLevel;
  amount?: number;
  percentage?: number;
}

export interface AuditLog {
  id: string;
  date: string;
  type: LogType;
  source: string;
  amount: number;
  breakdown?: DistributionItem[];
  bank?: BankName;
  description?: string;
}

export interface Balances {
  unallocated: number;
  [key: string]: number;
}

export interface CategoryState {
  income: string[];
  banks: string[];
  expenses: Expense[];
}

export interface BudgetState {
  isLoading: boolean;
  categories: CategoryState;
  balances: Balances;
  auditLogs: AuditLog[];

  fetchData: () => Promise<void>;
  logIncome: (source: string, rawAmount: string | number, excludedIds?: string[], forceIncludePaidFixed?: boolean, isManual?: boolean) => Promise<void>;
  logExpense: (expenseId: string, amountUsed: string | number, description: string) => Promise<void>;
  transferUnallocated: (toExpenseId: string, amount: string | number) => Promise<void>;
  distributeUnallocatedEqually: (excludedIds?: string[], forceIncludePaidFixed?: boolean) => Promise<void>;
  markAsPaid: (expenseId: string, monthKey: string) => Promise<void>;

  addExpense: (expense: Expense) => Promise<void>;
  updateExpense: (id: string, updatedExpense: Partial<Expense>) => Promise<void>;
  deleteExpense: (id: string) => Promise<void>;
  addBank: (bank: string) => Promise<void>;
  addIncomeSource: (source: string) => Promise<void>;
  removeIncomeSource: (source: string) => Promise<void>;

  user: any;
  checkAuth: () => Promise<void>;
  login: (email: string, pass: string) => Promise<{ error: string | null }>;
  logout: () => Promise<void>;
}

// --- HELPERS ---
const getCurrentMonth = (): string => {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
};

// --- STORE ---
export const useBudgetStore = create<BudgetState>((set, get) => ({
  isLoading: true,
  categories: { income: [], banks: [], expenses: [] },
  balances: { unallocated: 0 },
  auditLogs: [],

  // --- 1. INITIALIZE FETCH ---
  fetchData: async () => {
    set({ isLoading: true });
    try {
      const [banksRes, sourcesRes, sysRes, walletsRes, logsRes] = await Promise.all([
        supabase.from('target_banks').select('name'),
        supabase.from('income_sources').select('name'),
        supabase.from('system_balances').select('unallocated').eq('id', 1).maybeSingle(),
        supabase.from('wallets').select('*'),
        supabase.from('audit_logs').select('*').order('created_at', { ascending: false })
      ]);

      const dbBanks = banksRes.data?.map(b => b.name) || [];
      const dbSources = sourcesRes.data?.map(s => s.name) || [];
      const unallocated = sysRes.data?.unallocated || 0;

      const dbWallets = walletsRes.data || [];
      const dbLogs = logsRes.data || [];

      const formattedExpenses: Expense[] = dbWallets.map(w => ({
        id: w.id,
        name: w.name,
        type: w.type as ExpenseType,
        bank: w.bank,
        frequency: w.frequency as FrequencyType,
        priority: w.priority as PriorityLevel,
        amount: w.amount,
        percentage: w.percentage,
        lastAllocatedMonth: w.last_allocated_month,
        paidMonths: w.paid_months || []
      }));

      const dynamicBalances: Balances = { unallocated: Number(unallocated) };
      dbWallets.forEach(w => { dynamicBalances[w.id] = Number(w.balance); });

      set({
        categories: {
          income: dbSources,
          banks: dbBanks,
          expenses: formattedExpenses
        },
        balances: dynamicBalances,
        auditLogs: dbLogs.map(l => ({ ...l, amount: Number(l.amount) })),
        isLoading: false
      });
    } catch (error) {
      console.error('Error fetching data:', error);
      set({ isLoading: false });
    }
  },

  // --- 2. GLOBAL SETTINGS CRUD ---
  addBank: async (bank) => {
    const { categories } = get();
    await supabase.from('target_banks').insert([{ name: bank }]);
    set({ categories: { ...categories, banks: [...categories.banks, bank] } });
  },

  addIncomeSource: async (source) => {
    const { categories } = get();
    await supabase.from('income_sources').insert([{ name: source }]);
    set({ categories: { ...categories, income: [...categories.income, source] } });
  },

  removeIncomeSource: async (source) => {
    const { categories } = get();
    await supabase.from('income_sources').delete().eq('name', source);
    set({ categories: { ...categories, income: categories.income.filter(i => i !== source) } });
  },

  // --- 3. WALLET CRUD ---
  addExpense: async (expense) => {
    const { data, error } = await supabase.from('wallets').insert([{
      name: expense.name, type: expense.type, bank: expense.bank, frequency: expense.frequency,
      priority: expense.priority, amount: expense.amount || 0, percentage: expense.percentage || 0, balance: 0
    }]).select().single();

    if (error || !data) return console.error(error);
    const newExp = { ...expense, id: data.id, paidMonths: [] };
    set(state => ({
      categories: { ...state.categories, expenses: [...state.categories.expenses, newExp] },
      balances: { ...state.balances, [data.id]: 0 }
    }));
  },

  updateExpense: async (id, updated) => {
    await supabase.from('wallets').update({
      name: updated.name, type: updated.type, bank: updated.bank, frequency: updated.frequency,
      priority: updated.priority, amount: updated.amount, percentage: updated.percentage
    }).eq('id', id);

    set(state => ({ categories: { ...state.categories, expenses: state.categories.expenses.map(e => e.id === id ? { ...e, ...updated } : e) } }));
  },

  deleteExpense: async (id) => {
    await supabase.from('wallets').delete().eq('id', id);
    set(state => {
      const newExpenses = state.categories.expenses.filter(e => e.id !== id);
      const newBalances = { ...state.balances }; delete newBalances[id];
      return { categories: { ...state.categories, expenses: newExpenses }, balances: newBalances };
    });
  },

  // --- 4. CORE LOGIC ---
  logIncome: async (source, rawAmount, excludedIds = [], forceIncludePaidFixed = false, isManual = false) => {
    const { categories, balances } = get();
    const currentMonth = getCurrentMonth();
    const incomeAmount = parseFloat(String(rawAmount));

    let remainingBalance = incomeAmount;
    const distributionLog: DistributionItem[] = [];
    const newBalances: Balances = { ...balances };

    // MANUAL MODE
    if (isManual) {
      newBalances.unallocated = (newBalances.unallocated || 0) + remainingBalance;
      distributionLog.push({ name: 'Unallocated Funds', amount: remainingBalance, bank: 'System' });

      await Promise.all([
        supabase.from('system_balances').update({ unallocated: newBalances.unallocated }).eq('id', 1),
        supabase.from('audit_logs').insert({
          date: new Date().toLocaleDateString('en-PH'),
          type: 'INCOME',
          source,
          amount: incomeAmount,
          breakdown: distributionLog,
          description: 'Manual Distribution'
        })
      ]);

      await get().fetchData();
      return;
    }

    // AUTO MODE
    const priorityWeight: Record<PriorityLevel, number> = { High: 3, Medium: 2, Low: 1 };

    const sortedExpensesToProcess = [...categories.expenses]
      .filter((exp) => !excludedIds.includes(exp.id))
      .sort((a, b) => {
        const pA = priorityWeight[a.priority] || 0;
        const pB = priorityWeight[b.priority] || 0;
        if (pB !== pA) return pB - pA;
        if (a.type === 'fixed' && b.type === 'variable') return -1;
        if (a.type === 'variable' && b.type === 'fixed') return 1;
        return 0;
      });

    const processedExpenses = sortedExpensesToProcess.map((exp) => {
      if (!forceIncludePaidFixed && exp.frequency === 'monthly' && exp.lastAllocatedMonth === currentMonth) return exp;

      let deduction = 0;
      let newlyAllocatedMonth = exp.lastAllocatedMonth;

      if (exp.type === 'fixed' && exp.amount !== undefined) {
        deduction = exp.amount;
        newlyAllocatedMonth = exp.frequency === 'monthly' ? currentMonth : exp.lastAllocatedMonth;
      } else if (exp.type === 'variable' && exp.percentage !== undefined) {
        deduction = incomeAmount * (exp.percentage / 100);
      }

      if (deduction > remainingBalance) deduction = remainingBalance;

      if (deduction > 0) {
        remainingBalance -= deduction;
        newBalances[exp.id] = (newBalances[exp.id] ?? 0) + deduction;
        distributionLog.push({ name: exp.name, amount: deduction, bank: exp.bank });
      }
      return { ...exp, lastAllocatedMonth: newlyAllocatedMonth };
    });

    if (remainingBalance > 0) {
      newBalances.unallocated = (newBalances.unallocated || 0) + remainingBalance;
      distributionLog.push({ name: 'Unallocated Funds', amount: remainingBalance, bank: 'System' });
    }

    const updatedExpenses = categories.expenses.map(origExp => processedExpenses.find(p => p.id === origExp.id) || origExp);

    // DB Push
    await Promise.all([
      supabase.from('system_balances').update({ unallocated: newBalances.unallocated }).eq('id', 1),
      ...updatedExpenses.map(w => supabase.from('wallets').update({ balance: newBalances[w.id], last_allocated_month: w.lastAllocatedMonth }).eq('id', w.id)),
      supabase.from('audit_logs').insert({ date: new Date().toLocaleDateString('en-PH'), type: 'INCOME', source, amount: incomeAmount, breakdown: distributionLog })
    ]);

    await get().fetchData();
  },

  logExpense: async (expenseId, amountUsed, description) => {
    const { balances, categories } = get();
    const expenseData = categories.expenses.find((e) => e.id === expenseId);
    if (!expenseData) return;

    const newBalance = (balances[expenseId] ?? 0) - parseFloat(String(amountUsed));

    await Promise.all([
      supabase.from('wallets').update({ balance: newBalance }).eq('id', expenseId),
      supabase.from('audit_logs').insert({ date: new Date().toLocaleDateString('en-PH'), type: 'EXPENSE', source: expenseData.name, amount: parseFloat(String(amountUsed)), bank: expenseData.bank, description })
    ]);

    await get().fetchData();
  },

  markAsPaid: async (expenseId, monthKey) => {
    const { balances, categories } = get();
    const expenseData = categories.expenses.find((e) => e.id === expenseId);
    if (!expenseData || !expenseData.amount) return;

    const newBalance = (balances[expenseId] ?? 0) - expenseData.amount;
    const newPaidMonths = [...(expenseData.paidMonths || []), monthKey];

    await Promise.all([
      supabase.from('wallets').update({ balance: newBalance, paid_months: newPaidMonths }).eq('id', expenseId),
      supabase.from('audit_logs').insert({ date: new Date().toLocaleDateString('en-PH'), type: 'EXPENSE', source: expenseData.name, amount: expenseData.amount, bank: expenseData.bank, description: `Quick Paid for ${new Date().toLocaleString('default', { month: 'short' })}` })
    ]);

    await get().fetchData();
  },

  transferUnallocated: async (toExpenseId, amount) => {
    const { balances, categories } = get();
    const expenseData = categories.expenses.find(e => e.id === toExpenseId);
    const parsed = parseFloat(String(amount));
    if (!expenseData || (balances.unallocated || 0) < parsed) return;

    const newUnallocated = balances.unallocated - parsed;
    const newWalletBalance = (balances[toExpenseId] || 0) + parsed;

    await Promise.all([
      supabase.from('system_balances').update({ unallocated: newUnallocated }).eq('id', 1),
      supabase.from('wallets').update({ balance: newWalletBalance }).eq('id', toExpenseId),
      supabase.from('audit_logs').insert({ date: new Date().toLocaleDateString('en-PH'), type: 'TRANSFER', source: 'Unallocated Funds', amount: parsed, bank: expenseData.bank, description: `Transferred to ${expenseData.name}` })
    ]);

    await get().fetchData();
  },

  distributeUnallocatedEqually: async (excludedIds = [], forceIncludePaidFixed = false) => {
    const { balances, categories } = get();
    const currentMonth = getCurrentMonth();
    const unallocated = balances.unallocated || 0;

    if (unallocated <= 0 || categories.expenses.length === 0) return;

    const eligibleExpenses = categories.expenses.filter((exp) => {
      if (excludedIds.includes(exp.id)) return false;
      if (!forceIncludePaidFixed && exp.frequency === 'monthly' && exp.lastAllocatedMonth === currentMonth) return false;
      return true;
    });

    if (eligibleExpenses.length === 0) return;

    const splitAmount = unallocated / eligibleExpenses.length;
    const distributionLog: DistributionItem[] = [];

    const walletUpdates = eligibleExpenses.map(exp => {
      const updatedBalance = (balances[exp.id] || 0) + splitAmount;
      distributionLog.push({ name: exp.name, amount: splitAmount, bank: exp.bank });
      return supabase.from('wallets').update({ balance: updatedBalance }).eq('id', exp.id);
    });

    await Promise.all([
      supabase.from('system_balances').update({ unallocated: 0 }).eq('id', 1),
      ...walletUpdates,
      supabase.from('audit_logs').insert({ date: new Date().toLocaleDateString('en-PH'), type: 'TRANSFER', source: 'Unallocated Funds', amount: unallocated, description: 'Distributed equally to selected wallets', breakdown: distributionLog })
    ]);

    await get().fetchData();
  },

  user: null,

  checkAuth: async () => {
    set({ isLoading: true });
    const { data: { session } } = await supabase.auth.getSession();
    set({ user: session?.user || null });

    if (session?.user) {
      await get().fetchData();
    } else {
      set({ isLoading: false });
    }
  },

  login: async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { error: error.message };

    set({ user: data.user });
    await get().fetchData();
    return { error: null };
  },

  logout: async () => {
    await supabase.auth.signOut();
    set({ user: null, categories: { income: [], banks: [], expenses: [] }, auditLogs: [], balances: { unallocated: 0 } });
  }

}));