import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { supabase, isSupabaseConfigured } from '../store/supabaseClient';

const USERS_KEY = 'sakupintar_users';
const SESSION_KEY = 'sakupintar_session';
const DEMO_EMAIL = 'demo@sakupintar.id';
const DEMO_PASS = 'demo123';
const OAUTH_CALLBACK_KEYS = [
    'access_token',
    'refresh_token',
    'expires_in',
    'expires_at',
    'token_type',
    'provider_token',
    'provider_refresh_token',
    'type',
    'code',
    'sb_flow_id',
    'error',
    'error_code',
    'error_description'
];

const hashPass = (s) => btoa(unescape(encodeURIComponent(`sp::${s}`))).split('').reverse().join('');
const localUserId = (email) => `local-${encodeURIComponent(String(email || '').trim().toLowerCase())}`;

const toAppUser = (session) => {
    const sessionUser = session?.user;
    if (!sessionUser) return null;

    return {
        id: sessionUser.id,
        name: sessionUser.user_metadata?.name || 'Pengguna',
        email: sessionUser.email
    };
};

export function hasOAuthCallbackParams() {
    if (typeof window === 'undefined') return false;

    const hashParams = new URLSearchParams(window.location.hash.slice(1));
    const searchParams = new URLSearchParams(window.location.search);
    return ['access_token', 'refresh_token', 'code', 'error', 'error_code', 'error_description']
        .some((key) => hashParams.has(key) || searchParams.has(key));
}

const maskUserId = (userId) => {
    const value = String(userId || '');
    if (!value) return undefined;
    if (value.length <= 8) return 'present';
    return `${value.slice(0, 4)}...${value.slice(-4)}`;
};

const logAuthDiagnostic = ({ event, sessionExists, userId, authLoading, redirectDecision }) => {
    if (typeof window === 'undefined') return;

    console.info('[Sakuta auth]', {
        event,
        sessionExists: Boolean(sessionExists),
        ...(userId ? { userId: maskUserId(userId) } : {}),
        pathname: window.location.pathname,
        callbackParamsDetected: hasOAuthCallbackParams(),
        authLoading,
        redirectDecision
    });
};

const getOAuthCallbackError = () => {
    if (typeof window === 'undefined') return '';

    const hashParams = new URLSearchParams(window.location.hash.slice(1));
    const searchParams = new URLSearchParams(window.location.search);
    const getParam = (key) => searchParams.get(key) || hashParams.get(key) || '';
    const error = getParam('error');
    const errorCode = getParam('error_code');
    const description = getParam('error_description');

    if (!error && !errorCode && !description) return '';
    return `Login Google gagal: ${description || error || errorCode}`;
};

const clearOAuthCallbackParams = () => {
    if (typeof window === 'undefined') return;

    const url = new URL(window.location.href);
    const searchParams = url.searchParams;
    const hashParams = new URLSearchParams(url.hash.slice(1));
    let changed = false;

    if (!hasOAuthCallbackParams()) return;

    OAUTH_CALLBACK_KEYS.forEach((key) => {
        if (searchParams.has(key)) {
            searchParams.delete(key);
            changed = true;
        }
        if (hashParams.has(key)) {
            hashParams.delete(key);
            changed = true;
        }
    });

    if (changed) {
        url.search = searchParams.toString();
        url.hash = hashParams.toString() ? `#${hashParams.toString()}` : '';
        window.history.replaceState(window.history.state, '', `${url.pathname}${url.search}${url.hash}`);
    }
};

const loadUsers = () => {
    try {
        const raw = localStorage.getItem(USERS_KEY);
        const arr = raw ? JSON.parse(raw) : null;
        if (Array.isArray(arr) && arr.length > 0) return arr;
    } catch (e) {
        console.warn('Sakuta: gagal membaca data pengguna.');
    }
    const seeded = [{ id: localUserId(DEMO_EMAIL), name: 'Demo User', email: DEMO_EMAIL, passHash: hashPass(DEMO_PASS) }];
    try {
        localStorage.setItem(USERS_KEY, JSON.stringify(seeded));
    } catch (e) {}
    return seeded;
};

const loadSession = () => {
    try {
        const raw = localStorage.getItem(SESSION_KEY);
        const s = raw ? JSON.parse(raw) : null;
        if (s && s.name && s.email) {
            return {
                ...s,
                id: s.id && s.id !== 'local-user' ? s.id : localUserId(s.email),
            };
        }
    } catch (e) {}
    return null;
};

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [authLoading, setAuthLoading] = useState(true);
    const [authError, setAuthError] = useState('');

    // Sync Auth Session
    useEffect(() => {
        if (!isSupabaseConfigured) {
            logAuthDiagnostic({
                event: 'AUTH_INIT_START',
                sessionExists: false,
                authLoading: true,
                redirectDecision: 'localstorage_fallback'
            });
            clearOAuthCallbackParams();
            const localSession = loadSession();
            setUser(localSession);
            setAuthLoading(false);
            logAuthDiagnostic({
                event: 'AUTH_READY',
                sessionExists: Boolean(localSession),
                userId: localSession?.id,
                authLoading: false,
                redirectDecision: 'localstorage_fallback'
            });
            return;
        }

        let mounted = true;
        let authReady = false;
        let initialSessionReceived = false;
        let latestSession = null;
        let resolveInitialSession;
        const initialSessionPromise = new Promise((resolve) => {
            resolveInitialSession = resolve;
        });

        logAuthDiagnostic({
            event: 'AUTH_INIT_START',
            sessionExists: false,
            authLoading: true,
            redirectDecision: 'supabase_session_restore'
        });

        // Register before reading the session so an OAuth callback cannot be missed.
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            latestSession = session;
            logAuthDiagnostic({
                event,
                sessionExists: Boolean(session),
                userId: session?.user?.id,
                authLoading: !authReady,
                redirectDecision: 'auth_state_received'
            });
            if (event === 'INITIAL_SESSION' && !initialSessionReceived) {
                initialSessionReceived = true;
                resolveInitialSession(session);
            }
            if (!mounted) return;
            setUser(toAppUser(session));
            if (session) setAuthError('');
        });

        // Wait for both SDK initialization and its initial state event before routing.
        const restoreSession = async () => {
            try {
                logAuthDiagnostic({
                    event: 'GET_SESSION_START',
                    sessionExists: false,
                    authLoading: !authReady,
                    redirectDecision: 'await_supabase'
                });
                const { error } = await supabase.auth.getSession();
                if (error) throw error;
                await initialSessionPromise;
                if (!mounted) return;

                const session = latestSession;
                const callbackError = getOAuthCallbackError();
                clearOAuthCallbackParams();
                setUser(toAppUser(session));
                if (callbackError) setAuthError(callbackError);
                authReady = true;
                setAuthLoading(false);
                logAuthDiagnostic({
                    event: 'AUTH_READY',
                    sessionExists: Boolean(session),
                    userId: session?.user?.id,
                    authLoading: false,
                    redirectDecision: 'route_pending'
                });
            } catch (e) {
                if (!mounted) return;
                await initialSessionPromise;
                if (!mounted) return;
                logAuthDiagnostic({
                    event: 'AUTH_INIT_ERROR',
                    sessionExists: Boolean(latestSession),
                    userId: latestSession?.user?.id,
                    authLoading: true,
                    redirectDecision: 'auth_restore_failed'
                });
                const callbackError = getOAuthCallbackError();
                clearOAuthCallbackParams();
                setUser(toAppUser(latestSession));
                setAuthError(callbackError || e?.message || 'Sesi OAuth tidak dapat dipulihkan. Silakan coba lagi.');
                authReady = true;
                setAuthLoading(false);
                logAuthDiagnostic({
                    event: 'AUTH_READY',
                    sessionExists: Boolean(latestSession),
                    userId: latestSession?.user?.id,
                    authLoading: false,
                    redirectDecision: 'route_pending'
                });
            }
        };

        restoreSession();

        return () => {
            mounted = false;
            resolveInitialSession(null);
            subscription.unsubscribe();
        };
    }, []);

    const login = useCallback(async (email, password) => {
        const em = String(email || '').trim().toLowerCase();
        if (!em || !password) return { ok: false, error: 'Email dan kata sandi wajib diisi.' };
        setAuthError('');

        if (!isSupabaseConfigured) {
            const users = loadUsers();
            const found = users.find((u) => u.email.toLowerCase() === em);
            if (!found) return { ok: false, error: 'Akun dengan email tersebut tidak ditemukan.' };
            if (found.passHash !== hashPass(password)) return { ok: false, error: 'Kata sandi salah. Coba lagi.' };
            const session = { name: found.name, email: found.email, id: found.id || localUserId(found.email) };
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
        setAuthError('');
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(em)) return { ok: false, error: 'Format email tidak valid.' };
        if (password.length < 8) return { ok: false, error: 'Kata sandi minimal 8 karakter.' };

        if (!isSupabaseConfigured) {
            const users = loadUsers();
            if (users.some((u) => u.email.toLowerCase() === em)) {
                return { ok: false, error: 'Email sudah terdaftar. Gunakan email lain atau masuk.' };
            }
            users.push({ id: localUserId(em), name: nm, email: em, passHash: hashPass(password) });
            localStorage.setItem(USERS_KEY, JSON.stringify(users));
            const session = { name: nm, email: em, id: localUserId(em) };
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

    const loginWithGoogle = useCallback(async () => {
        setAuthError('');
        if (!isSupabaseConfigured) {
            const session = { name: 'Demo User', email: DEMO_EMAIL, id: localUserId(DEMO_EMAIL) };
            localStorage.setItem(SESSION_KEY, JSON.stringify(session));
            setUser(session);
            return { ok: true };
        }

        const redirectTo = window.location.origin + '/dashboard';
        logAuthDiagnostic({
            event: 'OAUTH_START',
            sessionExists: false,
            authLoading: false,
            redirectDecision: 'oauth_redirect_dashboard'
        });
        const { error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo
            }
        });

        if (error) {
            logAuthDiagnostic({
                event: 'OAUTH_START_ERROR',
                sessionExists: false,
                authLoading: false,
                redirectDecision: 'stay_on_login'
            });
            return { ok: false, error: error.message };
        }

        logAuthDiagnostic({
            event: 'OAUTH_REDIRECT_STARTED',
            sessionExists: false,
            authLoading: false,
            redirectDecision: 'oauth_redirect_dashboard'
        });

        return { ok: true };
    }, []);

    const logout = useCallback(async () => {
        logAuthDiagnostic({
            event: 'SIGN_OUT_REQUESTED',
            sessionExists: true,
            authLoading: false,
            redirectDecision: 'logout'
        });
        if (!isSupabaseConfigured) {
            localStorage.removeItem(SESSION_KEY);
            setUser(null);
            logAuthDiagnostic({
                event: 'SIGN_OUT_COMPLETED',
                sessionExists: false,
                authLoading: false,
                redirectDecision: 'redirect_login'
            });
            return { ok: true };
        }

        const { error } = await supabase.auth.signOut();
        if (error) {
            setAuthError(error.message);
            console.error('Sakuta: gagal keluar dari Supabase.', error);
            return { ok: false, error: error.message };
        }
        setUser(null);
        logAuthDiagnostic({
            event: 'SIGN_OUT_COMPLETED',
            sessionExists: false,
            authLoading: false,
            redirectDecision: 'redirect_login'
        });
        return { ok: true };
    }, []);

    const value = useMemo(() => ({
        user,
        login,
        register,
        loginWithGoogle,
        logout,
        authLoading,
        authError,
        demo: { email: DEMO_EMAIL, password: DEMO_PASS },
    }), [user, login, register, loginWithGoogle, logout, authLoading, authError]);

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

const AuthContext = createContext(null);

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth harus dipakai di dalam AuthProvider');
    return ctx;
}
