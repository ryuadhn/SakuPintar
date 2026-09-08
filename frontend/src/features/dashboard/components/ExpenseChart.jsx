import React, { useMemo } from 'react';
import { fmtIDR } from '../../../utils/format';
import { BarChart3 } from 'lucide-react';

const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Ags', 'Sep', 'Okt', 'Nov', 'Des'];

const monthKey = (date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

const buildChartData = (transactions) => {
    const now = new Date();
    const months = Array.from({ length: 6 }, (_, index) => {
        const date = new Date(now.getFullYear(), now.getMonth() - (5 - index), 1);
        return {
            key: monthKey(date),
            label: MONTH_LABELS[date.getMonth()],
            value: 0,
        };
    });

    transactions.forEach((transaction) => {
        if (transaction.type !== 'expense') return;
        const item = months.find((month) => month.key === transaction.date.slice(0, 7));
        if (item) item.value += Number(transaction.amount) || 0;
    });

    return months;
};

export default function ExpenseChart({ transactions = [] }) {
    const chartData = useMemo(() => buildChartData(transactions), [transactions]);
    const maxValue = Math.max(...chartData.map((item) => item.value), 1);
    const width = 577;
    const height = 204;
    const points = chartData.map((item, index) => {
        const x = chartData.length === 1 ? width / 2 : (index / (chartData.length - 1)) * width;
        const y = height - (item.value / maxValue) * (height - 28) - 14;
        return { ...item, x, y };
    });
    const linePath = points.map((point, index) => `${index === 0 ? 'M' : 'L'}${point.x.toFixed(2)} ${point.y.toFixed(2)}`).join(' ');
    const areaPath = `${linePath} L${width} ${height} L0 ${height} Z`;
    const totalExpense = chartData.reduce((sum, item) => sum + item.value, 0);
    const hasData = totalExpense > 0;
    const activePoint = points[points.length - 1];

    return (
        <div className="dashboard-expense-chart ui-card self-stretch p-5 flex flex-col justify-start items-start gap-4">
            {/* Header info */}
            <div className="self-stretch flex justify-between items-center flex-wrap gap-4">
                <div className="flex flex-col justify-start items-start">
                    <h3 className="flex items-center gap-2 ui-section-title">
                        <span className="ui-tone-icon ui-tone-danger flex h-8 w-8 shrink-0 items-center justify-center rounded-lg">
                            <BarChart3 className="h-4 w-4" aria-hidden="true" />
                        </span>
                        Tren Pengeluaran Bulanan
                    </h3>
                    <p className="text-slate-500 text-sm mt-0.5">Total 6 bulan terakhir: {fmtIDR(totalExpense)}</p>
                </div>

                 <div className="ui-badge ui-tone-danger">
                     <span className="text-current text-xs font-medium tracking-wide">{hasData ? '6 Bulan Terakhir' : 'Belum ada data'}</span>
                </div>
            </div>

            {hasData ? (
                <>
                     <div className="dashboard-expense-chart-plot self-stretch w-full h-52 relative bg-stone-50/50 rounded-xl p-3 overflow-hidden">
                        <div className="absolute inset-x-0 top-1/4 border-t border-dashed border-stone-200 h-0" />
                        <div className="absolute inset-x-0 top-2/4 border-t border-dashed border-stone-200 h-0" />
                        <div className="absolute inset-x-0 top-3/4 border-t border-dashed border-stone-200 h-0" />

                        <div className="w-full h-full absolute inset-0 pt-6">
                            <svg width="100%" height="100%" viewBox="0 0 577 204" preserveAspectRatio="none" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d={areaPath} fill="var(--ui-danger-soft)" />
                                 <path d={linePath} stroke="var(--ui-danger)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                                {points.map((point) => (
                                     <circle key={point.key} cx={point.x} cy={point.y} r={point.key === activePoint.key ? 5 : 3.5} fill="var(--ui-danger)" />
                                ))}
                            </svg>
                        </div>
                    </div>

                     <div className="dashboard-expense-chart-labels self-stretch px-3 flex justify-between items-center text-slate-500 text-xs font-medium">
                        {chartData.map((item, index) => (
                             <span key={item.key} className={index === chartData.length - 1 ? 'dashboard-expense-chart-current-label font-medium' : ''}>
                                {item.label}
                            </span>
                        ))}
                    </div>
                </>
            ) : (
                <div className="flex min-h-24 w-full items-center justify-center rounded-lg border border-dashed border-slate-200 bg-slate-50/60 px-4 py-5 text-center">
                    <div className="flex flex-col items-center gap-2">
                        <BarChart3 className="h-7 w-7 text-rose-400" aria-hidden="true" />
                        <p className="text-xs leading-relaxed text-slate-500">Belum ada data pengeluaran enam bulan terakhir.</p>
                    </div>
                </div>
            )}
        </div>
    );
}
