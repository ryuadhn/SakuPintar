import React from 'react';

export default function Badge({ children, type = 'default', className = '' }) {
    const baseStyle = "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold tracking-wide transition-all duration-300";
    
    const types = {
        default: "bg-slate-100 text-slate-700 border border-slate-200",
        lifestyle: "bg-purple-50 text-purple-700 border border-purple-100",
        safety: "bg-emerald-50 text-emerald-700 border border-emerald-100",
        transport: "bg-blue-50 text-blue-700 border border-blue-100",
        food: "bg-amber-50 text-amber-700 border border-amber-100",
        entertainment: "bg-rose-50 text-rose-700 border border-rose-100"
    };

    return (
        <span className={`${baseStyle} ${types[type]} ${className}`}>
            {children}
        </span>
    );
}