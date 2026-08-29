import React from 'react';

export default function Button({ children, className = '', variant = 'primary', ...props }) {
    const baseStyle = "px-4 py-2 rounded-xl font-medium transition-all duration-300 transform active:scale-95 flex items-center justify-center gap-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2";
    
    const variants = {
        primary: "bg-emerald-600 hover:bg-emerald-700 text-white focus:ring-emerald-500 shadow-emerald-200",
        secondary: "bg-emerald-50 hover:bg-emerald-100 text-emerald-700 focus:ring-emerald-300",
        outline: "border border-emerald-600 text-emerald-600 hover:bg-emerald-50 focus:ring-emerald-500",
        dark: "bg-slate-900 hover:bg-slate-800 text-white focus:ring-slate-700"
    };

    return (
        <button
            className={`${baseStyle} ${variants[variant]} ${className}`}
            {...props}
        >
            {children}
        </button>
    );
}