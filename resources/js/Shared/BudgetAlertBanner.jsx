import React from 'react';
import { Link } from 'react-router-dom';
import { useFinance } from '../Store/FinanceContext';
import { fmtIDR } from '../Utils/format';

export default function BudgetAlertBanner() {
    const alerts = useFinance().getBudgetAlerts();

    if (alerts.length === 0) return null;

    const over = alerts.filter((a) => a.level === 'over');
    const warning = alerts.filter((a) => a.level === 'warning');
    const headline = over.length > 0
        ? `${over.length} kategori melebihi batas anggaran!`
        : `${warning.length} kategori mendekati batas anggaran`;

    return (
        <div className={`rounded-2xl p-4 sm:p-5 border flex flex-col gap-3 ${over.length > 0
            ? 'bg-red-50 border-red-200'
            : 'bg-amber-50 border-amber-200'}`}
        >
            <div className="flex items-center gap-2.5">
                <svg className={`w-5 h-5 shrink-0 ${over.length > 0 ? 'text-red-600' : 'text-amber-600'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <span className={`font-bold text-sm ${over.length > 0 ? 'text-red-700' : 'text-amber-700'}`}>{headline}</span>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
                {alerts.slice(0, 4).map((a) => (
                    <div key={a.categoryId} className="flex-1 bg-white/70 rounded-xl px-4 py-3 border border-white min-w-[180px]">
                        <div className="flex justify-between items-center mb-1.5">
                            <span className="text-xs font-bold text-slate-700">{a.name}</span>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${a.level === 'over'
                                ? 'bg-red-100 text-red-700'
                                : 'bg-amber-100 text-amber-700'}`}
                            >
                                {a.pct >= 999 ? '>999' : a.pct}%
                            </span>
                        </div>
                        <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden mb-1.5">
                            <div
                                className={`h-full rounded-full ${a.level === 'over' ? 'bg-red-500' : 'bg-amber-500'}`}
                                style={{ width: `${Math.min(100, a.pct)}%` }}
                            />
                        </div>
                        <p className="text-[11px] text-slate-500 font-medium">
                            {fmtIDR(a.spent)} / {fmtIDR(a.limit)}
                        </p>
                    </div>
                ))}
            </div>

            <Link to="/categories" className={`text-xs font-bold hover:underline w-fit ${over.length > 0 ? 'text-red-700' : 'text-amber-700'}`}>
                Kelola anggaran &rarr;
            </Link>
        </div>
    );
}
