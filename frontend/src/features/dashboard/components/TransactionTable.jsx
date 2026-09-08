import React from 'react';
import { ReceiptText } from 'lucide-react';

export default function TransactionTable({ children, mobileContent = null, className = '' }) {
    return (
        <div className={`ui-card self-stretch p-0 flex flex-col justify-start items-start overflow-hidden ${className}`}>
            {/* Table Header Section */}
            <div className="self-stretch px-6 py-4 border-b border-stone-300 flex items-center bg-white flex-wrap gap-3">
                <div className="flex flex-col justify-start items-start">
                    <h3 className="flex items-center gap-2 ui-section-title">
                        <ReceiptText className="h-[18px] w-[18px] text-slate-500" aria-hidden="true" />
                        Aktivitas Terakhir
                    </h3>
                </div>
            </div>

            {/* Table Area */}
            {mobileContent}
            <div className={`self-stretch w-full overflow-x-auto ${mobileContent ? 'hidden sm:block' : ''}`}>
                <table className="w-full min-w-[700px] table-auto text-left">
                    <thead>
                        <tr className="bg-white border-b border-[var(--ui-line)] text-xs font-semibold text-[var(--ui-ink)]">
                            <th scope="col" className="py-3 px-6 w-1/2">Penerima / deskripsi</th>
                            <th scope="col" className="py-3 px-6">Kategori</th>
                            <th scope="col" className="py-3 px-6">Tanggal</th>
                            <th scope="col" className="py-3 px-6 text-right">Jumlah</th>
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
