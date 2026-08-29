import React from 'react';

export default function TransactionTable({ children }) {
    return (
        <div className="self-stretch bg-white rounded-2xl outline outline-1 outline-offset-[-1px] outline-stone-300 flex flex-col justify-start items-start overflow-hidden shadow-sm">
            {/* Table Header Section */}
            <div className="self-stretch px-8 py-8 border-b border-stone-300 flex justify-between items-center bg-white flex-wrap gap-4">
                <div className="flex flex-col justify-start items-start">
                    <h3 className="text-zinc-900 text-base font-bold leading-6">Aktivitas Terakhir</h3>
                </div>
                <button className="px-4 py-2 bg-stone-100 hover:bg-stone-200 transition-colors rounded-xl outline outline-1 outline-offset-[-1px] outline-stone-300 text-zinc-900 text-sm font-semibold tracking-wide active:scale-[0.98]">
                    Download Report
                </button>
            </div>

            {/* Table Area */}
            <div className="self-stretch w-full overflow-x-auto">
                <table className="w-full min-w-[700px] table-auto text-left">
                    <thead>
                        <tr className="bg-stone-100 border-b border-stone-200 text-[10px] font-bold uppercase text-slate-600 tracking-wide">
                            <th className="py-4 px-8 w-1/2">PENERIMA / DESKRIPSI</th>
                            <th className="py-4 px-8">KATEGORI</th>
                            <th className="py-4 px-8">TANGGAL</th>
                            <th className="py-4 px-8 text-right">JUMLAH</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-200">
                        {children}
                    </tbody>
                </table>
            </div>
        </div>
    );
}