import React from 'react';

export default function TransactionRow({ name, subname, category, date, amount, type = 'expense' }) {
    const isExpense = type === 'expense';
    
    // Format amount as currency Indonesian Rupiah
    const formattedAmount = new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0
    }).format(amount);

    // Icon Selector based on name or category
    const renderIcon = () => {
        if (type === 'transfer') {
            return (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4M16 17H4m0 0l4 4m-4-4l4-4" />
                </svg>
            );
        }
        if (type === 'income' || category === 'Pendapatan') {
            // Cash Icon SVG
            return (
                <svg width="22" height="16" viewBox="0 0 22 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M13 9C12.1667 9 11.4583 8.70833 10.875 8.125C10.2917 7.54167 10 6.83333 10 6C10 5.16667 10.2917 4.45833 10.875 3.875C11.4583 3.29167 12.1667 3 13 3C13.8333 3 14.5417 3.29167 15.125 3.875C15.7083 4.45833 16 5.16667 16 6C16 6.83333 15.7083 7.54167 15.125 8.125C14.5417 8.70833 13.8333 9 13 9ZM6 12C5.45 12 4.97917 11.8042 4.5875 11.4125C4.19583 11.0208 4 10.55 4 10V2C4 1.45 4.19583 0.979167 4.5875 0.5875C4.97917 0.195833 5.45 0 6 0H20C20.55 0 21.0208 0.195833 21.4125 0.5875C21.8042 0.979167 22 1.45 22 2V10C22 10.55 21.8042 11.0208 21.4125 11.4125C21.0208 11.8042 20.55 12 20 12H6ZM8 10H18C18 9.45 18.1958 8.97917 18.5875 8.5875C18.9792 8.19583 19.45 8 20 8V4C19.45 4 18.9792 3.80417 18.5875 3.4125C18.1958 3.02083 18 2.55 18 2H8C8 2.55 7.80417 3.02083 7.4125 3.4125C7.02083 3.80417 6.55 4 6 4V8C6.55 8 7.02083 8.19583 7.4125 8.5875C7.80417 8.97917 8 9.45 8 10ZM19 16H2C1.45 16 0.979167 15.8042 0.5875 15.4125C0.195833 15.0208 0 14.55 0 14V3H2V14H19V16ZM6 10V2V10Z" fill="#0E6C4A"/>
                </svg>
            );
        } else if (category === 'Lifestyle' || category === 'Hiburan') {
            // Dinner / Fork & Spoon Icon SVG
            return (
                <svg width="15" height="20" viewBox="0 0 15 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M3 20V10.85C2.15 10.6167 1.4375 10.15 0.8625 9.45C0.2875 8.75 0 7.93333 0 7V0H2V7H3V0H5V7H6V0H8V7C8 7.93333 7.7125 8.75 7.1375 9.45C6.5625 10.15 5.85 10.6167 5 10.85V20H3ZM13 20V12H10V5C10 3.61667 10.4875 2.4375 11.4625 1.4625C12.4375 0.4875 13.6167 0 15 0V20H13Z" fill="#0E6C4A"/>
                </svg>
            );
        } else {
            // Shopping Bag Icon SVG
            return (
                <svg width="16" height="20" viewBox="0 0 16 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M2 20C1.45 20 0.979167 19.8042 0.5875 19.4125C0.195833 19.0208 0 18.55 0 18V6C0 5.45 0.195833 4.97917 0.5875 4.5875C0.979167 4.19583 1.45 4 2 4H4C4 2.9 4.39167 1.95833 5.175 1.175C5.95833 0.391667 6.9 0 8 0C9.1 0 10.0417 0.391667 10.825 1.175C11.6083 1.95833 12 2.9 12 4H14C14.55 4 15.0208 4.19583 15.4125 4.5875C15.8042 4.97917 16 5.45 16 6V18C16 18.55 15.8042 19.0208 15.4125 19.4125C15.0208 19.8042 14.55 20 14 20H2ZM2 18H14V6H12V8C12 8.28333 11.9042 8.52083 11.7125 8.7125C11.5208 8.90417 11.2833 9 11 9C10.7167 9 10.4792 8.90417 10.2875 8.7125C10.0958 8.52083 10 8.28333 10 8V6H6V8C6 8.28333 5.90417 8.52083 5.7125 8.7125C5.52083 8.90417 5.28333 9 5 9C4.71667 9 4.47917 8.90417 4.2875 8.7125C4.09583 8.52083 4 8.28333 4 8V6H2V18ZM6 4H10C10 3.45 9.80417 2.97917 9.4125 2.5875C9.02083 2.19583 8.55 2 8 2C7.45 2 6.97917 2.19583 6.5875 2.5875C6.19583 2.97917 6 3.45 6 4ZM2 18V6V18Z" fill="#0E6C4A"/>
                </svg>
            );
        }
    };

    // Category Badge Styling based on category
    const getBadgeStyle = () => {
        if (type === 'transfer') {
            return 'bg-sky-50 text-sky-700 border border-sky-100';
        }
        if (type === 'income') {
            return 'bg-emerald-100 text-emerald-800';
        }
        if (category === 'Lifestyle' || category === 'Hiburan') {
            return 'bg-neutral-100 text-neutral-700';
        }
        return 'bg-neutral-200 text-neutral-700';
    };

    return (
        <tr className="hover:bg-slate-50/50 transition-colors border-t border-stone-200">
            {/* Description & Icon */}
            <td className="py-4 px-8 w-1/2">
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-[#0e6c4a]/10 rounded-full flex justify-center items-center shrink-0">
                        {renderIcon()}
                    </div>
                    <div className="flex flex-col justify-start items-start">
                        <span className="text-zinc-900 text-base font-bold leading-6">
                            {name}
                        </span>
                        {subname && (
                            <span className="text-slate-600 text-[10px] font-normal leading-4 mt-0.5">
                                {subname}
                            </span>
                        )}
                    </div>
                </div>
            </td>
            
            {/* Category */}
            <td className="py-4 px-8">
                <div className={`px-3 py-1 rounded-full text-xs font-bold w-fit ${getBadgeStyle()}`}>
                    {category}
                </div>
            </td>
            
            {/* Date */}
            <td className="py-4 px-8">
                <span className="text-slate-600 text-sm font-semibold tracking-wide">
                    {date}
                </span>
            </td>
            
            {/* Amount */}
            <td className="py-4 px-8 text-right">
                <span className={`text-base font-bold leading-6 ${type === 'transfer' ? 'text-slate-600' : isExpense ? 'text-red-700' : 'text-[#0e6c4a]'}`}>
                    {isExpense ? `- ${formattedAmount}` : `+ ${formattedAmount}`}
                </span>
            </td>
        </tr>
    );
}