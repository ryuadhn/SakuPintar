import React from 'react';
import { ArrowRightLeft, Pencil, ReceiptText, Trash2, TrendingDown, TrendingUp } from 'lucide-react';
import { formatDateID } from '../../utils/format';

export default function MobileTransactionList({
    items,
    loading,
    emptyMessage,
    getCategoryLabel,
    getWalletLabel,
    getAmountLabel,
    getAmountClass,
    onEdit,
    onDelete,
}) {
    const hasActions = Boolean(onEdit || onDelete);

    return (
        <div className="sm:hidden w-full">
            {loading ? (
                <div className="px-4 py-6 text-center text-sm text-slate-500">Memuat transaksi...</div>
            ) : items.length === 0 ? (
                <div className="flex flex-col items-center gap-2 px-4 py-8 text-center text-sm text-slate-500">
                    <ReceiptText className="h-7 w-7 text-slate-300" aria-hidden="true" />
                    <span>{emptyMessage}</span>
                </div>
            ) : (
                <ul aria-label="Daftar transaksi mobile" className="divide-y divide-stone-200">
                    {items.map((transaction) => (
                        <li key={transaction.id} className={`mobile-transaction-item border-l-2 px-4 py-3 ${
                            transaction.type === 'income'
                                ? 'is-income border-emerald-500'
                                : transaction.type === 'expense'
                                    ? 'is-expense border-rose-400'
                                    : 'is-transfer border-slate-300'
                        }`}>
                            <div className="flex min-w-0 items-start justify-between gap-3">
                                <div className="flex min-w-0 flex-1 items-start gap-2.5">
                                    <span className={`ui-tone-icon flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                                        transaction.type === 'income'
                                            ? 'ui-tone-positive'
                                            : transaction.type === 'transfer'
                                                ? 'ui-tone-info'
                                                : 'ui-tone-danger'
                                    }`} aria-hidden="true">
                                        {transaction.type === 'income'
                                            ? <TrendingUp className="h-4 w-4" />
                                            : transaction.type === 'transfer'
                                                ? <ArrowRightLeft className="h-4 w-4" />
                                                : <TrendingDown className="h-4 w-4" />}
                                    </span>
                                    <div className="min-w-0 flex-1">
                                        <p className="truncate text-sm font-semibold leading-5 text-slate-900">
                                            {transaction.title}
                                        </p>
                                        <p className="mt-0.5 truncate text-xs leading-4 text-slate-500">
                                            {getCategoryLabel(transaction)} &middot; {formatDateID(transaction.date)}{transaction.time ? ` · ${transaction.time} WIB` : ''}
                                            {transaction.auto ? ' · Otomatis' : ''}
                                        </p>
                                    </div>
                                </div>
                                <p className={`shrink-0 text-right text-sm font-semibold leading-5 ${getAmountClass(transaction)}`}>
                                    {getAmountLabel(transaction)}
                                </p>
                            </div>

                            <div className="mt-2 flex min-w-0 items-center justify-between gap-3">
                                <p className="min-w-0 flex-1 truncate text-xs leading-4 text-slate-500">
                                    {transaction.note || getWalletLabel(transaction)}
                                </p>
                                 {hasActions && (
                                     <div className="flex shrink-0 items-center gap-1">
                                         {onEdit && (
                                             <button
                                                 type="button"
                                                 onClick={() => onEdit(transaction)}
                                                 className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-emerald-50 hover:text-emerald-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700 focus-visible:ring-offset-2"
                                                 aria-label={`Edit transaksi ${transaction.title}`}
                                                 title="Edit transaksi"
                                             >
                                                 <Pencil className="h-4 w-4" aria-hidden="true" />
                                             </button>
                                         )}
                                         {onDelete && (
                                             <button
                                                 type="button"
                                                 onClick={() => onDelete(transaction.id)}
                                                 className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-rose-50 hover:text-rose-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-700 focus-visible:ring-offset-2"
                                                 aria-label={`Hapus transaksi ${transaction.title}`}
                                                 title="Hapus transaksi"
                                             >
                                                 <Trash2 className="h-4 w-4" aria-hidden="true" />
                                             </button>
                                         )}
                                     </div>
                                 )}
                            </div>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}
