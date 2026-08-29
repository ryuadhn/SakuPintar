import React, { useMemo, useState } from 'react';
import { Utensils, Car, ShoppingBag, Clapperboard, FileText, HeartPulse, Wallet, Banknote } from 'lucide-react';
import AuthenticatedLayout from '../Layouts/AuthenticatedLayout';
import CategoryCard from '../Components/Categories/CategoryCard';
import CategoryModal from '../Components/Categories/CategoryModal';
import AIHabitBanner from '../Components/Categories/AIHabitBanner';
import BudgetAlertBanner from '../Shared/BudgetAlertBanner';
import Button from '../Components/UI/Button';
import { useFinance } from '../Store/FinanceContext';
import { fmtIDR } from '../Utils/format';

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
            <div className="max-w-7xl mx-auto space-y-8">
                {/* Header Section */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h1 className="text-2xl md:text-3xl font-extrabold text-slate-800 tracking-tight">Kelola Kategori</h1>
                        <p className="text-sm text-slate-500 mt-0.5">Kelola kategori pengeluaran Anda dan atur batas anggaran bulanan.</p>
                    </div>
                    <Button variant="primary" onClick={openAdd} className="bg-emerald-600 hover:bg-emerald-700 shadow-md font-bold text-sm px-5 py-3">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                        </svg>
                        Tambah Kategori
                    </Button>
                </div>

                {/* Summary strip */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                    <div className="rounded-2xl p-5 bg-white border border-slate-100 shadow-sm">
                        <span className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Total Anggaran Bulanan</span>
                        <h3 className="text-xl font-bold text-slate-800 mt-1">{fmtIDR(totalBudget)}</h3>
                    </div>
                    <div className="rounded-2xl p-5 bg-white border border-slate-100 shadow-sm">
                        <span className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Terpakai Bulan Ini</span>
                        <h3 className={`text-xl font-bold mt-1 ${stats.expense > totalBudget ? 'text-red-600' : 'text-slate-800'}`}>
                            {fmtIDR(stats.expense)}
                        </h3>
                    </div>
                    <div className="rounded-2xl p-5 bg-white border border-slate-100 shadow-sm">
                        <span className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Kategori Aktif</span>
                        <h3 className="text-xl font-bold text-slate-800 mt-1">{expenseCategories.length} Pengeluaran &middot; {incomeCategories.length} Pemasukan</h3>
                    </div>
                </div>

                {/* Budget Alerts */}
                <BudgetAlertBanner />

                {/* Categories Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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
                        <p className="text-sm text-slate-500 col-span-full py-10 text-center bg-white rounded-2xl border border-dashed border-slate-200">
                            Belum ada kategori pengeluaran. Klik "Tambah Kategori" untuk memulai.
                        </p>
                    )}
                </div>

                {/* Income categories strip */}
                {incomeCategories.length > 0 && (
                    <div>
                        <h3 className="text-zinc-900 text-base font-bold mb-3 flex items-center gap-2">
                            <Banknote className="w-4 h-4 text-emerald-700" /> Kategori Pemasukan
                        </h3>
                        <div className="flex flex-wrap gap-3">
                            {incomeCategories.map((cat) => (
                                <button
                                    key={cat.id}
                                    onClick={() => openEdit(cat)}
                                    className={`px-4 py-2 rounded-full text-xs font-bold transition-transform active:scale-95 ${cat.badge}`}
                                >
                                    {cat.name}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* AI Spending Habits Banner */}
                <AIHabitBanner />
            </div>

            {/* Add / Edit Modal */}
            <CategoryModal isOpen={modalOpen} onClose={() => setModalOpen(false)} editing={editingCategory} />
        </AuthenticatedLayout>
    );
}
