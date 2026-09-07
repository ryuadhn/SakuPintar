import React from 'react';

export default function WalletSummaryCard({ title, amount, type = 'income', icon: Icon }) {
    const isIncome = type === 'income';
    const isExpense = type === 'expense';
    
    let containerStyle = "bg-white border border-slate-100";
    let iconBg = "bg-slate-50 text-slate-600";
    
    if (isIncome) {
        iconBg = "bg-emerald-50 text-emerald-600";
    } else if (isExpense) {
        iconBg = "bg-rose-50 text-rose-600";
    }

    const formattedAmount = new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0
    }).format(amount);

    return (
        <div className={`ui-stat-card transition-colors duration-200 ${containerStyle}`}>
            <div className="flex justify-between items-start">
                <div>
                    <span className="text-slate-500 text-xs font-medium">{title}</span>
                    <h3 className="text-xl font-semibold text-slate-800 mt-1">{formattedAmount}</h3>
                </div>
                {Icon && (
                    <div className={`p-2.5 rounded-lg ${iconBg}`}>
                        <Icon className="w-5 h-5" />
                    </div>
                )}
            </div>
        </div>
    );
}
