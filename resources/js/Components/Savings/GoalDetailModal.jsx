import React, { useState } from 'react';
import { Trash2, Calendar, DollarSign, FileText, Plus, Minus } from 'lucide-react';
import Modal from '../UI/Modal';
import Input from '../UI/Input';
import Button from '../UI/Button';
import { useFinance } from '../../Store/FinanceContext';
import { useAuth } from '../../Store/AuthContext';
import { GOAL_ICONS } from './GoalModal';
import { fmtIDR, formatDateID, todayISO } from '../../Utils/format';

export default function GoalDetailModal({ goal, isOpen, onClose }) {
    const { addSavingsGoalDeposit, deleteSavingsGoalDeposit } = useFinance();
    const { user } = useAuth();

    const [type, setType] = useState('deposit'); // 'deposit' or 'withdraw'
    const [amount, setAmount] = useState('');
    const [date, setDate] = useState(todayISO());
    const [note, setNote] = useState('');
    const [error, setError] = useState('');

    if (!goal) return null;

    const progress = goal.target > 0 ? Math.min(100, Math.round((goal.current / goal.target) * 100)) : 0;
    const isDone = progress >= 100;
    const Icon = GOAL_ICONS[goal.iconKey]?.Icon || GOAL_ICONS.other.Icon;

    const handleSubmit = (e) => {
        e.preventDefault();
        setError('');

        const amt = Number(amount);
        if (!amount || Number.isNaN(amt) || amt <= 0) {
            setError('Nominal harus berupa angka lebih dari 0');
            return;
        }

        // For withdraw, make sure current amount is sufficient
        if (type === 'withdraw' && amt > goal.current) {
            setError(`Dana tidak mencukupi untuk ditarik. Maksimum: ${fmtIDR(goal.current)}`);
            return;
        }

        const signedAmount = type === 'deposit' ? amt : -amt;
        const defaultNote = type === 'deposit' ? 'Setoran Tabungan' : 'Penarikan Tabungan';

        addSavingsGoalDeposit(goal.id, {
            amount: signedAmount,
            date: date || todayISO(),
            note: note.trim() || defaultNote,
            senderName: user ? user.name : 'Anda',
        });

        // Reset form
        setAmount('');
        setNote('');
        setDate(todayISO());
    };

    const handleDelete = (depositId) => {
        if (window.confirm('Hapus catatan riwayat setoran ini?')) {
            deleteSavingsGoalDeposit(goal.id, depositId);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Detail Target: ${goal.title}`} wide>
            <div className="space-y-5">
                
                {/* ── Progress Card ── */}
                <div className="ui-card-subtle p-4 flex flex-col gap-4">
                    <div className="flex justify-between items-center">
                            <div className="flex min-w-0 items-center gap-3">
                            <div className="w-12 h-12 bg-white rounded-xl flex justify-center items-center shadow-sm border border-slate-100 shrink-0">
                                <Icon className="w-6 h-6 text-emerald-800" strokeWidth={1.75} />
                            </div>
                            <div className="min-w-0">
                        <h4 className="break-words text-slate-900 font-semibold text-base leading-5">{goal.title}</h4>
                                <p className="text-slate-500 text-xs mt-0.5">Target Selesai: {goal.deadlineLabel}</p>
                            </div>
                        </div>
                         <span className={`text-xl font-semibold ${isDone ? 'text-emerald-700' : 'text-emerald-800'}`}>
                            {progress}%
                        </span>
                    </div>

                    <div className="space-y-1.5">
                        <div className="h-2.5 w-full bg-slate-200 rounded-full overflow-hidden">
                            <div 
                                className="h-full bg-emerald-800 rounded-full transition-all duration-500" 
                                style={{ width: `${progress}%` }} 
                            />
                        </div>
                        <div className="flex flex-wrap justify-between gap-x-3 gap-y-1 text-xs font-semibold">
                            <span className="min-w-0 break-words text-slate-900">{fmtIDR(goal.current)}</span>
                            <span className="min-w-0 break-words text-right text-slate-500">Target {fmtIDR(goal.target)}</span>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4 border-t border-slate-200/60 pt-3 text-xs sm:grid-cols-2">
                        <div>
                            <span className="text-slate-500 block uppercase tracking-wider font-medium text-xs">Sisa Target</span>
                            <span className="text-slate-900 font-semibold text-sm mt-0.5">
                                {goal.current >= goal.target ? 'Tercapai' : fmtIDR(goal.target - goal.current)}
                            </span>
                        </div>
                        <div>
                            <span className="text-slate-500 block uppercase tracking-wider font-medium text-xs">Setoran Bulanan</span>
                            <span className="text-slate-900 font-semibold text-sm mt-0.5">{fmtIDR(goal.monthly)}</span>
                        </div>
                    </div>
                </div>

                {/* ── Two Column Layout: Form & History ── */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
                    
                    {/* ── Form Setor/Tarik (Column Left: 5/12) ── */}
                    <div className="md:col-span-5 space-y-4">
                        <h5 className="font-semibold text-slate-800 text-sm border-b border-slate-100 pb-2">
                            Tambah Catatan Keuangan
                        </h5>

                        <form onSubmit={handleSubmit} className="space-y-3.5">
                            {/* Segmented control for Type */}
                            <fieldset>
                                <legend className="sr-only">Jenis catatan</legend>
                                <div className="ui-segmented grid grid-cols-2">
                                <button
                                    type="button"
                                    onClick={() => { setType('deposit'); setError(''); }}
                                    className={`ui-segmented-button flex items-center justify-center gap-1.5 ${
                                        type === 'deposit'
                                            ? 'is-active text-emerald-800'
                                            : ''
                                     }`}
                                    aria-pressed={type === 'deposit'}
                                >
                                    <Plus className="w-3.5 h-3.5" aria-hidden="true" />
                                    Setor Dana
                                </button>
                                <button
                                    type="button"
                                    onClick={() => { setType('withdraw'); setError(''); }}
                                    className={`ui-segmented-button flex items-center justify-center gap-1.5 ${
                                        type === 'withdraw'
                                            ? 'is-active text-rose-800'
                                            : ''
                                    }`}
                                    aria-pressed={type === 'withdraw'}
                                >
                                    <Minus className="w-3.5 h-3.5" aria-hidden="true" />
                                    Tarik Dana
                                </button>
                                </div>
                            </fieldset>

                            {/* Nominal Input */}
                            <div className="space-y-1">
                                 <label htmlFor="goal-entry-amount" className="ui-field-label block">Nominal (Rupiah)</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 font-semibold text-sm">
                                        Rp
                                    </div>
                                    <input
                                        id="goal-entry-amount"
                                        type="number"
                                        min="1"
                                        placeholder="Contoh: 250000"
                                        value={amount}
                                        onChange={(e) => { setAmount(e.target.value); setError(''); }}
                                         className="ui-control pl-9 pr-4 py-2.5 w-full text-sm text-slate-800 font-semibold"
                                        aria-invalid={error ? 'true' : undefined}
                                        aria-describedby={error ? 'goal-entry-error' : undefined}
                                        required
                                    />
                                </div>
                            </div>

                            {/* Date Input */}
                            <div className="space-y-1">
                                 <label htmlFor="goal-entry-date" className="ui-field-label block">Tanggal</label>
                                <div className="relative">
                                    <Calendar className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                                    <input
                                        id="goal-entry-date"
                                        type="date"
                                        value={date}
                                        onChange={(e) => setDate(e.target.value)}
                                         className="ui-control pl-9 pr-4 py-2.5 w-full text-sm text-slate-800 font-semibold"
                                        required
                                    />
                                </div>
                            </div>

                            {/* Note Input */}
                            <div className="space-y-1">
                                 <label htmlFor="goal-entry-note" className="ui-field-label block">Keterangan / Catatan</label>
                                <div className="relative">
                                    <FileText className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                                    <input
                                        id="goal-entry-note"
                                        type="text"
                                        placeholder="Contoh: Setoran minggu ke-1"
                                        value={note}
                                        onChange={(e) => setNote(e.target.value)}
                                         className="ui-control pl-9 pr-4 py-2.5 w-full text-sm text-slate-800"
                                    />
                                </div>
                            </div>

                            {error && (
                                <p id="goal-entry-error" role="alert" className="text-rose-600 text-xs font-semibold bg-rose-50 border border-rose-100 rounded-lg p-2.5 animate-pulse">
                                    {error}
                                </p>
                            )}

                            <Button 
                                type="submit" 
                                className={`w-full py-2.5 rounded-lg text-xs font-medium text-white shadow-sm flex items-center justify-center gap-1.5 transition-colors ${
                                    type === 'deposit'
                                        ? 'bg-emerald-800 hover:bg-emerald-700'
                                        : 'bg-rose-800 hover:bg-rose-700'
                                }`}
                            >
                                {type === 'deposit' ? 'Simpan Setoran' : 'Simpan Penarikan'}
                            </Button>
                        </form>
                    </div>

                    {/* ── Riwayat Logs (Column Right: 7/12) ── */}
                    <div className="md:col-span-7 space-y-4">
                        <h5 className="font-semibold text-slate-800 text-sm border-b border-slate-100 pb-2">
                            Riwayat Catatan Tabungan
                        </h5>

                        <div className="max-h-[300px] overflow-y-auto space-y-2.5 pr-1.5 scrollbar-thin">
                            {!goal.history || goal.history.length === 0 ? (
                                <div className="text-center py-10 text-slate-400 border border-dashed border-slate-200 rounded-xl bg-slate-50/50">
                                    <p className="text-xs">Belum ada riwayat transaksi.</p>
                                </div>
                            ) : (
                                goal.history.map((log) => {
                                    const isDeposit = log.amount >= 0;
                                    return (
                                        <div
                                            key={log.id}
                                            className={`p-3 rounded-xl border flex items-center justify-between gap-3 text-xs shadow-sm bg-white transition-all hover:bg-slate-50/40 ${
                                                isDeposit ? 'border-emerald-100' : 'border-rose-100'
                                            }`}
                                        >
                                            <div className="flex items-center gap-2.5 min-w-0">
                                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 font-bold ${
                                                    isDeposit ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                                                }`}>
                                                    {isDeposit ? '+' : '-'}
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="font-semibold text-slate-800 truncate">{log.note}</p>
                                                    <p className="text-[10px] text-slate-400 font-medium mt-0.5">
                                                        {formatDateID(log.date)}{log.senderName ? ` • oleh ${log.senderName}` : ''}
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-2 shrink-0">
                                                <span className={`font-semibold ${
                                                    isDeposit ? 'text-emerald-700' : 'text-rose-700'
                                                }`}>
                                                    {isDeposit ? fmtIDR(log.amount) : fmtIDR(Math.abs(log.amount))}
                                                </span>
                                                <button
                                                    type="button"
                                                    onClick={() => handleDelete(log.id)}
                                                     className="ui-icon-button ui-icon-button-danger"
                                                     aria-label={`Hapus catatan ${log.note}`}
                                                    title="Hapus catatan"
                                                >
                                                     <Trash2 className="w-4 h-4" aria-hidden="true" />
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>
                    
                </div>
                
                {/* ── Footer ── */}
                <div className="flex justify-end pt-3 border-t border-slate-100">
                    <Button variant="secondary" onClick={onClose} className="w-full px-5 py-2 sm:w-auto">
                        Tutup
                    </Button>
                </div>
                
            </div>
        </Modal>
    );
}
