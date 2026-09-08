import React from 'react';
import { Home, Plus, Settings2, UserRound, Wallet } from 'lucide-react';
import { Link } from 'react-router-dom';

const baseItemClass = 'mobile-bottom-nav-item flex min-w-0 flex-1 flex-col items-center justify-center gap-0.5 rounded-lg px-1 text-[10px] font-medium transition-colors';

export default function MobileBottomNav({
    activePath,
    onAddTransaction,
    onOpenMenu,
    onOpenAccount,
    menuOpen = false,
    accountOpen = false,
}) {
    const linkClass = (path) => `${baseItemClass} ${activePath === path ? 'is-active' : ''}`;

    return (
        <nav className="mobile-bottom-nav sm:hidden" aria-label="Navigasi bawah mobile">
            <Link to="/dashboard" aria-current={activePath === '/dashboard' ? 'page' : undefined} className={linkClass('/dashboard')}>
                <Home className="h-[18px] w-[18px]" aria-hidden="true" />
                <span>Home</span>
            </Link>
            <Link to="/wallets" aria-current={activePath === '/wallets' ? 'page' : undefined} className={linkClass('/wallets')}>
                <Wallet className="h-[18px] w-[18px]" aria-hidden="true" />
                <span>Transaksi</span>
            </Link>

            {onAddTransaction ? (
                <button type="button" onClick={onAddTransaction} className="mobile-bottom-nav-add" aria-label="Tambah transaksi">
                    <span aria-hidden="true"><Plus className="h-5 w-5" strokeWidth={2.5} /></span>
                    <span>Tambah</span>
                </button>
            ) : (
                <Link to="/wallets" className="mobile-bottom-nav-add" aria-label="Buka transaksi untuk menambah transaksi">
                    <span aria-hidden="true"><Plus className="h-5 w-5" strokeWidth={2.5} /></span>
                    <span>Tambah</span>
                </Link>
            )}

            <button
                type="button"
                onClick={onOpenMenu}
                aria-expanded={menuOpen}
                aria-controls="mobile-navigation-drawer"
                className={`${baseItemClass} ${menuOpen ? 'is-active' : ''}`}
            >
                <Settings2 className="h-[18px] w-[18px]" aria-hidden="true" />
                <span>Pengaturan</span>
            </button>
            <button
                type="button"
                onClick={onOpenAccount}
                aria-expanded={accountOpen}
                aria-controls="mobile-account-drawer"
                className={`${baseItemClass} ${accountOpen ? 'is-active' : ''}`}
            >
                <UserRound className="h-[18px] w-[18px]" aria-hidden="true" />
                <span>Akun</span>
            </button>
        </nav>
    );
}
