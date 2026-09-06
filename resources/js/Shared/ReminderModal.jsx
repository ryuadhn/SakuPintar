import React, { useEffect, useRef, useState } from 'react';
import Modal from '../Components/UI/Modal';
import Input from '../Components/UI/Input';
import Button from '../Components/UI/Button';
import { useFinance } from '../Store/FinanceContext';
import { todayISO } from '../Utils/format';

const TYPE_OPTIONS = [
    { value: 'finance', label: 'Keuangan' },
    { value: 'task', label: 'Tugas' },
    { value: 'schedule', label: 'Jadwal' },
    { value: 'other', label: 'Lainnya' },
];

export default function ReminderModal({ isOpen, onClose, editing = null, initialDate = todayISO() }) {
    const {
        addReminder,
        updateReminder,
        calendarBusy,
        syncLoading,
        calendarError,
        clearCalendarError,
    } = useFinance();
    const [title, setTitle] = useState('');
    const [date, setDate] = useState(todayISO());
    const [time, setTime] = useState('');
    const [type, setType] = useState('task');
    const [notes, setNotes] = useState('');
    const [amount, setAmount] = useState('');
    const [errors, setErrors] = useState({});
    const formRef = useRef(null);
    const formBusy = calendarBusy || syncLoading;

    useEffect(() => {
        if (!isOpen) return;
        clearCalendarError();

        if (editing) {
            setTitle(editing.title || '');
            setDate(editing.date || todayISO());
            setTime(editing.time || '');
            setType(editing.type || 'other');
            setNotes(editing.notes || '');
            setAmount(editing.amount === null || editing.amount === undefined ? '' : String(editing.amount));
        } else {
            setTitle('');
            setDate(initialDate || todayISO());
            setTime('');
            setType('task');
            setNotes('');
            setAmount('');
        }
        setErrors({});
    }, [isOpen, editing, initialDate, clearCalendarError]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        const nextErrors = {};
        const numericAmount = Number(amount);

        if (!title.trim()) nextErrors.title = 'Judul wajib diisi';
        if (!date) nextErrors.date = 'Tanggal wajib diisi';
        if (type === 'finance' && amount && (Number.isNaN(numericAmount) || numericAmount <= 0)) {
            nextErrors.amount = 'Nominal harus lebih dari 0';
        }

        setErrors(nextErrors);
        if (Object.keys(nextErrors).length > 0) {
            window.setTimeout(() => formRef.current?.querySelector('[aria-invalid="true"]')?.focus(), 0);
            return;
        }

        const data = {
            title: title.trim(),
            date,
            time: time || null,
            type,
            notes: notes.trim() || null,
            amount: type === 'finance' && amount ? numericAmount : null,
        };

        if (editing) {
            const saved = await updateReminder(editing.id, { ...data, isCompleted: editing.isCompleted });
            if (saved) onClose();
        } else {
            const saved = await addReminder(data);
            if (saved) onClose();
        }
    };

    const selectClass = "block min-h-[44px] w-full rounded-xl border border-slate-200 bg-white p-2.5 text-sm text-slate-900 transition-colors focus:border-emerald-500 focus:outline-none focus:ring-emerald-500";

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={editing ? 'Edit Pengingat' : 'Tambah Pengingat'}>
            <form ref={formRef} className="space-y-4" onSubmit={handleSubmit} noValidate>
                {calendarError && (
                    <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-semibold leading-relaxed text-rose-800">
                        {calendarError}
                    </p>
                )}

                <Input
                    label="Judul Pengingat"
                    id="reminder-title"
                    data-autofocus="true"
                    placeholder="Contoh: Bayar listrik"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    disabled={formBusy}
                    error={errors.title}
                    required
                />

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <Input
                        label="Tanggal"
                        id="reminder-date"
                        type="date"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        disabled={formBusy}
                        error={errors.date}
                        required
                    />
                    <Input
                        label="Waktu (Opsional)"
                        id="reminder-time"
                        type="time"
                        value={time}
                        onChange={(e) => setTime(e.target.value)}
                        disabled={formBusy}
                    />
                </div>

                <div>
                    <label htmlFor="reminder-type" className="mb-1.5 block text-sm font-semibold text-slate-700">Jenis agenda</label>
                    <select
                        id="reminder-type"
                        className={selectClass}
                        value={type}
                        disabled={formBusy}
                        onChange={(e) => {
                            setType(e.target.value);
                            if (e.target.value !== 'finance') setAmount('');
                        }}
                    >
                        {TYPE_OPTIONS.map((option) => (
                            <option key={option.value} value={option.value}>{option.label}</option>
                        ))}
                    </select>
                    <p className="mt-1.5 text-xs leading-relaxed text-slate-500">Jenis ini membantu membedakan agenda saat Anda melihat kalender.</p>
                </div>

                {type === 'finance' && (
                    <Input
                        label="Nominal (Opsional)"
                        id="reminder-amount"
                        type="number"
                        inputMode="numeric"
                        min="1"
                        placeholder="Contoh: 350000"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        disabled={formBusy}
                        error={errors.amount}
                    />
                )}

                <div>
                    <label htmlFor="reminder-notes" className="block text-sm font-semibold text-slate-700 mb-1.5">Catatan (Opsional)</label>
                    <textarea
                        id="reminder-notes"
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        disabled={formBusy}
                        placeholder="Tambahkan detail kecil..."
                        rows={3}
                        className="block w-full resize-none rounded-xl border border-slate-200 bg-white p-3 text-sm text-slate-900 placeholder:text-slate-500 transition-colors focus:border-emerald-500 focus:outline-none focus:ring-emerald-500"
                    />
                </div>

                <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
                    <Button type="button" variant="secondary" onClick={onClose} disabled={formBusy} className="min-h-[44px] px-5 py-2.5 disabled:pointer-events-none disabled:opacity-60">Batal</Button>
                    <Button type="submit" variant="primary" disabled={formBusy} className="min-h-[44px] bg-emerald-600 px-5 py-2.5 disabled:pointer-events-none disabled:opacity-60">
                        {syncLoading ? 'Memuat...' : calendarBusy ? 'Menyimpan...' : editing ? 'Simpan Perubahan' : 'Simpan Pengingat'}
                    </Button>
                </div>
            </form>
        </Modal>
    );
}
