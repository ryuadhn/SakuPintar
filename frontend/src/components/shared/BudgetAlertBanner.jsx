import React from 'react';
import { Link } from 'react-router-dom';
import { useFinance } from '../../contexts/FinanceContext';
import { fmtIDR } from '../../utils/format';
import { AlertTriangle, ArrowRight } from 'lucide-react';

export default function BudgetAlertBanner() {
    const alerts = useFinance().getBudgetAlerts();

    if (alerts.length === 0) return null;

    const over = alerts.filter((a) => a.level === 'over');
    const warning = alerts.filter((a) => a.level === 'warning');
    const headline = over.length > 0
        ? `${over.length} kategori melebihi batas anggaran!`
        : `${warning.length} kategori mendekati batas anggaran`;

    return (
        <div className={`ui-notice p-3 sm:p-4 border flex flex-col gap-2.5 ${over.length > 0
            ? 'bg-rose-50 border-rose-200'
            : 'bg-amber-50 border-amber-200'}`}
        >
            <div className="flex items-center gap-2.5">
                <AlertTriangle className={`h-5 w-5 shrink-0 ${over.length > 0 ? 'text-rose-600' : 'text-amber-600'}`} aria-hidden="true" />
                <span className={`font-semibold text-sm ${over.length > 0 ? 'text-rose-700' : 'text-amber-700'}`}>{headline}</span>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
                {alerts.slice(0, 4).map((a) => (
                    <div key={a.categoryId} className="flex-1 bg-white/70 rounded-lg px-3 py-2 border border-white min-w-[180px]">
                        <div className="flex justify-between items-center mb-1">
                            <span className="text-xs font-medium text-slate-700">{a.name}</span>
                            <span className={`text-xs font-medium px-1.5 py-0.5 rounded-full ${a.level === 'over'
                                ? 'bg-rose-100 text-rose-700'
                                : 'bg-amber-100 text-amber-700'}`}
                            >
                                {a.pct >= 999 ? '>999' : a.pct}%
                            </span>
                        </div>
                        <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden mb-1.5">
                            <div
                                className={`h-full rounded-full ${a.level === 'over' ? 'bg-rose-500' : 'bg-amber-500'}`}
                                style={{ width: `${Math.min(100, a.pct)}%` }}
                            />
                        </div>
                        <p className="text-xs text-slate-500 font-normal">
                            {fmtIDR(a.spent)} / {fmtIDR(a.limit)}
                        </p>
                    </div>
                ))}
            </div>

            <Link to="/categories" className={`inline-flex w-fit items-center gap-1 text-xs font-medium hover:underline ${over.length > 0 ? 'text-rose-700' : 'text-amber-700'}`}>
                Kelola anggaran
                <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
            </Link>
        </div>
    );
}
