import React from 'react';

export default function Input({ label, icon: Icon, error, className = '', ...props }) {
    return (
        <div className={`w-full ${className}`}>
            {label && <label className="block text-sm font-semibold text-slate-700 mb-1.5">{label}</label>}
            <div className="relative rounded-xl shadow-sm">
                {Icon && (
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                        <Icon className="h-5 w-5" />
                    </div>
                )}
                <input
                    className={`block w-full rounded-xl border-slate-200 transition-all duration-300 focus:border-emerald-500 focus:ring-emerald-500 text-slate-900 placeholder:text-slate-400 ${Icon ? 'pl-11' : 'pl-4'} pr-4 py-2.5 bg-white border`}
                    {...props}
                />
            </div>
            {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
        </div>
    );
}