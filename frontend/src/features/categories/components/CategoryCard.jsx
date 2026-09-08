import React from 'react';
import { Pencil } from 'lucide-react';

export default function CategoryCard({ name, count = 0, limit, spent = 0, icon: Icon, colorClass = 'emerald', onEdit }) {
    const progress = limit ? Math.min(100, Math.round((spent / limit) * 100)) : 0;
    const isOver = limit && spent > limit;
    const isWarning = limit && !isOver && progress >= 75;

    const formatCurrency = (val) => new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
    }).format(val);

    const colors = {
        emerald: {
            bg: 'bg-emerald-50 text-emerald-600',
            bar: 'bg-emerald-500',
            lightBg: 'hover:border-emerald-200',
        },
        blue: {
            bg: 'bg-blue-50 text-blue-600',
            bar: 'bg-blue-500',
            lightBg: 'hover:border-blue-200',
        },
        purple: {
            bg: 'bg-purple-50 text-purple-600',
            bar: 'bg-purple-500',
            lightBg: 'hover:border-purple-200',
        },
        rose: {
            bg: 'bg-rose-50 text-rose-600',
            bar: 'bg-rose-500',
            lightBg: 'hover:border-rose-200',
        },
        amber: {
            bg: 'bg-amber-50 text-amber-600',
            bar: 'bg-amber-500',
            lightBg: 'hover:border-amber-200',
        },
    };

    const scheme = colors[colorClass] || colors.emerald;

    return (
        <div className={`ui-card p-4 transition-colors duration-200 ${scheme.lightBg}`}>
            <div className="mb-3 flex items-start justify-between">
                <div className="flex items-center gap-3">
                    {Icon && (
                        <div className={`rounded-lg p-2.5 ${scheme.bg}`}>
                            <Icon className="h-5 w-5" aria-hidden="true" />
                        </div>
                    )}
                    <div>
                        <h4 className="text-sm font-semibold text-slate-800">{name}</h4>
                        <span className="text-xs font-normal text-slate-400">{count} transaksi</span>
                    </div>
                </div>
                {onEdit && (
                    <button
                        type="button"
                        onClick={onEdit}
                        className="ui-icon-button"
                        aria-label={`Kelola kategori ${name} dan anggaran`}
                        title="Kelola kategori & anggaran"
                    >
                        <Pencil className="h-4 w-4" aria-hidden="true" />
                    </button>
                )}
            </div>

            {limit && (
                <div className="mt-3 space-y-1.5">
                    <div className="flex justify-between text-xs font-medium">
                        <span className="text-slate-400">Batas bulanan</span>
                        <span className={isOver ? 'text-rose-600' : isWarning ? 'text-amber-600' : 'text-slate-700'}>
                            {formatCurrency(spent)} / {formatCurrency(limit)}
                        </span>
                    </div>
                    <div
                        className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100"
                        role="progressbar"
                        aria-label={`Pemakaian anggaran ${name}`}
                        aria-valuenow={progress}
                        aria-valuemin="0"
                        aria-valuemax="100"
                    >
                        <div
                            className={`h-full rounded-full transition-all duration-500 ${isOver ? 'bg-rose-500' : isWarning ? 'bg-amber-500' : scheme.bar}`}
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                    {(isOver || isWarning) && (
                        <p className={`text-xs font-medium ${isOver ? 'text-rose-600' : 'text-amber-600'}`}>
                            {isOver ? 'Melebihi batas anggaran' : 'Mendekati batas anggaran'}
                        </p>
                    )}
                </div>
            )}
        </div>
    );
}
