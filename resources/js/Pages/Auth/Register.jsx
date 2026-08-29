import React, { useEffect, useId, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import icon from "../../icon.svg";
import { useAuth } from "../../Store/AuthContext";

const baseFieldLabelClass =
  "relative flex items-center self-stretch mt-[-1.00px] font-semibold text-[#3f4943] text-sm tracking-[0.70px] leading-[16.8px]";

const baseInputWrapperClass =
  "flex flex-col items-start relative self-stretch w-full flex-[0_0_auto] bg-[#f7faf5] rounded-xl border border-solid border-[#bec9c0] transition-shadow duration-150 focus-within:shadow-[0_0_0_2px_rgba(14,108,74,0.12)] focus-within:border-[#0e6c4a]";

const baseInputClass =
  "relative grow border-[none] bg-transparent self-stretch mt-[-1.00px] font-normal text-[#181d1a] placeholder:text-[#6f7a72] text-base tracking-[0] leading-[normal] p-0 outline-none";

function TextField({
  id,
  label,
  type = "text",
  placeholder,
  value,
  onChange,
  autoComplete,
}) {
  return (
    <div className="flex flex-col items-start gap-2 relative self-stretch w-full flex-[0_0_auto]">
      <div className="flex flex-col items-start pt-0 pb-[0.8px] px-0 relative self-stretch w-full flex-[0_0_auto]">
        <label className={baseFieldLabelClass} htmlFor={id}>
          {label}
        </label>
      </div>
      <div className={baseInputWrapperClass}>
        <div className="flex h-12 items-start justify-center pl-12 pr-4 py-3.5 relative self-stretch w-full rounded-xl overflow-hidden">
          <input
            id={id}
            type={type}
            placeholder={placeholder}
            autoComplete={autoComplete}
            value={value}
            onChange={onChange}
            className={baseInputClass}
            required
          />
        </div>
        {/* Left Icon - User or Envelope */}
        <div className="inline-flex flex-col h-[48.00%] items-start absolute top-[26.00%] left-[17px] text-neutral-500" aria-hidden="true">
          {label === "Email" ? (
            <svg className="relative w-5 h-4 stroke-[1.8]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          ) : (
            <svg className="relative w-5 h-5 stroke-[1.8]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          )}
        </div>
      </div>
    </div>
  );
}

function PasswordField({
  id,
  label,
  placeholder,
  value,
  onChange,
  autoComplete,
}) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="flex flex-col items-start gap-[7.99px] relative self-stretch w-full flex-[0_0_auto]">
      <div className="flex flex-col items-start pt-0 pb-[0.8px] px-0 relative self-stretch w-full flex-[0_0_auto]">
        <label className={baseFieldLabelClass} htmlFor={id}>
          {label}
        </label>
      </div>
      <div className={baseInputWrapperClass}>
        <div className="flex h-12 items-start justify-center px-12 py-3.5 relative self-stretch w-full rounded-xl overflow-hidden">
          <input
            id={id}
            type={showPassword ? "text" : "password"}
            placeholder={placeholder}
            autoComplete={autoComplete}
            value={value}
            onChange={onChange}
            className={baseInputClass}
            required
          />
        </div>
        {/* Left Lock Icon */}
        <div className="inline-flex flex-col h-[48.00%] items-start absolute top-[26.00%] left-[17px] text-neutral-500" aria-hidden="true">
          <svg className="relative w-4 h-5 stroke-[1.8]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>
        {/* Right Eye Toggle Button */}
        <button
          type="button"
          aria-label={
            showPassword
              ? `Sembunyikan ${label.toLowerCase()}`
              : `Tampilkan ${label.toLowerCase()}`
          }
          aria-pressed={showPassword}
          onClick={() => setShowPassword((prev) => !prev)}
          className="inline-flex flex-col items-center justify-center pt-0 pb-1.5 px-0 absolute h-[42.00%] top-[29.00%] right-[17px] cursor-pointer text-neutral-500 hover:text-neutral-700 transition-colors"
        >
          <div className="inline-flex items-start justify-center relative flex-[0_0_auto]">
            {showPassword ? (
              <svg className="relative w-[22px] h-[15px] stroke-[1.8]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
              </svg>
            ) : (
              <svg className="relative w-[22px] h-[15px] stroke-[1.8]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            )}
          </div>
        </button>
      </div>
    </div>
  );
}

export default function Register() {
  const navigate = useNavigate();
  const { user, register, login, loginWithGoogle, demo } = useAuth();
  const formId = useId();
  const fullNameId = `${formId}-fullname`;
  const emailId = `${formId}-email`;
  const passwordId = `${formId}-password`;
  const confirmPasswordId = `${formId}-confirm-password`;

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      navigate("/dashboard", { replace: true });
    }
  }, [user, navigate]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!name || !email || !password || !confirmPassword) {
      setError("Semua kolom harus diisi!");
      return;
    }
    if (password !== confirmPassword) {
      setError("Kata sandi dan konfirmasi kata sandi tidak cocok!");
      return;
    }
    setError("");
    setLoading(true);
    const res = await register(name, email, password);
    setLoading(false);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    navigate("/dashboard", { replace: true });
  };

  const handleGoogleLogin = async () => {
    setError("");
    const res = await loginWithGoogle();
    if (!res.ok) {
      setError(res.error);
    }
  };

  const handleDemoLogin = async () => {
    setError("");
    const res = await login(demo.email, demo.password);
    if (res.ok) navigate("/dashboard", { replace: true });
  };

  return (
    <main className="flex items-center justify-center pt-[41.41px] pb-[41.42px] px-6 relative bg-[linear-gradient(0deg,rgba(247,250,245,1)_0%,rgba(247,250,245,1)_100%),linear-gradient(0deg,rgba(255,255,255,1)_0%,rgba(255,255,255,1)_100%)] w-full min-h-screen overflow-hidden">
      {/* Background Blobs */}
      <div className="absolute w-full h-full top-0 left-0 overflow-hidden opacity-30 pointer-events-none" aria-hidden="true">
        <div className="absolute top-[-102px] -left-32 w-[512px] h-[410px] bg-[#74c69d33] rounded-full blur-[60px] animate-blob-1" />
        <div className="absolute -right-32 bottom-[-102px] w-[640px] h-[512px] bg-[#c8ebd54c] rounded-full blur-[75px] animate-blob-2" />
      </div>

      {/* Card Section */}
      <section className="flex flex-col max-w-[480px] w-full items-start gap-[39px] p-12 relative bg-white rounded-3xl border border-solid border-[#bec9c0] z-10 shadow-[0px_8px_10px_-6px_#181d1a0d,0px_20px_25px_-5px_#181d1a0d]">
        
        {/* Header Block */}
        <div className="flex flex-col items-center relative self-stretch w-full flex-[0_0_auto]">
          <div className="inline-flex items-center relative flex-[0_0_auto]">
            {/* Brand Logo */}
            <div className="flex flex-col w-9 h-[31px] items-start pt-0 pb-4 px-0 relative">
              <div className="flex w-9 h-[35px] items-center justify-center relative mb-[-20.00px] bg-[#0e6c4a] rounded-xl shadow-sm">
                <div className="inline-flex flex-col items-center relative flex-[0_0_auto]">
                  <img
                    className="relative w-[18px] h-[17px]"
                    alt="Logo SakuPintar"
                    src={icon}
                    draggable={false}
                  />
                </div>
              </div>
            </div>
            
            {/* Brand Title */}
            <div className="pl-2 pr-0 py-0 inline-flex flex-col items-start relative flex-[0_0_auto]">
              <div className="inline-flex flex-col items-center relative flex-[0_0_auto]">
                <div className="relative flex items-center justify-center w-[126px] h-6 mt-[-1.00px] font-extrabold text-[#0e6c4a] text-2xl text-center tracking-[-0.60px] leading-[31.2px] whitespace-nowrap">
                  SakuPintar
                </div>
              </div>
            </div>
          </div>

          {/* Subtitle */}
          <div className="pt-4 pb-0 px-0 inline-flex flex-col items-start relative flex-[0_0_auto]">
            <div className="inline-flex flex-col items-start gap-[7.99px] relative flex-[0_0_auto]">
              <div className="flex flex-col items-center relative self-stretch w-full flex-[0_0_auto]">
                <h1 className="relative flex items-center justify-center w-fit mt-[-1.00px] font-semibold text-[#181d1a] text-2xl text-center tracking-[0] leading-[31.2px] whitespace-nowrap">
                  Buat Akun Baru
                </h1>
              </div>
              <div className="flex flex-col max-w-xs items-center relative w-full flex-[0_0_auto]">
                <p className="relative w-fit mt-[-1.00px] font-normal text-[#3f4943] text-base text-center tracking-[0] leading-6">
                  Mulai perjalanan finansial cerdas Anda
                  <br />
                  sekarang.
                </p>
              </div>
            </div>
          </div>
        </div>

        {error && (
          <div className="w-full p-3 bg-red-50 text-red-600 rounded-xl text-xs font-semibold border border-red-100 animate-in fade-in duration-300">
            {error}
          </div>
        )}

        {/* Register Form */}
        <form className="flex flex-col items-start gap-[23px] relative self-stretch w-full flex-[0_0_auto]" onSubmit={handleSubmit}>
          
          {/* Full Name field */}
          <TextField
            id={fullNameId}
            label="Nama Lengkap"
            placeholder="Masukkan nama lengkap"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoComplete="name"
          />

          {/* Email field */}
          <TextField
            id={emailId}
            label="Email"
            type="email"
            placeholder="contoh@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
          />

          {/* Password field */}
          <PasswordField
            id={passwordId}
            label="Kata Sandi"
            placeholder="Min. 8 karakter"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="new-password"
          />

          {/* Confirm Password field */}
          <PasswordField
            id={confirmPasswordId}
            label="Konfirmasi Kata Sandi"
            placeholder="Ulangi kata sandi"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            autoComplete="new-password"
          />

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="flex h-[57px] items-center justify-center pt-[19.6px] pb-[20.4px] px-0 relative self-stretch bg-[#0e6c4a] hover:bg-[#0a4d35] w-full rounded-xl cursor-pointer transition-colors duration-150 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0e6c4a] text-white font-semibold text-sm tracking-[0.70px] active:scale-[0.98] disabled:opacity-60 disabled:pointer-events-none"
          >
            {loading ? "Mendaftarkan..." : "Daftar Sekarang"}
          </button>

          {/* Separator line */}
          <div className="flex-col pt-[17px] pb-4 px-0 flex items-start relative self-stretch w-full flex-[0_0_auto]">
            <div className="flex w-full h-[calc(100%_-_1px)] items-center justify-center absolute top-px left-0" aria-hidden="true">
              <div className="relative flex-1 grow h-px border-t border-[#bec9c0]" />
            </div>
            <div className="flex items-start justify-center relative self-stretch w-full flex-[0_0_auto]">
              <div className="relative self-stretch w-[188.58px] bg-white">
                <div className="absolute -top-px left-4 h-[17px] flex items-center font-normal text-[#6f7a72] text-xs tracking-[1.20px] leading-[16.8px] whitespace-nowrap bg-white px-2">
                  ATAU DAFTAR DENGAN
                </div>
              </div>
            </div>
          </div>

          {/* OAuth options */}
          <div className="gap-4 flex items-start relative self-stretch w-full flex-[0_0_auto]">
            {/* Google OAuth Button */}
            <button
              type="button"
              onClick={handleGoogleLogin}
              title="Daftar dengan akun Google"
              className="flex-1 py-0 inline-flex h-12 items-center justify-center gap-3 relative bg-[#f7faf5] hover:bg-[#f1f5ee] rounded-xl border border-solid border-[#bec9c0] cursor-pointer transition-colors duration-150 active:scale-[0.98]"
              aria-label="Continue with Google"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#EA4335" d="M12 5.04c1.66 0 3.2.57 4.38 1.69l3.27-3.27C17.67 1.47 14.98 1 12 1 7.35 1 3.37 3.65 1.4 7.56l3.85 2.99c.9-2.7 3.42-4.51 6.75-4.51z" />
                <path fill="#4285F4" d="M23.49 12.27c0-.81-.07-1.59-.2-2.36H12v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58l3.73 2.9c2.18-2.01 3.69-4.96 3.69-8.63z" />
                <path fill="#FBBC05" d="M5.25 10.55a6.99 6.99 0 010 2.9l-3.85 2.99a11.96 11.96 0 010-8.88l3.85 2.99z" />
                <path fill="#34A853" d="M12 23c3.24 0 5.97-1.07 7.96-2.91l-3.73-2.9c-1.1.74-2.5 1.18-4.23 1.18-3.33 0-5.85-1.81-6.75-4.51L1.4 16.85C3.37 20.76 7.35 23 12 23z" />
              </svg>
              <span className="relative flex items-center justify-center w-fit mt-[-1.00px] font-normal text-[#181d1a] text-base text-center tracking-[0] leading-6 whitespace-nowrap">
                Google
              </span>
            </button>

            {/* Apple OAuth Button */}
            <button
              type="button"
              onClick={handleDemoLogin}
              title="Masuk cepat dengan akun demo"
              className="flex-1 py-0 inline-flex h-12 items-center justify-center gap-3 relative bg-[#f7faf5] hover:bg-[#f1f5ee] rounded-xl border border-solid border-[#bec9c0] cursor-pointer transition-colors duration-150 active:scale-[0.98]"
              aria-label="Continue with Apple"
            >
              <svg className="w-5 h-5 fill-zinc-900" viewBox="0 0 24 24">
                <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 4.17c.66-.81 1.11-1.93.99-3.06-1 .04-2.21.67-2.93 1.49-.62.69-1.16 1.84-1.01 2.96 1.12.09 2.27-.57 2.95-1.39z" />
              </svg>
              <span className="relative flex items-center justify-center w-fit mt-[-1.00px] font-normal text-[#181d1a] text-base text-center tracking-[0] leading-6 whitespace-nowrap">
                Apple
              </span>
            </button>
          </div>
        </form>

        {/* Footer block */}
        <div className="flex items-start justify-center gap-1.5 pt-[1.01px] pb-0 px-0 relative self-stretch w-full flex-[0_0_auto]">
          <p className="relative flex items-center justify-center w-fit mt-[-1.00px] font-normal text-[#3f4943] text-base text-center tracking-[0] leading-6 whitespace-nowrap">
            Sudah memiliki akun?
          </p>
          <Link
            to="/login"
            className="relative flex items-center justify-center w-fit mt-[-1.00px] font-bold text-[#0e6c4a] text-base text-center tracking-[0] leading-6 whitespace-nowrap hover:underline"
          >
            Masuk
          </Link>
        </div>
      </section>
    </main>
  );
}