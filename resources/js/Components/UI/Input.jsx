import React, { useId } from 'react';

export default function Input({ label, icon: Icon, error, className = '', ...props }) {
    const generatedId = useId();
    const inputId = props.id || `input-${generatedId.replace(/:/g, '')}`;
    const errorId = `${inputId}-error`;
    const describedBy = [props['aria-describedby'], error ? errorId : null]
        .filter(Boolean)
        .join(' ') || undefined;

    return (
        <div className={`w-full ${className}`}>
            {label && <label htmlFor={inputId} className="block text-xs font-medium text-slate-700 mb-1">{label}</label>}
            <div className="relative rounded-lg">
                {Icon && (
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                        <Icon className="h-4 w-4" />
                    </div>
                )}
                <input
                    className={`block w-full rounded-lg border-slate-200 transition-colors duration-200 focus:border-emerald-500 focus:ring-emerald-500 text-sm text-slate-900 placeholder:text-slate-500 ${Icon ? 'pl-10' : 'pl-3.5'} pr-3.5 py-2 bg-white border`}
                    {...props}
                    id={inputId}
                    aria-invalid={error ? 'true' : props['aria-invalid']}
                    aria-describedby={describedBy}
                />
            </div>
            {error && <p id={errorId} role="alert" className="mt-1 text-sm text-red-600">{error}</p>}
        </div>
    );
}
