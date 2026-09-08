import React, { useId } from 'react';

export default function Input({ label, icon: Icon, error, className = '', inputClassName = '', ...props }) {
    const generatedId = useId();
    const inputId = props.id || `input-${generatedId.replace(/:/g, '')}`;
    const errorId = `${inputId}-error`;
    const describedBy = [props['aria-describedby'], error ? errorId : null]
        .filter(Boolean)
        .join(' ') || undefined;

    return (
        <div className={`w-full ${className}`}>
            {label && <label htmlFor={inputId} className="ui-field-label block mb-1">{label}</label>}
            <div className="relative">
                {Icon && (
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                        <Icon className="h-4 w-4" aria-hidden="true" />
                    </div>
                )}
                <input
                    className={`ui-input ui-control block w-full transition-colors duration-150 placeholder:text-slate-400 ${Icon ? 'pl-10' : 'pl-3.5'} pr-3.5 py-2 ${inputClassName}`}
                    {...props}
                    id={inputId}
                    aria-invalid={error ? 'true' : props['aria-invalid']}
                    aria-describedby={describedBy}
                />
            </div>
            {error && <p id={errorId} role="alert" className="mt-1 text-xs text-rose-700">{error}</p>}
        </div>
    );
}
