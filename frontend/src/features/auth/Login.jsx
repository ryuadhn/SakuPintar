import React, { useEffect, useId, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import icon from '../../assets/icon.svg';
import { useAuth } from '../../contexts/AuthContext';
import { ArrowRight, Eye, EyeOff, LockKeyhole, Mail } from 'lucide-react';

export default function Login() {
    const navigate = useNavigate();
    const { user, login, loginWithGoogle, demo, authError } = useAuth();
    const formId = useId();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (user) {
            navigate('/dashboard', { replace: true });
        }
    }, [user, navigate]);

    useEffect(() => {
        if (authError) setError(authError);
    }, [authError]);

    const handleGoogleLogin = async () => {
        setError('');
        const res = await loginWithGoogle();
        if (!res.ok) {
            setError(res.error);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!email || !password) {
            setError('Mohon isi email dan kata sandi.');
            return;
        }
        setError('');
        setLoading(true);
        const res = await login(email, password);
        setLoading(false);
        if (!res.ok) {
            setError(res.error);
            return;
        }
        navigate('/dashboard', { replace: true });
    };

    const handleDemoLogin = async () => {
        setError('');
        const res = await login(demo.email, demo.password);
        if (res.ok) navigate('/dashboard', { replace: true });
    };

    return (
        <main className="ui-auth-shell ui-auth-compact ui-auth-login">
            <section className="ui-auth-card" aria-labelledby={`${formId}-title`}>
                <header className="ui-auth-header">
                    <Link className="ui-auth-brand" to="/" aria-label="Sakuta beranda">
                        <img
                            className="ui-auth-brand-mark"
                            alt="Logo Sakuta"
                            src={icon}
                            draggable={false}
                        />
                        <span className="ui-auth-brand-name">Sakuta</span>
                    </Link>
                    <div className="ui-auth-intro">
                        <h1 className="ui-auth-title" id={`${formId}-title`}>Masuk ke akun</h1>
                        <p className="ui-auth-subtitle">Rencanakan hari ini, capai bersama.</p>
                    </div>
                </header>

                {error && (
                    <div role="alert" className="ui-auth-error animate-in fade-in duration-300">
                        {error}
                    </div>
                )}

                <form className="ui-auth-form" onSubmit={handleSubmit}>
                    <div className="ui-auth-field">
                        <label className="ui-auth-field-label" htmlFor="email">
                            Alamat Email
                        </label>
                        <div className="ui-auth-input-wrap ui-auth-input-leading">
                            <input
                                className="ui-auth-input"
                                id="email"
                                name="email"
                                placeholder="nama@email.com"
                                type="email"
                                autoComplete="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                            <span className="ui-auth-input-icon" aria-hidden="true">
                                <Mail className="h-4 w-5" strokeWidth={1.8} />
                            </span>
                        </div>
                    </div>

                    <div className="ui-auth-field">
                        <label className="ui-auth-field-label" htmlFor="password">
                            Kata Sandi
                        </label>
                        <div className="ui-auth-input-wrap ui-auth-input-leading ui-auth-input-password">
                            <input
                                className="ui-auth-input"
                                id="password"
                                name="password"
                                placeholder="••••••••"
                                type={showPassword ? 'text' : 'password'}
                                autoComplete="current-password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                            <span className="ui-auth-input-icon" aria-hidden="true">
                                <LockKeyhole className="h-5 w-4" strokeWidth={1.8} />
                            </span>
                            <button
                                type="button"
                                className="ui-auth-password-toggle"
                                onClick={() => setShowPassword(!showPassword)}
                                aria-label={showPassword ? "Hide password" : "Show password"}
                                aria-pressed={showPassword}
                            >
                                {showPassword
                                    ? <EyeOff aria-hidden="true" className="h-[15px] w-[22px]" strokeWidth={1.8} />
                                    : <Eye aria-hidden="true" className="h-[15px] w-[22px]" strokeWidth={1.8} />}
                            </button>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="ui-auth-submit"
                        aria-busy={loading}
                    >
                        <span>{loading ? 'Memeriksa...' : 'Masuk'}</span>
                        {!loading && (
                            <span aria-hidden="true">
                                <ArrowRight className="h-3.5 w-3.5 text-white" strokeWidth={2.5} />
                            </span>
                        )}
                    </button>

                    <button
                        type="button"
                        onClick={handleDemoLogin}
                        className="ui-auth-demo-link"
                    >
                        Coba cepat dengan akun demo
                    </button>
                </form>

                <div className="ui-auth-divider" role="separator">
                    <span>Atau lanjutkan dengan</span>
                </div>

                <div className="ui-auth-social-row">
                    <button
                        type="button"
                        onClick={handleGoogleLogin}
                        title="Masuk dengan akun Google"
                        className="ui-auth-social"
                        aria-label="Continue with Google"
                    >
                        <svg aria-hidden="true" className="h-5 w-5" viewBox="0 0 24 24">
                            <path fill="#EA4335" d="M12 5.04c1.66 0 3.2.57 4.38 1.69l3.27-3.27C17.67 1.47 14.98 1 12 1 7.35 1 3.37 3.65 1.4 7.56l3.85 2.99c.9-2.7 3.42-4.51 6.75-4.51z" />
                            <path fill="#4285F4" d="M23.49 12.27c0-.81-.07-1.59-.2-2.36H12v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58l3.73 2.9c2.18-2.01 3.69-4.96 3.69-8.63z" />
                            <path fill="#FBBC05" d="M5.25 10.55a6.99 6.99 0 010 2.9l-3.85 2.99a11.96 11.96 0 010-8.88l3.85 2.99z" />
                            <path fill="#34A853" d="M12 23c3.24 0 5.97-1.07 7.96-2.91l-3.73-2.9c-1.1.74-2.5 1.18-4.23 1.18-3.33 0-5.85-1.81-6.75-4.51L1.4 16.85C3.37 20.76 7.35 23 12 23z" />
                        </svg>
                        <span>Google</span>
                    </button>
                </div>

                <footer className="ui-auth-footer">
                    <p>Belum punya akun?</p>
                    <Link
                        to="/register"
                        className="ui-auth-link"
                    >
                        Daftar
                    </Link>
                </footer>
            </section>
        </main>
    );
}
