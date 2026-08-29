import React from 'react';

export default function GrowthProjection() {
    return (
        <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h3 className="text-lg font-bold text-slate-800">Proyeksi Pertumbuhan</h3>
                    <p className="text-xs text-slate-400">Estimasi saldo tabungan Anda di masa mendatang</p>
                </div>
            </div>
            
            <div className="h-56 flex items-end justify-between gap-3 relative mt-4 px-2">
                {/* Horizontal Guide Lines */}
                <div className="absolute inset-x-0 top-0 border-t border-slate-50 h-0 w-full" />
                <div className="absolute inset-x-0 top-1/4 border-t border-slate-50 h-0 w-full" />
                <div className="absolute inset-x-0 top-2/4 border-t border-slate-50 h-0 w-full" />
                <div className="absolute inset-x-0 top-3/4 border-t border-slate-50 h-0 w-full" />
                
                {/* Visual projection bars */}
                <div className="flex-1 flex flex-col items-center group z-10">
                    <div className="w-full bg-slate-200 rounded-t-lg transition-all duration-300 group-hover:bg-slate-300" style={{ height: '60px' }} />
                    <span className="text-[10px] text-slate-400 mt-2 font-medium">Bulan 1</span>
                </div>
                <div className="flex-1 flex flex-col items-center group z-10">
                    <div className="w-full bg-slate-200 rounded-t-lg transition-all duration-300 group-hover:bg-slate-300" style={{ height: '90px' }} />
                    <span className="text-[10px] text-slate-400 mt-2 font-medium">Bulan 2</span>
                </div>
                <div className="flex-1 flex flex-col items-center group z-10">
                    <div className="w-full bg-emerald-200 rounded-t-lg transition-all duration-300 group-hover:bg-emerald-300" style={{ height: '120px' }} />
                    <span className="text-[10px] text-slate-400 mt-2 font-medium">Bulan 3 (Est)</span>
                </div>
                <div className="flex-1 flex flex-col items-center group z-10">
                    <div className="w-full bg-emerald-300 rounded-t-lg transition-all duration-300 group-hover:bg-emerald-400" style={{ height: '150px' }} />
                    <span className="text-[10px] text-slate-400 mt-2 font-medium">Bulan 4 (Est)</span>
                </div>
                <div className="flex-1 flex flex-col items-center group z-10">
                    <div className="w-full bg-emerald-500 rounded-t-lg transition-all duration-300 group-hover:bg-emerald-600 shadow-md shadow-emerald-100" style={{ height: '190px' }} />
                    <span className="text-[10px] text-emerald-600 mt-2 font-bold">Bulan 5 (Est)</span>
                </div>
            </div>
        </div>
    );
}