import React, { useEffect, useState, useMemo, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import icon from '../assets/icon.svg';
import { useAuth } from '../contexts/AuthContext';
import { useFinance } from '../contexts/FinanceContext';
import { fmtIDR } from '../utils/format';
import { AlertTriangle, BarChart3, Bell, CalendarDays, CheckCircle2, Clock3, Home, Lightbulb, ListChecks, LogOut, Map, RefreshCw, Search, Settings2, Tags, Target, Users, Wallet, X } from 'lucide-react';
import MobileBottomNav from '../mobile/components/MobileBottomNav';
import MobileMenuDrawer from '../mobile/components/MobileMenuDrawer';
import MobileTopBar from '../mobile/components/MobileTopBar';

const MOBILE_PRIMARY_LINKS = [
    ['/dashboard', 'Dashboard', Home],
    ['/wallets', 'Dompet', Wallet],
    ['/savings', 'Target Tabungan', Target],
    ['/calendar', 'Kalender Tagihan', CalendarDays],
    ['/tasks', 'Tugas', ListChecks],
    ['/reports', 'Analisis Laporan', BarChart3],
];

const MOBILE_SECONDARY_LINKS = [
    ['/planner', 'Perencana AI', Map],
    ['/ai-advisor', 'Tanya AI', Lightbulb],
    ['/categories', 'Kategori', Tags],
];

const matchesSearch = (values, query) => {
    const tokens = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
    const haystack = values.filter(Boolean).join(' ').toLowerCase();
    return tokens.length > 0 && tokens.every((token) => haystack.includes(token));
};

export default function AuthenticatedLayout({ children, onAddTransaction }) {
    const location = useLocation();
    const navigate = useNavigate();
    const { user, logout } = useAuth();
    const {
        getBudgetAlerts, resetData, recurringRules, savingsGoals,
        transactions, wallets, categories,
        invitations, acceptSavingsGoalInvitation, rejectSavingsGoalInvitation,
        calendarError, clearCalendarError, resetBusy, resetError, clearResetError
    } = useFinance();
    const [searchTerm, setSearchTerm] = useState('');
    const [notifOpen, setNotifOpen] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [mobileAccountOpen, setMobileAccountOpen] = useState(false);
    const notificationPanelRef = useRef(null);
    const notificationTriggerRef = useRef(null);

    const displayName = user?.name || 'Pengguna';
    const initial = displayName.charAt(0).toUpperCase();
    const email = user?.email || '';

    const handleGlobalSearch = (event) => {
        event.preventDefault();
        const term = searchTerm.trim();
        if (!term) return;

        const hasSavingsMatch = savingsGoals.some((goal) => matchesSearch(
            ['target tabungan', goal.title, goal.partnerEmail],
            term,
        ));
        const hasWalletMatch = wallets.some((wallet) => matchesSearch(
            ['dompet', wallet.name],
            term,
        ));
        const hasTransactionMatch = transactions.some((transaction) => matchesSearch(
            [
                'transaksi',
                transaction.title,
                transaction.note,
                transaction.categoryId,
                categories.find((category) => category.id === transaction.categoryId)?.name,
                wallets.find((wallet) => wallet.id === transaction.walletId)?.name,
            ],
            term,
        ));

        if (hasSavingsMatch && !hasTransactionMatch && !hasWalletMatch) {
            navigate(`/savings?q=${encodeURIComponent(term)}`);
            return;
        }

        navigate(`/wallets?q=${encodeURIComponent(term)}`);
    };

    const handleLogout = async () => {
        const result = await logout();
        if (result?.ok) navigate('/login', { replace: true });
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

    const pendingInvites = useMemo(() => {
        if (!invitations || !user) return [];
        return invitations.filter(
            (inv) => inv.status === 'pending' && inv.inviteeEmail.toLowerCase() === user.email.toLowerCase()
        );
    }, [invitations, user]);

    const totalNotifCount = allNotifications.length + pendingInvites.length;

    const isActive = (path) => location.pathname === path;

    const handleToggleNotifications = (event) => {
        if (!notifOpen) notificationTriggerRef.current = event.currentTarget;
        setMobileMenuOpen(false);
        setMobileAccountOpen(false);
        setNotifOpen((v) => !v);
    };

    const handleInvitationAction = (action, invitationId) => {
        action(invitationId);
        setNotifOpen(false);
    };

    useEffect(() => {
        if (!notifOpen) return undefined;

        const getFocusableElements = () => (
            [...(notificationPanelRef.current?.querySelectorAll(
                'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
            ) || [])].filter((element) => element.getClientRects().length > 0)
        );

        const focusTimer = window.setTimeout(() => {
            const initialTarget = notificationPanelRef.current?.querySelector('[data-autofocus]') || getFocusableElements()[0];
            (initialTarget || notificationPanelRef.current)?.focus();
        }, 0);

        const handleKeyDown = (event) => {
            if (event.key === 'Escape') {
                event.preventDefault();
                setNotifOpen(false);
                return;
            }

            if (event.key !== 'Tab') return;
            const focusableElements = getFocusableElements();
            if (focusableElements.length === 0) {
                event.preventDefault();
                notificationPanelRef.current?.focus();
                return;
            }

            const first = focusableElements[0];
            const last = focusableElements[focusableElements.length - 1];
            if (!focusableElements.includes(document.activeElement)) {
                event.preventDefault();
                (event.shiftKey ? last : first).focus();
            } else if (event.shiftKey && document.activeElement === first) {
                event.preventDefault();
                last.focus();
            } else if (!event.shiftKey && document.activeElement === last) {
                event.preventDefault();
                first.focus();
            }
        };

        document.addEventListener('keydown', handleKeyDown);

        return () => {
            window.clearTimeout(focusTimer);
            document.removeEventListener('keydown', handleKeyDown);
            if (notificationTriggerRef.current && typeof notificationTriggerRef.current.focus === 'function') {
                notificationTriggerRef.current.focus();
            }
        };
    }, [notifOpen]);

    useEffect(() => {
        setMobileMenuOpen(false);
        setMobileAccountOpen(false);
        setNotifOpen(false);
    }, [location.pathname]);

    const openMobileMenu = () => {
        setNotifOpen(false);
        setMobileAccountOpen(false);
        setMobileMenuOpen(true);
    };

    const toggleMobileMenu = () => {
        if (mobileMenuOpen) {
            setMobileMenuOpen(false);
            return;
        }
        openMobileMenu();
    };

    const openMobileAccount = () => {
        setNotifOpen(false);
        setMobileMenuOpen(false);
        setMobileAccountOpen(true);
    };
    
    const getLinkClass = (path) => {
        const base = "app-nav-item flex items-center justify-center lg:justify-start ";
        if (isActive(path)) {
            return base + "is-active";
        }
        return base;
    };

    return (
        <div className="app-shell h-screen flex overflow-hidden">
            {/* Sidebar Kiri */}
            <aside className="app-sidebar bg-white text-slate-700 flex flex-col justify-between hidden sm:flex border-r transition-all duration-300">
                <div className="space-y-6">
                    {/* Brand */}
                    <div className="flex items-center justify-center lg:justify-start gap-2 px-2">
                        <img className="w-11 h-11 rounded-lg shrink-0" src={icon} alt="Sakuta logo" draggable={false} />
                        <span className="font-semibold text-[#0e6c4a] text-[20px] tracking-tight hidden lg:inline">Sakuta</span>
                    </div>
                    
                     {/* Menu Navigasi */}
                     <nav className="app-nav flex flex-col items-center lg:items-stretch">
                         <div className="app-nav-group">
                             <span className="app-nav-group-label hidden lg:block">MENU UTAMA</span>
                             <Link to="/dashboard" aria-label="Dashboard" className={getLinkClass('/dashboard')}>
                                 <Home className="h-4 w-4 shrink-0" aria-hidden="true" />
                                 <span className="hidden lg:inline">Dashboard</span>
                             </Link>
                             <Link to="/wallets" aria-label="Dompet" className={getLinkClass('/wallets')}>
                                 <Wallet className="h-4 w-4 shrink-0" aria-hidden="true" />
                                 <span className="hidden lg:inline">Dompet</span>
                             </Link>
                             <Link to="/savings" aria-label="Target Tabungan" className={getLinkClass('/savings')}>
                                 <Target className="h-4 w-4 shrink-0" aria-hidden="true" />
                                 <span className="hidden lg:inline">Target Tabungan</span>
                             </Link>
                             <Link to="/calendar" aria-label="Kalender Tagihan" className={getLinkClass('/calendar')}>
                                 <CalendarDays className="h-4 w-4 shrink-0" aria-hidden="true" />
                                 <span className="hidden lg:inline">Kalender Tagihan</span>
                             </Link>
                             <Link to="/tasks" aria-label="Tugas" className={getLinkClass('/tasks')}>
                                 <ListChecks className="h-4 w-4 shrink-0" aria-hidden="true" />
                                 <span className="hidden lg:inline">Tugas</span>
                             </Link>
                             <Link to="/reports" aria-label="Analisis Laporan" className={getLinkClass('/reports')}>
                                 <BarChart3 className="h-4 w-4 shrink-0" aria-hidden="true" />
                                 <span className="hidden lg:inline">Analisis Laporan</span>
                             </Link>
                         </div>
                         <div className="app-nav-group">
                             <span className="app-nav-group-label hidden lg:block">ALAT KEUANGAN</span>
                             <Link to="/planner" aria-label="Perencana AI" className={getLinkClass('/planner')}>
                                 <Map className="h-4 w-4 shrink-0" aria-hidden="true" />
                                 <span className="hidden lg:inline">Perencana AI</span>
                             </Link>
                             <Link to="/ai-advisor" aria-label="Tanya AI" className={getLinkClass('/ai-advisor')}>
                                 <Lightbulb className="h-4 w-4 shrink-0" aria-hidden="true" />
                                 <span className="hidden lg:inline">Tanya AI</span>
                             </Link>
                             <Link to="/categories" aria-label="Kategori" className={getLinkClass('/categories')}>
                                 <Tags className="h-5 w-5 shrink-0" aria-hidden="true" />
                                 <span className="hidden lg:inline">Kategori</span>
                             </Link>
                         </div>
                     </nav>
                </div>
                
                {/* User Profile Info */}
                <div className="space-y-3">
                    <div className="border-t border-stone-200 pt-4 flex items-center justify-center lg:justify-start gap-2.5">
                        <div className="w-9 h-9 rounded-full bg-[#0e6c4a]/10 text-[#0e6c4a] font-medium flex items-center justify-center shrink-0">
                            {initial}
                        </div>
                        <div className="min-w-0 hidden lg:block">
                            <span className="font-semibold text-slate-800 text-sm block truncate">{displayName}</span>
                            <span className="text-xs text-slate-500 block truncate">{email}</span>
                        </div>
                    </div>
                    <div className="flex flex-col lg:flex-row items-center gap-2">
                        <button
                            type="button"
                            aria-label="Keluar"
                            onClick={handleLogout}
                             className="ui-button-compact w-9 h-9 lg:w-auto lg:flex-1 flex items-center justify-center gap-1.5 p-2 lg:px-3 lg:py-1.5 rounded-md bg-slate-50 hover:bg-rose-50 text-slate-500 hover:text-rose-600 transition-colors shrink-0"
                            title="Keluar"
                        >
                            <LogOut className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                            <span className="hidden lg:inline">Keluar</span>
                        </button>
                        <button
                            type="button"
                            aria-label="Hapus semua data finance akun aktif"
                            onClick={() => { if (!resetBusy && window.confirm('Hapus semua data finance akun ini? Akun auth dan email tidak akan dihapus.')) void resetData(); }}
                            disabled={resetBusy}
                            aria-busy={resetBusy}
                             className="ui-button-compact w-9 h-9 lg:w-auto lg:flex-1 flex items-center justify-center gap-1.5 p-2 lg:px-3 lg:py-1.5 rounded-md bg-slate-50 hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors shrink-0 disabled:pointer-events-none disabled:opacity-50"
                            title="Hapus semua data finance akun ini"
                        >
                            <RefreshCw className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                            <span className="hidden lg:inline">Reset Data</span>
                        </button>
                    </div>
                </div>
            </aside>

            {/* Main Content Area */}
            <div className="app-shell-main flex-1 flex flex-col min-w-0 overflow-hidden">
                {/* Navbar Atas */}
                <header className="app-topbar border-b backdrop-blur-[6px] flex items-center justify-between gap-2 z-20">
                    <MobileTopBar
                        icon={icon}
                        notificationCount={totalNotifCount}
                        notificationsOpen={notifOpen}
                        menuOpen={mobileMenuOpen}
                        onToggleNotifications={handleToggleNotifications}
                        onToggleMenu={toggleMobileMenu}
                    />
                    {/* Search Field */}
                    <form
                        className="relative hidden min-w-0 w-full max-w-md flex-1 sm:flex"
                        onSubmit={handleGlobalSearch}
                    >
                        <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                            <Search className="h-4 w-4" aria-hidden="true" />
                        </span>
                        <input
                            type="search"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Cari transaksi, tabungan atau dompet..."
                                className="ui-topbar-search w-full pr-3 pl-8 placeholder:text-slate-400"
                        />
                    </form>

                {/* Notifications & Action */}
                <div className="relative hidden shrink-0 items-center gap-2 sm:flex sm:gap-3">
                        <button
                            type="button"
                            aria-label={notifOpen ? 'Tutup pemberitahuan' : 'Buka pemberitahuan'}
                            aria-expanded={notifOpen}
                            aria-controls="notification-panel"
                            onClick={handleToggleNotifications}
                            className={`ui-icon-button relative ${totalNotifCount > 0 ? 'ui-icon-button-active' : ''}`}
                    >
                        <Bell className="h-5 w-5" aria-hidden="true" />
                        {totalNotifCount > 0 && (
                             <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-rose-600 text-white text-[10px] font-bold flex items-center justify-center ring-2 ring-white animate-pulse">
                                {totalNotifCount}
                            </span>
                        )}
                    </button>

                </div>
                </header>

                {notifOpen && (
                    <>
                         <div aria-hidden="true" className="fixed inset-0 z-30 cursor-default" onClick={() => setNotifOpen(false)} />
                          <div id="notification-panel" ref={notificationPanelRef} role="dialog" aria-modal="true" aria-labelledby="notification-panel-title" tabIndex="-1" className="notification-popover ui-popover overflow-hidden border border-slate-100 bg-white">
                                 <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/60">
                                      <div className="flex items-start justify-between gap-3">
                                          <div>
                                              <h2 id="notification-panel-title" className="font-semibold text-sm text-slate-800">Pusat pemberitahuan</h2>
                                              <p className="text-xs text-slate-500">Informasi dan peringatan keuangan Anda</p>
                                          </div>
                                           <button type="button" data-autofocus aria-label="Tutup pemberitahuan" onClick={() => setNotifOpen(false)} className="ui-icon-button -mr-2 -mt-2 h-11 w-11">
                                               <X className="h-4 w-4" aria-hidden="true" />
                                          </button>
                                      </div>
                                </div>

                                {/* Shared Goal Collaboration Invitations */}
                                {pendingInvites.length > 0 && (
                                    <div className="bg-emerald-50/40 p-4 border-b border-stone-200 flex flex-col gap-3">
                                         <div className="flex items-center gap-1.5 text-xs font-medium text-emerald-800">
                                            <Users className="h-3.5 w-3.5" aria-hidden="true" />
                                            Undangan Kolaborasi ({pendingInvites.length})
                                        </div>
                                        <div className="flex flex-col gap-3">
                                            {pendingInvites.map((inv) => (
                                                 <div key={inv.id} className="ui-card-subtle p-3 flex flex-col gap-2.5">
                                                    <p className="text-xs text-slate-700 leading-normal">
                                                        <strong className="font-bold text-slate-900">{inv.inviterName}</strong> ({inv.inviterEmail}) mengundang Anda mengelola target bersama <strong>"{inv.goalTitle}"</strong>.
                                                    </p>
                                                    <div className="flex gap-2 justify-end">
                                                         <button
                                                             type="button"
                                                              onClick={() => handleInvitationAction(rejectSavingsGoalInvitation, inv.id)}
                                                              className="notification-action ui-button-compact bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors"
                                                        >
                                                            Tolak
                                                        </button>
                                                         <button
                                                             type="button"
                                                              onClick={() => handleInvitationAction(acceptSavingsGoalInvitation, inv.id)}
                                                              className="notification-action ui-button-compact bg-emerald-800 hover:bg-emerald-700 text-white transition-colors"
                                                        >
                                                            Terima
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {allNotifications.length === 0 && pendingInvites.length === 0 ? (
                                    <div className="px-4 py-8 text-center flex flex-col items-center justify-center gap-2">
                                         <CheckCircle2 className="h-8 w-8 text-slate-300" aria-hidden="true" />
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
                                                             : notif.type === 'saving'
                                                                 ? 'ui-tone-info'
                                                                 : 'ui-tone-positive'
                                                    }`}>
                                                         {notif.type === 'budget' && (
                                                             <AlertTriangle className="h-4 w-4" aria-hidden="true" />
                                                         )}
                                                         {notif.type === 'bill' && (
                                                             <Clock3 className="h-4 w-4" aria-hidden="true" />
                                                         )}
                                                         {notif.type === 'saving' && (
                                                             <Target className="h-4 w-4" aria-hidden="true" />
                                                         )}
                                                    </div>

                                                    <div className="min-w-0 flex-1">
                                                        <div className="flex justify-between items-center mb-0.5">
                                                             <span className="text-xs font-medium text-slate-800 truncate">{notif.title}</span>
                                                            {notif.type === 'budget' && (
                                                                     <span className={`text-[9px] font-medium px-1.5 py-0.5 rounded shrink-0 ${
                                                                    notif.level === 'over' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'
                                                                }`}>
                                                                    Limit
                                                                </span>
                                                            )}
                                                            {notif.type === 'bill' && (
                                                                 <span className="text-[9px] font-medium px-1.5 py-0.5 rounded bg-amber-100 text-amber-700 shrink-0">
                                                                    Tagihan
                                                                </span>
                                                            )}
                                                            {notif.type === 'saving' && (
                                                                  <span className="ui-tone-info text-[9px] font-medium px-1.5 py-0.5 rounded shrink-0">
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
                
                {(resetError || calendarError) && (
                    <div role="alert" className="mx-4 mt-4 flex items-center justify-between gap-3 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-semibold text-rose-800 sm:mx-6 lg:mx-8">
                        <span>{resetError || calendarError}</span>
                        <button type="button" onClick={() => { clearResetError(); clearCalendarError(); }} className="shrink-0 text-rose-700 underline underline-offset-2">Tutup</button>
                    </div>
                )}

                {/* Content body wrapper */}
                <main className="app-content flex-1 overflow-y-auto">
                    {children}
                </main>

                <MobileBottomNav
                    activePath={location.pathname}
                    onAddTransaction={onAddTransaction}
                    onOpenAccount={openMobileAccount}
                    accountOpen={mobileAccountOpen}
                />

                <MobileMenuDrawer open={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} title="Menu Sakuta" id="mobile-navigation-drawer">
                    <div className="mobile-drawer-content space-y-5">
                        <form
                            className="space-y-2"
                            onSubmit={(event) => {
                                handleGlobalSearch(event);
                                setMobileMenuOpen(false);
                            }}
                        >
                            <label htmlFor="mobile-global-search" className="mobile-drawer-section-label">Cari transaksi</label>
                            <div className="relative">
                                 <Search aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                                <input id="mobile-global-search" type="search" value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} placeholder="Nama atau catatan..." className="ui-control w-full pl-9 pr-3" />
                            </div>
                        </form>
                        <nav aria-label="Navigasi mobile" className="mobile-drawer-nav space-y-5">
                        <div>
                            <p className="mobile-drawer-section-label">Menu utama</p>
                            <div className="mt-2 space-y-1">
                                {MOBILE_PRIMARY_LINKS.map(([path, label, Icon]) => (
                                    <Link
                                        key={path}
                                        to={path}
                                        aria-current={isActive(path) ? 'page' : undefined}
                                        onClick={() => setMobileMenuOpen(false)}
                                        className={`mobile-drawer-link ${isActive(path) ? 'is-active' : ''}`}
                                    >
                                        <Icon className="h-[18px] w-[18px] shrink-0" aria-hidden="true" />
                                        <span className="min-w-0 flex-1 truncate">{label}</span>
                                    </Link>
                                ))}
                            </div>
                        </div>
                        <div>
                            <div className="flex items-center justify-between gap-3">
                                <p className="mobile-drawer-section-label">Alat keuangan</p>
                                <Settings2 className="h-4 w-4 text-slate-400" aria-hidden="true" />
                            </div>
                            <div className="mt-2 space-y-1">
                                {MOBILE_SECONDARY_LINKS.map(([path, label, Icon]) => (
                                    <Link
                                        key={path}
                                        to={path}
                                        aria-current={isActive(path) ? 'page' : undefined}
                                        onClick={() => setMobileMenuOpen(false)}
                                        className={`mobile-drawer-link ${isActive(path) ? 'is-active' : ''}`}
                                    >
                                        <Icon className="h-[18px] w-[18px] shrink-0" aria-hidden="true" />
                                        <span className="min-w-0 flex-1 truncate">{label}</span>
                                    </Link>
                                ))}
                            </div>
                        </div>
                        </nav>
                    </div>
                </MobileMenuDrawer>

                <MobileMenuDrawer open={mobileAccountOpen} onClose={() => setMobileAccountOpen(false)} title="Akun" id="mobile-account-drawer">
                    <div className="mobile-account-content">
                        <section className="mobile-account-profile" aria-label="Informasi akun">
                            <div className="mobile-account-avatar">
                                {initial}
                            </div>
                            <div className="min-w-0">
                                <p className="mobile-account-name">{displayName}</p>
                                <p className="mobile-account-email">{email}</p>
                                <p className="mobile-account-label">Akun Sakuta</p>
                            </div>
                        </section>
                        <section className="mobile-account-section" aria-labelledby="mobile-account-data-heading">
                            <h3 id="mobile-account-data-heading" className="mobile-account-section-label">Akun &amp; Data</h3>
                            <div className="mobile-account-list">
                                <button
                                    type="button"
                                     onClick={() => { if (!resetBusy && window.confirm('Hapus semua data finance akun ini? Akun auth dan email tidak akan dihapus.')) void resetData(); }}
                                     disabled={resetBusy}
                                     aria-busy={resetBusy}
                                     className="mobile-account-row mobile-account-row-warning disabled:pointer-events-none disabled:opacity-50"
                                >
                                    <span className="mobile-account-row-icon" aria-hidden="true">
                                        <RefreshCw className="h-4 w-4" />
                                    </span>
                                    <span className="mobile-account-row-label">Hapus data finance akun ini</span>
                                </button>
                            </div>
                        </section>
                        <section className="mobile-account-section" aria-labelledby="mobile-account-session-heading">
                            <h3 id="mobile-account-session-heading" className="mobile-account-section-label">Sesi</h3>
                            <div className="mobile-account-list mobile-account-list-danger">
                                <button type="button" onClick={handleLogout} className="mobile-account-row mobile-account-row-danger">
                                    <span className="mobile-account-row-icon" aria-hidden="true">
                                        <LogOut className="h-4 w-4" />
                                    </span>
                                    <span className="mobile-account-row-label">Keluar dari akun</span>
                                </button>
                            </div>
                        </section>
                    </div>
                </MobileMenuDrawer>
            </div>
        </div>
    );
}
