import React from 'react';
import {
    ArrowRightLeft,
    Banknote,
    Car,
    Clapperboard,
    Coffee,
    FileText,
    HeartPulse,
    ReceiptText,
    ShoppingBag,
    Wallet,
} from 'lucide-react';

const CATEGORY_ICONS = {
    food: Coffee,
    transport: Car,
    lifestyle: Clapperboard,
    shopping: ShoppingBag,
    bills: FileText,
    health: HeartPulse,
    salary: Banknote,
    bonus: Banknote,
    'other-inc': Banknote,
};

export default function TransactionRow({ name, subname, category, categoryId, date, amount, type = 'expense' }) {
    const isExpense = type === 'expense';
    const iconTone = type === 'income'
        ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
        : type === 'transfer'
            ? 'border-sky-400 bg-sky-50 text-sky-700'
            : 'border-rose-400 bg-rose-50 text-rose-700';
    const CategoryIcon = type === 'transfer'
        ? ArrowRightLeft
        : CATEGORY_ICONS[categoryId] || (type === 'income' || category === 'Pendapatan' ? Banknote : ReceiptText);

    const formattedAmount = new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
    }).format(amount);

    const getBadgeStyle = () => {
        if (type === 'transfer') return 'ui-tone-info';
        if (type === 'income') return 'ui-tone-positive';
        return 'ui-tone-neutral';
    };

    return (
        <tr className="border-t border-stone-200 transition-colors hover:bg-slate-50/50">
            <td className="w-1/2 px-6 py-3 align-middle">
                <div className="flex items-center gap-3">
                    <div className={`transaction-icon ui-tone-icon flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border-2 ${iconTone}`}>
                        <CategoryIcon className="h-[18px] w-[18px]" aria-hidden="true" strokeWidth={1.9} />
                    </div>
                    <div className="flex flex-col items-start justify-start">
                        <span className="text-sm font-medium leading-5 text-zinc-900">{name}</span>
                        {subname && <span className="mt-0.5 text-[10px] font-normal leading-4 text-slate-600">{subname}</span>}
                    </div>
                </div>
            </td>
            <td className="px-6 py-3 align-middle">
                <div className={`transaction-category-badge ui-badge w-fit rounded-full ${getBadgeStyle()}`}>{category}</div>
            </td>
            <td className="px-6 py-3 align-middle">
                <span className="text-sm font-medium tracking-wide text-slate-600">{date}</span>
            </td>
            <td className="px-6 py-3 text-right align-middle">
                <span className={`inline-block whitespace-nowrap text-sm font-semibold leading-5 tabular-nums ${type === 'transfer' ? 'text-slate-600' : isExpense ? 'ui-tone-danger-text' : 'ui-tone-positive-text'}`}>
                    {isExpense ? `- ${formattedAmount}` : `+ ${formattedAmount}`}
                </span>
            </td>
        </tr>
    );
}
