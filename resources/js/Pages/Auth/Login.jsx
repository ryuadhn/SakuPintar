import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import icon from '../../icon.svg';
import { useAuth } from '../../Store/AuthContext';

export default function Login() {
    const navigate = useNavigate();
    const { login, loginWithGoogle, demo } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

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
        <main className="flex items-center justify-center px-6 py-[159px] relative bg-[linear-gradient(0deg,rgba(247,250,245,1)_0%,rgba(247,250,245,1)_100%),linear-gradient(0deg,rgba(255,255,255,1)_0%,rgba(255,255,255,1)_100%)] w-full min-h-screen overflow-hidden">
            {/* Animated soft blobs from design */}
            <div className="absolute w-full h-full top-0 left-0 overflow-hidden pointer-events-none" aria-hidden="true">
                <div className="absolute top-[-102px] -left-32 w-[512px] h-[410px] bg-[#0e6c4a0d] rounded-full blur-[60px] animate-blob-1" />
                <div className="absolute -right-32 bottom-[-102px] w-[512px] h-[410px] bg-[#4665541a] rounded-full blur-[60px] animate-blob-2" />
            </div>

            {/* Card container */}
            <section className="flex flex-col max-w-[480px] w-full items-start gap-8 p-12 relative bg-white rounded-2xl border border-solid border-[#bec9c0] z-10 shadow-[0px_8px_10px_-6px_#181d1a0d,0px_20px_25px_-5px_#181d1a0d]">
                
                {/* Header Section */}
                <div className="flex flex-col items-center relative self-stretch w-full flex-[0_0_auto]">
                    {/* Brand Logo Box */}
                    <div className="relative flex h-16 w-12 flex-col items-start px-0 pb-4 pt-0">
                        <div
                            className="relative flex h-12 w-12 items-center justify-center rounded-xl bg-[#0e6c4a]"
                            role="img"
                            aria-label="App icon"
                        >
                            <div className="relative inline-flex flex-[0_0_auto] flex-col items-center">
                                <img
                                    className="relative h-[22.5px] w-[23.75px]"
                                    alt="Icon"
                                    src={icon}
                                    draggable={false}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Brand Title */}
                    <div className="inline-flex flex-col items-start pt-0 pb-2 px-0 relative flex-[0_0_auto]">
                        <div className="inline-flex flex-col items-start pl-2 pr-0 py-0 relative flex-[0_0_auto]">
                            <div className="inline-flex flex-col items-center relative flex-[0_0_auto]">
                                <h1 className="relative flex items-center justify-center w-[126px] h-6 mt-[-1.00px] font-extrabold text-[#0e6c4a] text-2xl text-center tracking-[-0.60px] leading-[31.2px] whitespace-nowrap">
                                    SakuPintar
                                </h1>
                            </div>
                        </div>
                    </div>

                    {/* Subtitle */}
                    <p className="justify-center text-[#3f4943] text-center relative flex items-center w-fit font-normal text-base tracking-[0] leading-6 whitespace-nowrap">
                        Masuk ke asisten keuangan cerdas Anda
                    </p>
                </div>

                {error && (
                    <div className="w-full p-3 bg-red-50 text-red-600 rounded-xl text-xs font-semibold border border-red-100 animate-in fade-in duration-300">
                        {error}
                    </div>
                )}

                {/* Form fields */}
                <form className="flex flex-col items-start gap-6 relative self-stretch w-full flex-[0_0_auto]" onSubmit={handleSubmit}>
                    
                    {/* Email Input */}
                    <div className="relative self-stretch w-full h-20">
                        <label className="absolute top-0 left-1 h-6 flex items-center font-normal text-[#3f4943] text-base tracking-[0] leading-6 whitespace-nowrap" htmlFor="email">
                            Alamat Email
                        </label>
                        <div className="flex flex-col w-full items-start absolute top-8 left-0">
                            <div className="flex h-12 items-start justify-center pl-12 pr-4 py-[13px] relative self-stretch w-full bg-[#f7faf5] rounded-xl border border-solid border-[#bec9c0] focus-within:border-[#0e6c4a] focus-within:ring-1 focus-within:ring-[#0e6c4a] transition-all">
                                <input
                                    className="relative grow border-[none] bg-transparent self-stretch mt-[-1.00px] font-normal text-slate-800 text-base tracking-[0] p-0 placeholder:text-gray-400 outline-none"
                                    id="email"
                                    name="email"
                                    placeholder="nama@email.com"
                                    type="email"
                                    autoComplete="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    aria-label="Email Address"
                                    required
                                />
                            </div>
                            {/* Envelope Icon */}
                            <div className="inline-flex flex-col h-[50.00%] items-start absolute top-[25%] left-4 text-neutral-500" aria-hidden="true">
                                <svg className="w-5 h-4 stroke-[1.8]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                </svg>
                            </div>
                        </div>
                    </div>

                    {/* Password Input */}
                    <div className="flex flex-col items-start gap-2 relative self-stretch w-full flex-[0_0_auto]">
                        <div className="flex items-center justify-between px-1 py-0 relative self-stretch w-full flex-[0_0_auto]">
                            <label className="inline-flex flex-col items-start relative flex-[0_0_auto]" htmlFor="password">
                                <span className="relative flex items-center w-fit mt-[-1.00px] font-normal text-[#3f4943] text-base tracking-[0] leading-6 whitespace-nowrap">
                                    Kata Sandi
                                </span>
                            </label>
                            <a
                                href="#"
                                onClick={(e) => e.preventDefault()}
                                className="mt-[-1.00px] text-[#0e6c4a] relative flex items-center w-fit font-normal text-base tracking-[0] leading-6 whitespace-nowrap hover:underline"
                            >
                                Lupa Kata Sandi?
                            </a>
                        </div>
                        
                        <div className="flex flex-col items-start relative self-stretch w-full flex-[0_0_auto] bg-white">
                            <div className="flex h-12 items-start justify-center px-12 py-[13px] relative self-stretch w-full bg-[#f7faf5] rounded-xl border border-solid border-[#bec9c0] focus-within:border-[#0e6c4a] focus-within:ring-1 focus-within:ring-[#0e6c4a] transition-all">
                                <input
                                    className="relative grow border-[none] bg-transparent self-stretch mt-[-1.00px] font-normal text-slate-800 text-base tracking-[0] p-0 placeholder:text-gray-400 outline-none"
                                    id="password"
                                    name="password"
                                    placeholder="••••••••"
                                    type={showPassword ? 'text' : 'password'}
                                    autoComplete="current-password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    aria-label="Password"
                                    required
                                />
                            </div>
                            {/* Lock Icon */}
                            <div className="inline-flex flex-col h-[50.00%] items-start absolute top-[25%] left-4 text-neutral-500" aria-hidden="true">
                                <svg className="w-4 h-5 stroke-[1.8]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                </svg>
                            </div>
                            {/* Eye Show/Hide Toggle Button */}
                            <button
                                type="button"
                                className="inline-flex flex-col items-center justify-center pt-[1.62px] pb-[0.01px] px-0 absolute h-[34.65%] top-[32.69%] right-4 text-neutral-500 hover:text-neutral-700 transition-colors"
                                onClick={() => setShowPassword(!showPassword)}
                                aria-label={showPassword ? "Hide password" : "Show password"}
                                aria-pressed={showPassword}
                            >
                                <div className="inline-flex items-start justify-center relative flex-[0_0_auto]">
                                    {showPassword ? (
                                        <svg className="w-[22px] h-[15px] stroke-[1.8]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                                        </svg>
                                    ) : (
                                        <svg className="w-[22px] h-[15px] stroke-[1.8]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                        </svg>
                                    )}
                                </div>
                            </button>
                        </div>
                    </div>

                {/* Sign In Button */}
                    <button
                        type="submit"
                        disabled={loading}
                        className="flex h-12 items-center justify-center gap-2 relative self-stretch w-full bg-[#0e6c4a] hover:bg-[#0a4d35] rounded-xl transition-colors text-white text-base font-normal active:scale-[0.98] disabled:opacity-60 disabled:pointer-events-none"
                    >
                        <span>{loading ? 'Memeriksa...' : 'Masuk'}</span>
                        {!loading && (
                            <span className="inline-flex flex-col items-center relative flex-[0_0_auto]" aria-hidden="true">
                                <svg className="w-3.5 h-3.5 text-white stroke-[2.5]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                                </svg>
                            </span>
                        )}
                    </button>

                    <button
                        type="button"
                        onClick={handleDemoLogin}
                        className="self-stretch text-center text-xs font-semibold text-[#0e6c4a] hover:underline"
                    >
                        Coba cepat dengan akun demo (demo@sakupintar.id / demo123)
                    </button>
                </form>

                {/* Divider Line */}
                <div className="flex flex-col items-start relative self-stretch w-full flex-[0_0_auto] z-[1]" aria-label="Alternative sign in options">
                    <div className="flex w-full h-full items-center justify-center absolute top-0 left-0" aria-hidden="true">
                        <div className="relative flex-1 grow h-px border-t border-[#bec9c0]" />
                    </div>
                    <div className="flex items-start justify-center relative self-stretch w-full flex-[0_0_auto]">
                        <div className="inline-flex flex-col items-start px-4 py-0 relative self-stretch flex-[0_0_auto] bg-white">
                            <div className="relative flex items-center w-fit mt-[-1.00px] font-normal text-[#3f4943] text-base tracking-[0] leading-6 whitespace-nowrap">
                                Atau lanjutkan dengan
                            </div>
                        </div>
                    </div>
                </div>

                {/* Social Buttons */}
                <div className="flex items-start gap-4 relative self-stretch w-full flex-[0_0_auto] z-[1]">
                    {/* Google Button */}
                    <button
                        type="button"
                        onClick={handleGoogleLogin}
                        title="Masuk dengan akun Google"
                        className="flex-1 px-4 py-0 inline-flex h-12 items-center justify-center gap-3 relative bg-[#f7faf5] hover:bg-stone-100 transition-colors rounded-xl border border-solid border-[#bec9c0] active:scale-[0.98]"
                        aria-label="Continue with Google"
                    >
                        {/* Google Logo SVG */}
                        <svg className="w-5 h-5" viewBox="0 0 24 24">
                            <path fill="#EA4335" d="M12 5.04c1.66 0 3.2.57 4.38 1.69l3.27-3.27C17.67 1.47 14.98 1 12 1 7.35 1 3.37 3.65 1.4 7.56l3.85 2.99c.9-2.7 3.42-4.51 6.75-4.51z" />
                            <path fill="#4285F4" d="M23.49 12.27c0-.81-.07-1.59-.2-2.36H12v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58l3.73 2.9c2.18-2.01 3.69-4.96 3.69-8.63z" />
                            <path fill="#FBBC05" d="M5.25 10.55a6.99 6.99 0 010 2.9l-3.85 2.99a11.96 11.96 0 010-8.88l3.85 2.99z" />
                            <path fill="#34A853" d="M12 23c3.24 0 5.97-1.07 7.96-2.91l-3.73-2.9c-1.1.74-2.5 1.18-4.23 1.18-3.33 0-5.85-1.81-6.75-4.51L1.4 16.85C3.37 20.76 7.35 23 12 23z" />
                        </svg>
                        <span className="justify-center mt-[-1.00px] text-[#181d1a] text-center relative flex items-center w-fit font-normal text-base tracking-[0] leading-6 whitespace-nowrap">
                            Google
                        </span>
                    </button>

                    {/* Apple Button */}
                    <button
                        type="button"
                        onClick={handleDemoLogin}
                        title="Masuk cepat dengan akun demo"
                        className="flex-1 px-4 py-0 inline-flex h-12 items-center justify-center gap-3 relative bg-[#f7faf5] hover:bg-stone-100 transition-colors rounded-xl border border-solid border-[#bec9c0] active:scale-[0.98]"
                        aria-label="Continue with Apple"
                    >
                        {/* Apple Logo SVG */}
                        <svg className="w-5 h-5 fill-zinc-900" viewBox="0 0 24 24">
                            <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 4.17c.66-.81 1.11-1.93.99-3.06-1 .04-2.21.67-2.93 1.49-.62.69-1.16 1.84-1.01 2.96 1.12.09 2.27-.57 2.95-1.39z" />
                        </svg>
                        <span className="justify-center mt-[-1.00px] text-[#181d1a] text-center relative flex items-center w-fit font-normal text-base tracking-[0] leading-6 whitespace-nowrap">
                            Apple
                        </span>
                    </button>
                </div>

                {/* Footer Section */}
                <footer className="flex items-start justify-center gap-1.5 pt-2 pb-0 px-0 relative self-stretch w-full flex-[0_0_auto] bg-transparent z-[1]">
                    <div className="justify-center mt-[-1.00px] text-[#3f4943] text-center relative flex items-center w-fit font-normal text-base tracking-[0] leading-6 whitespace-nowrap">
                        Belum punya akun?
                    </div>
                    <Link
                        to="/register"
                        className="relative flex items-center justify-center w-fit mt-[-1.00px] font-bold text-[#0e6c4a] text-base text-center tracking-[0] leading-6 whitespace-nowrap hover:underline"
                    >
                        Daftar
                    </Link>
                </footer>
            </section>
        </main>
    );
}
