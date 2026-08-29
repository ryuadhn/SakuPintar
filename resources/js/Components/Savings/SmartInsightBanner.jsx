import React from 'react';

export default function SmartInsightBanner() {
    return (
        <div className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-2xl p-6 shadow-md relative overflow-hidden">
            {/* Background pattern */}
            <div className="absolute right-0 top-0 w-32 h-full opacity-10 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:12px_12px] pointer-events-none" />
            
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative z-10">
                <div className="flex gap-4 items-center">
                    <div className="bg-white/20 p-3 rounded-2xl backdrop-blur-sm hidden sm:block">
                        <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                    </div>
                    <div>
                        <span className="bg-white/20 text-white text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full backdrop-blur-md">
                            Smart Insight AI
                        </span>
                        <h2 className="text-lg font-bold mt-1.5">Target Liburan ke Jepang hampir tercapai!</h2>
                        <p className="text-emerald-100 text-sm mt-0.5">Dengan tren menabungmu saat ini, target akan terpenuhi 12 hari lebih cepat.</p>
                    </div>
                </div>
                <button className="bg-white text-emerald-700 hover:bg-emerald-50 transition-colors font-bold text-sm px-5 py-2.5 rounded-xl shadow-sm self-stretch md:self-auto text-center">
                    Lihat Proyeksi
                </button>
            </div>
        </div>
    );
}