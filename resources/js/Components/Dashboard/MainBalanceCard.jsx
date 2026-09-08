import React from 'react';

export default function MainBalanceCard({ balance = 0, net = 0 }) {
    const formattedBalance = new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0
    }).format(balance);

    const formattedNet = new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0
    }).format(Math.abs(net));

    const netPositive = net >= 0;
    const netLabel = `${netPositive ? '+' : '-'}${formattedNet} (${balance ? Math.abs(Math.round((net / balance) * 1000) / 10) : 0}%) arus kas bulan ini`;

    return (
        <section className="ui-card ui-card-balance relative isolate flex min-h-[12.5rem] w-full self-stretch flex-col p-4 sm:min-h-[13rem] sm:p-5" aria-labelledby="total-balance-heading">
            <div className="relative z-10 flex h-full flex-col gap-4">
                <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                        <div className="flex items-center gap-2">
                            <span className="ui-balance-icon" aria-hidden="true">
                                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                                    <rect x="3" y="5" width="18" height="14" rx="3" />
                                    <path d="M3 9h18M7 15h3" strokeLinecap="round" />
                                </svg>
                            </span>
                            <span className="truncate text-xs font-medium leading-5 text-slate-600">Total saldo terkonsolidasi</span>
                        </div>
                        <h2 id="total-balance-heading" className="mt-2 text-2xl font-semibold leading-none tracking-tight text-[#0e6c4a] tabular-nums sm:text-3xl">
                            {formattedBalance}
                        </h2>
                    </div>
                    <span className="ui-balance-chip shrink-0">Semua dompet</span>
                </div>

                <div className={`ui-balance-flow ${netPositive ? 'is-positive' : 'is-negative'}`}>
                    <span className="ui-balance-flow-icon" aria-hidden="true">
                        <svg className="h-4 w-4" viewBox="0 0 20 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                            {netPositive
                                ? <path d="M1.4 12L0 10.6L7.4 3.15L11.4 7.15L16.6 2H14V0H20V6H18V3.4L11.4 10L7.4 6L1.4 12Z" fill="currentColor"/>
                                : <path d="M14 12V10H16.6L11.4 4.85L7.4 8.85L0 1.4L1.4 0L7.4 6L11.4 2L18 8.6V6H20V12H14Z" fill="currentColor"/>}
                        </svg>
                    </span>
                    <span className="min-w-0 break-words text-xs font-semibold leading-5 sm:text-sm">{netLabel}</span>
                </div>

                <div className="ui-balance-footer mt-auto flex items-center gap-2 text-[11px] font-medium">
                    <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                        <path d="M4 7.5h16M4 12h16M4 16.5h10" strokeLinecap="round" />
                    </svg>
                    <span>Gabungan saldo dari seluruh dompet</span>
                </div>
            </div>
        </section>
    );
}
