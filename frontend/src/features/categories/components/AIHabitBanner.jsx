import React from 'react';
import { Lightbulb } from 'lucide-react';
import { currentMonthKey, monthKeyOf } from '../../../utils/format';

export default function AIHabitBanner({ categories = [], transactions = [] }) {
    const monthlyExpenses = transactions.filter((transaction) => (
        transaction.type === 'expense'
        && monthKeyOf(transaction.date) === currentMonthKey()
        && Number(transaction.amount) > 0
    ));
    const totalExpense = monthlyExpenses.reduce((sum, transaction) => sum + Number(transaction.amount || 0), 0);
    const spendingByCategory = monthlyExpenses.reduce((totals, transaction) => {
        const categoryId = transaction.categoryId || 'uncategorized';
        return {
            ...totals,
            [categoryId]: (totals[categoryId] || 0) + Number(transaction.amount || 0),
        };
    }, {});
    const topCategory = Object.entries(spendingByCategory).sort(([, a], [, b]) => b - a)[0];
    const topCategoryData = topCategory
        ? categories.find((category) => category.id === topCategory[0])
        : null;
    const hasEnoughData = monthlyExpenses.length >= 3 && totalExpense > 0 && Boolean(topCategory);
    const topCategoryName = topCategoryData?.name || 'kategori lain';
    const topCategoryShare = hasEnoughData ? Math.round((topCategory[1] / totalExpense) * 100) : 0;

    return (
        <section className="ui-insight ui-insight-ai flex items-start gap-3 p-4 sm:p-5" aria-labelledby="category-insight-heading">
            <div className={`ui-tone-icon flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${hasEnoughData ? 'ui-tone-ai' : 'ui-tone-neutral'}`}>
                <Lightbulb className="h-4 w-4" aria-hidden="true" />
            </div>
            <div className="min-w-0">
                <p className="text-xs font-medium text-violet-800">Insight kebiasaan belanja</p>
                <h2 id="category-insight-heading" className="ui-section-title mt-1">
                    {hasEnoughData ? 'Pola pengeluaran bulan ini' : 'Belum cukup data untuk membaca kebiasaan belanja.'}
                </h2>
                <p className="mt-1 text-sm leading-relaxed text-violet-900/75">
                    {hasEnoughData
                        ? `${topCategoryName} menjadi kategori terbesar dengan sekitar ${topCategoryShare}% dari total pengeluaran bulan ini.`
                        : 'Catat beberapa transaksi untuk mulai mendapatkan insight berdasarkan pola pengeluaran Anda.'}
                </p>
            </div>
        </section>
    );
}
