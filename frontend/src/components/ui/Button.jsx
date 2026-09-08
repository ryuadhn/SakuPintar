import React from 'react';

export default function Button({ children, className = '', variant = 'primary', ...props }) {
    const baseStyle = "ui-button flex items-center justify-center gap-2 transition-colors duration-150 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-60";
    
    const variants = {
        primary: "bg-emerald-700 hover:bg-emerald-800 text-white",
        secondary: "border border-slate-200 bg-white hover:bg-slate-50 text-slate-700",
        outline: "border border-emerald-700 text-emerald-700 hover:bg-emerald-50",
        dark: "bg-slate-900 hover:bg-slate-800 text-white"
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
