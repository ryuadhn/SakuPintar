import React, { useMemo, useState } from 'react';
import AuthenticatedLayout from '../Layouts/AuthenticatedLayout';
import MainBalanceCard from '../Components/Dashboard/MainBalanceCard';
import PlatinumCard from '../Components/Dashboard/PlatinumCard';
import ExpenseChart from '../Components/Dashboard/ExpenseChart';
import QuickAllocation from '../Components/Dashboard/QuickAllocation';
import TransactionTable from '../Shared/TransactionTable';
import TransactionRow from '../Shared/TransactionRow';
import AddTransactionModal from '../Shared/AddTransactionModal';
import BudgetAlertBanner from '../Shared/BudgetAlertBanner';
import Button from '../Components/UI/Button';
import { useFinance } from '../Store/FinanceContext';
import { fmtIDR } from '../Utils/format';

export default function Dashboard() {
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const { transactions, categories, walletById, categoryById, totalBalance, monthStats, savingsGoals } = useFinance();

    const stats = monthStats();
    const recent = useMemo(() => transactions.slice(0, 5), [transactions]);

    return (
        <AuthenticatedLayout>
            <div className="max-w-7xl mx-auto space-y-12">
                {/* Header Welcome Section */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h1 className="text-2xl md:text-3xl font-extrabold text-slate-800 tracking-tight">Dashboard Keuangan</h1>
                        <p className="text-sm text-slate-500 mt-0.5">Finansial Anda aman dan terkelola secara otomatis hari ini.</p>
                    </div>
                    <Button
                        variant="primary"
                        onClick={() => setIsAddModalOpen(true)}
                        className="bg-[#0e6c4a] hover:bg-[#0a4d35] shadow-md font-bold text-sm px-6 py-3"
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                        </svg>
                        Tambah Transaksi
                    </Button>
                </div>

                {/* Budget Alerts */}
                <BudgetAlertBanner />

                {/* Section - Hero Stats: Total Balance */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
                    <div className="lg:col-span-2">
                        <MainBalanceCard balance={totalBalance} net={stats.net} />
                    </div>
                    <div>
                        <PlatinumCard number="**** **** 8829" expiry="12 / 28" />
                    </div>
                </div>

                {/* Section - Chart & Analytics */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
                    <div className="lg:col-span-2">
                        <ExpenseChart transactions={transactions} />
                    </div>
                    <div>
                        <QuickAllocation transactions={transactions} categories={categories} />
                    </div>
                </div>

                {/* Section - Savings Goals Grid */}
                <div className="flex flex-col justify-start items-start gap-8 w-full">
                    <div className="self-stretch flex justify-between items-end flex-wrap gap-4">
                        <div className="flex flex-col justify-start items-start">
                            <h3 className="text-zinc-900 text-lg font-bold tracking-tight">Target Tabungan</h3>
                            <p className="text-slate-500 text-sm mt-0.5">Dana yang Anda kumpulkan untuk impian di masa depan.</p>
                        </div>
                        <a href="/savings" className="flex justify-start items-center gap-2 text-[#0e6c4a] hover:text-[#0a4d35] font-bold text-base transition-colors group">
                            <span>Kelola Semua</span>
                            <svg className="w-2 h-3 transition-transform group-hover:translate-x-0.5" viewBox="0 0 8 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M4.6 6L0 1.4L1.4 0L7.4 6L1.4 12L0 10.6L4.6 6Z" fill="currentColor"/>
                            </svg>
                        </a>
                    </div>

                    {/* Grid of Accounts */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full">
                        {savingsGoals.length === 0 ? (
                            <div className="col-span-3 p-8 text-center bg-white border border-dashed border-stone-200 rounded-2xl flex flex-col items-center justify-center gap-3">
                                <span className="text-sm font-semibold text-slate-400">Belum ada target tabungan aktif.</span>
                            </div>
                        ) : (
                            savingsGoals.slice(0, 3).map((g) => {
                                const pct = g.target > 0 ? Math.min(100, Math.round((g.current / g.target) * 100)) : 0;
                                const remaining = Math.max(0, g.target - g.current);
                                
                                return (
                                    <div key={g.id} className="p-6 bg-white rounded-2xl outline outline-1 outline-offset-[-1px] outline-stone-300 flex flex-col justify-start items-start gap-3 shadow-sm hover:shadow-md transition-shadow">
                                        <div className="self-stretch flex justify-between items-start">
                                            <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-800 shrink-0">
                                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                </svg>
                                            </div>
                                            <div className="px-3 py-1 bg-indigo-50 rounded-full text-indigo-700 text-[10px] font-bold tracking-wide uppercase">
                                                {pct}% Tercapai
                                            </div>
                                        </div>
                                        <div className="pt-3 flex flex-col justify-start items-start">
                                            <h4 className="text-zinc-900 text-base font-bold leading-6">{g.title}</h4>
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
                <TransactionTable>
                    {recent.length === 0 && (
                        <tr>
                            <td colSpan={4} className="py-16 px-8 text-center text-slate-500 text-sm">
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
