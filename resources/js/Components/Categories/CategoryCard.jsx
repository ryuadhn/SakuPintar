import React from 'react';

export default function CategoryCard({ name, count = 0, limit, spent = 0, icon: Icon, colorClass = "emerald", onEdit }) {
    const progress = limit ? Math.min(100, Math.round((spent / limit) * 100)) : 0;
    const isOver = limit && spent > limit;
    const isWarning = limit && !isOver && progress >= 75;
    
    const formatCurrency = (val) => new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0
    }).format(val);

    const colors = {
        emerald: {
            bg: "bg-emerald-50 text-emerald-600",
            bar: "bg-emerald-500",
            lightBg: "hover:border-emerald-200"
        },
        blue: {
            bg: "bg-blue-50 text-blue-600",
            bar: "bg-blue-500",
            lightBg: "hover:border-blue-200"
        },
        purple: {
            bg: "bg-purple-50 text-purple-600",
            bar: "bg-purple-500",
            lightBg: "hover:border-purple-200"
        },
        rose: {
            bg: "bg-rose-50 text-rose-600",
            bar: "bg-rose-500",
            lightBg: "hover:border-rose-200"
        },
        amber: {
            bg: "bg-amber-50 text-amber-600",
            bar: "bg-amber-500",
            lightBg: "hover:border-amber-200"
        }
    };

    const scheme = colors[colorClass] || colors.emerald;

    return (
        <div className={`bg-white border border-slate-100 rounded-2xl p-5 shadow-sm transition-all duration-300 hover:shadow-md ${scheme.lightBg}`}>
            <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                    {Icon && (
                        <div className={`p-3 rounded-xl ${scheme.bg}`}>
                            <Icon className="w-5 h-5" />
                        </div>
                    )}
                    <div>
                        <h4 className="font-bold text-slate-800 text-sm">{name}</h4>
                        <span className="text-[11px] text-slate-400 font-medium">{count} Transaksi</span>
                    </div>
                </div>
                {onEdit && (
                    <button
                        onClick={onEdit}
                        className="p-2 rounded-lg text-slate-400 hover:text-emerald-700 hover:bg-emerald-50 transition-colors"
                        title="Kelola kategori & anggaran"
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                    </button>
                )}
            </div>

            {limit && (
                <div className="space-y-2 mt-4">
                    <div className="flex justify-between text-[11px] font-semibold">
                        <span className="text-slate-400">Batas Bulanan</span>
                        <span className={isOver ? "text-rose-600" : isWarning ? "text-amber-600" : "text-slate-700"}>
                            {formatCurrency(spent)} / {formatCurrency(limit)}
                        </span>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden shadow-inner">
                        <div
                            className={`h-full rounded-full transition-all duration-500 ${isOver ? 'bg-rose-500' : isWarning ? 'bg-amber-500' : scheme.bar}`}
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                    {(isOver || isWarning) && (
                        <p className={`text-[10px] font-bold ${isOver ? 'text-rose-600' : 'text-amber-600'}`}>
                            {isOver ? 'MELEBIHI BATAS ANGGARAN!' : 'MENDEKATI BATAS ANGGARAN'}
                        </p>
                    )}
                </div>
            )}
        </div>
    );
}