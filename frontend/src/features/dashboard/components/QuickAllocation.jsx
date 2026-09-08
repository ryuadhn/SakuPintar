import React, { useMemo } from 'react';
import { currentMonthKey, fmtIDR } from '../../../utils/format';

export default function QuickAllocation({ transactions = [], categories = [] }) {
    const items = useMemo(() => {
        const categoryById = Object.fromEntries(categories.map((category) => [category.id, category]));
        const totals = {};
        transactions.forEach((transaction) => {
            if (transaction.type !== 'expense') return;
            if (transaction.date.slice(0, 7) !== currentMonthKey()) return;
            totals[transaction.categoryId] = (totals[transaction.categoryId] || 0) + Number(transaction.amount || 0);
        });

        const total = Object.values(totals).reduce((sum, value) => sum + value, 0);
        return Object.entries(totals)
            .map(([categoryId, value]) => ({
                id: categoryId,
                name: categoryById[categoryId]?.name || 'Tanpa Kategori',
                color: categoryById[categoryId]?.color || '#475569',
                value,
                pct: total > 0 ? Math.round((value / total) * 100) : 0,
            }))
            .sort((a, b) => b.value - a.value)
            .slice(0, 3);
    }, [transactions, categories]);

    const hasData = items.length > 0;

    return (
        <div className="dashboard-quick-allocation ui-card self-stretch p-5 flex flex-col justify-start items-start gap-4">
            <div className="self-stretch flex flex-col justify-start items-start">
                <h3 className="ui-section-title">Alokasi Pengeluaran</h3>
                <p className="text-slate-500 text-sm mt-0.5">Kategori terbesar bulan ini.</p>
            </div>
            
                <div className="dashboard-quick-allocation-body self-stretch flex flex-col justify-start items-start gap-4 w-full">
                {hasData ? (
                    <>
                        <div className="self-stretch flex flex-col gap-3">
                            {items.map((item) => (
                                <div key={item.id} className="self-stretch inline-flex justify-between items-center gap-3">
                                    <div className="flex justify-start items-center gap-3 min-w-0">
                                        <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} aria-hidden="true" />
                                        <span className="text-slate-600 text-sm font-normal truncate">{item.name}</span>
                                    </div>
                                    <span className="text-zinc-900 text-sm font-semibold shrink-0">{item.pct}%</span>
                                </div>
                            ))}
                        </div>

                        <div className="self-stretch pt-4 border-t border-stone-200 flex flex-col justify-start items-start gap-3 w-full">
                            <div className="self-stretch h-2.5 bg-stone-100 rounded-full flex overflow-hidden w-full">
                                {items.map((item) => (
                                    <div
                                        key={item.id}
                                        className="h-full"
                                        style={{ width: `${item.pct}%`, backgroundColor: item.color }}
                                        title={`${item.name}: ${item.pct}%`}
                                    />
                                ))}
                            </div>

                            <div className="self-stretch flex flex-col justify-start items-center text-center">
                                <p className="text-slate-500 text-xs font-normal leading-4">
                                    Terbesar: {items[0].name} ({fmtIDR(items[0].value)})
                                </p>
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="flex min-h-20 w-full items-center justify-center rounded-lg border border-dashed border-slate-200 bg-slate-50/60 px-3 py-4 text-center">
                        <p className="text-xs leading-relaxed text-slate-500">Belum ada pengeluaran bulan ini.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
