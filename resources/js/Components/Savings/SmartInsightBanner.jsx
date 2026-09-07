export default function SmartInsightBanner({ insight, actionLabel, onAction }) {
    if (!insight?.title || !insight?.description) return null;

    return (
        <div className="ui-insight p-5 relative overflow-hidden">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="flex gap-4 items-center">
                    <div className="bg-emerald-100 p-2 rounded-lg hidden sm:block">
                        <svg className="w-7 h-7 text-emerald-800" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                    </div>
                    <div>
                        <span className="text-emerald-800 text-xs font-medium">Insight berdasarkan target Anda</span>
                        <h2 className="ui-section-title mt-1.5">{insight.title}</h2>
                        <p className="text-emerald-900/75 text-sm mt-0.5">{insight.description}</p>
                    </div>
                </div>
                {actionLabel && onAction && (
                    <button
                        onClick={onAction}
                        className="ui-button bg-emerald-700 text-white hover:bg-emerald-800 self-stretch md:self-auto text-center"
                    >
                        {actionLabel}
                    </button>
                )}
            </div>
        </div>
    );
}
