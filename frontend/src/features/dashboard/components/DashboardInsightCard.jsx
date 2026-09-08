import React from 'react';
import { Info, Scale, TrendingDown, TrendingUp } from 'lucide-react';
import { fmtIDR } from '../../../utils/format';

const getInsight = ({ income, expense, net, transactionCount }) => {
    const hasCashFlowData = transactionCount > 0 && (income > 0 || expense > 0);

    if (!hasCashFlowData) {
        return {
            icon: Info,
            iconClass: 'ui-tone-neutral',
            title: 'Belum cukup data untuk membuat insight bulan ini.',
            description: 'Tambahkan transaksi untuk mulai melihat analisis kondisi keuangan Anda.',
        };
    }

    if (net > 0) {
        return {
            icon: TrendingUp,
            iconClass: 'ui-tone-positive',
            title: `Arus kas bulan ini surplus ${fmtIDR(net)}.`,
            description: `Pemasukan ${fmtIDR(income)} lebih besar daripada pengeluaran ${fmtIDR(expense)} dari ${transactionCount} transaksi.`,
        };
    }

    if (net < 0) {
        return {
            icon: TrendingDown,
            iconClass: 'ui-tone-danger',
            title: `Arus kas bulan ini defisit ${fmtIDR(Math.abs(net))}.`,
            description: `Pengeluaran ${fmtIDR(expense)} lebih besar daripada pemasukan ${fmtIDR(income)} dari ${transactionCount} transaksi.`,
        };
    }

    return {
        icon: Scale,
        iconClass: 'ui-tone-neutral',
        title: 'Arus kas bulan ini seimbang.',
        description: `Pemasukan dan pengeluaran sama-sama tercatat ${fmtIDR(income)} dari ${transactionCount} transaksi.`,
    };
};

export default function DashboardInsightCard({ income = 0, expense = 0, net = 0, transactionCount = 0 }) {
    const insight = getInsight({ income, expense, net, transactionCount });
    const InsightIcon = insight.icon;

    return (
        <section className="dashboard-insight-card ui-card flex items-start gap-3 p-4 sm:p-5" aria-labelledby="dashboard-insight-heading">
            <div className={`ui-tone-icon flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${insight.iconClass}`}>
                <InsightIcon className="h-4 w-4" aria-hidden="true" />
            </div>
            <div className="min-w-0">
                <p className="text-xs font-medium text-slate-500">Insight bulan ini</p>
                <h2 id="dashboard-insight-heading" className="ui-section-title mt-1">{insight.title}</h2>
                <p className="mt-1 text-xs leading-relaxed text-slate-600">{insight.description}</p>
            </div>
        </section>
    );
}
