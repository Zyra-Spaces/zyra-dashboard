"use client";

interface LoadingProps {
  size?: "sm" | "md" | "lg";
  text?: string;
  fullScreen?: boolean;
}

export function Loading({ size = "md", text, fullScreen = false }: LoadingProps) {
  const sizeClasses = {
    sm: "w-8 h-8",
    md: "w-12 h-12",
    lg: "w-16 h-16",
  };

  const containerClass = fullScreen
    ? "fixed inset-0 bg-white/80 backdrop-blur-sm z-50 flex items-center justify-center"
    : "flex items-center justify-center";

  return (
    <div className={containerClass}>
      <div className="flex flex-col items-center gap-4">
        {/* Zyra Logo with Animation */}
        <div className="relative">
          <svg
            width={size === "sm" ? 32 : size === "md" ? 48 : 64}
            height={size === "sm" ? 31 : size === "md" ? 47 : 63}
            viewBox="0 0 32 31"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="animate-pulse"
          >
            <path
              d="M6.4 0H25.8462V8.32929H25.8797L11.7873 22.6707H32V31H0V22.6707H0.212553L14.3049 8.32929H6.4V0Z"
              fill="#4780C6"
            />
          </svg>
          {/* Spinning ring */}
          <div
            className={`absolute inset-0 border-2 border-[#4780C6] border-t-transparent rounded-full animate-spin ${
              sizeClasses[size]
            }`}
            style={{
              top: size === "sm" ? "-4px" : size === "md" ? "-6px" : "-8px",
              left: size === "sm" ? "-4px" : size === "md" ? "-6px" : "-8px",
            }}
          />
        </div>
        {text && (
          <p className="text-sm text-gray-600 font-medium animate-pulse">{text}</p>
        )}
      </div>
    </div>
  );
}




