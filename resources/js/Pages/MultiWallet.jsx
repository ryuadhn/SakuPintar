import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import AuthenticatedLayout from '../Layouts/AuthenticatedLayout';
import AddTransactionModal from '../Shared/AddTransactionModal';
import RecurringModal from '../Shared/RecurringModal';
import WalletModal from '../Shared/WalletModal';
import BudgetAlertBanner from '../Shared/BudgetAlertBanner';
import { useFinance } from '../Store/FinanceContext';
import { FREQ_LABELS, fmtIDR, formatDateID, todayISO } from '../Utils/format';
import insightIllustration from '../Shared/insight_illustration.jpg';

const RANGE_OPTIONS = ['30 Hari Terakhir', 'Hari Ini', '7 Hari Terakhir', 'Bulan Ini', 'Semua Waktu'];

const daysForRange = (range) => {
    if (range === 'Hari Ini') return 0;
    if (range === '7 Hari Terakhir') return 7;
    if (range === '30 Hari Terakhir') return 30;
    return null;
};

export default function MultiWallet() {
    const {
        wallets, categories, transactions, recurringRules,
        walletById, categoryById,
        deleteTransaction, deleteRecurringRule, toggleRecurringRule,
        deleteWallet,
        getWalletBalance, totalBalance, monthStats,
    } = useFinance();

    const [searchParams, setSearchParams] = useSearchParams();
    const [selectedDateRange, setSelectedDateRange] = useState('30 Hari Terakhir');
    const [selectedCategory, setSelectedCategory] = useState('Semua Kategori');
    const [selectedType, setSelectedType] = useState('Semua Jenis');
    const [currentPage, setCurrentPage] = useState(1);
    const [modalOpen, setModalOpen] = useState(false);
    const [editingTxn, setEditingTxn] = useState(null);
    const [initialType, setInitialType] = useState('expense');
    const [recurringOpen, setRecurringOpen] = useState(false);
    const [deletingId, setDeletingId] = useState(null);
    const [walletModalOpen, setWalletModalOpen] = useState(false);
    const [editingWallet, setEditingWallet] = useState(null);
    const [walletNotice, setWalletNotice] = useState('');

    const q = searchParams.get('q') || '';
    const setQ = (value) => {
        const next = new URLSearchParams(searchParams);
        if (value) next.set('q', value);
        else next.delete('q');
        setSearchParams(next, { replace: true });
    };

    useEffect(() => {
        setCurrentPage(1);
    }, [q, selectedDateRange, selectedCategory, selectedType]);

    const stats = monthStats();

    const filtered = useMemo(() => {
        const cutoffDays = daysForRange(selectedDateRange);
        const today = todayISO();
        let cutoffISO = null;
        if (cutoffDays !== null) {
            const d = new Date();
            d.setDate(d.getDate() - cutoffDays);
            cutoffISO = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        } else if (selectedDateRange === 'Bulan Ini') {
            cutoffISO = `${today.slice(0, 7)}-01`;
        }

        const ql = q.trim().toLowerCase();
        return transactions.filter((t) => {
            if (cutoffISO && t.date < cutoffISO) return false;
            if (selectedDateRange === 'Hari Ini' && t.date !== today) return false;
            if (selectedType === 'Pemasukan' && t.type !== 'income') return false;
            if (selectedType === 'Pengeluaran' && t.type !== 'expense') return false;
            if (selectedType === 'Transfer' && t.type !== 'transfer') return false;
            if (selectedCategory !== 'Semua Kategori' && t.categoryId !== selectedCategory) return false;
            if (ql) {
                const hay = `${t.title} ${t.note}`.toLowerCase();
                if (!hay.includes(ql)) return false;
            }
            return true;
        });
    }, [transactions, q, selectedDateRange, selectedCategory, selectedType]);

    const PAGE_SIZE = 8;
    const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
    const pageSafe = Math.min(currentPage, totalPages);
    const pageItems = filtered.slice((pageSafe - 1) * PAGE_SIZE, pageSafe * PAGE_SIZE);

    const openAdd = () => { setEditingTxn(null); setInitialType('expense'); setModalOpen(true); };
    const openTransfer = () => { setEditingTxn(null); setInitialType('transfer'); setModalOpen(true); };
    const openEdit = (t) => { setEditingTxn(t); setModalOpen(true); };
    const openAddWallet = () => { setEditingWallet(null); setWalletNotice(''); setWalletModalOpen(true); };
    const openEditWallet = (wallet) => { setEditingWallet(wallet); setWalletNotice(''); setWalletModalOpen(true); };

    const exportCSV = () => {
        const header = ['Tanggal', 'Waktu', 'Judul', 'Catatan', 'Tipe', 'Kategori', 'Dompet', 'Jumlah'];
        const rows = filtered.map((t) => [
            t.date,
            t.time,
            t.title,
            t.note || '',
            t.type === 'income' ? 'Pemasukan' : t.type === 'expense' ? 'Pengeluaran' : 'Transfer',
            categoryById[t.categoryId]?.name || '-',
            t.type === 'transfer'
                ? `${walletById[t.fromWalletId]?.name || '?'} > ${walletById[t.toWalletId]?.name || '?'}`
                : walletById[t.walletId]?.name || '-',
            t.amount,
        ]);
        const esc = (v) => `"${String(v).replace(/"/g, '""')}"`;
        const csv = '\uFEFF' + [header, ...rows].map((r) => r.map(esc).join(';')).join('\r\n');
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `sakupintar-transaksi-${todayISO()}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const walletAlloc = useMemo(() => {
        const items = wallets.map((w) => ({ ...w, balance: getWalletBalance(w.id) }));
        const total = items.reduce((s, i) => s + i.balance, 0) || 1;
        return items.map((i) => ({ ...i, pct: Math.max(0, Math.round((i.balance / total) * 100)) }));
    }, [wallets, getWalletBalance]);

    const walletUsage = useMemo(() => {
        const usage = Object.fromEntries(wallets.map((w) => [w.id, { transactions: 0, rules: 0 }]));
        transactions.forEach((t) => {
            if (t.walletId && usage[t.walletId]) usage[t.walletId].transactions += 1;
            if (t.fromWalletId && usage[t.fromWalletId]) usage[t.fromWalletId].transactions += 1;
            if (t.toWalletId && usage[t.toWalletId]) usage[t.toWalletId].transactions += 1;
        });
        recurringRules.forEach((rule) => {
            if (rule.walletId && usage[rule.walletId]) usage[rule.walletId].rules += 1;
        });
        return usage;
    }, [wallets, transactions, recurringRules]);

    const handleDeleteWallet = (wallet) => {
        const usage = walletUsage[wallet.id] || { transactions: 0, rules: 0 };
        if (wallets.length <= 1) {
            setWalletNotice('Minimal harus ada satu dompet aktif.');
            return;
        }
        if (usage.transactions > 0 || usage.rules > 0) {
            setWalletNotice(`Dompet "${wallet.name}" masih dipakai oleh ${usage.transactions} transaksi atau ${usage.rules} aturan rutin.`);
            return;
        }
        if (window.confirm(`Hapus dompet "${wallet.name}"?`)) {
            deleteWallet(wallet.id);
            setWalletNotice('');
        }
    };

    const resetFilters = () => {
        setSelectedDateRange('30 Hari Terakhir');
        setSelectedCategory('Semua Kategori');
        setSelectedType('Semua Jenis');
        setQ('');
    };

    const SelectArrow = () => (
        <svg width="21" height="21" viewBox="0 0 21 21" fill="none" className="pointer-events-none">
            <path d="M6.3 8.4L10.5 12.6L14.7 8.4" stroke="#6B7280" strokeWidth="1.575" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    );

    const renderCategoryCell = (t) => {
        if (t.type === 'transfer') {
            return (
                <span className="px-3 py-[2.5px] bg-sky-50 text-sky-700 border border-sky-100 rounded-full text-xs font-bold leading-4 inline-flex items-center gap-1">
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8 7h12m0 0l-4-4m4 4l-4 4M16 17H4m0 0l4 4m-4-4l4-4" />
                    </svg>
                    Transfer
                </span>
            );
        }
        const cat = categoryById[t.categoryId];
        return (
            <span className={`px-3 py-[2.5px] rounded-full text-xs font-bold leading-4 ${cat?.badge || 'bg-stone-100 text-stone-600 border border-stone-200'}`}>
                {cat?.name || 'Tanpa Kategori'}
            </span>
        );
    };

    const renderWalletCell = (t) => {
        if (t.type === 'transfer') {
            return (
                <div className="flex items-center gap-1.5 min-w-0">
                    <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: walletById[t.fromWalletId]?.color || '#ccc' }} />
                    <span className="text-zinc-900 text-sm font-semibold truncate max-w-[80px]">{walletById[t.fromWalletId]?.name || '?'}</span>
                    <svg className="w-3.5 h-3.5 shrink-0 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                    <span className="text-zinc-900 text-sm font-semibold truncate max-w-[80px]">{walletById[t.toWalletId]?.name || '?'}</span>
                </div>
            );
        }
        return (
            <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: walletById[t.walletId]?.color || '#ccc' }} />
                <span className="text-zinc-900 text-sm font-semibold leading-4 tracking-wide">{walletById[t.walletId]?.name || '-'}</span>
            </div>
        );
    };

    const amountClass = (t) =>
        t.type === 'income' ? 'text-emerald-800' : t.type === 'expense' ? 'text-red-700' : 'text-slate-600';

    const pageNumbers = useMemo(() => {
        const nums = [];
        const start = Math.max(1, Math.min(pageSafe - 2, totalPages - 4));
        for (let n = start; n <= Math.min(totalPages, start + 4); n++) nums.push(n);
        return nums;
    }, [pageSafe, totalPages]);

    return (
        <AuthenticatedLayout>
            <div className="flex flex-col gap-6">

                {/* Header Section */}
                <div className="flex flex-col xl:flex-row xl:justify-between xl:items-end gap-4">
                    <div className="space-y-1 min-w-0">
                        <h1 className="text-zinc-900 text-2xl sm:text-3xl font-bold leading-9 sm:leading-10">Riwayat Transaksi</h1>
                        <p className="text-neutral-700 text-base font-normal leading-6">Kelola dan pantau semua aliran dana Anda secara langsung.</p>
                    </div>
                    <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-3 w-full xl:w-auto xl:justify-end">
                        <button
                            onClick={openTransfer}
                            className="min-w-0 px-4 h-12 bg-white hover:bg-slate-50 transition-colors outline outline-1 outline-offset-[-1px] outline-stone-300 text-slate-700 text-sm font-semibold rounded-xl inline-flex items-center justify-center gap-2 active:scale-[0.98]"
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4M16 17H4m0 0l4 4m-4-4l4-4" />
                            </svg>
                            Transfer Dompet
                        </button>
                        <button
                            onClick={() => setRecurringOpen(true)}
                            className="min-w-0 px-4 h-12 bg-white hover:bg-slate-50 transition-colors outline outline-1 outline-offset-[-1px] outline-stone-300 text-slate-700 text-sm font-semibold rounded-xl inline-flex items-center justify-center gap-2 active:scale-[0.98]"
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                            Aturan Rutin
                        </button>
                        <button
                            onClick={exportCSV}
                            className="min-w-0 px-4 h-12 bg-slate-600 hover:bg-slate-700 transition-colors text-white text-sm font-semibold rounded-xl inline-flex items-center justify-center gap-2.5 active:scale-[0.98]"
                        >
                            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                                <path d="M8 12L3 7L4.4 5.55L7 8.15V0H9V8.15L11.6 5.55L13 7L8 12ZM2 16C1.45 16 0.979167 15.8042 0.5875 15.4125C0.195833 15.0208 0 14.55 0 14V11H2V14H14V11H16V14C16 14.55 15.8042 15.0208 15.4125 15.4125C15.0208 15.8042 14.55 16 14 16H2Z" fill="white" />
                            </svg>
                            Ekspor Data
                        </button>
                        <button
                            onClick={openAdd}
                            className="min-w-0 px-4 h-12 bg-emerald-800 hover:bg-emerald-700 transition-colors text-white text-sm font-semibold rounded-xl inline-flex items-center justify-center gap-2.5 shadow-[0px_10px_15px_-3px_rgba(14,108,74,0.10),0px_4px_6px_-4px_rgba(14,108,74,0.10)] active:scale-[0.98]"
                        >
                            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                                <path d="M6 8H0V6H6V0H8V6H14V8H8V14H6V8Z" fill="white" />
                            </svg>
                            Tambah Transaksi
                        </button>
                    </div>
                </div>

                <BudgetAlertBanner />

                {/* Bento Grid Summary */}
                <div className="pt-2 grid grid-cols-[repeat(auto-fit,minmax(230px,1fr))] gap-5">
                    <div className="p-5 bg-stone-100 rounded-2xl outline outline-1 outline-offset-[-1px] outline-stone-300 flex items-center gap-4 min-w-0">
                        <div className="w-11 h-11 bg-emerald-800/10 rounded-xl flex items-center justify-center shrink-0">
                            <svg width="19" height="18" viewBox="0 0 19 18" fill="none">
                                <path d="M2 18C1.45 18 0.979167 17.8042 0.5875 17.4125C0.195833 17.0208 0 16.55 0 16V2C0 1.45 0.195833 0.979167 0.5875 0.5875C0.979167 0.195833 1.45 0 2 0H16C16.55 0 17.0208 0.195833 17.4125 0.5875C17.8042 0.979167 18 1.45 18 2H10C8.81667 2 7.85417 2.37083 7.1125 3.1125C6.37083 3.85417 6 4.81667 6 6V12C6 13.1833 6.37083 14.1458 7.1125 14.8875C7.85417 15.6292 8.81667 16 10 16H18C18 16.55 17.8042 17.0208 17.4125 17.4125C17.0208 17.8042 16.55 18 16 18H2ZM10 14C9.45 14 8.97917 13.8042 8.5875 13.4125C8.19583 13.0208 8 12.55 8 12V6C8 5.45 8.19583 4.97917 8.5875 4.5875C8.97917 4.19583 9.45 4 10 4H17C17.55 4 18.0208 4.19583 18.4125 4.5875C18.8042 4.97917 19 5.45 19 6V12C19 12.55 18.8042 13.0208 18.4125 13.4125C18.0208 13.8042 17.55 14 17 14H10ZM13 10.5C13.4333 10.5 13.7917 10.3583 14.075 10.075C14.3583 9.79167 14.5 9.43333 14.5 9C14.5 8.56667 14.3583 8.20833 14.075 7.925C13.7917 7.64167 13.4333 7.5 13 7.5C12.5667 7.5 12.2083 7.64167 11.925 7.925C11.6417 8.20833 11.5 8.56667 11.5 9C11.5 9.43333 11.6417 9.79167 11.925 10.075C12.2083 10.3583 12.5667 10.5 13 10.5Z" fill="#0E6C4A" />
                            </svg>
                        </div>
                        <div className="min-w-0 flex-1">
                            <span className="block text-neutral-700 text-[11px] font-normal uppercase leading-4 tracking-wide">TOTAL SALDO</span>
                            <span className="block text-zinc-900 text-xl 2xl:text-2xl font-semibold leading-7 truncate">{fmtIDR(totalBalance)}</span>
                        </div>
                    </div>

                    <div className="p-5 bg-stone-100 rounded-2xl outline outline-1 outline-offset-[-1px] outline-stone-300 flex items-center gap-4 min-w-0">
                        <div className="w-11 h-11 bg-gray-400/30 rounded-xl flex items-center justify-center shrink-0">
                            <svg width="20" height="12" viewBox="0 0 20 12" fill="none">
                                <path d="M1.4 12L0 10.6L7.4 3.15L11.4 7.15L16.6 2H14V0H20V6H18V3.4L11.4 10L7.4 6L1.4 12Z" fill="#466554" />
                            </svg>
                        </div>
                        <div className="min-w-0 flex-1">
                            <span className="block text-neutral-700 text-[11px] font-normal uppercase leading-4 tracking-wide">PEMASUKAN BULAN INI</span>
                            <span className="block text-emerald-800 text-xl 2xl:text-2xl font-semibold leading-7 truncate">+ {fmtIDR(stats.income)}</span>
                        </div>
                    </div>

                    <div className="p-5 bg-stone-100 rounded-2xl outline outline-1 outline-offset-[-1px] outline-stone-300 flex items-center gap-4 min-w-0">
                        <div className="w-11 h-11 bg-rose-200/30 rounded-xl flex items-center justify-center shrink-0">
                            <svg width="20" height="12" viewBox="0 0 20 12" fill="none">
                                <path d="M14 12V10H16.6L11.4 4.85L7.4 8.85L0 1.4L1.4 0L7.4 6L11.4 2L18 8.6V6H20V12H14Z" fill="#BA1A1A" />
                            </svg>
                        </div>
                        <div className="min-w-0 flex-1">
                            <span className="block text-neutral-700 text-[11px] font-normal uppercase leading-4 tracking-wide">PENGELUARAN BULAN INI</span>
                            <span className="block text-red-700 text-xl 2xl:text-2xl font-semibold leading-7 truncate">- {fmtIDR(stats.expense)}</span>
                        </div>
                    </div>
                </div>

                {/* Wallet Management */}
                <div className="bg-white rounded-2xl outline outline-1 outline-offset-[-1px] outline-stone-300 p-5 sm:p-6 flex flex-col gap-4">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                        <div>
                            <h2 className="text-zinc-900 text-lg font-bold">Dompet Saya</h2>
                            <p className="text-slate-500 text-sm mt-0.5">Tambah, ubah, atau hapus sumber dana yang dipakai transaksi.</p>
                        </div>
                        <button
                            onClick={openAddWallet}
                            className="h-10 px-4 rounded-xl bg-emerald-800 text-white text-sm font-semibold inline-flex items-center justify-center gap-2 hover:bg-emerald-700 transition-colors active:scale-[0.98]"
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                            </svg>
                            Tambah Dompet
                        </button>
                    </div>

                    {walletNotice && (
                        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800">
                            {walletNotice}
                        </div>
                    )}

                    <div className="grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-4">
                        {walletAlloc.map((wallet) => {
                            const usage = walletUsage[wallet.id] || { transactions: 0, rules: 0 };
                            return (
                                <div key={wallet.id} className="rounded-2xl border border-stone-200 bg-stone-50/60 p-4 flex flex-col gap-4 min-w-0">
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="flex items-center gap-3 min-w-0">
                                            <span className="w-11 h-11 rounded-xl shrink-0 flex items-center justify-center text-white" style={{ backgroundColor: wallet.color }}>
                                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                                                </svg>
                                            </span>
                                            <div className="min-w-0">
                                                <h3 className="text-sm font-bold text-zinc-900 truncate">{wallet.name}</h3>
                                                <p className="text-xs text-slate-500">{wallet.pct}% dari total saldo</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-1 shrink-0">
                                            <button
                                                onClick={() => openEditWallet(wallet)}
                                                className="p-2 rounded-lg text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 transition-colors"
                                                title="Edit dompet"
                                            >
                                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                </svg>
                                            </button>
                                            <button
                                                onClick={() => handleDeleteWallet(wallet)}
                                                className="p-2 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                                                title="Hapus dompet"
                                            >
                                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                </svg>
                                            </button>
                                        </div>
                                    </div>
                                    <div>
                                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Saldo Saat Ini</p>
                                        <p className="text-xl font-bold text-zinc-900 truncate">{fmtIDR(wallet.balance)}</p>
                                    </div>
                                    <div className="h-2 rounded-full bg-white overflow-hidden">
                                        <div className="h-full rounded-full" style={{ width: `${wallet.pct}%`, backgroundColor: wallet.color }} />
                                    </div>
                                    <p className="text-xs text-slate-500">
                                        {usage.transactions} transaksi &middot; {usage.rules} aturan rutin
                                    </p>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Filters Section */}
                <div className="px-6 pt-8 pb-6 bg-white rounded-2xl outline outline-1 outline-offset-[-1px] outline-stone-300/50 flex items-end gap-4 flex-wrap">
                    <div className="flex-1 min-w-56 flex flex-col gap-[5px]">
                        <label className="text-neutral-700 text-xs font-normal leading-4 px-1">Cari Transaksi</label>
                        <div className="relative">
                            <span className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-slate-400">
                                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                            </span>
                            <input
                                type="search"
                                value={q}
                                onChange={(e) => setQ(e.target.value)}
                                placeholder="Nama atau catatan..."
                                className="w-full pl-9 pr-4 py-2.5 bg-white rounded-xl outline outline-1 outline-offset-[-1px] outline-stone-300 text-zinc-900 text-sm tracking-wide focus:outline-emerald-800 transition-colors"
                            />
                        </div>
                    </div>

                    <div className="flex-1 min-w-44 flex flex-col gap-[5px]">
                        <label className="text-neutral-700 text-xs font-normal leading-4 px-1">Rentang Tanggal</label>
                        <div className="relative">
                            <select
                                value={selectedDateRange}
                                onChange={(e) => setSelectedDateRange(e.target.value)}
                                className="w-full px-4 pr-8 py-2.5 bg-white rounded-xl outline outline-1 outline-offset-[-1px] outline-stone-300 text-zinc-900 text-sm font-semibold tracking-wide appearance-none focus:outline-emerald-800 transition-colors"
                            >
                                {RANGE_OPTIONS.map((o) => <option key={o}>{o}</option>)}
                            </select>
                            <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none"><SelectArrow /></div>
                        </div>
                    </div>

                    <div className="flex-1 min-w-44 flex flex-col gap-[5px]">
                        <label className="text-neutral-700 text-xs font-normal leading-4 px-1">Kategori</label>
                        <div className="relative">
                            <select
                                value={selectedCategory}
                                onChange={(e) => setSelectedCategory(e.target.value)}
                                className="w-full px-4 pr-8 py-2.5 bg-white rounded-xl outline outline-1 outline-offset-[-1px] outline-stone-300 text-zinc-900 text-sm font-semibold tracking-wide appearance-none focus:outline-emerald-800 transition-colors"
                            >
                                <option>Semua Kategori</option>
                                {categories.map((c) => (
                                    <option key={c.id} value={c.id}>{c.name}</option>
                                ))}
                            </select>
                            <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none"><SelectArrow /></div>
                        </div>
                    </div>

                    <div className="flex-1 min-w-44 flex flex-col gap-[5px]">
                        <label className="text-neutral-700 text-xs font-normal leading-4 px-1">Jenis Transaksi</label>
                        <div className="relative">
                            <select
                                value={selectedType}
                                onChange={(e) => setSelectedType(e.target.value)}
                                className="w-full px-4 pr-8 py-2.5 bg-white rounded-xl outline outline-1 outline-offset-[-1px] outline-stone-300 text-zinc-900 text-sm font-semibold tracking-wide appearance-none focus:outline-emerald-800 transition-colors"
                            >
                                <option>Semua Jenis</option>
                                <option>Pemasukan</option>
                                <option>Pengeluaran</option>
                                <option>Transfer</option>
                            </select>
                            <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none"><SelectArrow /></div>
                        </div>
                    </div>

                    <div className="shrink-0 pb-[1px]">
                        <button
                            onClick={resetFilters}
                            className="px-2.5 py-3 bg-neutral-200 hover:bg-neutral-300 transition-colors rounded-xl outline outline-1 outline-offset-[-1px] outline-stone-300 flex items-center justify-center active:scale-[0.95]"
                            title="Reset Filter"
                        >
                            <svg width="18" height="12" viewBox="0 0 18 12" fill="none">
                                <path d="M7 12V10H11V12H7ZM3 7V5H15V7H3ZM0 2V0H18V2H0Z" fill="#3F4943" />
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Transaction Table Card */}
                <div className="bg-white rounded-2xl shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)] outline outline-1 outline-offset-[-1px] outline-stone-300 flex flex-col overflow-hidden">
                    <div className="w-full overflow-x-auto">
                        <table className="w-full min-w-[860px] table-fixed text-left">
                            <thead>
                                <tr className="bg-white border-b border-stone-300">
                                    <th className="py-4 px-6 w-32 text-neutral-700 text-sm font-semibold uppercase leading-4 tracking-wide">Tanggal</th>
                                    <th className="py-4 px-6 w-64 text-neutral-700 text-sm font-semibold uppercase leading-4 tracking-wide">Deskripsi</th>
                                    <th className="py-4 px-6 w-36 text-neutral-700 text-sm font-semibold uppercase leading-4 tracking-wide">Kategori</th>
                                    <th className="py-4 px-6 w-52 text-neutral-700 text-sm font-semibold uppercase leading-4 tracking-wide">Dompet</th>
                                    <th className="py-4 px-6 w-44 text-right text-neutral-700 text-sm font-semibold uppercase leading-4 tracking-wide">Jumlah</th>
                                    <th className="py-4 px-4 w-24 text-right text-neutral-700 text-sm font-semibold uppercase leading-4 tracking-wide">Aksi</th>
                                </tr>
                            </thead>
                            <tbody>
                                {pageItems.length === 0 && (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-16 text-center text-neutral-500 text-sm">
                                            Tidak ada transaksi yang cocok dengan filter.
                                        </td>
                                    </tr>
                                )}
                                {pageItems.map((t) => (
                                    <tr key={t.id} className={`group hover:bg-stone-50/60 transition-colors ${t !== pageItems[0] ? 'border-t border-stone-300' : ''}`}>
                                        <td className="px-6 py-5">
                                            <span className="block text-zinc-900 text-sm font-semibold leading-4 tracking-wide">{formatDateID(t.date)}</span>
                                            <span className="block text-neutral-700 text-xs leading-4 opacity-70 mt-1">{t.time} WIB</span>
                                        </td>

                                        <td className="px-6 py-5">
                                            <div className="flex items-start gap-3">
                                                {t.auto && (
                                                    <span className="mt-0.5 shrink-0 w-5 h-5 rounded-md bg-emerald-50 text-emerald-700 flex items-center justify-center" title="Dibuat otomatis oleh aturan rutin">
                                                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                                        </svg>
                                                    </span>
                                                )}
                                                <div className="flex flex-col min-w-0">
                                                    <span className="text-zinc-900 text-sm font-semibold leading-4 tracking-wide truncate">{t.title}</span>
                                                    {t.note && <span className="text-neutral-700 text-xs leading-4 mt-1 truncate">{t.note}</span>}
                                                </div>
                                            </div>
                                        </td>

                                        <td className="px-6 py-5">{renderCategoryCell(t)}</td>
                                        <td className="px-6 py-5">{renderWalletCell(t)}</td>

                                        <td className="px-6 py-5 text-right">
                                            <span className={`text-lg font-semibold leading-6 ${amountClass(t)}`}>
                                                {t.type === 'expense' ? `- ${fmtIDR(t.amount)}` : `+ ${fmtIDR(t.amount)}`}
                                            </span>
                                        </td>

                                        <td className="px-4 py-5">
                                            <div className="flex items-center justify-end gap-1.5 opacity-60 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={() => openEdit(t)}
                                                    className="p-2 rounded-lg hover:bg-emerald-50 text-slate-500 hover:text-emerald-700 transition-colors"
                                                    title="Edit transaksi"
                                                >
                                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                    </svg>
                                                </button>
                                                <button
                                                    onClick={() => setDeletingId(t.id)}
                                                    className="p-2 rounded-lg hover:bg-red-50 text-slate-500 hover:text-red-600 transition-colors"
                                                    title="Hapus transaksi"
                                                >
                                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                    </svg>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination Footer */}
                    <div className="px-6 py-4 bg-white border-t border-stone-300 flex justify-between items-center flex-wrap gap-3">
                        <span className="text-neutral-700 text-xs font-normal leading-4">
                            Menampilkan {filtered.length === 0 ? 0 : (pageSafe - 1) * PAGE_SIZE + 1} - {Math.min(pageSafe * PAGE_SIZE, filtered.length)} dari {filtered.length} transaksi
                        </span>
                        <div className="flex items-center gap-2">
                            <button
                                disabled={pageSafe === 1}
                                onClick={() => setCurrentPage(pageSafe - 1)}
                                className="w-8 h-8 rounded-lg outline outline-1 outline-offset-[-1px] outline-stone-300 flex items-center justify-center text-[#3F4943] hover:bg-stone-100 transition-colors disabled:opacity-30 disabled:pointer-events-none"
                            >
                                <svg width="7" height="10" viewBox="0 0 7 10" fill="none"><path d="M5 10L0 5L5 0L6.16667 1.16667L2.33333 5L6.16667 8.83333L5 10Z" fill="currentColor" /></svg>
                            </button>
                            {pageNumbers.map((n) => (
                                <button
                                    key={n}
                                    onClick={() => setCurrentPage(n)}
                                    className={`w-8 h-8 rounded-lg text-sm font-semibold flex items-center justify-center transition-colors ${pageSafe === n ? 'bg-emerald-800 text-white' : 'outline outline-1 outline-offset-[-1px] outline-stone-300 text-neutral-700 hover:bg-stone-100'}`}
                                >
                                    {n}
                                </button>
                            ))}
                            <button
                                disabled={pageSafe === totalPages}
                                onClick={() => setCurrentPage(pageSafe + 1)}
                                className="w-8 h-8 rounded-lg outline outline-1 outline-offset-[-1px] outline-stone-300 flex items-center justify-center text-[#3F4943] hover:bg-stone-100 transition-colors disabled:opacity-30 disabled:pointer-events-none"
                            >
                                <svg width="7" height="10" viewBox="0 0 7 10" fill="none"><path d="M3.83333 5L0 1.16667L1.16667 0L6.16667 5L1.16667 10L0 8.83333L3.83333 5Z" fill="currentColor" /></svg>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Insight + Wallet Allocation */}
                <div className="pt-6 grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div className="min-h-64 bg-zinc-900 rounded-2xl flex flex-col justify-end items-start overflow-hidden p-8 relative group">
                        {/* Background illustration covering full card */}
                        <div className="absolute inset-0 w-full h-full pointer-events-none select-none overflow-hidden">
                            <img 
                                src={insightIllustration} 
                                alt="Insight Illustration" 
                                className="w-full h-full object-cover opacity-35 transition-transform duration-700 group-hover:scale-[1.03]"
                            />
                            {/* Dark gradient overlay for text readability */}
                            <div className="absolute inset-0 bg-gradient-to-r from-zinc-950 via-zinc-900/85 to-transparent" />
                        </div>
                        <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-transparent to-emerald-500/5 pointer-events-none" />
                        <div className="z-10 space-y-2">
                            <h4 className="text-white text-2xl font-semibold leading-8">Insight Pintar</h4>
                            <p className="text-white/80 text-base font-normal leading-6 max-w-sm">
                                Selisih arus kas bulan ini:{' '}
                                <span className={stats.net >= 0 ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                                    {stats.net >= 0 ? '+' : ''}{fmtIDR(stats.net)}
                                </span>
                                . {stats.net >= 0 ? 'Keuangan Anda sehat bulan ini!' : 'Perhatikan pengeluaran Anda.'}
                            </p>
                        </div>
                    </div>

                    <div className="p-6 bg-white rounded-2xl outline outline-1 outline-offset-[-1px] outline-stone-300 flex flex-col gap-4">
                        <div className="flex justify-between items-center">
                            <span className="text-neutral-700 text-sm font-semibold uppercase leading-4 tracking-wide">ALOKASI DOMPET</span>
                            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                                <path d="M11 9H17.95C17.7 7.16667 16.9375 5.6125 15.6625 4.3375C14.3875 3.0625 12.8333 2.3 11 2.05V9ZM9 17.95V2.05C6.98333 2.3 5.3125 3.17917 3.9875 4.6875C2.6625 6.19583 2 7.96667 2 10C2 12.0333 2.6625 13.8042 3.9875 15.3125C5.3125 16.8208 6.98333 17.7 9 17.95ZM11 17.95C12.8333 17.7167 14.3917 16.9583 15.675 15.675C16.9583 14.3917 17.7167 12.8333 17.95 11H11V17.95ZM10 20C8.61667 20 7.31667 19.7375 6.1 19.2125C4.88333 18.6875 3.825 17.975 2.925 17.075C2.025 16.175 1.3125 15.1167 0.7875 13.9C0.2625 12.6833 0 11.3833 0 10C0 8.61667 0.2625 7.31667 0.7875 6.1C1.3125 4.88333 2.025 3.825 2.925 2.925C3.825 2.025 4.88333 1.3125 6.1 0.7875C7.31667 0.2625 8.61667 0 10 0C11.3833 0 12.6792 0.2625 13.8875 0.7875C15.0958 1.3125 16.1542 2.02917 17.0625 2.9375C17.9708 3.84583 18.6875 4.90417 19.2125 6.1125C19.7375 7.32083 20 8.61667 20 10C20 11.3667 19.7375 12.6583 19.2125 13.875C18.6875 15.0917 17.975 16.1542 17.075 17.0625C16.175 17.9708 15.1167 18.6875 13.9 19.2125C12.6833 19.7375 11.3833 20 10 20Z" fill="#6F7A72" />
                            </svg>
                        </div>
                        <div className="flex flex-col gap-4">
                            {walletAlloc.map((w) => (
                                <div key={w.id} className="flex flex-col gap-1.5">
                                    <div className="flex justify-between">
                                        <span className="text-zinc-900 text-sm font-semibold leading-4 tracking-wide">{w.name}</span>
                                        <span className="text-zinc-900 text-sm font-bold leading-4 tracking-wide">{w.pct}%</span>
                                    </div>
                                    <div className="h-2 bg-neutral-200 rounded-full overflow-hidden">
                                        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${w.pct}%`, backgroundColor: w.color }} />
                                    </div>
                                    <span className="text-xs text-neutral-500">{fmtIDR(w.balance)}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Recurring Rules Section */}
                <div className="bg-white rounded-2xl shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)] outline outline-1 outline-offset-[-1px] outline-stone-300 p-6">
                    <div className="flex justify-between items-center mb-5 flex-wrap gap-3">
                        <div>
                            <h3 className="text-zinc-900 text-lg font-bold">Transaksi Rutin</h3>
                            <p className="text-slate-500 text-sm mt-0.5">Dicatat otomatis sesuai jadwal saat aplikasi dibuka.</p>
                        </div>
                        <button
                            onClick={() => setRecurringOpen(true)}
                            className="px-4 py-2 bg-stone-100 hover:bg-stone-200 transition-colors rounded-xl outline outline-1 outline-offset-[-1px] outline-stone-300 text-zinc-900 text-sm font-semibold tracking-wide active:scale-[0.98]"
                        >
                            + Aturan Baru
                        </button>
                    </div>

                    {recurringRules.length === 0 ? (
                        <p className="text-sm text-neutral-500 py-6 text-center">Belum ada aturan rutin. Buat satu untuk gaji, langganan, atau tagihan bulanan Anda.</p>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                            {recurringRules.map((rule) => (
                                <div key={rule.id} className={`rounded-xl outline outline-1 outline-offset-[-1px] p-4 flex flex-col gap-3 ${rule.active ? 'outline-stone-200 bg-stone-50/50' : 'outline-stone-200 bg-slate-50 opacity-60'}`}>
                                    <div className="flex justify-between items-start gap-2">
                                        <div className="min-w-0">
                                            <p className="font-bold text-sm text-zinc-900 truncate">{rule.title}</p>
                                            <p className="text-xs text-slate-500 mt-0.5">
                                                {categoryById[rule.categoryId]?.name || '-'} &bull; {walletById[rule.walletId]?.name || '-'}
                                            </p>
                                        </div>
                                        <span className={`shrink-0 px-2 py-0.5 rounded-full text-[10px] font-bold ${rule.type === 'income' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-50 text-red-600'}`}>
                                            {rule.type === 'income' ? '+' : '-'}{fmtIDR(rule.amount)}
                                        </span>
                                    </div>

                                    <div className="flex items-center gap-2 text-xs text-slate-600">
                                        <span className="px-2 py-0.5 bg-white rounded-md outline outline-1 outline-stone-200 font-semibold">{FREQ_LABELS[rule.frequency]}</span>
                                        <span>Berikutnya: <b>{formatDateID(rule.nextDate)}</b></span>
                                    </div>

                                    <div className="flex items-center justify-between pt-1 border-t border-stone-200/70">
                                        <button
                                            onClick={() => toggleRecurringRule(rule.id)}
                                            className={`relative w-10 h-5 rounded-full transition-colors ${rule.active ? 'bg-emerald-700' : 'bg-stone-300'}`}
                                            title={rule.active ? 'Nonaktifkan' : 'Aktifkan'}
                                        >
                                            <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all ${rule.active ? 'left-[22px]' : 'left-0.5'}`} />
                                        </button>
                                        <div className="flex gap-1">
                                            <button
                                                onClick={() => { deleteRecurringRule(rule.id); }}
                                                className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-600 transition-colors"
                                                title="Hapus aturan"
                                            >
                                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                </svg>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

            </div>

            {/* Delete confirmation */}
            {deletingId && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setDeletingId(null)} />
                    <div className="bg-white rounded-2xl shadow-xl p-6 max-w-sm w-full relative z-10">
                        <h3 className="font-bold text-slate-800 text-lg">Hapus Transaksi?</h3>
                        <p className="text-sm text-slate-500 mt-1.5">Transaksi yang dihapus tidak dapat dikembalikan.</p>
                        <div className="flex gap-3 justify-end mt-6">
                            <button
                                onClick={() => setDeletingId(null)}
                                className="px-5 py-2.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-medium text-sm transition-colors active:scale-95"
                            >
                                Batal
                            </button>
                            <button
                                onClick={() => { deleteTransaction(deletingId); setDeletingId(null); }}
                                className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-medium text-sm transition-colors active:scale-95"
                            >
                                Hapus
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modals */}
            <AddTransactionModal
                isOpen={modalOpen}
                onClose={() => setModalOpen(false)}
                editing={editingTxn}
                initialType={initialType}
            />
            <RecurringModal isOpen={recurringOpen} onClose={() => setRecurringOpen(false)} />
            <WalletModal
                isOpen={walletModalOpen}
                onClose={() => setWalletModalOpen(false)}
                editing={editingWallet}
            />
        </AuthenticatedLayout>
    );
}
