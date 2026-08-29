import React from 'react';

export default function AIHabitBanner() {
    return (
        <div className="bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-950 text-white rounded-3xl p-8 shadow-xl relative overflow-hidden border border-emerald-900/30">
            {/* Background elements */}
            <div className="absolute right-0 top-0 w-64 h-full bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
            
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative z-10">
                <div className="max-w-xl">
                    <div className="inline-flex items-center gap-2 bg-emerald-900/50 text-emerald-400 border border-emerald-500/30 text-[10px] uppercase font-bold tracking-widest px-3 py-1 rounded-full backdrop-blur-md mb-3.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        AI Spending Habits
                    </div>
                    <h2 className="text-xl md:text-2xl font-bold tracking-tight">Master Your Spending Habits</h2>
                    <p className="text-slate-400 text-sm mt-1.5">SakuPintar menganalisis transaksi harian Anda secara otomatis untuk memberikan tips cerdas dalam meminimalisir pengeluaran impulsif.</p>
                </div>
                <button className="bg-emerald-600 hover:bg-emerald-500 transition-colors text-white font-bold text-sm px-6 py-3 rounded-xl shadow-md shadow-emerald-950/20 whitespace-nowrap">
                    Aktifkan Analisis AI
                </button>
            </div>
        </div>
    );
}