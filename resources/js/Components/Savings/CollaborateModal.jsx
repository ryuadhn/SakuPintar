import React, { useState, useEffect } from 'react';
import Modal from '../UI/Modal';
import Input from '../UI/Input';
import Button from '../UI/Button';
import { Users, Info, Sparkles, CheckCircle2 } from 'lucide-react';

export default function CollaborateModal({ isOpen, onClose, goal, onSave }) {
    const [email, setEmail] = useState('');
    const [error, setError] = useState('');

    useEffect(() => {
        if (!isOpen) return;
        setEmail(goal?.partnerEmail || '');
        setError('');
    }, [isOpen, goal]);

    const handleSubmit = (e) => {
        e.preventDefault();
        setError('');

        const em = String(email || '').trim().toLowerCase();
        if (!em) {
            setError('Email pasangan wajib diisi');
            return;
        }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(em)) {
            setError('Format email tidak valid');
            return;
        }

        onSave(goal.id, em);
        onClose();
    };

    const handleStopCollaboration = () => {
        if (window.confirm('Hentikan kolaborasi untuk target ini? Pasangan Anda tidak akan bisa melihat atau mengedit target ini lagi.')) {
            onSave(goal.id, null);
            onClose();
        }
    };

    if (!goal) return null;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Undang Pasangan (Kolaborasi)" wide={false}>
            <form onSubmit={handleSubmit} className="space-y-5">
                {/* Info Card */}
                <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 flex gap-3 text-xs leading-relaxed text-slate-600">
                    <Info className="w-5 h-5 text-emerald-800 shrink-0 mt-0.5" />
                    <div>
                        <p className="font-bold text-slate-800 mb-1">Cara Kerja Tabungan Bersama:</p>
                        <p>Masukkan email pasangan Anda yang telah terdaftar di SakuPintar. Target tabungan **"{goal.title}"** ini otomatis akan terbagi secara langsung di halaman akun pasangan Anda secara *real-time*.</p>
                    </div>
                </div>

                {/* State: Connected */}
                {goal.isShared && goal.partnerEmail ? (
                    <div className="space-y-4">
                        <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4 flex items-center gap-3">
                            <CheckCircle2 className="w-6 h-6 text-emerald-700 shrink-0" />
                            <div>
                                <h6 className="font-bold text-emerald-800 text-xs">Target Terhubung Bersama</h6>
                                <p className="text-[11px] text-emerald-700 mt-0.5">
                                    Dibagikan dengan: <strong className="font-bold">{goal.partnerEmail}</strong>
                                </p>
                            </div>
                        </div>

                        <div className="flex gap-3 pt-2">
                            <Button
                                type="button"
                                variant="secondary"
                                onClick={handleStopCollaboration}
                                className="w-full py-2.5 text-xs font-bold text-rose-700 hover:bg-rose-50 hover:text-rose-800 border-rose-100"
                            >
                                Hentikan Kolaborasi
                            </Button>
                            <Button
                                type="button"
                                variant="secondary"
                                onClick={onClose}
                                className="w-full py-2.5 text-xs font-bold text-slate-700"
                            >
                                Tutup
                            </Button>
                        </div>
                    </div>
                ) : (
                    /* State: Unconnected Form */
                    <div className="space-y-4">
                        <Input
                            label="Email Pasangan"
                            type="email"
                            placeholder="contoh: pacar@email.com"
                            value={email}
                            onChange={(e) => { setEmail(e.target.value); setError(''); }}
                            error={error}
                            required
                        />

                        <div className="flex gap-3 justify-end pt-2">
                            <Button type="button" variant="secondary" onClick={onClose} className="px-5 py-2.5">
                                Batal
                            </Button>
                            <Button type="submit" variant="primary" className="px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 flex items-center gap-1.5">
                                <Users className="w-4 h-4" />
                                Hubungkan Target
                            </Button>
                        </div>
                    </div>
                )}
            </form>
        </Modal>
    );
}
