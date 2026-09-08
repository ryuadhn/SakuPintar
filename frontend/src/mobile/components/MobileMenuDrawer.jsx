import React, { useEffect, useId, useRef } from 'react';
import { X } from 'lucide-react';

export default function MobileMenuDrawer({ open, onClose, title, id, children }) {
    const panelRef = useRef(null);
    const previousFocusRef = useRef(null);
    const onCloseRef = useRef(onClose);
    const titleId = useId();

    useEffect(() => {
        onCloseRef.current = onClose;
    }, [onClose]);

    useEffect(() => {
        if (!open) return undefined;

        previousFocusRef.current = document.activeElement;
        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';

        const getFocusableElements = () => (
            [...(panelRef.current?.querySelectorAll(
                'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
            ) || [])].filter((element) => element.getClientRects().length > 0)
        );

        const focusTimer = window.setTimeout(() => {
            const initialTarget = panelRef.current?.querySelector('[data-autofocus]') || getFocusableElements()[0];
            (initialTarget || panelRef.current)?.focus();
        }, 0);

        const handleKeyDown = (event) => {
            if (event.key === 'Escape') {
                event.preventDefault();
                onCloseRef.current();
                return;
            }

            if (event.key !== 'Tab') return;
            const focusableElements = getFocusableElements();
            if (focusableElements.length === 0) {
                event.preventDefault();
                panelRef.current?.focus();
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
            document.body.style.overflow = previousOverflow;
            if (previousFocusRef.current && typeof previousFocusRef.current.focus === 'function') {
                previousFocusRef.current.focus();
            }
        };
    }, [open]);

    if (!open) return null;

    return (
        <>
            <button
                type="button"
                aria-label={`Tutup ${title}`}
                className="mobile-drawer-backdrop fixed inset-0 z-40 bg-slate-900/35 sm:hidden"
                onClick={onClose}
            />
            <aside
                id={id}
                ref={panelRef}
                role="dialog"
                aria-modal="true"
                aria-labelledby={titleId}
                tabIndex="-1"
                className="mobile-drawer fixed inset-y-0 right-0 z-50 flex w-full max-w-[22rem] flex-col border-l border-slate-200 bg-white shadow-2xl sm:hidden"
            >
                <div className="mobile-drawer-header flex shrink-0 items-center justify-between border-b border-slate-100 px-4 py-3">
                    <h2 id={titleId} className="text-base font-semibold text-slate-800">{title}</h2>
                    <button
                        type="button"
                        data-autofocus
                        aria-label={`Tutup ${title}`}
                        onClick={onClose}
                        className="ui-icon-button"
                    >
                        <X className="h-5 w-5" aria-hidden="true" />
                    </button>
                </div>
                <div className="mobile-drawer-body min-h-0 flex-1 overflow-y-auto p-4">{children}</div>
            </aside>
        </>
    );
}
