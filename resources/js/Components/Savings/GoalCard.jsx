import React from 'react';

export default function GoalCard({ title, target, current, deadline, icon: Icon }) {
    const progress = Math.min(100, Math.round((current / target) * 100));
    
    const formatCurrency = (val) => new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0
    }).format(val);

    return (
        <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all duration-300">
            <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3.5">
                    {Icon && (
                        <div className="bg-emerald-50 text-emerald-600 p-3 rounded-xl">
                            <Icon className="w-6 h-6" />
                        </div>
                    )}
                    <div>
                        <h4 className="font-bold text-slate-800 text-base">{title}</h4>
                        <span className="text-[11px] text-slate-400 font-medium">Hingga {deadline}</span>
                    </div>
                </div>
                <span className="bg-emerald-50 text-emerald-700 text-xs font-bold px-2.5 py-1 rounded-lg">
                    {progress}%
                </span>
            </div>

            <div className="space-y-2.5">
                <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden shadow-inner">
                    <div 
                        className="bg-emerald-500 h-full rounded-full transition-all duration-500" 
                        style={{ width: `${progress}%` }}
                    />
                </div>
                
                <div className="flex justify-between text-xs mt-1">
                    <div>
                        <span className="text-slate-400 block">Terkumpul</span>
                        <span className="font-bold text-slate-800">{formatCurrency(current)}</span>
                    </div>
                    <div className="text-right">
                        <span className="text-slate-400 block">Target</span>
                        <span className="font-semibold text-slate-500">{formatCurrency(target)}</span>
                    </div>
                </div>
            </div>
        </div>
    );
}