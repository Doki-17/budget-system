import { useState } from 'react';
import { useBudgetStore, type AuditLog } from '../store/useBudgetStore';

function BreakdownDetails({ log }: { log: AuditLog }) {
  const [open, setOpen] = useState(false);
  if (!log.breakdown?.length) return null;
  return (
    <div className="mt-3">
      <button type="button" onClick={() => setOpen(o => !o)} className="flex items-center gap-1.5 text-xs text-indigo-500 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 font-semibold transition-colors border border-transparent focus:outline-none">
        {open ? 'Hide details' : 'Show breakdown details'}
      </button>
      {open && (
        <div className="mt-2.5 space-y-2 pl-3.5 border-l-[3px] border-indigo-100 dark:border-indigo-900/50">
          {log.breakdown!.map((item, i) => (
            <div key={i} className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400">
              <span className="font-medium">{item.name}</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200">₱{item.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function LogRow({ log }: { log: AuditLog }) {
  const isIncome = log.type === 'INCOME';
  const isTransfer = log.type === 'TRANSFER';

  return (
    <div className="group flex items-start gap-4 p-5 sm:px-6 hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors border-b border-slate-100 dark:border-slate-700/60 last:border-0">
      <div className={`mt-0.5 flex-shrink-0 px-3 py-1 rounded-full text-xs font-bold tracking-wide shadow-sm ${isIncome ? 'bg-teal-100 dark:bg-teal-900/40 text-teal-800 dark:text-teal-400' : isTransfer ? 'bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-400' : 'bg-rose-100 dark:bg-rose-900/40 text-rose-700 dark:text-rose-400'
        }`}
      >
        {isIncome ? 'IN' : isTransfer ? 'MOVE' : 'OUT'}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
          <p className="font-bold text-slate-800 dark:text-slate-100 truncate text-base">{log.source}</p>
          <p className={`flex-shrink-0 text-base font-bold ${isIncome ? 'text-teal-600 dark:text-teal-400' : isTransfer ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-800 dark:text-slate-100'}`}>
            {isIncome || isTransfer ? '+' : '-'}₱{log.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </p>
        </div>

        <div className="flex items-center flex-wrap gap-2.5 mt-2">
          <span className="text-xs font-semibold text-slate-400 dark:text-slate-500">{log.date}</span>
          {log.description && (
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium italic truncate max-w-[200px] sm:max-w-md">— {log.description}</span>
          )}
          {log.bank && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
              {log.bank}
            </span>
          )}
        </div>

        {(isIncome || (isTransfer && log.breakdown)) && <BreakdownDetails log={log} />}
      </div>
    </div>
  );
}

export default function History() {
  const { auditLogs } = useBudgetStore();
  const [viewDate, setViewDate] = useState(new Date());
  const [selectedDateStr, setSelectedDateStr] = useState<string | null>(null);

  // Generate date keys format: YYYY-MM-DD for grouping
  const getFmt = (d: Date) => `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
  
  // Group logs by date
  const logsByDate: Record<string, AuditLog[]> = {};
  auditLogs.forEach(log => {
    const d = new Date(log.date);
    const key = getFmt(d);
    if (!logsByDate[key]) logsByDate[key] = [];
    logsByDate[key].push(log);
  });

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = new Date(year, month, 1).getDay();

  const prevMonth = () => setViewDate(new Date(year, month - 1, 1));
  const nextMonth = () => setViewDate(new Date(year, month + 1, 1));

  const days = [];
  for (let i = 0; i < firstDayOfMonth; i++) days.push(null);
  for (let i = 1; i <= daysInMonth; i++) days.push(i);

  // Filter logs for the current viewed month
  const currentMonthLogs = auditLogs.filter(log => {
    const d = new Date(log.date);
    return d.getMonth() === month && d.getFullYear() === year;
  });

  // Calculate Monthly Summaries
  const monthIncome = currentMonthLogs.filter(l => l.type === 'INCOME').reduce((s, l) => s + l.amount, 0);
  const monthExpense = currentMonthLogs.filter(l => l.type === 'EXPENSE').reduce((s, l) => s + l.amount, 0);

  // Filter logs for the list view below the calendar
  const displayLogs = selectedDateStr 
    ? (logsByDate[selectedDateStr] || [])
    : currentMonthLogs;

  // Calculate Daily Summaries (only used when a specific date is clicked)
  const dayIncome = displayLogs.filter(l => l.type === 'INCOME').reduce((s, l) => s + l.amount, 0);
  const dayExpense = displayLogs.filter(l => l.type === 'EXPENSE').reduce((s, l) => s + l.amount, 0);

  return (
    <div className="space-y-6">
      {/* CALENDAR VIEW */}
      <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-sm border border-slate-100 dark:border-slate-700/60">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
          <div>
            <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">Activity Calendar</h2>
            <div className="flex gap-3 mt-1.5 flex-wrap">
              <p className="text-[11px] font-bold uppercase tracking-wider text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-900/20 px-2 py-1 rounded-md border border-teal-100 dark:border-teal-800/50">
                Month Income: ₱{monthIncome.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </p>
              <p className="text-[11px] font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-900/20 px-2 py-1 rounded-md border border-rose-100 dark:border-rose-800/50">
                Month Expense: ₱{monthExpense.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={prevMonth} className="p-2 bg-slate-50 dark:bg-slate-700 hover:bg-slate-100 dark:hover:bg-slate-600 rounded-xl text-slate-600 dark:text-slate-300 transition">&lt;</button>
            <span className="text-sm font-bold w-32 text-center text-slate-700 dark:text-slate-200">
              {viewDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
            </span>
            <button onClick={nextMonth} className="p-2 bg-slate-50 dark:bg-slate-700 hover:bg-slate-100 dark:hover:bg-slate-600 rounded-xl text-slate-600 dark:text-slate-300 transition">&gt;</button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-1 sm:gap-2 text-center">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider pb-2">{day}</div>
          ))}
          
          {days.map((dayNum, i) => {
            if (!dayNum) return <div key={`empty-${i}`} className="h-12 sm:h-16" />;
            
            const cellDate = new Date(year, month, dayNum);
            const dateKey = getFmt(cellDate);
            const isSelected = selectedDateStr === dateKey;
            const isToday = getFmt(new Date()) === dateKey;
            const dayLogs = logsByDate[dateKey] || [];
            
            const hasIncome = dayLogs.some(l => l.type === 'INCOME');
            const hasExpense = dayLogs.some(l => l.type === 'EXPENSE');
            const hasTransfer = dayLogs.some(l => l.type === 'TRANSFER');

            return (
              <button
                key={`day-${dayNum}`}
                onClick={() => setSelectedDateStr(isSelected ? null : dateKey)}
                className={`h-12 sm:h-16 flex flex-col items-center justify-start pt-2 rounded-xl border transition-all ${
                  isSelected 
                    ? 'border-teal-500 bg-teal-50 dark:bg-teal-900/20 shadow-sm' 
                    : isToday 
                    ? 'border-indigo-200 dark:border-indigo-800 bg-indigo-50/50 dark:bg-indigo-900/20 hover:bg-indigo-50 dark:hover:bg-indigo-900/40' 
                    : 'border-slate-100 dark:border-slate-700/60 hover:border-teal-200 dark:hover:border-teal-800/60 hover:bg-slate-50 dark:hover:bg-slate-700/30'
                }`}
              >
                <span className={`text-sm font-bold ${isSelected ? 'text-teal-700 dark:text-teal-400' : isToday ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-600 dark:text-slate-400'}`}>
                  {dayNum}
                </span>
                
                {/* Dots Container */}
                <div className="flex gap-1 mt-1.5">
                  {hasIncome && <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-emerald-500 shadow-sm"></div>}
                  {hasExpense && <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-rose-500 shadow-sm"></div>}
                  {hasTransfer && <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-indigo-500 shadow-sm"></div>}
                </div>
              </button>
            );
          })}
        </div>
        
        {/* Legend */}
        <div className="flex items-center justify-center gap-4 mt-6 pt-4 border-t border-slate-100 dark:border-slate-700/60">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500 dark:text-slate-400"><div className="w-2 h-2 rounded-full bg-emerald-500"></div> Income</div>
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500 dark:text-slate-400"><div className="w-2 h-2 rounded-full bg-rose-500"></div> Expense</div>
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500 dark:text-slate-400"><div className="w-2 h-2 rounded-full bg-indigo-500"></div> Transfer</div>
        </div>
      </div>

      {/* LIST VIEW */}
      <div>
        <div className="flex flex-col sm:flex-row sm:items-start justify-between mb-3 px-2 gap-2">
          <div>
            <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200">
              {selectedDateStr ? `Activity for ${new Date(year, month, parseInt(selectedDateStr.split('-')[2])).toLocaleDateString('en-PH', { month: 'long', day: 'numeric', year: 'numeric' })}` : `All Activity in ${viewDate.toLocaleString('default', { month: 'long', year: 'numeric' })}`}
            </h3>
            {selectedDateStr && (
              <div className="flex gap-3 mt-1.5">
                <p className="text-[11px] font-semibold text-teal-600 dark:text-teal-400">Total Income: ₱{dayIncome.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                <p className="text-[11px] font-semibold text-rose-600 dark:text-rose-400">Total Expense: ₱{dayExpense.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
              </div>
            )}
          </div>
          {selectedDateStr && (
            <button onClick={() => setSelectedDateStr(null)} className="text-xs font-bold text-teal-600 dark:text-teal-400 hover:text-teal-700 dark:hover:text-teal-300 underline mt-1 sm:mt-0">
              View Whole Month
            </button>
          )}
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] dark:shadow-none border border-slate-100 dark:border-slate-700/60 overflow-hidden">
          {displayLogs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-slate-400 dark:text-slate-500 gap-3">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 stroke-slate-300 dark:stroke-slate-600 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <p className="font-semibold text-sm">No activity recorded for this period.</p>
            </div>
          ) : (
            <div className="flex flex-col">
              {displayLogs.map((log) => <LogRow key={log.id} log={log} />)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}