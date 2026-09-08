import React, { useMemo, useState } from 'react';
import { Utensils, Car, ShoppingBag, Clapperboard, FileText, HeartPulse, Wallet, Banknote, Plus, Receipt, Tags } from 'lucide-react';
import AuthenticatedLayout from '../../layouts/AuthenticatedLayout';
import CategoryCard from './components/CategoryCard';
import CategoryModal from './components/CategoryModal';
import AIHabitBanner from './components/AIHabitBanner';
import BudgetAlertBanner from '../../components/shared/BudgetAlertBanner';
import Button from '../../components/ui/Button';
import { useFinance } from '../../contexts/FinanceContext';
import { fmtIDR } from '../../utils/format';

const ICON_BY_ID = {
    food: Utensils,
    transport: Car,
    lifestyle: Clapperboard,
    shopping: ShoppingBag,
    bills: FileText,
    health: HeartPulse,
};

const COLOR_BY_ID = {
    food: 'amber',
    transport: 'blue',
    lifestyle: 'purple',
    shopping: 'rose',
    bills: 'blue',
    health: 'emerald',
};

export default function Categories() {
    const {
        categories, budgets,
        getCategoryMonthSpend, getCategoryMonthCount,
        monthStats,
        transactions,
    } = useFinance();

    const [modalOpen, setModalOpen] = useState(false);
    const [editingCategory, setEditingCategory] = useState(null);

    const expenseCategories = categories.filter((c) => c.type === 'expense');
    const incomeCategories = categories.filter((c) => c.type === 'income');
    const stats = monthStats();

    const totalBudget = useMemo(
        () => expenseCategories.reduce((sum, c) => sum + (Number(budgets[c.id]) || 0), 0),
        [expenseCategories, budgets]
    );

    const openAdd = () => { setEditingCategory(null); setModalOpen(true); };
    const openEdit = (cat) => {
        setEditingCategory({ ...cat, budget: budgets[cat.id] || null });
        setModalOpen(true);
    };

    return (
        <AuthenticatedLayout>
            <div className="app-page categories-page">
                {/* Header Section */}
                <div className="app-page-header categories-page-header">
                    <div className="min-w-0">
                        <h1 className="app-page-title">Kategori</h1>
                        <p className="app-page-description">Kelola kategori pengeluaran Anda dan atur batas anggaran bulanan.</p>
                    </div>
                    <Button variant="primary" onClick={openAdd} className="categories-add-button shrink-0">
                        <Plus className="h-5 w-5" aria-hidden="true" strokeWidth={2.5} />
                        Tambah Kategori
                    </Button>
                </div>

                {/* Summary strip */}
                <div className="categories-summary grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="ui-stat-card flex min-w-0 items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-800">
                            <Wallet className="h-4 w-4" aria-hidden="true" />
                        </div>
                        <div className="min-w-0">
                            <span className="block text-xs font-medium text-slate-500">Total anggaran bulanan</span>
                            <span className="mt-0.5 block truncate text-base font-semibold text-slate-800">{fmtIDR(totalBudget)}</span>
                        </div>
                    </div>
                    <div className="ui-stat-card flex min-w-0 items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-rose-50 text-rose-800">
                            <Receipt className="h-4 w-4" aria-hidden="true" />
                        </div>
                        <div className="min-w-0">
                            <span className="block text-xs font-medium text-slate-500">Terpakai bulan ini</span>
                            <span className={`mt-0.5 block truncate text-base font-semibold ${totalBudget > 0 && stats.expense > totalBudget ? 'text-rose-800' : 'text-slate-800'}`}>
                                {fmtIDR(stats.expense)}
                            </span>
                        </div>
                    </div>
                    <div className="ui-stat-card flex min-w-0 items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-50 text-slate-700">
                            <Tags className="h-4 w-4" aria-hidden="true" />
                        </div>
                        <div className="min-w-0">
                            <span className="block text-xs font-medium text-slate-500">Kategori aktif</span>
                            <span className="mt-0.5 block truncate text-base font-semibold text-slate-800">{expenseCategories.length} pengeluaran &middot; {incomeCategories.length} pemasukan</span>
                        </div>
                    </div>
                </div>

                {/* Budget Alerts */}
                <BudgetAlertBanner />

                {/* Categories Grid */}
                <div className="categories-grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {expenseCategories.map((cat) => (
                        <CategoryCard
                            key={cat.id}
                            name={cat.name}
                            count={getCategoryMonthCount(cat.id)}
                            spent={getCategoryMonthSpend(cat.id)}
                            limit={budgets[cat.id] || null}
                            icon={ICON_BY_ID[cat.id] || Wallet}
                            colorClass={COLOR_BY_ID[cat.id] || 'emerald'}
                            onEdit={() => openEdit(cat)}
                        />
                    ))}
                    {expenseCategories.length === 0 && (
                        <div className="categories-empty ui-empty col-span-full flex flex-col items-center gap-3">
                            <Tags className="h-8 w-8 text-teal-700" aria-hidden="true" />
                            <div>
                                <p className="font-semibold text-slate-700">Belum ada kategori pengeluaran.</p>
                                <p className="mt-1 text-xs leading-relaxed text-slate-500">Tambahkan kategori untuk mulai mengatur batas anggaran.</p>
                            </div>
                            <Button variant="secondary" onClick={openAdd} className="categories-empty-action min-h-8 px-3 text-xs">
                                Tambah kategori
                            </Button>
                        </div>
                    )}
                </div>

                {/* Income categories strip */}
                {incomeCategories.length > 0 && (
                    <div className="categories-income-section min-w-0">
                        <h3 className="ui-section-title mb-3 flex items-center gap-2">
                            <Banknote className="w-4 h-4 text-emerald-700" /> Kategori Pemasukan
                        </h3>
                        <div className="categories-income-list flex flex-wrap gap-3 min-w-0">
                            {incomeCategories.map((cat) => (
                                <button
                                    key={cat.id}
                                    type="button"
                                    onClick={() => openEdit(cat)}
                                    className={`categories-income-chip ui-badge rounded-full transition-colors ${cat.badge}`}
                                >
                                    {cat.name}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* AI Spending Habits Banner */}
                <AIHabitBanner categories={categories} transactions={transactions} />
            </div>

            {/* Add / Edit Modal */}
            <CategoryModal isOpen={modalOpen} onClose={() => setModalOpen(false)} editing={editingCategory} />
        </AuthenticatedLayout>
    );
}
