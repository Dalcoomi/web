import React from "react";

interface BottomButtonProps {
  text: string;
  onClick: () => void;
  disabled?: boolean;
  className?: string; // For wrapper customization (e.g., padding-bottom)
  children?: React.ReactNode;
}

export default function BottomButton({
  text,
  onClick,
  disabled = false,
  className = "pb-[34px]", // Default safe area padding
  children,
}: BottomButtonProps) {
  return (
    <div className={`bg-white px-5 py-4 ${className}`}>
      {children}
      <button
        onClick={onClick}
        disabled={disabled}
        className={`w-full h-14 rounded-xl text-subtitle transition-all flex items-center justify-center ${
          disabled
            ? "bg-gray-200 text-white cursor-not-allowed"
            : "bg-gray-900 text-white cursor-pointer hover:bg-gray-800"
        }`}
      >
        {text}
      </button>
    </div>
  );
}
