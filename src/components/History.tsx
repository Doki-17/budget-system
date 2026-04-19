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
      <div className={`mt-0.5 flex-shrink-0 px-3 py-1 rounded-full text-xs font-bold tracking-wide shadow-sm ${isIncome ? 'bg-teal-100 dark:bg-teal-900/40 text-teal-800 dark:text-teal-400' : isTransfer ? 'bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-400' : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-400'
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
          {isIncome && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-teal-50 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400 border border-teal-100 dark:border-teal-800">
              Auto-split
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
  const incomeCount = auditLogs.filter(l => l.type === 'INCOME').length;
  const expenseCount = auditLogs.filter(l => l.type === 'EXPENSE').length;

  // PAGINATION LOGIC
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;
  const totalPages = Math.ceil(auditLogs.length / itemsPerPage) || 1;

  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentLogs = auditLogs.slice(startIndex, startIndex + itemsPerPage);

  const handleNext = () => { if (currentPage < totalPages) setCurrentPage(p => p + 1); };
  const handlePrev = () => { if (currentPage > 1) setCurrentPage(p => p - 1); };

  return (
    <div className="space-y-6">
      {auditLogs.length > 0 && (
        <div className="flex gap-3 flex-wrap">
          <div className="bg-teal-50 dark:bg-teal-900/30 border border-teal-100 dark:border-teal-800 text-teal-700 dark:text-teal-400 px-4 py-2.5 rounded-xl text-sm font-semibold shadow-sm">
            {incomeCount} Income Records
          </div>
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 px-4 py-2.5 rounded-xl text-sm font-semibold shadow-sm">
            {expenseCount} Expense Records
          </div>
        </div>
      )}

      <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] dark:shadow-none border border-slate-100 dark:border-slate-700/60 overflow-hidden">
        {auditLogs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-slate-400 dark:text-slate-500 gap-3">
             <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 stroke-slate-300 dark:stroke-slate-600 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
             </svg>
            <p className="font-semibold text-sm">No activity recorded yet.</p>
          </div>
        ) : (
          <>
            <div className="flex flex-col">
              {currentLogs.map((log) => (
                <LogRow key={log.id} log={log} />
              ))}
            </div>

            {/* PAGINATION CONTROLS */}
            <div className="p-4 border-t border-slate-100 dark:border-slate-700/60 bg-slate-50/50 dark:bg-slate-900/50 flex items-center justify-between">
              <button
                onClick={handlePrev}
                disabled={currentPage === 1}
                className="px-4 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-sm border border-slate-200 dark:border-slate-700/60 disabled:opacity-40 disabled:cursor-not-allowed bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"
              >
                Previous
              </button>

              <span className="text-sm font-semibold text-slate-500 dark:text-slate-400">
                Page {currentPage} of {totalPages}
              </span>

              <button
                onClick={handleNext}
                disabled={currentPage === totalPages}
                className="px-4 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-sm border border-slate-200 dark:border-slate-700/60 disabled:opacity-40 disabled:cursor-not-allowed bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"
              >
                Next
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}