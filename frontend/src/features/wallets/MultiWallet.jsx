import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import AuthenticatedLayout from '../../layouts/AuthenticatedLayout';
import AddTransactionModal from '../../components/shared/AddTransactionModal';
import RecurringModal from '../../components/shared/RecurringModal';
import WalletModal from './components/WalletModal';
import BudgetAlertBanner from '../../components/shared/BudgetAlertBanner';
import MobileTransactionList from '../../mobile/components/MobileTransactionList';
import Modal from '../../components/ui/Modal';
import { useFinance } from '../../contexts/FinanceContext';
import { FREQ_LABELS, fmtIDR, formatDateID, todayISO } from '../../utils/format';
import {
    ArrowRight,
    ArrowRightLeft,
    BarChart3,
    ChevronDown,
    ChevronLeft,
    ChevronRight,
    Download,
    Lightbulb,
    Pencil,
    Plus,
    ReceiptText,
    RefreshCw,
    Repeat2,
    Search,
    SlidersHorizontal,
    Trash2,
    TrendingDown,
    TrendingUp,
    Wallet,
} from 'lucide-react';

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
        syncLoading, syncError, retrySync,
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
    const [deletingRuleId, setDeletingRuleId] = useState(null);
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
            if (!ql && cutoffISO && t.date < cutoffISO) return false;
            if (!ql && selectedDateRange === 'Hari Ini' && t.date !== today) return false;
            if (selectedType === 'Pemasukan' && t.type !== 'income') return false;
            if (selectedType === 'Pengeluaran' && t.type !== 'expense') return false;
            if (selectedType === 'Transfer' && t.type !== 'transfer') return false;
            if (selectedCategory !== 'Semua Kategori' && t.categoryId !== selectedCategory) return false;
            if (ql) {
                const hay = [
                    t.title,
                    t.note,
                    t.type === 'income' ? 'pemasukan' : t.type === 'expense' ? 'pengeluaran' : 'transfer',
                    categoryById[t.categoryId]?.name,
                    walletById[t.walletId]?.name,
                    walletById[t.fromWalletId]?.name,
                    walletById[t.toWalletId]?.name,
                ].filter(Boolean).join(' ').toLowerCase();
                if (!ql.split(/\s+/).every((token) => hay.includes(token))) return false;
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
        a.download = `sakuta-transaksi-${todayISO()}.csv`;
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
        <ChevronDown className="h-4 w-4 text-slate-500" aria-hidden="true" />
    );

    const renderCategoryCell = (t) => {
        if (t.type === 'transfer') {
            return (
                    <span className="ui-badge ui-tone-info inline-flex items-center gap-1">
                    <ArrowRightLeft className="h-3.5 w-3.5" aria-hidden="true" />
                    Transfer
                </span>
            );
        }
        const cat = categoryById[t.categoryId];
        return (
            <span className={`ui-badge ${cat?.badge || 'bg-stone-100 text-stone-600 border-stone-200'}`}>
                {getCategoryLabel(t)}
            </span>
        );
    };

    const renderWalletCell = (t) => {
        if (t.type === 'transfer') {
            return (
                <div className="flex items-center gap-1.5 min-w-0">
                    <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: walletById[t.fromWalletId]?.color || '#ccc' }} />
                    <span className="text-zinc-900 text-sm font-semibold truncate max-w-[80px]">{walletById[t.fromWalletId]?.name || '?'}</span>
                    <ArrowRight className="h-3.5 w-3.5 shrink-0 text-slate-400" aria-hidden="true" />
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
        t.type === 'income' ? 'ui-tone-positive-text' : t.type === 'expense' ? 'ui-tone-danger-text' : 'text-slate-600';

    const getCategoryLabel = (t) => (
        t.type === 'transfer' ? 'Transfer' : categoryById[t.categoryId]?.name || 'Tanpa Kategori'
    );

    const getWalletLabel = (t) => (
        t.type === 'transfer'
            ? `${walletById[t.fromWalletId]?.name || '?'} > ${walletById[t.toWalletId]?.name || '?'}`
            : walletById[t.walletId]?.name || '-'
    );

    const getAmountLabel = (t) => `${t.type === 'expense' ? '- ' : '+ '}${fmtIDR(t.amount)}`;

    const hasActiveFilters = Boolean(
        q.trim()
        || selectedDateRange !== '30 Hari Terakhir'
        || selectedCategory !== 'Semua Kategori'
        || selectedType !== 'Semua Jenis'
    );
    const emptyTransactionMessage = hasActiveFilters
        ? 'Tidak ada transaksi yang sesuai filter.'
        : 'Belum ada transaksi.';
    const initialSyncLoading = syncLoading && transactions.length === 0;
    const deletingTransaction = transactions.find((transaction) => transaction.id === deletingId);
    const deletingRule = recurringRules.find((rule) => rule.id === deletingRuleId);

    const pageNumbers = useMemo(() => {
        const nums = [];
        const start = Math.max(1, Math.min(pageSafe - 2, totalPages - 4));
        for (let n = start; n <= Math.min(totalPages, start + 4); n++) nums.push(n);
        return nums;
    }, [pageSafe, totalPages]);

    return (
        <AuthenticatedLayout onAddTransaction={openAdd}>
            <div className="app-page">

                {/* Header Section */}
                <div className="app-page-header">
                    <div className="min-w-0">
                        <h1 className="app-page-title">Riwayat Transaksi</h1>
                        <p className="app-page-description">Kelola dan pantau semua aliran dana Anda secara langsung.</p>
                    </div>
                    <div className="transaction-header-actions grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-3 w-full xl:w-auto xl:justify-end">
                        <button
                            onClick={openTransfer}
                            className="transaction-header-action ui-button min-w-0 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 inline-flex items-center justify-center gap-2"
                        >
                            <ArrowRightLeft className="h-4 w-4" aria-hidden="true" />
                            Transfer Dompet
                        </button>
                        <button
                            onClick={() => setRecurringOpen(true)}
                            className="transaction-header-action ui-button min-w-0 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 inline-flex items-center justify-center gap-2"
                        >
                            <Repeat2 className="h-4 w-4" aria-hidden="true" />
                            Aturan Rutin
                        </button>
                        <button
                            onClick={exportCSV}
                            className="transaction-header-action transaction-export-action ui-button min-w-0 bg-slate-700 hover:bg-slate-800 text-white inline-flex items-center justify-center gap-2.5"
                        >
                            <Download className="h-4 w-4" aria-hidden="true" />
                            Ekspor Data
                        </button>
                        <button
                            onClick={openAdd}
                            className="transaction-header-action transaction-add-action ui-button min-w-0 bg-emerald-800 hover:bg-emerald-700 text-white inline-flex items-center justify-center gap-2.5"
                        >
                            <Plus className="h-4 w-4" aria-hidden="true" strokeWidth={2.5} />
                            Tambah Transaksi
                        </button>
                    </div>
                </div>

                <BudgetAlertBanner />

                {syncError && (
                    <div role="alert" className="ui-notice flex flex-col gap-3 border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-semibold text-rose-800 sm:flex-row sm:items-center sm:justify-between">
                        <span className="min-w-0">Data transaksi tidak dapat dimuat. Periksa koneksi Anda lalu coba lagi.</span>
                        <button
                            type="button"
                            onClick={retrySync}
                            className="ui-button min-h-[44px] shrink-0 bg-white px-4 py-2 text-rose-800 hover:bg-rose-100 sm:min-h-0"
                        >
                            Coba lagi
                        </button>
                    </div>
                )}

                {/* Bento Grid Summary */}
                <div className="transaction-summary-grid grid grid-cols-[repeat(auto-fit,minmax(230px,1fr))] gap-4">
                    <div className="transaction-stat-card transaction-stat-balance ui-stat-card flex items-center gap-3 min-w-0 bg-stone-50">
                        <div className="ui-tone-icon ui-tone-info w-10 h-10 rounded-lg flex items-center justify-center shrink-0">
                            <Wallet className="h-5 w-5" aria-hidden="true" />
                        </div>
                        <div className="min-w-0 flex-1">
                            <span className="block text-neutral-700 text-xs font-medium leading-4">Total saldo</span>
                            <span className="block text-zinc-900 text-lg font-semibold leading-6 truncate">{fmtIDR(totalBalance)}</span>
                        </div>
                    </div>

                    <div className="transaction-stat-card transaction-stat-income ui-stat-card flex items-center gap-3 min-w-0 bg-stone-50">
                        <div className="ui-tone-icon ui-tone-positive w-10 h-10 rounded-lg flex items-center justify-center shrink-0">
                            <TrendingUp className="h-5 w-5" aria-hidden="true" />
                        </div>
                        <div className="min-w-0 flex-1">
                            <span className="block text-neutral-700 text-xs font-medium leading-4">Pemasukan bulan ini</span>
                            <span className="block text-emerald-800 text-lg font-semibold leading-6 truncate">+ {fmtIDR(stats.income)}</span>
                        </div>
                    </div>

                    <div className="transaction-stat-card transaction-stat-expense ui-stat-card flex items-center gap-3 min-w-0 bg-stone-50">
                        <div className="ui-tone-icon ui-tone-danger w-10 h-10 rounded-lg flex items-center justify-center shrink-0">
                            <TrendingDown className="h-5 w-5" aria-hidden="true" />
                        </div>
                        <div className="min-w-0 flex-1">
                            <span className="block text-neutral-700 text-xs font-medium leading-4">Pengeluaran bulan ini</span>
                             <span className="block ui-tone-danger-text text-lg font-semibold leading-6 truncate">- {fmtIDR(stats.expense)}</span>
                        </div>
                    </div>
                </div>

                {/* Wallet Management */}
                <div className="wallet-management-card ui-card p-4 flex flex-col gap-3">
                    <div className="flex flex-col gap-3">
                        <div>
                            <h2 className="ui-section-title">Dompet Saya</h2>
                            <p className="ui-section-description">Tambah, ubah, atau hapus sumber dana yang dipakai transaksi.</p>
                        </div>
                    </div>

                    {walletNotice && (
                        <div className="ui-notice ui-notice-warning">
                            {walletNotice}
                        </div>
                    )}

                    <div className="wallet-grid grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-4">
                        {walletAlloc.map((wallet) => {
                            const usage = walletUsage[wallet.id] || { transactions: 0, rules: 0 };
                            return (
                                 <div key={wallet.id} className="wallet-card ui-card-subtle p-4 flex flex-col gap-4 min-w-0">
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="flex items-center gap-3 min-w-0">
                                             <span className="wallet-card-icon w-11 h-11 rounded-xl shrink-0 flex items-center justify-center text-white" style={{ backgroundColor: wallet.color }}>
                                                <Wallet className="h-5 w-5" aria-hidden="true" />
                                            </span>
                                            <div className="min-w-0">
                                                <h3 className="text-sm font-medium text-zinc-900 truncate">{wallet.name}</h3>
                                                 <p className="whitespace-nowrap text-xs text-slate-500">{wallet.pct}% dari total saldo</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-1 shrink-0">
                                            <button
                                                onClick={() => openEditWallet(wallet)}
                                                className="ui-icon-button"
                                                aria-label={`Edit dompet ${wallet.name}`}
                                                title="Edit dompet"
                                            >
                                                <Pencil className="h-4 w-4" aria-hidden="true" />
                                            </button>
                                            <button
                                                onClick={() => handleDeleteWallet(wallet)}
                                                className="ui-icon-button ui-icon-button-danger"
                                                aria-label={`Hapus dompet ${wallet.name}`}
                                                title="Hapus dompet"
                                            >
                                                <Trash2 className="h-4 w-4" aria-hidden="true" />
                                            </button>
                                        </div>
                                    </div>
                                    <div className="wallet-card-balance">
                                         <p className="text-xs font-medium text-slate-500">Saldo saat ini</p>
                                         <p className="text-xl font-semibold text-zinc-900 truncate">{fmtIDR(wallet.balance)}</p>
                                    </div>
                                    <div className="wallet-card-progress h-2 rounded-full bg-white overflow-hidden">
                                        <div className="h-full rounded-full" style={{ width: `${wallet.pct}%`, backgroundColor: wallet.color }} />
                                    </div>
                                     <p className="wallet-card-meta flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-500">
                                         <span className="inline-flex items-center gap-1">
                                             <ReceiptText className="h-3.5 w-3.5" aria-hidden="true" />
                                             {usage.transactions} transaksi
                                         </span>
                                         <span aria-hidden="true">&middot;</span>
                                         <span className="inline-flex items-center gap-1">
                                             <Repeat2 className="h-3.5 w-3.5" aria-hidden="true" />
                                             {usage.rules} aturan rutin
                                         </span>
                                     </p>
                                </div>
                            );
                        })}
                        <button
                            type="button"
                            onClick={openAddWallet}
                            className="wallet-add-card group flex min-w-0 flex-col items-center justify-center gap-3 text-center"
                        >
                            <span className="wallet-add-card-icon flex h-9 w-9 items-center justify-center rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-800 transition-colors duration-150 group-hover:border-emerald-300 group-hover:bg-emerald-100">
                                <Plus className="h-5 w-5" aria-hidden="true" strokeWidth={2.25} />
                            </span>
                            <span className="text-sm font-semibold text-emerald-800">Tambah Dompet</span>
                        </button>
                    </div>
                </div>

                {/* Filters Section */}
                <div className="wallet-filter-card ui-card grid grid-cols-1 gap-3 p-4 sm:flex sm:items-end sm:flex-wrap xl:flex-nowrap">
                    <div className="wallet-filter-field flex w-full min-w-0 flex-col gap-1.5 sm:min-w-56 sm:flex-1">
                        <label htmlFor="wallet-transaction-search" className="text-neutral-700 text-xs font-normal leading-4 px-1">Cari Transaksi</label>
                        <div className="relative">
                            <span className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-slate-400">
                                <Search className="h-[15px] w-[15px]" aria-hidden="true" />
                            </span>
                            <input
                                id="wallet-transaction-search"
                                type="search"
                                value={q}
                                onChange={(e) => setQ(e.target.value)}
                                placeholder="Nama atau catatan..."
                                  className="ui-control w-full pl-9 pr-3 py-2 transition-colors"
                            />
                        </div>
                    </div>

                    <div className="wallet-filter-field flex w-full min-w-0 flex-col gap-1.5 sm:min-w-44 sm:flex-1">
                        <label htmlFor="wallet-date-range" className="text-neutral-700 text-xs font-normal leading-4 px-1">Rentang Tanggal</label>
                        <div className="relative">
                            <select
                                id="wallet-date-range"
                                value={selectedDateRange}
                                onChange={(e) => setSelectedDateRange(e.target.value)}
                                  className="ui-control w-full px-3 pr-8 py-2 appearance-none transition-colors"
                            >
                                {RANGE_OPTIONS.map((o) => <option key={o}>{o}</option>)}
                            </select>
                            <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none"><SelectArrow /></div>
                        </div>
                    </div>

                    <div className="wallet-filter-field flex w-full min-w-0 flex-col gap-1.5 sm:min-w-44 sm:flex-1">
                        <label htmlFor="wallet-category-filter" className="text-neutral-700 text-xs font-normal leading-4 px-1">Kategori</label>
                        <div className="relative">
                            <select
                                id="wallet-category-filter"
                                value={selectedCategory}
                                onChange={(e) => setSelectedCategory(e.target.value)}
                                 className="ui-control w-full px-3 pr-8 py-2 appearance-none transition-colors"
                            >
                                <option>Semua Kategori</option>
                                {categories.map((c) => (
                                    <option key={c.id} value={c.id}>{c.name}</option>
                                ))}
                            </select>
                            <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none"><SelectArrow /></div>
                        </div>
                    </div>

                    <div className="wallet-filter-field flex w-full min-w-0 flex-col gap-1.5 sm:min-w-44 sm:flex-1">
                        <label htmlFor="wallet-type-filter" className="text-neutral-700 text-xs font-normal leading-4 px-1">Jenis Transaksi</label>
                        <div className="relative">
                            <select
                                id="wallet-type-filter"
                                value={selectedType}
                                onChange={(e) => setSelectedType(e.target.value)}
                                 className="ui-control w-full px-3 pr-8 py-2 appearance-none transition-colors"
                            >
                                <option>Semua Jenis</option>
                                <option>Pemasukan</option>
                                <option>Pengeluaran</option>
                                <option>Transfer</option>
                            </select>
                            <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none"><SelectArrow /></div>
                        </div>
                    </div>

                    <div className="wallet-filter-action w-full shrink-0 sm:w-auto">
                        <button
                            type="button"
                            onClick={resetFilters}
                            disabled={!hasActiveFilters}
                            className="wallet-reset-filter ui-button ui-button-touch inline-flex w-full items-center justify-center gap-2 border border-slate-200 bg-white px-3 text-slate-600 transition-colors hover:border-slate-300 hover:bg-slate-50 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50 sm:w-auto"
                            aria-label="Reset filter transaksi"
                            title="Reset Filter"
                        >
                            <SlidersHorizontal className="h-4 w-4" aria-hidden="true" />
                            <span>Reset filter</span>
                        </button>
                    </div>
                </div>

                {/* Transaction Table Card */}
                <div className="ui-card p-0 flex flex-col overflow-hidden">
                    <div className="hidden w-full overflow-x-auto sm:block">
                        <table className="w-full min-w-[860px] table-fixed text-left">
                            <thead>
                                <tr className="bg-white border-b border-stone-300">
                                    <th className="py-3 px-4 w-32 text-neutral-700 text-xs font-medium leading-4">Tanggal</th>
                                    <th className="py-3 px-4 w-64 text-neutral-700 text-xs font-medium leading-4">Deskripsi</th>
                                    <th className="py-3 px-4 w-36 text-neutral-700 text-xs font-medium leading-4">Kategori</th>
                                    <th className="py-3 px-4 w-52 text-neutral-700 text-xs font-medium leading-4">Dompet</th>
                                    <th className="py-3 px-4 w-44 text-right text-neutral-700 text-xs font-medium leading-4">Jumlah</th>
                                    <th className="py-3 px-3 w-24 text-right text-neutral-700 text-xs font-medium leading-4">Aksi</th>
                                </tr>
                            </thead>
                            <tbody>
                                {pageItems.length === 0 && (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-16 text-center text-neutral-500 text-sm">
                                            <div className="flex flex-col items-center gap-2">
                                                <ReceiptText className="h-7 w-7 text-slate-300" aria-hidden="true" />
                                                <span>{initialSyncLoading ? 'Memuat transaksi...' : emptyTransactionMessage}</span>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                                {pageItems.map((t) => (
                                    <tr key={t.id} className={`group hover:bg-stone-50/60 transition-colors ${t !== pageItems[0] ? 'border-t border-stone-300' : ''}`}>
                                        <td className="px-4 py-3">
                                            <span className="block text-zinc-900 text-sm font-semibold leading-4 tracking-wide">{formatDateID(t.date)}</span>
                                            <span className="block text-neutral-700 text-xs leading-4 opacity-70 mt-1">{t.time} WIB</span>
                                        </td>

                                        <td className="px-4 py-3">
                                            <div className="flex items-start gap-3">
                                                {t.auto && (
                                                    <span className="mt-0.5 shrink-0 w-5 h-5 rounded-md bg-emerald-50 text-emerald-700 flex items-center justify-center" title="Dibuat otomatis oleh aturan rutin">
                                                        <Repeat2 className="h-3.5 w-3.5" aria-hidden="true" />
                                                    </span>
                                                )}
                                                <div className="flex flex-col min-w-0">
                                                    <span className="text-zinc-900 text-sm font-semibold leading-4 tracking-wide truncate">{t.title}</span>
                                                    {t.note && <span className="text-neutral-700 text-xs leading-4 mt-1 truncate">{t.note}</span>}
                                                </div>
                                            </div>
                                        </td>

                                        <td className="px-4 py-3">{renderCategoryCell(t)}</td>
                                        <td className="px-4 py-3">{renderWalletCell(t)}</td>

                                        <td className="px-4 py-3 text-right">
                            <span className={`text-sm font-semibold leading-5 ${amountClass(t)}`}>
                                                {getAmountLabel(t)}
                                            </span>
                                        </td>

                                        <td className="px-3 py-3">
                                            <div className="flex items-center justify-end gap-1.5 opacity-60 group-hover:opacity-100 transition-opacity">
                                                 <button
                                                     type="button"
                                                     onClick={() => openEdit(t)}
                                                      className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg p-2 text-slate-500 transition-colors hover:bg-emerald-50 hover:text-emerald-700"
                                                     aria-label={`Edit transaksi ${t.title}`}
                                                     title="Edit transaksi"
                                                >
                                                      <Pencil className="h-4 w-4" aria-hidden="true" />
                                                </button>
                                                 <button
                                                     type="button"
                                                     onClick={() => setDeletingId(t.id)}
                                                       className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg p-2 text-slate-500 transition-colors hover:bg-rose-50 hover:text-rose-600"
                                                     aria-label={`Hapus transaksi ${t.title}`}
                                                     title="Hapus transaksi"
                                                >
                                                      <Trash2 className="h-4 w-4" aria-hidden="true" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <MobileTransactionList
                        items={pageItems}
                        loading={initialSyncLoading}
                        emptyMessage={emptyTransactionMessage}
                        getCategoryLabel={getCategoryLabel}
                        getWalletLabel={getWalletLabel}
                        getAmountLabel={getAmountLabel}
                        getAmountClass={amountClass}
                        onEdit={openEdit}
                        onDelete={(id) => setDeletingId(id)}
                    />

                    {/* Pagination Footer */}
                    <div className="flex flex-col gap-3 border-t border-stone-300 bg-white px-4 py-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
                        <span className="hidden text-neutral-700 text-xs font-normal leading-4 sm:inline">
                            Menampilkan {filtered.length === 0 ? 0 : (pageSafe - 1) * PAGE_SIZE + 1} - {Math.min(pageSafe * PAGE_SIZE, filtered.length)} dari {filtered.length} transaksi
                        </span>
                        <div className="flex w-full items-center justify-between gap-2 sm:w-auto sm:justify-end">
                            <button
                                type="button"
                                disabled={pageSafe === 1}
                                onClick={() => setCurrentPage(pageSafe - 1)}
                                className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center gap-1 rounded-lg px-2 text-[#3F4943] outline outline-1 outline-offset-[-1px] outline-stone-300 transition-colors hover:bg-stone-100 disabled:pointer-events-none disabled:opacity-30 sm:h-8 sm:min-h-0 sm:w-8 sm:min-w-0 sm:px-0"
                                aria-label="Halaman sebelumnya"
                            >
                                <ChevronLeft className="h-4 w-4" aria-hidden="true" />
                                <span className="text-xs font-medium sm:hidden">Sebelumnya</span>
                            </button>
                            <span className="text-center text-xs font-medium leading-4 text-neutral-700 sm:hidden">
                                {pageSafe} / {totalPages}
                            </span>
                            <div className="hidden items-center gap-2 sm:flex">
                                {pageNumbers.map((n) => (
                                    <button
                                        type="button"
                                        key={n}
                                        onClick={() => setCurrentPage(n)}
                                        aria-label={`Buka halaman ${n}`}
                                        aria-current={pageSafe === n ? 'page' : undefined}
                                        className={`flex h-8 w-8 items-center justify-center rounded-lg text-sm font-semibold transition-colors ${pageSafe === n ? 'bg-emerald-800 text-white' : 'outline outline-1 outline-offset-[-1px] outline-stone-300 text-neutral-700 hover:bg-stone-100'}`}
                                    >
                                        {n}
                                    </button>
                                ))}
                            </div>
                            <button
                                type="button"
                                disabled={pageSafe === totalPages}
                                onClick={() => setCurrentPage(pageSafe + 1)}
                                className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center gap-1 rounded-lg px-2 text-[#3F4943] outline outline-1 outline-offset-[-1px] outline-stone-300 transition-colors hover:bg-stone-100 disabled:pointer-events-none disabled:opacity-30 sm:h-8 sm:min-h-0 sm:w-8 sm:min-w-0 sm:px-0"
                                aria-label="Halaman berikutnya"
                            >
                                <ChevronRight className="h-4 w-4" aria-hidden="true" />
                                <span className="text-xs font-medium sm:hidden">Berikutnya</span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Insight + Wallet Allocation */}
                 <div className="grid grid-cols-1 items-stretch gap-6 lg:grid-cols-2">
                    <section className="ui-insight flex min-w-0 items-start gap-3 p-4 sm:p-5" aria-labelledby="wallet-insight-heading">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-800">
                            <Lightbulb className="h-4 w-4" aria-hidden="true" />
                        </div>
                        <div className="min-w-0 space-y-1.5">
                            <h4 id="wallet-insight-heading" className="ui-section-title">Insight pintar</h4>
                            {stats.income > 0 || stats.expense > 0 ? (
                                <>
                                    <p className="max-w-sm text-sm leading-relaxed text-emerald-950">
                                        Selisih arus kas bulan ini:{' '}
                                        <span className={stats.net >= 0 ? 'font-semibold text-emerald-800' : 'font-semibold text-rose-700'}>
                                            {stats.net >= 0 ? '+' : ''}{fmtIDR(stats.net)}
                                        </span>
                                    </p>
                                    <p className="text-xs leading-relaxed text-emerald-900/75">
                                        {stats.net >= 0 ? 'Keuangan Anda sehat bulan ini!' : 'Perhatikan pengeluaran Anda.'}
                                    </p>
                                </>
                            ) : (
                                <>
                                    <p className="text-sm font-medium leading-relaxed text-emerald-950">
                                        Belum cukup data untuk membuat insight bulan ini.
                                    </p>
                                    <p className="text-xs leading-relaxed text-emerald-900/75">
                                        Catat beberapa transaksi untuk melihat pola keuangan Anda.
                                    </p>
                                </>
                            )}
                        </div>
                    </section>

                     <div className="wallet-allocation-card ui-card p-5 flex flex-col gap-3">
                        <div className="flex justify-between items-center">
                            <span className="text-neutral-700 text-sm font-semibold leading-4">Alokasi dompet</span>
                             <BarChart3 className="h-5 w-5 text-slate-500" aria-hidden="true" />
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
                 <div className={`recurring-section ui-card p-5 ${recurringRules.length === 0 ? 'is-empty' : ''}`}>
                     <div className="recurring-section-header flex justify-between items-center mb-4 flex-wrap gap-3">
                        <div>
                            <h3 className="ui-section-title">Transaksi Rutin</h3>
                            <p className="ui-section-description">Dicatat otomatis sesuai jadwal saat aplikasi dibuka.</p>
                        </div>
                            <button
                                type="button"
                                onClick={() => setRecurringOpen(true)}
                                className="ui-button inline-flex items-center gap-2 bg-stone-100 hover:bg-stone-200 border border-stone-300 text-zinc-900"
                            >
                                <Plus className="h-4 w-4" aria-hidden="true" />
                                Aturan Baru
                        </button>
                    </div>

                    {recurringRules.length === 0 ? (
                         <>
                              <p className="recurring-empty-copy flex items-center justify-center gap-2 px-4 py-6 text-center text-sm text-neutral-500">
                                  <Repeat2 className="h-5 w-5 shrink-0 text-amber-700" aria-hidden="true" />
                                  <span>Belum ada aturan rutin. Buat satu untuk gaji, langganan, atau tagihan bulanan Anda.</span>
                              </p>
                             <div className="recurring-empty-mobile" aria-label="Belum ada transaksi rutin">
                                 <div className="space-y-1 text-center">
                                     <h3 className="ui-section-title">Transaksi Rutin</h3>
                                     <p className="ui-section-description">Dicatat otomatis sesuai jadwal saat aplikasi dibuka.</p>
                                 </div>
                                  <div className="recurring-empty-icon flex h-10 w-10 items-center justify-center rounded-lg border border-amber-200 bg-amber-50 text-amber-700" aria-hidden="true">
                                      <Repeat2 className="h-6 w-6" />
                                 </div>
                                 <div className="space-y-1 text-center">
                                     <p className="text-sm font-semibold text-slate-700">Belum ada transaksi rutin.</p>
                                     <p className="text-xs leading-relaxed text-slate-500">Buat satu untuk gaji, langganan, atau tagihan bulanan Anda.</p>
                                 </div>
                                  <button
                                      type="button"
                                      onClick={() => setRecurringOpen(true)}
                                      className="ui-button inline-flex items-center gap-2 bg-emerald-800 text-white hover:bg-emerald-700"
                                  >
                                      <Plus className="h-4 w-4" aria-hidden="true" />
                                      Aturan Baru
                                 </button>
                             </div>
                         </>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                            {recurringRules.map((rule) => (
                                 <div key={rule.id} className={`rounded-lg outline outline-1 outline-offset-[-1px] p-3 flex flex-col gap-2.5 ${rule.active ? 'outline-stone-200 bg-stone-50/50' : 'outline-stone-200 bg-slate-50 opacity-60'}`}>
                                    <div className="flex justify-between items-start gap-2">
                                        <div className="min-w-0">
                                             <p className="font-semibold text-sm text-zinc-900 truncate">{rule.title}</p>
                                            <p className="text-xs text-slate-500 mt-0.5">
                                                {categoryById[rule.categoryId]?.name || '-'} &bull; {walletById[rule.walletId]?.name || '-'}
                                            </p>
                                        </div>
                                         <span className={`ui-badge shrink-0 ${rule.type === 'income' ? 'ui-tone-positive' : 'ui-tone-danger'}`}>
                                            {rule.type === 'income' ? '+' : '-'}{fmtIDR(rule.amount)}
                                        </span>
                                    </div>

                                    <div className="flex items-center gap-2 text-xs text-slate-600">
                                         <span className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-white rounded-md outline outline-1 outline-stone-200 font-semibold">
                                             <Repeat2 className="h-3.5 w-3.5 text-amber-700" aria-hidden="true" />
                                             {FREQ_LABELS[rule.frequency]}
                                         </span>
                                        <span>Berikutnya: <b>{formatDateID(rule.nextDate)}</b></span>
                                    </div>

                                    <div className="flex items-center justify-between pt-1 border-t border-stone-200/70">
                                        <button
                                            type="button"
                                            onClick={() => toggleRecurringRule(rule.id)}
                                             className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-full"
                                            role="switch"
                                            aria-checked={rule.active}
                                            aria-label={`${rule.active ? 'Nonaktifkan' : 'Aktifkan'} aturan ${rule.title}`}
                                            title={rule.active ? 'Nonaktifkan' : 'Aktifkan'}
                                        >
                                            <span aria-hidden="true" className={`relative block h-5 w-10 rounded-full transition-colors ${rule.active ? 'bg-emerald-700' : 'bg-stone-300'}`}>
                                                <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-all ${rule.active ? 'left-[22px]' : 'left-0.5'}`} />
                                            </span>
                                        </button>
                                        <div className="flex gap-1">
                                            <button
                                                type="button"
                                                onClick={() => setDeletingRuleId(rule.id)}
                                                className="ui-icon-button ui-icon-button-danger"
                                                aria-label={`Hapus aturan ${rule.title}`}
                                                title="Hapus aturan"
                                            >
                                                 <Trash2 className="h-4 w-4" aria-hidden="true" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

            </div>

            {/* Modals */}
            <Modal
                isOpen={Boolean(deletingId)}
                onClose={() => setDeletingId(null)}
                title="Hapus transaksi"
            >
                <div className="space-y-4">
                    <p className="text-sm leading-6 text-slate-600">
                        {deletingTransaction ? (
                            <>Hapus transaksi <strong className="text-slate-800">&quot;{deletingTransaction.title}&quot;</strong>? Transaksi yang dihapus tidak dapat dikembalikan.</>
                        ) : (
                            'Transaksi yang dihapus tidak dapat dikembalikan.'
                        )}
                    </p>
                    <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                            <button
                                type="button"
                                onClick={() => setDeletingId(null)}
                            className="ui-button min-h-[44px] w-full bg-emerald-50 text-emerald-700 hover:bg-emerald-100 sm:w-auto"
                        >
                            Batal
                        </button>
                        <button
                            type="button"
                            onClick={() => {
                                if (deletingId) deleteTransaction(deletingId);
                                setDeletingId(null);
                            }}
                             className="ui-button min-h-[44px] w-full bg-rose-700 text-white hover:bg-rose-800 sm:w-auto"
                        >
                            Hapus transaksi
                        </button>
                    </div>
                </div>
            </Modal>
            <Modal
                isOpen={Boolean(deletingRuleId)}
                onClose={() => setDeletingRuleId(null)}
                title="Hapus aturan rutin"
            >
                <div className="space-y-4">
                    <p className="text-sm leading-6 text-slate-600">
                        {deletingRule ? (
                            <>Hapus aturan rutin <strong className="text-slate-800">&quot;{deletingRule.title}&quot;</strong>? Aturan ini tidak akan membuat transaksi otomatis lagi.</>
                        ) : (
                            'Aturan rutin ini tidak akan membuat transaksi otomatis lagi.'
                        )}
                    </p>
                    <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                        <button
                            type="button"
                            onClick={() => setDeletingRuleId(null)}
                            className="ui-button min-h-[44px] w-full bg-emerald-50 text-emerald-700 hover:bg-emerald-100 sm:w-auto"
                        >
                            Batal
                        </button>
                        <button
                            type="button"
                            onClick={() => {
                                if (deletingRuleId) deleteRecurringRule(deletingRuleId);
                                setDeletingRuleId(null);
                            }}
                             className="ui-button min-h-[44px] w-full bg-rose-700 text-white hover:bg-rose-800 sm:w-auto"
                        >
                            Hapus aturan
                        </button>
                    </div>
                </div>
            </Modal>
            <AddTransactionModal
                isOpen={modalOpen}
                onClose={() => {
                    setModalOpen(false);
                    setEditingTxn(null);
                }}
                editing={editingTxn}
                initialType={initialType}
                onRequestDelete={(transaction) => {
                    setModalOpen(false);
                    setEditingTxn(null);
                    setDeletingId(transaction.id);
                }}
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
