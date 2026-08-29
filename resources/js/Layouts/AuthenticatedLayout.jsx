import React, { useState, useMemo } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import icon from '../icon.svg';
import { useAuth } from '../Store/AuthContext';
import { useFinance } from '../Store/FinanceContext';
import { fmtIDR } from '../Utils/format';

export default function AuthenticatedLayout({ children }) {
    const location = useLocation();
    const navigate = useNavigate();
    const { user, logout } = useAuth();
    const { getBudgetAlerts, resetData, recurringRules, savingsGoals } = useFinance();
    const [searchTerm, setSearchTerm] = useState('');
    const [notifOpen, setNotifOpen] = useState(false);

    const displayName = user?.name || 'Pengguna';
    const initial = displayName.charAt(0).toUpperCase();
    const email = user?.email || '';

    const handleLogout = () => {
        logout();
        navigate('/login', { replace: true });
    };

    // ─── Unified Notification Hub Logic ───
    const budgetAlertList = useMemo(() => {
        return getBudgetAlerts().map((a) => ({
            id: `budget-${a.categoryId}`,
            type: 'budget',
            level: a.level,
            title: a.name,
            text: a.level === 'over' 
                ? `Anggaran terlampaui sebesar ${fmtIDR(Math.abs(a.remaining))}` 
                : `Anggaran tersisa ${fmtIDR(a.remaining)}`,
            link: '/categories'
        }));
    }, [getBudgetAlerts, recurringRules]);

    const billAlertList = useMemo(() => {
        if (!recurringRules) return [];
        const today = new Date();
        const scanDayNum = today.getDate();
        
        return recurringRules.filter(r => r.active).map(rule => {
            const ruleDay = parseInt(rule.nextDate.split('-')[2]);
            let daysRemaining = ruleDay - scanDayNum;
            if (daysRemaining < 0) {
                const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
                daysRemaining += daysInMonth;
            }
            return { rule, daysRemaining };
        })
        .filter(item => item.daysRemaining <= 3)
        .map(item => ({
            id: `bill-${item.rule.id}`,
            type: 'bill',
            level: 'warn',
            title: item.rule.title,
            text: `Tagihan ${fmtIDR(item.rule.amount)} jatuh tempo ${item.daysRemaining === 0 ? 'hari ini' : item.daysRemaining === 1 ? 'besok' : `${item.daysRemaining} hari lagi`}`,
            link: '/calendar'
        }));
    }, [recurringRules]);

    const savingAlertList = useMemo(() => {
        if (!savingsGoals || savingsGoals.length === 0) return [];
        const goalsWithProgress = savingsGoals.map(g => {
            const pct = g.target > 0 ? Math.min(100, Math.round((g.current / g.target) * 100)) : 0;
            return { ...g, pct };
        }).sort((a, b) => b.pct - a.pct);
        
        const topGoal = goalsWithProgress[0];
        if (topGoal && topGoal.pct >= 50 && topGoal.pct < 100) {
            return [{
                id: `saving-${topGoal.id}`,
                type: 'saving',
                level: 'info',
                title: topGoal.title,
                text: `Progres tabungan Anda sudah mencapai ${topGoal.pct}%! Teruskan menabung.`,
                link: '/savings'
            }];
        }
        return [];
    }, [savingsGoals]);

    const allNotifications = useMemo(() => {
        return [...budgetAlertList, ...billAlertList, ...savingAlertList];
    }, [budgetAlertList, billAlertList, savingAlertList]);

    const isActive = (path) => location.pathname === path;
    
    const getLinkClass = (path) => {
        const base = "flex items-center gap-3.5 px-4 py-3 rounded-xl transition-all duration-300 ";
        if (isActive(path)) {
            return base + "bg-[#0e6c4a] text-white font-semibold shadow-sm";
        }
        return base + "text-slate-600 hover:bg-[#0e6c4a]/5 hover:text-[#0e6c4a] font-medium";
    };

    return (
        <div className="h-screen bg-[#F7FAF5] flex overflow-hidden">
            {/* Sidebar Kiri */}
            <aside className="w-64 bg-white text-slate-700 flex flex-col justify-between p-6 hidden md:flex border-r border-[#bec9c0]">
                <div className="space-y-8">
                    {/* Brand */}
                    <div className="flex items-center gap-2.5 px-2">
                        <div className="w-9 h-9 bg-[#0e6c4a] rounded-xl flex justify-center items-center shadow-md shadow-emerald-950/15">
                            <img className="w-[18px] h-[17px]" src={icon} alt="SakuPintar logo" draggable={false} />
                        </div>
                        <span className="font-bold text-[#0e6c4a] text-lg tracking-tight">SakuPintar</span>
                    </div>
                    
                    {/* Menu Navigasi */}
                    <nav className="space-y-1.5">
                        <Link to="/dashboard" className={getLinkClass('/dashboard')}>
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                            </svg>
                            Dashboard
                        </Link>
                        <Link to="/wallets" className={getLinkClass('/wallets')}>
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                            </svg>
                            Dompet
                        </Link>
                        <Link to="/savings" className={getLinkClass('/savings')}>
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                            </svg>
                            Target Tabungan
                        </Link>
                        <Link to="/planner" className={getLinkClass('/planner')}>
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A2 2 0 013 15.487V6.512a2 2 0 011.553-1.95L9 2l5.447 2.724A2 2 0 0116 6.512v8.975a2 2 0 01-1.553 1.95L9 20z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20V11M3 6.5l6 3 7-3M3 11l6 3" />
                            </svg>
                            Perencana AI
                        </Link>
                        <Link to="/calendar" className={getLinkClass('/calendar')}>
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            Kalender Tagihan
                        </Link>
                        <Link to="/reports" className={getLinkClass('/reports')}>
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                            </svg>
                            Analisis Laporan
                        </Link>
                        <Link to="/ai-advisor" className={getLinkClass('/ai-advisor')}>
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                            </svg>
                            Tanya AI
                        </Link>
                        <Link to="/categories" className={getLinkClass('/categories')}>
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
                            </svg>
                            Kategori
                        </Link>
                    </nav>
                </div>
                
                {/* User Profile Info */}
                <div className="space-y-3">
                    <div className="border-t border-stone-200 pt-6 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-[#0e6c4a]/10 text-[#0e6c4a] font-bold flex items-center justify-center shrink-0">
                            {initial}
                        </div>
                        <div className="min-w-0">
                            <span className="font-semibold text-slate-800 text-sm block truncate">{displayName}</span>
                            <span className="text-xs text-slate-500 block truncate">{email}</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={handleLogout}
                            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-slate-50 hover:bg-red-50 text-slate-500 hover:text-red-600 text-xs font-semibold transition-colors"
                        >
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                            </svg>
                            Keluar
                        </button>
                        <button
                            onClick={() => { if (window.confirm('Reset semua data ke contoh awal?')) resetData(); }}
                            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-400 hover:text-slate-600 text-xs font-semibold transition-colors"
                            title="Kembalikan data transaksi & target ke contoh awal"
                        >
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                            Reset Data
                        </button>
                    </div>
                </div>
            </aside>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                {/* Navbar Atas */}
                <header className="h-20 bg-[#F7FAF5]/80 border-b border-stone-200 backdrop-blur-[6px] flex items-center justify-between px-6 md:px-8 z-20">
                    {/* Search Field */}
                    <form
                        className="relative max-w-md w-full"
                        onSubmit={(e) => {
                            e.preventDefault();
                            if (searchTerm.trim()) navigate(`/wallets?q=${encodeURIComponent(searchTerm.trim())}`);
                        }}
                    >
                        <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </span>
                        <input
                            type="search"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Cari transaksi, tabungan atau dompet..."
                            className="w-full bg-slate-50/50 border border-slate-200 rounded-xl py-2 pr-4 pl-10 text-sm focus:border-emerald-500 focus:ring-emerald-500 placeholder:text-slate-400"
                        />
                    </form>

                {/* Notifications & Action */}
                <div className="flex items-center gap-4 relative">
                    <button
                        onClick={() => setNotifOpen((v) => !v)}
                        className={`p-2.5 rounded-xl hover:bg-slate-50 transition-colors relative ${allNotifications.length > 0 ? 'text-emerald-800' : 'text-slate-500'}`}
                    >
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                        </svg>
                        {allNotifications.length > 0 && (
                            <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-red-600 text-white text-[10px] font-bold flex items-center justify-center ring-2 ring-white">
                                {allNotifications.length}
                            </span>
                        )}
                    </button>

                    {notifOpen && (
                        <>
                            <div className="fixed inset-0 z-30" onClick={() => setNotifOpen(false)} />
                            <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-2xl shadow-xl border border-slate-100 z-40 overflow-hidden">
                                <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/60">
                                    <p className="font-bold text-sm text-slate-800">Pusat Pemberitahuan</p>
                                    <p className="text-xs text-slate-500 font-medium">Informasi & peringatan keuangan Anda</p>
                                </div>
                                {allNotifications.length === 0 ? (
                                    <div className="px-4 py-8 text-center flex flex-col items-center justify-center gap-2">
                                        <svg className="w-8 h-8 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        <p className="text-xs font-semibold text-slate-400">Keuangan Anda aman. Tidak ada pemberitahuan.</p>
                                    </div>
                                ) : (
                                    <div className="divide-y divide-slate-100 max-h-80 overflow-y-auto">
                                        {allNotifications.map((notif) => (
                                            <Link
                                                key={notif.id}
                                                to={notif.link}
                                                onClick={() => setNotifOpen(false)}
                                                className="block px-4 py-3 hover:bg-slate-50 transition-colors"
                                            >
                                                <div className="flex gap-3 items-start">
                                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border ${
                                                        notif.level === 'over' 
                                                            ? 'bg-rose-50 text-rose-700 border-rose-100' 
                                                            : notif.type === 'bill' 
                                                                ? 'bg-amber-50 text-amber-700 border-amber-100'
                                                                : 'bg-emerald-50 text-emerald-800 border-emerald-100'
                                                    }`}>
                                                        {notif.type === 'budget' && (
                                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                                            </svg>
                                                        )}
                                                        {notif.type === 'bill' && (
                                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                            </svg>
                                                        )}
                                                        {notif.type === 'saving' && (
                                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                                                            </svg>
                                                        )}
                                                    </div>

                                                    <div className="min-w-0 flex-1">
                                                        <div className="flex justify-between items-center mb-0.5">
                                                            <span className="text-xs font-bold text-slate-800 truncate">{notif.title}</span>
                                                            {notif.type === 'budget' && (
                                                                <span className={`text-[8px] font-extrabold uppercase px-1.5 py-0.5 rounded shrink-0 ${
                                                                    notif.level === 'over' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'
                                                                }`}>
                                                                    Limit
                                                                </span>
                                                            )}
                                                            {notif.type === 'bill' && (
                                                                <span className="text-[8px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-amber-100 text-amber-700 shrink-0">
                                                                    Tagihan
                                                                </span>
                                                            )}
                                                            {notif.type === 'saving' && (
                                                                <span className="text-[8px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 shrink-0">
                                                                    Target
                                                                </span>
                                                            )}
                                                        </div>
                                                        <p className="text-xs text-slate-500 leading-snug">{notif.text}</p>
                                                    </div>
                                                </div>
                                            </Link>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </>
                    )}
                </div>
                </header>
                
                {/* Content body wrapper */}
                <main className="flex-1 overflow-y-auto p-6 md:p-8">
                    {children}
                </main>
            </div>
        </div>
    );
}
