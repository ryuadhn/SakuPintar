import React, { useEffect, useId, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import icon from "../../assets/icon.svg";
import { useAuth } from "../../contexts/AuthContext";
import { Eye, EyeOff, LockKeyhole, Mail, UserRound } from "lucide-react";

const baseFieldLabelClass =
  "ui-auth-field-label";

const baseInputWrapperClass =
  "ui-auth-input-wrap";

const baseInputClass =
  "ui-auth-input";

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
    <div className="ui-auth-field">
        <div>
        <label className={baseFieldLabelClass} htmlFor={id}>
          {label}
        </label>
      </div>
      <div className={`${baseInputWrapperClass} pl-12 pr-4`}>
        <div className="flex h-12 items-start justify-center w-full">
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
        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500" aria-hidden="true">
          {label === "Email" ? (
            <Mail className="relative h-4 w-5" strokeWidth={1.8} />
          ) : (
            <UserRound className="relative h-5 w-5" strokeWidth={1.8} />
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
    <div className="ui-auth-field">
      <div>
        <label className={baseFieldLabelClass} htmlFor={id}>
          {label}
        </label>
      </div>
      <div className={`${baseInputWrapperClass} pl-12 pr-14`}>
        <div className="flex h-12 items-start justify-center w-full">
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
        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500" aria-hidden="true">
          <LockKeyhole className="relative h-5 w-4" strokeWidth={1.8} />
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
          className="ui-auth-password-toggle"
        >
          <div className="inline-flex items-start justify-center relative flex-[0_0_auto]">
            {showPassword
              ? <EyeOff aria-hidden="true" className="relative h-[15px] w-[22px]" strokeWidth={1.8} />
              : <Eye aria-hidden="true" className="relative h-[15px] w-[22px]" strokeWidth={1.8} />}
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
    <main className="ui-auth-shell ui-auth-compact">

      {/* Card Section */}
      <section className="ui-auth-card">
        
        {/* Header Block */}
        <div className="flex flex-col items-center relative self-stretch w-full flex-[0_0_auto]">
          <div className="inline-flex items-center relative flex-[0_0_auto]">
            {/* Brand Logo */}
            <div className="flex flex-col w-11 h-11 items-start pt-0 pb-4 px-0 relative">
              <img
                className="relative w-11 h-11 rounded-xl"
                alt="Logo Sakuta"
                src={icon}
                draggable={false}
              />
            </div>
            
            {/* Brand Title */}
            <div className="pl-2 pr-0 py-0 inline-flex flex-col items-start relative flex-[0_0_auto]">
              <div className="inline-flex flex-col items-center relative flex-[0_0_auto]">
                <div className="relative flex items-center justify-center w-[126px] h-6 mt-[-1.00px] font-semibold text-[#0e6c4a] text-2xl text-center tracking-[-0.60px] leading-[31.2px] whitespace-nowrap">
                  Sakuta
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
                 <p className="relative w-full font-normal text-center text-sm leading-5 text-[#3f4943] sm:w-fit">
                  Rencanakan hari ini, capai bersama.
                </p>
              </div>
            </div>
          </div>
        </div>

        {error && (
          <div role="alert" className="ui-auth-error animate-in fade-in duration-300">
            {error}
          </div>
        )}

        {/* Register Form */}
        <form className="flex flex-col items-start gap-6 relative self-stretch w-full flex-[0_0_auto]" onSubmit={handleSubmit}>
          
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
            className="ui-auth-submit"
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
                  <div className="absolute -top-px left-4 h-[17px] flex items-center font-normal text-[#6f7a72] text-xs leading-[16.8px] whitespace-nowrap bg-white px-2">
                   Atau daftar dengan
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
              className="ui-auth-social"
              aria-label="Continue with Google"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#EA4335" d="M12 5.04c1.66 0 3.2.57 4.38 1.69l3.27-3.27C17.67 1.47 14.98 1 12 1 7.35 1 3.37 3.65 1.4 7.56l3.85 2.99c.9-2.7 3.42-4.51 6.75-4.51z" />
                <path fill="#4285F4" d="M23.49 12.27c0-.81-.07-1.59-.2-2.36H12v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58l3.73 2.9c2.18-2.01 3.69-4.96 3.69-8.63z" />
                <path fill="#FBBC05" d="M5.25 10.55a6.99 6.99 0 010 2.9l-3.85 2.99a11.96 11.96 0 010-8.88l3.85 2.99z" />
                <path fill="#34A853" d="M12 23c3.24 0 5.97-1.07 7.96-2.91l-3.73-2.9c-1.1.74-2.5 1.18-4.23 1.18-3.33 0-5.85-1.81-6.75-4.51L1.4 16.85C3.37 20.76 7.35 23 12 23z" />
              </svg>
              <span className="relative flex items-center justify-center w-fit font-medium text-[#181d1a] text-sm text-center tracking-[0] leading-5 whitespace-nowrap">
                Google
              </span>
            </button>

          </div>
        </form>

        {/* Footer block */}
        <div className="flex items-start justify-center gap-1.5 pt-[1.01px] pb-0 px-0 relative self-stretch w-full flex-[0_0_auto]">
          <p className="relative flex items-center justify-center w-fit font-normal text-[#3f4943] text-sm text-center tracking-[0] leading-5 whitespace-nowrap">
            Sudah memiliki akun?
          </p>
          <Link
            to="/login"
            className="relative flex items-center justify-center w-fit font-medium text-[#0e6c4a] text-sm text-center tracking-[0] leading-5 whitespace-nowrap hover:underline"
          >
            Masuk
          </Link>
        </div>
      </section>
    </main>
  );
}
