import React from 'react';

export default function MainBalanceCard({ balance = 150000000, net = 0 }) {
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
        <div className="self-stretch p-8 relative bg-white rounded-2xl border border-solid border-[#bec9c0] flex flex-col justify-between items-start overflow-hidden shadow-[0px_8px_10px_-6px_#181d1a0d,0px_20px_25px_-5px_#181d1a0d] h-full min-h-[220px]">
            <div className="self-stretch flex flex-col justify-start items-start gap-1.5 z-10">
                <div className="self-stretch flex flex-col justify-start items-start">
                    <span className="self-stretch text-slate-600 text-xs sm:text-sm font-semibold uppercase leading-6 tracking-widest">
                        TOTAL SALDO TERKONSOLIDASI
                    </span>
                </div>
                <div className="self-stretch pb-[0.80px] flex flex-col justify-start items-start">
                    <h2 className="self-stretch text-[#0e6c4a] text-3xl sm:text-5xl font-bold leading-[52.80px]">
                        {formattedBalance}
                    </h2>
                </div>
                <div className="self-stretch pt-2 inline-flex justify-start items-center gap-2">
                    <div className={netPositive ? "text-[#0e6c4a]" : "text-red-700"}>
                        <svg width="20" height="12" viewBox="0 0 20 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                            {netPositive
                                ? <path d="M1.4 12L0 10.6L7.4 3.15L11.4 7.15L16.6 2H14V0H20V6H18V3.4L11.4 10L7.4 6L1.4 12Z" fill="currentColor"/>
                                : <path d="M14 12V10H16.6L11.4 4.85L7.4 8.85L0 1.4L1.4 0L7.4 6L11.4 2L18 8.6V6H20V12H14Z" fill="currentColor"/>}
                        </svg>
                    </div>
                    <span className={`text-sm sm:text-base font-bold leading-6 ${netPositive ? 'text-[#0e6c4a]' : 'text-red-700'}`}>
                        {netLabel}
                    </span>
                </div>
            </div>

            {/* Radial background blur element from Figma design */}
            <div className="absolute w-64 h-64 -right-16 -top-16 bg-[#0e6c4a]/5 rounded-full blur-[32px] pointer-events-none" />

            <div className="self-stretch pt-8 flex flex-col justify-start items-start z-10">
                <div className="self-stretch inline-flex justify-start items-start gap-4">
                    <button className="px-8 py-4 relative bg-[#0e6c4a] hover:bg-[#0a4d35] transition-colors rounded-xl text-white text-base font-bold leading-6 shadow-[0px_8px_10px_-6px_rgba(14,108,74,0.15)] shadow-[0px_20px_25px_-5px_rgba(14,108,74,0.15)] active:scale-[0.98]">
                        Kirim Dana
                    </button>
                    <button className="px-8 py-4 bg-neutral-200 hover:bg-neutral-300 transition-colors rounded-xl border border-solid border-[#bec9c0] text-zinc-900 text-base font-bold leading-6 active:scale-[0.98]">
                        Tarik Tunai
                    </button>
                </div>
            </div>
        </div>
    );
}
