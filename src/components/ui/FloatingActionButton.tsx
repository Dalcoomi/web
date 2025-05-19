"use client";

import React from "react";

interface FloatingActionButtonProps {
  onClick: () => void;
  className?: string;
}

export default function FloatingActionButton({
  onClick,
  className = "",
}: FloatingActionButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`w-14 h-14 rounded-full bg-[#0EABFF] text-white flex items-center justify-center shadow-lg ${className}`}
    >
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" fill="white" />
      </svg>
    </button>
  );
}
