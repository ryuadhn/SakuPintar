import { useId, useState } from "react";
import icon from "./icon.svg";
import icon2 from "./icon-2.svg";
import icon3 from "./icon-3.svg";
import icon4 from "./icon-4.svg";
import icon5 from "./icon-5.svg";
import icon6 from "./icon-6.svg";
import image from "./image.svg";
import vector from "./vector.svg";
import vector2 from "./vector-2.svg";
import vector3 from "./vector-3.svg";
import vector4 from "./vector-4.svg";
import vector5 from "./vector-5.svg";

const socialButtons = [
  {
    id: "google",
    label: "Google",
    icon: (
      <div className="relative w-5 h-5" aria-hidden="true">
        <img
          className="absolute w-[50.00%] h-[58.33%] top-[41.67%] left-[50.00%]"
          alt=""
          src={vector}
        />
        <img
          className="absolute w-[90.92%] h-[41.25%] top-[58.75%] left-[9.08%]"
          alt=""
          src={vector2}
        />
        <img
          className="absolute w-[95.83%] h-[70.54%] top-[29.46%] left-[4.17%]"
          alt=""
          src={vector3}
        />
        <img
          className="absolute w-[90.92%] h-[95.83%] top-[4.17%] left-[9.08%]"
          alt=""
          src={vector4}
        />
      </div>
    ),
    className:
      "all-unset box-border pl-[47.42px] pr-[47.44px] py-0 inline-flex h-12 items-center justify-center gap-3 relative flex-[0_0_auto] bg-[#f7faf5] rounded-xl border border-solid border-[#bec9c0] cursor-pointer transition-colors duration-150 hover:bg-[#f1f5ee] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0e6c4a]",
  },
  {
    id: "apple",
    label: "Apple",
    icon: (
      <div className="relative w-5 h-5" aria-hidden="true">
        <img
          className="absolute w-[92.63%] h-[87.50%] top-[12.50%] left-[7.37%]"
          alt=""
          src={vector5}
        />
      </div>
    ),
    className:
      "all-unset box-border px-[52.58px] py-0 inline-flex h-12 items-center justify-center gap-3 relative flex-[0_0_auto] bg-[#f7faf5] rounded-xl border border-solid border-[#bec9c0] cursor-pointer transition-colors duration-150 hover:bg-[#f1f5ee] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0e6c4a]",
  },
];

const baseFieldLabelClass =
  "relative flex items-center self-stretch mt-[-1.00px] [font-family:'Inter-SemiBold',Helvetica] font-semibold text-[#3f4943] text-sm tracking-[0.70px] leading-[16.8px]";

const baseInputWrapperClass =
  "flex flex-col items-start relative self-stretch w-full flex-[0_0_auto] bg-[#f7faf5] rounded-xl border border-solid border-[#bec9c0] transition-shadow duration-150 focus-within:shadow-[0_0_0_2px_rgba(14,108,74,0.12)]";

const baseInputClass =
  "relative grow border-[none] [background:none] self-stretch mt-[-1.00px] [font-family:'Inter-Regular',Helvetica] font-normal text-[#181d1a] placeholder:text-[#6f7a72] text-base tracking-[0] leading-[normal] p-0";

function TextField({
  id,
  label,
  type = "text",
  placeholder,
  iconSrc,
  iconAlt,
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
            className={baseInputClass}
          />
        </div>
        <div className="inline-flex flex-col h-[48.00%] items-start absolute top-[26.00%] left-[17px]">
          <img
            className={`relative ${label === "Email" ? "w-5 h-4" : "w-4 h-4"}`}
            alt={iconAlt}
            src={iconSrc}
          />
        </div>
      </div>
    </div>
  );
}

function PasswordField({
  id,
  label,
  placeholder,
  iconSrc,
  iconAlt,
  eyeIconSrc,
  eyeIconAlt,
  autoComplete,
  leftIconClassName,
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
            className={baseInputClass}
          />
        </div>
        <div className="inline-flex flex-col h-[48.00%] items-start absolute top-[26.00%] left-[17px]">
          <img className={leftIconClassName} alt={iconAlt} src={iconSrc} />
        </div>
        <button
          type="button"
          aria-label={
            showPassword
              ? `Sembunyikan ${label.toLowerCase()}`
              : `Tampilkan ${label.toLowerCase()}`
          }
          aria-pressed={showPassword}
          onClick={() => setShowPassword((prev) => !prev)}
          className="inline-flex flex-col items-center justify-center pt-0 pb-1.5 px-0 absolute h-[42.00%] top-[29.00%] right-[17px] cursor-pointer"
        >
          <div className="inline-flex items-start justify-center relative flex-[0_0_auto]">
            <img
              className="relative w-[22px] h-[15px]"
              alt={eyeIconAlt}
              src={eyeIconSrc}
            />
          </div>
        </button>
      </div>
    </div>
  );
}

export const AkunBaruLight = () => {
  const formId = useId();
  const fullNameId = `${formId}-fullname`;
  const emailId = `${formId}-email`;
  const passwordId = `${formId}-password`;
  const confirmPasswordId = `${formId}-confirm-password`;

  return (
    <main className="flex items-center justify-center pt-[41.41px] pb-[41.42px] px-6 relative bg-[linear-gradient(0deg,rgba(247,250,245,1)_0%,rgba(247,250,245,1)_100%),linear-gradient(0deg,rgba(255,255,255,1)_0%,rgba(255,255,255,1)_100%)] w-full min-w-[1280px] min-h-[1014.82px]">
      <div
        className="absolute w-full h-full top-0 left-0 overflow-hidden opacity-30"
        aria-hidden="true"
      >
        <div className="absolute top-[-102px] -left-32 w-[512px] h-[410px] bg-[#74c69d33] rounded-full blur-[60px]" />
        <div className="absolute -right-32 bottom-[-102px] w-[640px] h-[512px] bg-[#c8ebd54c] rounded-full blur-[75px]" />
      </div>
      <section className="flex flex-col max-w-[480px] w-[480px] items-start gap-[39px] p-12 relative bg-white rounded-3xl border border-solid border-[#bec9c0]">
        <div
          className="absolute w-full h-full top-0 left-0 bg-[#ffffff01] rounded-3xl shadow-[0px_8px_10px_-6px_#181d1a0d,0px_20px_25px_-5px_#181d1a0d]"
          aria-hidden="true"
        />
        <div className="flex flex-col items-center relative self-stretch w-full flex-[0_0_auto]">
          <div className="inline-flex items-center relative flex-[0_0_auto]">
            <div className="flex flex-col w-9 h-[31px] items-start pt-0 pb-4 px-0 relative">
              <div className="flex w-9 h-[35px] items-center justify-center relative mb-[-20.00px] bg-[#0e6c4a] rounded-xl">
                <div className="inline-flex flex-col items-center relative flex-[0_0_auto]">
                  <img
                    className="relative w-[23.75px] h-[22.5px]"
                    alt="Logo SakuPintar"
                    src={icon}
                  />
                </div>
              </div>
            </div>
            <div className="pl-2 pr-0 py-0 inline-flex flex-col items-start relative flex-[0_0_auto]">
              <div className="inline-flex flex-col items-center relative flex-[0_0_auto]">
                <div className="relative flex items-center justify-center w-[126px] h-6 mt-[-1.00px] [font-family:'Inter-ExtraBold',Helvetica] font-extrabold text-[#0e6c4a] text-2xl text-center tracking-[-0.60px] leading-[31.2px] whitespace-nowrap">
                  SakuPintar
                </div>
              </div>
            </div>
          </div>
          <div className="pt-4 pb-0 px-0 inline-flex flex-col items-start relative flex-[0_0_auto]">
            <div className="inline-flex flex-col items-start gap-[7.99px] relative flex-[0_0_auto]">
              <div className="flex flex-col items-center relative self-stretch w-full flex-[0_0_auto]">
                <h1 className="relative flex items-center justify-center w-fit mt-[-1.00px] [font-family:'Inter-SemiBold',Helvetica] font-semibold text-[#181d1a] text-2xl text-center tracking-[0] leading-[31.2px] whitespace-nowrap">
                  Buat Akun Baru
                </h1>
              </div>
              <div className="flex flex-col max-w-xs items-center relative w-full flex-[0_0_auto]">
                <p className="relative w-fit mt-[-1.00px] [font-family:'Inter-Regular',Helvetica] font-normal text-[#3f4943] text-base text-center tracking-[0] leading-6">
                  Mulai perjalanan finansial cerdas Anda
                  <br />
                  sekarang.
                </p>
              </div>
            </div>
          </div>
        </div>
        <form className="flex flex-col items-start gap-[23px] relative self-stretch w-full flex-[0_0_auto]">
          <TextField
            id={fullNameId}
            label="Nama Lengkap"
            placeholder="Masukkan nama lengkap"
            iconSrc={image}
            iconAlt="Ikon nama lengkap"
            autoComplete="name"
          />
          <TextField
            id={emailId}
            label="Email"
            type="email"
            placeholder="contoh@email.com"
            iconSrc={icon2}
            iconAlt="Ikon email"
            autoComplete="email"
          />
          <PasswordField
            id={passwordId}
            label="Kata Sandi"
            placeholder="Min. 8 karakter"
            iconSrc={icon3}
            iconAlt="Ikon kata sandi"
            eyeIconSrc={icon4}
            eyeIconAlt="Ikon tampilkan kata sandi"
            autoComplete="new-password"
            leftIconClassName="relative w-4 h-[21px]"
          />
          <PasswordField
            id={confirmPasswordId}
            label="Konfirmasi Kata Sandi"
            placeholder="Ulangi kata sandi"
            iconSrc={icon5}
            iconAlt="Ikon konfirmasi kata sandi"
            eyeIconSrc={icon6}
            eyeIconAlt="Ikon tampilkan konfirmasi kata sandi"
            autoComplete="new-password"
            leftIconClassName="relative w-5 h-5"
          />
          <button
            type="submit"
            className="flex h-[57px] items-center justify-center pt-[19.6px] pb-[20.4px] px-0 relative self-stretch bg-[#0e6c4a] w-full rounded-xl cursor-pointer transition-colors duration-150 hover:bg-[#0c6243] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0e6c4a]"
          >
            <div className="absolute top-px left-0 h-14 bg-[#ffffff01] shadow-[0px_4px_6px_-4px_#0e6c4a33,0px_10px_15px_-3px_#0e6c4a33] w-full rounded-xl" />
            <div className="relative flex items-center justify-center w-fit mt-[-1.00px] [font-family:'Inter-SemiBold',Helvetica] font-semibold text-white text-sm text-center tracking-[0.70px] leading-[16.8px] whitespace-nowrap">
              Daftar Sekarang
            </div>
          </button>
          <div className="flex-col pt-[17px] pb-4 px-0 flex items-start relative self-stretch w-full flex-[0_0_auto]">
            <div
              className="flex w-full h-[calc(100%_-_1px)] items-center justify-center absolute top-px left-0"
              aria-hidden="true"
            >
              <div className="relative flex-1 grow h-px border-t [border-top-style:solid] border-[#bec9c0]" />
            </div>
            <div className="flex items-start justify-center relative self-stretch w-full flex-[0_0_auto]">
              <div className="relative self-stretch w-[188.58px] bg-white">
                <div className="absolute -top-px left-4 h-[17px] flex items-center [font-family:'Inter-Regular',Helvetica] font-normal text-[#6f7a72] text-xs tracking-[1.20px] leading-[16.8px] whitespace-nowrap">
                  ATAU DAFTAR DENGAN
                </div>
              </div>
            </div>
          </div>
          <div className="gap-4 flex items-start relative self-stretch w-full flex-[0_0_auto]">
            {socialButtons.map((button) => (
              <button
                key={button.id}
                type="button"
                className={button.className}
              >
                {button.icon}
                <div className="inline-flex flex-col items-center relative flex-[0_0_auto]">
                  <div className="relative flex items-center justify-center w-fit mt-[-1.00px] [font-family:'Inter-Regular',Helvetica] font-normal text-[#181d1a] text-base text-center tracking-[0] leading-6 whitespace-nowrap">
                    {button.label}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </form>
        <div className="flex items-start justify-center gap-1 pt-[1.01px] pb-0 px-0 relative self-stretch w-full flex-[0_0_auto]">
          <p className="relative flex items-center justify-center w-fit mt-[-1.00px] [font-family:'Inter-Regular',Helvetica] font-normal text-[#3f4943] text-base text-center tracking-[0] leading-6 whitespace-nowrap">
            Sudah memiliki akun?
          </p>
          <a
            href="#"
            className="relative flex items-center justify-center w-fit mt-[-1.00px] [font-family:'Inter-Bold',Helvetica] font-bold text-[#0e6c4a] text-base text-center tracking-[0] leading-6 whitespace-nowrap focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0e6c4a]"
          >
            Masuk
          </a>
        </div>
      </section>
    </main>
  );
};

export default AkunBaruLight;