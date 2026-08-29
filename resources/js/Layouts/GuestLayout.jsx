import React from 'react';

export default function GuestLayout({ children }) {
    return (
        <div className="min-h-screen w-full bg-[#f4fbf7]/40 flex items-center justify-center p-4 md:p-6 relative overflow-hidden">
            {/* Animated soft mint green blobs */}
            <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-[#d3f2e4]/30 rounded-full blur-[120px] animate-blob-1 pointer-events-none" />
            <div className="absolute bottom-[-10%] left-[-10%] w-[550px] h-[550px] bg-[#e6f7ef]/50 rounded-full blur-[130px] animate-blob-2 pointer-events-none" />
            
            {/* Main Centered Content */}
            <div className="relative z-10 w-full max-w-[460px] animate-in fade-in zoom-in-95 duration-500">
                {children}
            </div>
        </div>
    );
}