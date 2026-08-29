import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { supabase, isSupabaseConfigured } from './supabaseClient';

const USERS_KEY = 'sakupintar_users';
const SESSION_KEY = 'sakupintar_session';
const DEMO_EMAIL = 'demo@sakupintar.id';
const DEMO_PASS = 'demo123';

const hashPass = (s) => btoa(unescape(encodeURIComponent(`sp::${s}`))).split('').reverse().join('');

const loadUsers = () => {
    try {
        const raw = localStorage.getItem(USERS_KEY);
        const arr = raw ? JSON.parse(raw) : null;
        if (Array.isArray(arr) && arr.length > 0) return arr;
    } catch (e) {
        console.warn('SakuPintar: gagal membaca data pengguna.', e);
    }
    const seeded = [{ name: 'Demo User', email: DEMO_EMAIL, passHash: hashPass(DEMO_PASS) }];
    try {
        localStorage.setItem(USERS_KEY, JSON.stringify(seeded));
    } catch (e) {}
    return seeded;
};

const loadSession = () => {
    try {
        const raw = localStorage.getItem(SESSION_KEY);
        const s = raw ? JSON.parse(raw) : null;
        if (s && s.name && s.email) return s;
    } catch (e) {}
    return null;
};

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [authLoading, setAuthLoading] = useState(isSupabaseConfigured);

    // Sync Auth Session
    useEffect(() => {
        if (!isSupabaseConfigured) {
            setUser(loadSession());
            setAuthLoading(false);
            return;
        }

        // Get initial Supabase session
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (session) {
                setUser({
                    id: session.user.id,
                    name: session.user.user_metadata.name || 'Pengguna',
                    email: session.user.email
                });
            } else {
                setUser(null);
            }
            setAuthLoading(false);
        });

        // Listen for Supabase auth state changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            if (session) {
                setUser({
                    id: session.user.id,
                    name: session.user.user_metadata.name || 'Pengguna',
                    email: session.user.email
                });
            } else {
                setUser(null);
            }
        });

        return () => subscription.unsubscribe();
    }, []);

    const login = useCallback(async (email, password) => {
        const em = String(email || '').trim().toLowerCase();
        if (!em || !password) return { ok: false, error: 'Email dan kata sandi wajib diisi.' };

        if (!isSupabaseConfigured) {
            const users = loadUsers();
            const found = users.find((u) => u.email.toLowerCase() === em);
            if (!found) return { ok: false, error: 'Akun dengan email tersebut tidak ditemukan.' };
            if (found.passHash !== hashPass(password)) return { ok: false, error: 'Kata sandi salah. Coba lagi.' };
            const session = { name: found.name, email: found.email, id: 'local-user' };
            localStorage.setItem(SESSION_KEY, JSON.stringify(session));
            setUser(session);
            return { ok: true };
        }

        const { data, error } = await supabase.auth.signInWithPassword({
            email: em,
            password: password
        });

        if (error) {
            return { 
                ok: false, 
                error: error.message === 'Invalid login credentials' ? 'Email atau kata sandi salah.' : error.message 
            };
        }

        return { ok: true };
    }, []);

    const register = useCallback(async (name, email, password) => {
        const nm = String(name || '').trim();
        const em = String(email || '').trim().toLowerCase();
        if (!nm || !em || !password) return { ok: false, error: 'Semua kolom wajib diisi.' };
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(em)) return { ok: false, error: 'Format email tidak valid.' };
        if (password.length < 8) return { ok: false, error: 'Kata sandi minimal 8 karakter.' };

        if (!isSupabaseConfigured) {
            const users = loadUsers();
            if (users.some((u) => u.email.toLowerCase() === em)) {
                return { ok: false, error: 'Email sudah terdaftar. Gunakan email lain atau masuk.' };
            }
            users.push({ name: nm, email: em, passHash: hashPass(password) });
            localStorage.setItem(USERS_KEY, JSON.stringify(users));
            const session = { name: nm, email: em, id: 'local-user' };
            localStorage.setItem(SESSION_KEY, JSON.stringify(session));
            setUser(session);
            return { ok: true };
        }

        const { data, error } = await supabase.auth.signUp({
            email: em,
            password: password,
            options: {
                data: {
                    name: nm
                }
            }
        });

        if (error) {
            return { ok: false, error: error.message };
        }

        return { ok: true };
    }, []);

    const logout = useCallback(async () => {
        if (!isSupabaseConfigured) {
            localStorage.removeItem(SESSION_KEY);
            setUser(null);
            return;
        }

        await supabase.auth.signOut();
        setUser(null);
    }, []);

    const value = useMemo(() => ({
        user,
        login,
        register,
        logout,
        authLoading,
        demo: { email: DEMO_EMAIL, password: DEMO_PASS },
    }), [user, login, register, logout, authLoading]);

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

const AuthContext = createContext(null);

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth harus dipakai di dalam AuthProvider');
    return ctx;
}
