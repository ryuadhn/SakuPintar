import React from 'react';
import { fmtIDR } from '../../Utils/format';

const getCashFlowLabel = (net) => {
    if (net > 0) return `+${fmtIDR(net)}`;
    if (net < 0) return `-${fmtIDR(Math.abs(net))}`;
    return fmtIDR(0);
};

const getCashFlowColor = (net) => {
    if (net > 0) return 'text-emerald-800';
    if (net < 0) return 'text-rose-700';
    return 'text-slate-700';
};

export default function MonthlySummaryCard({ income = 0, expense = 0, net = 0, transactionCount = 0 }) {
    return (
        <section className="ui-card w-full flex flex-col gap-4 p-5" aria-labelledby="monthly-summary-heading">
            <div>
                <h2 id="monthly-summary-heading" className="ui-section-title">Ringkasan Bulan Ini</h2>
                <p className="ui-section-description">Arus uang dan aktivitas pada bulan berjalan.</p>
            </div>

            <dl className="grid grid-cols-2 gap-x-4 gap-y-3">
                <div>
                    <dt className="text-xs font-medium text-slate-500">Pemasukan</dt>
                    <dd className="mt-1 text-sm font-semibold tabular-nums text-emerald-800">{fmtIDR(income)}</dd>
                </div>
                <div>
                    <dt className="text-xs font-medium text-slate-500">Pengeluaran</dt>
                    <dd className="mt-1 text-sm font-semibold tabular-nums text-rose-700">{fmtIDR(expense)}</dd>
                </div>
            </dl>

            <div className="flex items-center justify-between gap-3 border-t border-[#e2e9e3] pt-3">
                <span className="text-xs font-medium text-slate-500">Arus kas</span>
                <span className={`text-sm font-semibold tabular-nums ${getCashFlowColor(net)}`}>{getCashFlowLabel(net)}</span>
            </div>

            <p className="text-xs font-medium text-slate-500">{transactionCount} transaksi bulan ini</p>
        </section>
    );
}
