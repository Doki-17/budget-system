import React, { useState } from 'react';
import { useBudgetStore, type AuditLog } from '../store/useBudgetStore';

function BreakdownDetails({ log }: { log: AuditLog }) {
  const [open, setOpen] = React.useState(false);
  if (!log.breakdown?.length) return null;
  return (
    <div className="mt-2">
      <button type="button" onClick={() => setOpen(o => !o)} className="flex items-center gap-1 text-xs text-[#7A70BA] hover:text-[#41386B] font-bold transition-colors">
        {open ? '[-] Hide' : '[+] Show'} distribution breakdown
      </button>
      {open && (
        <div className="mt-2 space-y-1 pl-3 border-l-2 border-[#7A70BA]">
          {log.breakdown!.map((item, i) => (
            <div key={i} className="flex items-center justify-between text-xs text-[#41386B]">
              <span className="font-semibold">{item.name}</span>
              <span className="font-bold">₱{item.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
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
    <div className="group flex items-start gap-4 p-5 hover:bg-[#EBEED5]/30 transition-colors rounded-xl">
      <div className={`mt-0.5 flex-shrink-0 px-3 py-1 rounded-full text-xs font-bold ${isIncome ? 'bg-[#B0C49C] text-[#41386B]' : isTransfer ? 'bg-[#7A70BA] text-white' : 'bg-[#41386B] text-white'
        }`}
      >
        {isIncome ? 'IN' : isTransfer ? 'MOVE' : 'OUT'}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-baseline justify-between gap-2">
          <p className="font-bold text-[#41386B] truncate">{log.source}</p>
          <p className={`flex-shrink-0 text-base font-bold ${isIncome || isTransfer ? 'text-[#7A70BA]' : 'text-[#41386B]'}`}>
            {isIncome || isTransfer ? '+' : '-'}₱{log.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </p>
        </div>

        <div className="flex items-center flex-wrap gap-2 mt-1.5">
          <span className="text-xs font-semibold text-[#B1B4C8]">{log.date}</span>
          {log.description && (
            <span className="text-xs text-[#7A70BA] font-medium italic">— {log.description}</span>
          )}
          {log.bank && (
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-[#B1B4C8]/20 text-[#41386B]">
              {log.bank}
            </span>
          )}
          {isIncome && (
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-[#EBEED5] text-[#7A70BA]">
              Auto-distributed
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
  const itemsPerPage = 5;
  const totalPages = Math.ceil(auditLogs.length / itemsPerPage) || 1;

  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentLogs = auditLogs.slice(startIndex, startIndex + itemsPerPage);

  const handleNext = () => { if (currentPage < totalPages) setCurrentPage(p => p + 1); };
  const handlePrev = () => { if (currentPage > 1) setCurrentPage(p => p - 1); };

  return (
    <div className="space-y-6">
      {auditLogs.length > 0 && (
        <div className="flex gap-4 flex-wrap">
          <div className="bg-[#B0C49C] text-[#41386B] px-4 py-2 rounded-xl text-sm font-bold shadow-sm">
            {incomeCount} Income Logs
          </div>
          <div className="bg-[#41386B] text-[#EBEED5] px-4 py-2 rounded-xl text-sm font-bold shadow-sm">
            {expenseCount} Expense Logs
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-sm border border-[#B1B4C8]/30 overflow-hidden">
        {auditLogs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-[#B1B4C8] gap-3">
            <p className="font-bold text-sm">No transactions yet. Log one to get started!</p>
          </div>
        ) : (
          <>
            <div className="divide-y divide-[#B1B4C8]/20 p-2">
              {currentLogs.map((log) => (
                <LogRow key={log.id} log={log} />
              ))}
            </div>

            {/* PAGINATION CONTROLS */}
            <div className="p-4 border-t border-[#B1B4C8]/30 bg-[#EBEED5]/30 flex items-center justify-between">
              <button
                onClick={handlePrev}
                disabled={currentPage === 1}
                className="px-4 py-2 rounded-lg text-sm font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed bg-[#41386B] text-white hover:bg-[#7A70BA]"
              >
                Previous
              </button>

              <span className="text-sm font-bold text-[#41386B]">
                Page {currentPage} of {totalPages}
              </span>

              <button
                onClick={handleNext}
                disabled={currentPage === totalPages}
                className="px-4 py-2 rounded-lg text-sm font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed bg-[#41386B] text-white hover:bg-[#7A70BA]"
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