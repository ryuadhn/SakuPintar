import React, { useMemo } from 'react';
import { fmtIDR } from '../../Utils/format';

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
    const activePoint = points[points.length - 1];

    return (
        <div className="self-stretch p-8 bg-white rounded-2xl outline outline-1 outline-offset-[-1px] outline-stone-300 flex flex-col justify-start items-start gap-6 shadow-sm">
            {/* Header info */}
            <div className="self-stretch flex justify-between items-center flex-wrap gap-4">
                <div className="flex flex-col justify-start items-start">
                    <h3 className="text-zinc-900 text-lg font-bold tracking-tight">Tren Pengeluaran Bulanan</h3>
                    <p className="text-slate-500 text-sm mt-0.5">Total 6 bulan terakhir: {fmtIDR(totalExpense)}</p>
                </div>

                <div className="px-4 py-2 bg-stone-100 rounded-lg flex items-center gap-2 border border-stone-200">
                    <span className="text-zinc-900 text-xs font-semibold tracking-wide">6 Bulan Terakhir</span>
                </div>
            </div>

            <div className="self-stretch w-full h-64 relative bg-stone-50/50 rounded-xl p-4 overflow-hidden">
                <div className="absolute inset-x-0 top-1/4 border-t border-dashed border-stone-200 h-0" />
                <div className="absolute inset-x-0 top-2/4 border-t border-dashed border-stone-200 h-0" />
                <div className="absolute inset-x-0 top-3/4 border-t border-dashed border-stone-200 h-0" />

                <div className="w-full h-full absolute inset-0 pt-6">
                    <svg width="100%" height="100%" viewBox="0 0 577 204" preserveAspectRatio="none" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d={areaPath} fill="url(#expense_chart_fill)" fillOpacity="0.16" />
                        <path d={linePath} stroke="#0E6C4A" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                        {points.map((point) => (
                            <circle key={point.key} cx={point.x} cy={point.y} r={point.key === activePoint.key ? 5 : 3.5} fill="#0E6C4A" />
                        ))}
                        <defs>
                            <linearGradient id="expense_chart_fill" x1="0" y1="0" x2="0" y2="204" gradientUnits="userSpaceOnUse">
                                <stop stopColor="#0E6C4A" />
                                <stop offset="1" stopColor="#0E6C4A" stopOpacity="0" />
                            </linearGradient>
                        </defs>
                    </svg>
                </div>
            </div>

            <div className="self-stretch px-4 flex justify-between items-center text-slate-500 text-xs font-semibold">
                {chartData.map((item, index) => (
                    <span key={item.key} className={index === chartData.length - 1 ? 'text-[#0e6c4a] font-bold' : ''}>
                        {item.label}
                    </span>
                ))}
            </div>
        </div>
    );
}
