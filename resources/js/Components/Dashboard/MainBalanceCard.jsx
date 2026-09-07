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
        <div className="ui-card ui-card-balance w-full self-stretch p-5 flex flex-col gap-3 items-start">
            <div className="self-stretch flex flex-col justify-start items-start gap-1.5 z-10">
                <div className="self-stretch flex flex-col justify-start items-start">
                    <span className="self-stretch text-slate-600 text-xs font-medium leading-5">
                        Total saldo terkonsolidasi
                    </span>
                </div>
                <div className="self-stretch pb-[0.80px] flex flex-col justify-start items-start">
                        <h2 className="self-stretch text-[#0e6c4a] text-3xl font-semibold leading-9">
                        {formattedBalance}
                    </h2>
                </div>
                <div className="self-stretch pt-1 inline-flex justify-start items-center gap-2">
                    <div className={netPositive ? "text-[#0e6c4a]" : "text-red-700"}>
                        <svg width="20" height="12" viewBox="0 0 20 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                            {netPositive
                                ? <path d="M1.4 12L0 10.6L7.4 3.15L11.4 7.15L16.6 2H14V0H20V6H18V3.4L11.4 10L7.4 6L1.4 12Z" fill="currentColor"/>
                                : <path d="M14 12V10H16.6L11.4 4.85L7.4 8.85L0 1.4L1.4 0L7.4 6L11.4 2L18 8.6V6H20V12H14Z" fill="currentColor"/>}
                        </svg>
                    </div>
                    <span className={`text-sm sm:text-base font-medium leading-5 ${netPositive ? 'text-[#0e6c4a]' : 'text-red-700'}`}>
                        {netLabel}
                    </span>
                </div>
            </div>

        </div>
    );
}
