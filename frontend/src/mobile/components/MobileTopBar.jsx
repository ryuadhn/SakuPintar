import React from 'react';
import { Bell, Menu } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function MobileTopBar({
    icon,
    notificationCount = 0,
    notificationsOpen = false,
    menuOpen = false,
    onToggleNotifications,
    onToggleMenu,
}) {
    return (
        <div className="mobile-topbar flex min-w-0 flex-1 items-center justify-between gap-2 sm:hidden">
            <Link to="/dashboard" aria-label="Sakuta, ke Dashboard" className="flex min-w-0 items-center gap-2">
                <img className="h-9 w-9 shrink-0 rounded-md" src={icon} alt="Sakuta logo" draggable={false} />
                <span className="mobile-topbar-brand-name truncate text-[20px] font-bold leading-6 tracking-tight text-[#0e6c4a]">Sakuta</span>
            </Link>

            <div className="flex shrink-0 items-center gap-1">
                <button
                    type="button"
                    aria-label={notificationsOpen ? 'Tutup pemberitahuan' : 'Buka pemberitahuan'}
                    aria-expanded={notificationsOpen}
                    aria-controls="notification-panel"
                    onClick={onToggleNotifications}
                    className={`ui-icon-button relative ${notificationCount > 0 ? 'ui-icon-button-active' : ''}`}
                >
                    <Bell className="h-5 w-5" aria-hidden="true" />
                    {notificationCount > 0 && (
                        <span className="absolute -right-0.5 -top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-rose-600 px-1 text-[10px] font-bold text-white ring-2 ring-white">
                            {notificationCount > 99 ? '99+' : notificationCount}
                        </span>
                    )}
                </button>
                <button
                    type="button"
                    aria-label={menuOpen ? 'Tutup menu navigasi' : 'Buka menu navigasi'}
                    aria-expanded={menuOpen}
                    aria-controls="mobile-navigation-drawer"
                    onClick={onToggleMenu}
                    className="ui-icon-button"
                >
                    <Menu className="h-5 w-5" aria-hidden="true" />
                </button>
            </div>
        </div>
    );
}
