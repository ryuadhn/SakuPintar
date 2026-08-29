import React, { useEffect, useState } from 'react';
import {
    Home, Plane, GraduationCap, PiggyBank, Laptop, Gift,
    Car, HeartPulse, Heart, Moon, Briefcase, Wallet,
} from 'lucide-react';
import Modal from '../UI/Modal';
import Input from '../UI/Input';
import Button from '../UI/Button';
import { useFinance } from '../../Store/FinanceContext';
import { addYearsISO, fmtIDR } from '../../Utils/format';

export const GOAL_ICONS = {
    home:     { label: 'Rumah',      Icon: Home },
    plane:    { label: 'Travel',     Icon: Plane },
    gradcap:  { label: 'Pendidikan', Icon: GraduationCap },
    piggy:    { label: 'Pensiun',    Icon: PiggyBank },
    laptop:   { label: 'Teknologi',  Icon: Laptop },
    gift:     { label: 'Hadiah',     Icon: Gift },
    car:      { label: 'Kendaraan',  Icon: Car },
    health:   { label: 'Kesehatan',  Icon: HeartPulse },
    wedding:  { label: 'Pernikahan', Icon: Heart },
    worship:  { label: 'Ibadah',     Icon: Moon },
    business: { label: 'Usaha',      Icon: Briefcase },
    other:    { label: 'Lainnya',    Icon: Wallet },
};

export default function GoalModal({ isOpen, onClose }) {
    const { addSavingsGoal } = useFinance();

    const [title, setTitle] = useState('');
    const [target, setTarget] = useState('');
    const [current, setCurrent] = useState('');
    const [monthly, setMonthly] = useState('');
    const [deadlineISO, setDeadlineISO] = useState('');
    const [iconKey, setIconKey] = useState('home');
    const [errors, setErrors] = useState({});

    useEffect(() => {
        if (!isOpen) return;
        setTitle('');
        setTarget('');
        setCurrent('');
        setMonthly('');
        setDeadlineISO(addYearsISO(1));
        setIconKey('home');
        setErrors({});
    }, [isOpen]);

    const handleSubmit = (e) => {
        e.preventDefault();
        const errs = {};
        if (!title.trim()) errs.title = 'Nama target wajib diisi';
        const tgt = Number(target);
        if (!target || Number.isNaN(tgt) || tgt <= 0) errs.target = 'Target harus lebih dari 0';
        const cur = current === '' ? 0 : Number(current);
        if (Number.isNaN(cur) || cur < 0) errs.current = 'Nominal tidak valid';
        if (!Number.isNaN(cur) && !Number.isNaN(tgt) && tgt > 0 && cur > tgt) errs.current = 'Tidak boleh melebihi target';
        const mon = monthly === '' ? 0 : Number(monthly);
        if (Number.isNaN(mon) || mon < 0) errs.monthly = 'Nominal tidak valid';
        if (!deadlineISO) errs.deadlineISO = 'Tanggal target wajib diisi';
        setErrors(errs);
        if (Object.keys(errs).length > 0) return;

        addSavingsGoal({
            title: title.trim(),
            iconKey,
            deadlineISO,
            current: cur,
            target: tgt,
            monthly: mon,
        });
        onClose();
    };

    const previewProgress = (Number(target) > 0)
        ? Math.min(100, Math.round(((Number(current) || 0) / Number(target)) * 100))
        : null;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Tambah Target Tabungan" wide>
            <form className="space-y-4" onSubmit={handleSubmit} noValidate>
                <Input
                    label="Nama Target"
                    placeholder="Contoh: Rumah Impian"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    error={errors.title}
                    required
                />

                <div className="grid grid-cols-2 gap-4">
                    <Input
                        label="Target Nominal (Rupiah)"
                        type="number"
                        min="1"
                        placeholder="Contoh: 50000000"
                        value={target}
                        onChange={(e) => setTarget(e.target.value)}
                        error={errors.target}
                        required
                    />
                    <Input
                        label="Sudah Terkumpul (Opsional)"
                        type="number"
                        min="0"
                        placeholder="0"
                        value={current}
                        onChange={(e) => setCurrent(e.target.value)}
                        error={errors.current}
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <Input
                        label="Setoran Bulanan (Rupiah)"
                        type="number"
                        min="0"
                        placeholder="Contoh: 2500000"
                        value={monthly}
                        onChange={(e) => setMonthly(e.target.value)}
                        error={errors.monthly}
                    />
                    <Input
                        label="Target Selesai"
                        type="date"
                        value={deadlineISO}
                        onChange={(e) => setDeadlineISO(e.target.value)}
                        error={errors.deadlineISO}
                        required
                    />
                </div>

                <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Pilih Ikon</label>
                    <div className="grid grid-cols-6 gap-2">
                        {Object.entries(GOAL_ICONS).map(([key, { label, Icon }]) => {
                            const selected = iconKey === key;
                            return (
                                <button
                                    key={key}
                                    type="button"
                                    onClick={() => setIconKey(key)}
                                    title={label}
                                    className={`flex flex-col items-center gap-1.5 py-3 rounded-xl outline outline-1 transition-all ${selected
                                        ? 'outline-emerald-700 bg-emerald-50'
                                        : 'outline-stone-200 bg-white hover:bg-stone-50'}`}
                                >
                                    <Icon
                                        className={`w-6 h-6 transition-colors ${selected ? 'text-emerald-700' : 'text-slate-400'}`}
                                        strokeWidth={1.75}
                                    />
                                    <span className={`text-[9px] font-semibold leading-3 ${selected ? 'text-emerald-800' : 'text-slate-500'}`}>
                                        {label}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {previewProgress !== null && (
                    <div className="bg-slate-50 border border-slate-100 rounded-xl px-4 py-3">
                        <div className="flex justify-between items-center mb-1.5">
                            <span className="text-xs font-semibold text-slate-600">Pratinjau Progres Awal</span>
                            <span className="text-xs font-bold text-emerald-800">{previewProgress}%</span>
                        </div>
                        <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                            <div className="h-full bg-emerald-700 rounded-full transition-all" style={{ width: `${previewProgress}%` }} />
                        </div>
                        <p className="text-[11px] text-slate-500 mt-1.5">
                            Terkumpul {fmtIDR(Number(current) || 0)} dari {fmtIDR(Number(target) || 0)}
                        </p>
                    </div>
                )}

                <div className="flex gap-3 justify-end pt-2">
                    <Button type="button" variant="secondary" onClick={onClose} className="px-5 py-2.5">Batal</Button>
                    <Button type="submit" variant="primary" className="px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800">
                        Simpan Target
                    </Button>
                </div>
            </form>
        </Modal>
    );
}
