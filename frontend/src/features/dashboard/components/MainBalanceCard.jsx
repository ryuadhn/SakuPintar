import React from 'react';
import { ArrowRightLeft, TrendingDown, TrendingUp, Wallet } from 'lucide-react';

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
    const FlowIcon = netPositive ? TrendingUp : TrendingDown;
    const netLabel = `${netPositive ? '+' : '-'}${formattedNet} (${balance ? Math.abs(Math.round((net / balance) * 1000) / 10) : 0}%) arus kas bulan ini`;

    return (
        <section className="dashboard-balance-card ui-card ui-card-balance relative isolate flex min-h-[12.5rem] w-full self-stretch flex-col p-4 sm:min-h-[13rem] sm:p-5" aria-labelledby="total-balance-heading">
            <div className="relative z-10 flex h-full flex-col gap-4">
                <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                        <div className="flex items-center gap-2">
                            <span className="ui-balance-icon" aria-hidden="true">
                                <Wallet className="h-4 w-4" strokeWidth={1.8} />
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
                        <FlowIcon className="h-4 w-4" strokeWidth={2} />
                    </span>
                    <span className="min-w-0 break-words text-xs font-semibold leading-5 sm:text-sm">{netLabel}</span>
                </div>

                <div className="ui-balance-footer mt-auto flex items-center gap-2 text-[11px] font-medium">
                    <ArrowRightLeft className="h-4 w-4 shrink-0" aria-hidden="true" strokeWidth={1.8} />
                    <span>Gabungan saldo dari seluruh dompet</span>
                </div>
            </div>
        </section>
    );
}
