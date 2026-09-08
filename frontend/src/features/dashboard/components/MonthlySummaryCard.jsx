import React from 'react';
import { fmtIDR } from '../../../utils/format';
import { ArrowRightLeft, ReceiptText, TrendingDown, TrendingUp } from 'lucide-react';

const getCashFlowLabel = (net) => {
    if (net > 0) return `+${fmtIDR(net)}`;
    if (net < 0) return `-${fmtIDR(Math.abs(net))}`;
    return fmtIDR(0);
};

const getCashFlowColor = (net) => {
    if (net > 0) return 'ui-tone-positive-text';
    if (net < 0) return 'ui-tone-danger-text';
    return 'text-slate-700';
};

export default function MonthlySummaryCard({ income = 0, expense = 0, net = 0, transactionCount = 0 }) {
    const CashFlowIcon = net > 0 ? TrendingUp : net < 0 ? TrendingDown : ArrowRightLeft;

    return (
        <section className="dashboard-monthly-summary ui-card w-full flex flex-col gap-4 p-5" aria-labelledby="monthly-summary-heading">
            <div>
                <h2 id="monthly-summary-heading" className="ui-section-title">Ringkasan Bulan Ini</h2>
                <p className="ui-section-description">Arus uang dan aktivitas pada bulan berjalan.</p>
            </div>

            <dl className="grid grid-cols-2 gap-x-4 gap-y-3">
                <div className="dashboard-summary-income">
                    <dt className="flex items-center gap-2 text-xs font-medium text-slate-500">
                        <span className="ui-tone-icon ui-tone-positive flex h-7 w-7 shrink-0 items-center justify-center rounded-lg">
                            <TrendingUp className="h-4 w-4" aria-hidden="true" />
                        </span>
                        Pemasukan
                    </dt>
                    <dd className="mt-1 text-sm font-semibold tabular-nums ui-tone-positive-text">{fmtIDR(income)}</dd>
                </div>
                <div className="dashboard-summary-expense">
                    <dt className="flex items-center gap-2 text-xs font-medium text-slate-500">
                        <span className="ui-tone-icon ui-tone-danger flex h-7 w-7 shrink-0 items-center justify-center rounded-lg">
                            <TrendingDown className="h-4 w-4" aria-hidden="true" />
                        </span>
                        Pengeluaran
                    </dt>
                    <dd className="mt-1 text-sm font-semibold tabular-nums ui-tone-danger-text">{fmtIDR(expense)}</dd>
                </div>
            </dl>

            <div className="dashboard-summary-net flex items-center justify-between gap-3 border-t border-[#e2e9e3] pt-3">
                <span className="flex items-center gap-2 text-xs font-medium text-slate-500">
                    <span className={`ui-tone-icon flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${net > 0 ? 'ui-tone-positive' : net < 0 ? 'ui-tone-danger' : 'ui-tone-info'}`}>
                        <CashFlowIcon className="h-4 w-4" aria-hidden="true" />
                    </span>
                    Arus kas
                </span>
                <span className={`text-sm font-semibold tabular-nums ${getCashFlowColor(net)}`}>{getCashFlowLabel(net)}</span>
            </div>

            <p className="flex items-center gap-1.5 text-xs font-medium text-slate-500">
                <ReceiptText className="h-4 w-4 shrink-0" aria-hidden="true" />
                {transactionCount} transaksi bulan ini
            </p>
        </section>
    );
}
