import React from 'react';

export default function PlatinumCard({ number = "**** **** 8829", expiry = "12 / 28" }) {
    return (
        <div className="self-stretch p-8 bg-[#0a4d35] rounded-2xl flex flex-col justify-between items-start h-full min-h-[220px] shadow-[0px_8px_10px_-6px_#181d1a0d,0px_20px_25px_-5px_#181d1a0d] relative overflow-hidden">
            {/* Top header row */}
            <div className="self-stretch flex justify-between items-start">
                {/* Minimalist App Icon in White */}
                <div className="text-white opacity-90">
                    <svg width="30" height="24" viewBox="0 0 30 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M30 3V21C30 21.825 29.7062 22.5312 29.1187 23.1187C28.5312 23.7062 27.825 24 27 24H3C2.175 24 1.46875 23.7062 0.88125 23.1187C0.29375 22.5312 0 21.825 0 21V3C0 2.175 0.29375 1.46875 0.88125 0.88125C1.46875 0.29375 2.175 0 3 0H27C27.825 0 28.5312 0.29375 29.1187 0.88125C29.7062 1.46875 30 2.175 30 3ZM3 6H27V3H3V6ZM3 12V21H27V12H3ZM3 21V3V21Z" fill="currentColor"/>
                    </svg>
                </div>
                <div className="text-[#a7f3d0] text-sm font-semibold tracking-wider font-['Inter']">
                    PLATINUM
                </div>
            </div>

            {/* Middle body row */}
            <div className="self-stretch flex flex-col justify-start items-start gap-1 mt-4">
                <div className="self-stretch opacity-60">
                    <span className="text-white text-xs font-semibold tracking-wide">Nomor Kartu</span>
                </div>
                <div className="self-stretch">
                    <span className="text-white text-base sm:text-lg font-normal font-mono tracking-[3.20px]">
                        {number}
                    </span>
                </div>
            </div>

            {/* Bottom info row */}
            <div className="self-stretch flex justify-between items-end mt-4">
                <div className="flex flex-col gap-0.5">
                    <div className="opacity-60">
                        <span className="text-white text-[10px] uppercase tracking-wider">MASA BERLAKU</span>
                    </div>
                    <div>
                        <span className="text-white text-sm sm:text-base font-normal">
                            {expiry}
                        </span>
                    </div>
                </div>
                
                {/* Mastercard overlapping circles */}
                <div className="flex items-center" aria-hidden="true">
                    <svg width="45" height="28" viewBox="0 0 59 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <circle cx="16" cy="16" r="16" fill="#EB001B" />
                        <circle cx="43" cy="16" r="16" fill="#F79E1B" fillOpacity="0.8" />
                    </svg>
                </div>
            </div>
            
            {/* Visual shine overlay */}
            <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-white/10 pointer-events-none" />
        </div>
    );
}