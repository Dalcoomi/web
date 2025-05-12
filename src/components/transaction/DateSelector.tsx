"use client";

import { useState } from "react";

interface DateSelectorProps {
  selectedDate: Date;
  onDateChange: (date: Date) => void;
}

export default function DateSelector({
  selectedDate,
  onDateChange,
}: DateSelectorProps) {
  const formatDateForDisplay = (date: Date): string => {
    return `${date.getFullYear()}년 ${date.getMonth() + 1}월`;
  };

  const handlePrevMonth = () => {
    const newDate = new Date(selectedDate);
    newDate.setMonth(newDate.getMonth() - 1);
    onDateChange(newDate);
  };

  const handleNextMonth = () => {
    const newDate = new Date(selectedDate);
    newDate.setMonth(newDate.getMonth() + 1);
    onDateChange(newDate);
  };

  const isCurrentMonth = () => {
    const now = new Date();
    return (
      selectedDate.getFullYear() === now.getFullYear() &&
      selectedDate.getMonth() === now.getMonth()
    );
  };

  return (
    <div className="flex items-center justify-between px-4 py-3 bg-white">
      <button
        onClick={handlePrevMonth}
        className="flex items-center justify-center w-8 h-8"
      >
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M15.41 7.41L14 6L8 12L14 18L15.41 16.59L10.83 12L15.41 7.41Z"
            fill="#CCCCCC"
          />
        </svg>
      </button>

      <div className="text-base font-medium">
        {formatDateForDisplay(selectedDate)}
      </div>

      <button
        onClick={handleNextMonth}
        className="flex items-center justify-center w-8 h-8"
        disabled={isCurrentMonth()}
      >
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M8.59 16.59L10 18L16 12L10 6L8.59 7.41L13.17 12L8.59 16.59Z"
            fill={isCurrentMonth() ? "#E5E5E5" : "#CCCCCC"}
          />
        </svg>
      </button>
    </div>
  );
}
