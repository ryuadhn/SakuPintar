import React from 'react';

export default function TransactionTable({ children }) {
    return (
        <div className="ui-card self-stretch p-0 flex flex-col justify-start items-start overflow-hidden">
            {/* Table Header Section */}
            <div className="self-stretch px-6 py-4 border-b border-stone-300 flex items-center bg-white flex-wrap gap-3">
                <div className="flex flex-col justify-start items-start">
                    <h3 className="ui-section-title">Aktivitas Terakhir</h3>
                </div>
            </div>

            {/* Table Area */}
            <div className="self-stretch w-full overflow-x-auto">
                <table className="w-full min-w-[700px] table-auto text-left">
                    <thead>
                        <tr className="bg-stone-50 border-b border-stone-200 text-xs font-medium text-slate-600">
                            <th className="py-3 px-6 w-1/2">Penerima / deskripsi</th>
                            <th className="py-3 px-6">Kategori</th>
                            <th className="py-3 px-6">Tanggal</th>
                            <th className="py-3 px-6 text-right">Jumlah</th>
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
