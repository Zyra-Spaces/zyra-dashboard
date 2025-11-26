"use client";

import React from "react";
import Link from "next/link";

// --- ICONS ---

const ZyraLogo = () => (
  <Link href="/" className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity">
    <svg width="32" height="31" viewBox="0 0 32 31" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M6.4 0H25.8462V8.32929H25.8797L11.7873 22.6707H32V31H0V22.6707H0.212553L14.3049 8.32929H6.4V0Z" fill="#4780C6"/>
    </svg>
    <span className="text-xl font-semibold text-gray-800">Zyra Spaces</span>
  </Link>
);

const SparkleIcon = () => (
  <svg width="95" height="80" viewBox="0 0 95 80" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path fillRule="evenodd" clipRule="evenodd" d="M0 40C25.4247 40 40 25.4247 40 0C40 25.4247 54.5753 40 80 40C54.5753 40 40 54.5753 40 80C40 54.5753 25.4247 40 0 40Z" fill="white"/>
    <path fillRule="evenodd" clipRule="evenodd" d="M0 12C7.62742 12 12 7.62742 12 0C12 7.62742 16.3726 12 24 12C16.3726 12 12 16.3726 12 24C12 16.3726 7.62742 12 0 12Z" fill="#FEC84B"/>
    <path fillRule="evenodd" clipRule="evenodd" d="M64 24C69.0849 24 72 21.0849 72 16C72 21.0849 74.9151 24 80 24C74.9151 24 72 26.9151 72 32C72 26.9151 69.0849 24 64 24Z" fill="#FEC84B"/>
  </svg>
);

const HandDrawnArrow = () => (
  <svg width="144" height="129" viewBox="0 0 288 258" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M15.0967 113.445C14.2315 112.032 12.3846 111.588 10.9717 112.453C9.55867 113.318 9.11464 115.165 9.97987 116.578L12.5383 115.011L15.0967 113.445ZM162.86 107.723L162.99 104.725L162.989 104.725L162.86 107.723ZM131.715 189.869L133.787 187.699L133.786 187.699L131.715 189.869ZM265.62 95.1165C265.747 93.4645 264.511 92.0224 262.859 91.8956C261.207 91.7687 259.765 93.0051 259.638 94.657L262.629 94.8868L265.62 95.1165ZM4.96459 133.214C4.6848 134.847 5.78184 136.398 7.4149 136.677C9.04796 136.957 10.5986 135.86 10.8784 134.227L7.92151 133.72L4.96459 133.214ZM11.3998 113.418L11.5255 110.421C10.0178 110.358 8.69776 111.424 8.44293 112.912L11.3998 113.418ZM32.2838 116.86C33.9375 116.757 35.1949 115.334 35.0923 113.68C34.9898 112.026 33.5661 110.769 31.9124 110.871L32.0981 113.866L32.2838 116.86ZM12.5383 115.011C9.97987 116.578 9.98054 116.579 9.98141 116.58C9.98195 116.581 9.98301 116.583 9.9841 116.585C9.98628 116.588 9.98924 116.593 9.99297 116.599C10.0004 116.611 10.011 116.628 10.0246 116.65C10.0518 116.694 10.0913 116.758 10.1429 116.84C10.2462 117.005 10.3979 117.246 10.597 117.556C10.9951 118.177 11.5827 119.079 12.3503 120.218C13.8851 122.495 16.1414 125.721 19.0433 129.546C24.8416 137.189 33.2451 147.257 43.6501 156.917C64.3246 176.113 93.6113 194.337 126.363 187.336L125.736 184.403L125.108 181.469C95.3382 187.833 68.0262 171.362 47.7325 152.52C37.6534 143.162 29.4804 133.376 23.8233 125.92C20.9974 122.195 18.8062 119.061 17.3255 116.864C16.5853 115.766 16.0231 114.903 15.6484 114.318C15.461 114.026 15.3206 113.804 15.2283 113.656C15.1821 113.582 15.1479 113.527 15.126 113.492C15.115 113.474 15.1071 113.461 15.1022 113.453C15.0997 113.449 15.0981 113.447 15.0972 113.445C15.0967 113.445 15.0966 113.444 15.0964 113.444C15.0965 113.444 15.0967 113.445 12.5383 115.011ZM125.736 184.403L126.363 187.336C158.628 180.439 175.623 160.808 180.802 142.301C183.373 133.116 183.052 124.095 180.047 117.132C177.003 110.078 171.123 105.078 162.99 104.725L162.86 107.723L162.73 110.72C168.157 110.955 172.232 114.165 174.538 119.51C176.885 124.947 177.31 132.516 175.024 140.684C170.492 156.881 155.365 175.001 125.108 181.469L125.736 184.403ZM162.86 107.723L162.989 104.725C155.288 104.393 147.15 107.725 139.958 113.066C132.727 118.438 126.182 126.035 121.642 134.729C112.544 152.153 111.32 174.541 129.643 192.038L131.715 189.869L133.786 187.699C117.931 172.558 118.721 153.288 126.961 137.506C131.09 129.598 137.046 122.704 143.536 117.883C150.067 113.032 156.873 110.467 162.73 110.72L162.86 107.723ZM131.715 189.869L129.642 192.038C139.019 200.994 152.105 203.903 166.111 202.32C180.113 200.738 195.318 194.656 209.486 185.231C237.786 166.404 262.653 133.748 265.62 95.1165L262.629 94.8868L259.638 94.657C256.846 131.005 233.339 162.157 206.163 180.235C192.594 189.262 178.285 194.907 165.437 196.358C152.593 197.81 141.494 195.06 133.787 187.699L131.715 189.869ZM7.92151 133.72L10.8784 134.227L14.3568 113.925L11.3998 113.418L8.44293 112.912L4.96459 133.214L7.92151 133.72ZM11.3998 113.418C11.2742 116.416 11.2743 116.416 11.2745 116.416C11.2746 116.416 11.2749 116.416 11.2751 116.416C11.2757 116.416 11.2765 116.416 11.2776 116.416C11.2797 116.416 11.2828 116.416 11.2869 116.416C11.2951 116.417 11.3073 116.417 11.3233 116.418C11.3554 116.419 11.4028 116.421 11.4648 116.424C11.5886 116.429 11.7704 116.436 12.0031 116.445C12.4683 116.464 13.137 116.49 13.9518 116.521C15.5811 116.583 17.7969 116.663 20.1408 116.735C24.7449 116.876 30.089 116.996 32.2838 116.86L32.0981 113.866L31.9124 110.871C30.064 110.986 25.059 110.883 20.3247 110.737C17.9995 110.666 15.7988 110.587 14.1789 110.526C13.3692 110.495 12.7051 110.469 12.2437 110.45C12.013 110.441 11.8331 110.434 11.711 110.429C11.65 110.426 11.6034 110.424 11.5722 110.423C11.5565 110.422 11.5448 110.422 11.537 110.421C11.5331 110.421 11.5301 110.421 11.5282 110.421C11.5272 110.421 11.5265 110.421 11.5261 110.421C11.5259 110.421 11.5257 110.421 11.5256 110.421C11.5255 110.421 11.5255 110.421 11.3998 113.418Z" fill="#4780C6"/>
  </svg>
);

const UserAvatars = () => (
  <div className="flex -space-x-3">
    {[1, 2, 3, 4, 5].map((i) => (
      <div
        key={i}
        className="w-10 h-10 rounded-full border-2 border-white bg-gradient-to-br from-gray-300 to-gray-400 overflow-hidden"
      >
        <img
          src={`https://i.pravatar.cc/40?img=${i + 10}`}
          alt={`User ${i}`}
          className="w-full h-full object-cover"
        />
      </div>
    ))}
  </div>
);

const StarRating = () => (
  <div className="flex items-center gap-2">
    <div className="flex">
      {[1, 2, 3, 4, 5].map((i) => (
        <svg key={i} className="w-5 h-5 text-yellow-400 fill-current" viewBox="0 0 20 20">
          <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
        </svg>
      ))}
    </div>
    <span className="text-white font-semibold">5.0</span>
  </div>
);

interface AuthLayoutProps {
  children: React.ReactNode;
  heroImageSrc?: string;
  showArrow?: boolean;
}

export const AuthLayout: React.FC<AuthLayoutProps> = ({
  children,
  heroImageSrc = "/images/banner-1.png",
  showArrow = true,
}) => {
  return (
    <div className="h-screen w-screen flex overflow-hidden bg-white relative">
      {/* Left Column - Form */}
      <div className="flex-1 flex flex-col justify-between p-8 lg:px-16 lg:py-10 overflow-hidden">
        {/* Logo */}
        <div className="animate-fade-in">
          <ZyraLogo />
        </div>

        {/* Form Content */}
        <div className="w-full max-w-[400px]">
          {children}
        </div>

        {/* Footer */}
        <div className="animate-fade-in animate-delay-700">
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>© Zyra Spaces 2025</span>
            <a href="mailto:help@zyraspaces.com" className="flex items-center gap-2 hover:text-gray-700 transition-colors cursor-pointer">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              help@zyraspaces.com
            </a>
          </div>
        </div>
      </div>

      {/* Decorative Arrow - Positioned between form and hero */}
      {showArrow && (
        <div className="hidden lg:block absolute bottom-24 left-1/2 -translate-x-1/2 z-10 animate-fade-in animate-delay-700">
          <HandDrawnArrow />
        </div>
      )}

      {/* Right Column - Hero */}
      <div className="hidden lg:block flex-1 relative overflow-hidden">
        {/* Background Image */}
        <img
          src={heroImageSrc}
          alt="Modern building"
          className="absolute inset-0 w-full h-full object-cover"
        />
        
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />

        {/* Content */}
        <div className="absolute inset-0 flex flex-col justify-end p-12 text-white">
          <div className="mb-6 animate-fade-in animate-delay-300">
            <SparkleIcon />
          </div>

          <h2 className="text-4xl lg:text-5xl font-bold leading-tight mb-4 animate-fade-in animate-delay-400">
            Start turning your<br />ideas into reality.
          </h2>

          <p className="text-lg text-gray-200 mb-8 animate-fade-in animate-delay-500">
            Create a free account and get full access to all features for 30-days. No credit card needed. Get started in 2 minutes.
          </p>

          <div className="flex items-center gap-6 animate-fade-in animate-delay-600">
            <UserAvatars />
            <div>
              <StarRating />
              <p className="text-sm text-gray-300 mt-1">from 200+ reviews</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Reusable Input Component
interface AuthInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

export const AuthInput: React.FC<AuthInputProps> = ({ label, error, className = "", ...props }) => (
  <div className="animate-fade-in">
    <label className="block text-xs font-medium text-gray-700 mb-2 cursor-default">
      {label}
    </label>
    <input
      {...props}
      className={`w-full px-4 py-3 border ${error ? 'border-red-400' : 'border-gray-200'} rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4780C6] focus:border-transparent transition-all text-gray-900 placeholder-gray-400 text-xs cursor-text ${className}`}
    />
    {error && <p className="text-red-500 text-xs mt-1 cursor-default">{error}</p>}
  </div>
);

// Reusable Button Component
interface AuthButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary';
  isLoading?: boolean;
}

export const AuthButton: React.FC<AuthButtonProps> = ({ 
  children, 
  variant = 'primary', 
  isLoading = false,
  className = "",
  disabled,
  ...props 
}) => {
  const baseClasses = "w-full font-medium py-3 rounded-lg transition-all text-sm cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]";
  const variantClasses = variant === 'primary' 
    ? "bg-[#4780C6] hover:bg-[#3A6FB5] active:bg-[#2F5A94] text-white"
    : "border border-gray-200 hover:bg-gray-50 active:bg-gray-100 text-gray-700";

  return (
    <button
      {...props}
      disabled={disabled || isLoading}
      className={`${baseClasses} ${variantClasses} ${className}`}
    >
      {isLoading ? (
        <span className="flex items-center justify-center gap-2">
          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          Loading...
        </span>
      ) : children}
    </button>
  );
};

// Google Button
interface GoogleButtonProps {
  onClick: () => void;
  text?: string;
}

export const GoogleButton: React.FC<GoogleButtonProps> = ({ onClick, text = "Sign in with Google" }) => (
  <button
    type="button"
    onClick={onClick}
    className="w-full flex items-center justify-center gap-3 border border-gray-200 rounded-lg py-3 hover:bg-gray-50 active:bg-gray-100 transition-all text-gray-700 font-medium text-sm cursor-pointer active:scale-[0.98]"
  >
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 48 48">
      <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z" />
      <path fill="#FF3D00" d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z" />
      <path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238A11.91 11.91 0 0 1 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z" />
      <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303a12.04 12.04 0 0 1-4.087 5.571l.003-.002 6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z" />
    </svg>
    {text}
  </button>
);

// OTP Input Component
interface OTPInputProps {
  length?: number;
  value: string;
  onChange: (value: string) => void;
  error?: string;
}

export const OTPInput: React.FC<OTPInputProps> = ({ length = 6, value, onChange, error }) => {
  const inputRefs = React.useRef<(HTMLInputElement | null)[]>([]);

  const handleChange = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (!/^\d*$/.test(val)) return;

    const newValue = value.split('');
    newValue[index] = val.slice(-1);
    const finalValue = newValue.join('');
    onChange(finalValue);

    // Move to next input
    if (val && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !value[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').slice(0, length);
    if (/^\d+$/.test(pastedData)) {
      onChange(pastedData.padEnd(length, ''));
      inputRefs.current[Math.min(pastedData.length, length - 1)]?.focus();
    }
  };

  return (
    <div>
      <div className="flex gap-3 justify-center">
        {Array.from({ length }).map((_, index) => (
          <input
            key={index}
            ref={(el) => { inputRefs.current[index] = el; }}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={value[index] || ''}
            onChange={(e) => handleChange(index, e)}
            onKeyDown={(e) => handleKeyDown(index, e)}
            onPaste={handlePaste}
            className={`w-12 h-14 text-center text-xl font-semibold border ${error ? 'border-red-400' : 'border-gray-200'} rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4780C6] focus:border-transparent transition-all cursor-text`}
          />
        ))}
      </div>
      {error && <p className="text-red-500 text-xs mt-2 text-center">{error}</p>}
    </div>
  );
};

