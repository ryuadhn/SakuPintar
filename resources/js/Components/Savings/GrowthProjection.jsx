export default function GrowthProjection({ data = [] }) {
    const points = Array.isArray(data)
        ? data.filter((point) => Number.isFinite(Number(point?.value)))
        : [];

    if (points.length === 0) return null;

    const maxValue = Math.max(...points.map((point) => Number(point.value)), 1);

    return (
        <div className="ui-card p-5">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h3 className="ui-section-title">Proyeksi Pertumbuhan</h3>
                    <p className="text-xs text-slate-400">Estimasi saldo berdasarkan data target Anda</p>
                </div>
            </div>
            
            <div className="h-56 flex items-end justify-between gap-3 relative mt-4 px-2">
                <div className="absolute inset-x-0 top-0 border-t border-slate-50 h-0 w-full" />
                <div className="absolute inset-x-0 top-1/4 border-t border-slate-50 h-0 w-full" />
                <div className="absolute inset-x-0 top-2/4 border-t border-slate-50 h-0 w-full" />
                <div className="absolute inset-x-0 top-3/4 border-t border-slate-50 h-0 w-full" />
                {points.map((point) => {
                    const isProjection = Boolean(point.isProjection);
                    const height = `${Math.max(8, (Number(point.value) / maxValue) * 190)}px`;
                    return (
                        <div key={point.label} className="flex-1 flex flex-col items-center group z-10">
                            <div
                                className={`w-full rounded-t-lg transition-all duration-300 ${isProjection ? 'bg-emerald-300 group-hover:bg-emerald-400' : 'bg-slate-200 group-hover:bg-slate-300'}`}
                                style={{ height }}
                            />
                            <span className={`text-[10px] mt-2 font-medium ${isProjection ? 'text-emerald-600' : 'text-slate-400'}`}>
                                {point.label}
                            </span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
