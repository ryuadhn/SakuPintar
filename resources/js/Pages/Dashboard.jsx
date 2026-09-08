import React, { useMemo, useState } from 'react';
import AuthenticatedLayout from '../Layouts/AuthenticatedLayout';
import MainBalanceCard from '../Components/Dashboard/MainBalanceCard';
import MonthlySummaryCard from '../Components/Dashboard/MonthlySummaryCard';
import DashboardInsightCard from '../Components/Dashboard/DashboardInsightCard';
import ExpenseChart from '../Components/Dashboard/ExpenseChart';
import QuickAllocation from '../Components/Dashboard/QuickAllocation';
import TransactionTable from '../Shared/TransactionTable';
import TransactionRow from '../Shared/TransactionRow';
import AddTransactionModal from '../Shared/AddTransactionModal';
import MobileTransactionList from '../Shared/MobileTransactionList';
import BudgetAlertBanner from '../Shared/BudgetAlertBanner';
import Button from '../Components/UI/Button';
import { useFinance } from '../Store/FinanceContext';
import { currentMonthKey, fmtIDR, monthKeyOf } from '../Utils/format';

export default function Dashboard() {
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const { transactions, categories, walletById, categoryById, totalBalance, monthStats, savingsGoals } = useFinance();

    const stats = monthStats();
    const currentMonth = currentMonthKey();
    const monthTransactionCount = useMemo(
        () => transactions.filter((transaction) => monthKeyOf(transaction.date) === currentMonth).length,
        [transactions, currentMonth],
    );
    const recent = useMemo(() => transactions.slice(0, 5), [transactions]);

    const getRecentCategoryLabel = (transaction) => (
        transaction.type === 'transfer' ? 'Transfer' : categoryById[transaction.categoryId]?.name || '-'
    );
    const getRecentWalletLabel = (transaction) => (
        transaction.type === 'transfer'
            ? `${walletById[transaction.fromWalletId]?.name || '?'} > ${walletById[transaction.toWalletId]?.name || '?'}`
            : walletById[transaction.walletId]?.name || '-'
    );
    const getRecentAmountLabel = (transaction) => (
        `${transaction.type === 'expense' ? '- ' : '+ '}${fmtIDR(transaction.amount)}`
    );
    const getRecentAmountClass = (transaction) => (
        transaction.type === 'income' ? 'text-emerald-800' : transaction.type === 'expense' ? 'text-red-700' : 'text-slate-600'
    );

    return (
        <AuthenticatedLayout>
            <div className="app-page">
                {/* Header Welcome Section */}
                <div className="app-page-header">
                    <div>
                        <h1 className="app-page-title">Dashboard Keuangan</h1>
                        <p className="app-page-description">Pantau saldo, arus kas, dan aktivitas finansial Anda bulan ini.</p>
                    </div>
                    <Button
                        variant="primary"
                        onClick={() => setIsAddModalOpen(true)}
                        className="shrink-0"
                    >
                        <svg aria-hidden="true" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                        </svg>
                        Tambah Transaksi
                    </Button>
                </div>

                {/* Budget Alerts */}
                <BudgetAlertBanner />

                {/* Section - Hero Stats: Total Balance */}
                <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-3 lg:items-stretch">
                    <div className="lg:col-span-2 lg:flex lg:w-full">
                        <MainBalanceCard balance={totalBalance} net={stats.net} />
                    </div>
                    <div className="lg:flex lg:w-full">
                        <MonthlySummaryCard
                            income={stats.income}
                            expense={stats.expense}
                            net={stats.net}
                            transactionCount={monthTransactionCount}
                        />
                    </div>
                </div>

                <DashboardInsightCard
                    income={stats.income}
                    expense={stats.expense}
                    net={stats.net}
                    transactionCount={monthTransactionCount}
                />

                {/* Section - Chart & Analytics */}
                <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-3">
                    <div className="lg:col-span-2">
                        <ExpenseChart transactions={transactions} />
                    </div>
                    <div>
                        <QuickAllocation transactions={transactions} categories={categories} />
                    </div>
                </div>

                {/* Section - Savings Goals Grid */}
                <div className="flex flex-col justify-start items-start gap-6 w-full">
                    <div className="self-stretch flex justify-between items-end flex-wrap gap-4">
                        <div className="flex flex-col justify-start items-start">
                            <h3 className="ui-section-title">Target Tabungan</h3>
                            <p className="ui-section-description">Dana yang Anda kumpulkan untuk impian di masa depan.</p>
                        </div>
                        <a href="/savings" className="flex justify-start items-center gap-2 text-[#0e6c4a] hover:text-[#0a4d35] font-medium text-sm transition-colors group">
                            <span>Kelola Semua</span>
                            <svg className="w-2 h-3 transition-transform group-hover:translate-x-0.5" viewBox="0 0 8 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M4.6 6L0 1.4L1.4 0L7.4 6L1.4 12L0 10.6L4.6 6Z" fill="currentColor"/>
                            </svg>
                        </a>
                    </div>

                    {/* Grid of Accounts */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full">
                        {savingsGoals.length === 0 ? (
                            <div className="ui-empty col-span-3 flex flex-col items-center justify-center gap-3">
                                <span className="text-sm font-semibold text-slate-400">Belum ada target tabungan aktif.</span>
                            </div>
                        ) : (
                            savingsGoals.slice(0, 3).map((g) => {
                                const pct = g.target > 0 ? Math.min(100, Math.round((g.current / g.target) * 100)) : 0;
                                const remaining = Math.max(0, g.target - g.current);
                                
                                return (
                                    <div key={g.id} className="ui-card p-4 flex flex-col justify-start items-start gap-3 hover:outline hover:outline-emerald-700/20 transition-colors">
                                        <div className="self-stretch flex justify-between items-start">
                                            <div className="w-9 h-9 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-800 shrink-0">
                                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                </svg>
                                            </div>
                                            <div className="ui-badge bg-emerald-50 text-emerald-800 border-emerald-100">
                                                {pct}% tercapai
                                            </div>
                                        </div>
                                        <div className="pt-3 flex flex-col justify-start items-start">
                                            <h4 className="text-zinc-900 text-sm font-semibold leading-5">{g.title}</h4>
                                            <span className="text-slate-500 text-sm mt-0.5">Target: {fmtIDR(g.target)}</span>
                                        </div>
                                        <div className="self-stretch h-2 bg-stone-100 rounded-full overflow-hidden mt-3">
                                            <div className="h-full bg-[#0E6C4A] rounded-full" style={{ width: `${pct}%` }} />
                                        </div>
                                        <div className="self-stretch flex justify-between items-center text-xs font-semibold mt-1">
                                            <span className="text-[#0E6C4A]">{fmtIDR(g.current)}</span>
                                            <span className="text-slate-500">Sisa {fmtIDR(remaining)}</span>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>

                {/* Section - Recent Activity Table */}
                <TransactionTable
                    mobileContent={(
                        <MobileTransactionList
                            items={recent}
                            loading={false}
                            emptyMessage="Belum ada transaksi tercatat."
                            getCategoryLabel={getRecentCategoryLabel}
                            getWalletLabel={getRecentWalletLabel}
                            getAmountLabel={getRecentAmountLabel}
                            getAmountClass={getRecentAmountClass}
                        />
                    )}
                >
                    {recent.length === 0 && (
                        <tr>
                        <td colSpan={4} className="py-10 px-6 text-center text-slate-500 text-sm">
                                Belum ada transaksi tercatat.
                            </td>
                        </tr>
                    )}
                    {recent.map((t) => (
                        <TransactionRow
                            key={t.id}
                            name={t.title}
                            subname={
                                t.type === 'transfer'
                                    ? `${walletById[t.fromWalletId]?.name || '?'} → ${walletById[t.toWalletId]?.name || '?'}`
                                    : `${walletById[t.walletId]?.name || '-'}${t.note ? ` • ${t.note}` : ''}`
                            }
                            category={t.type === 'transfer' ? 'Transfer' : categoryById[t.categoryId]?.name || '-'}
                            date={`${t.date.split('-')[2]}/${t.date.split('-')[1]}/${t.date.split('-')[0]}`}
                            amount={t.amount}
                            type={t.type}
                        />
                    ))}
                </TransactionTable>

                {/* Add Transaction Modal */}
                <AddTransactionModal
                    isOpen={isAddModalOpen}
                    onClose={() => setIsAddModalOpen(false)}
                />
            </div>
        </AuthenticatedLayout>
    );
}
