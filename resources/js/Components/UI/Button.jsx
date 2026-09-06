import React from 'react';

export default function Button({ children, className = '', variant = 'primary', ...props }) {
    const baseStyle = "min-h-9 px-3.5 py-2 rounded-lg font-medium transition-colors duration-200 flex items-center justify-center gap-2 shadow-sm active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-60";
    
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
