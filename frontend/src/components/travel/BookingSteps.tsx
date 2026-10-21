"use client";

import { Check } from "lucide-react";
import { useTravelCopy } from "./travel-shell";

export function BookingSteps({ step }: { step: 0 | 1 | 2 }) {
  const copy = useTravelCopy();

  const steps = [
    { label: copy("ตะกร้าสินค้า", "Shopping Cart") },
    { label: copy("ตรวจสอบข้อมูล", "Review Details") },
    { label: copy("ชำระเงิน", "Payment") },
  ];

  return (
    <nav aria-label={copy("ขั้นตอนการจอง", "Booking progress")} className="w-full py-2">
      <ol className="flex items-center justify-between w-full max-w-2xl mx-auto">
        {steps.map((s, i) => {
          const isDone = i < step;
          const isCurrent = i === step;

          return (
            <li key={s.label} className="flex-1 flex items-center relative">
              <div className="flex items-center gap-2 sm:gap-3 z-10 bg-[#FAF8F5] pr-3">
                <span
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all shadow-sm ${
                    isDone
                      ? "bg-[#D97706] text-white"
                      : isCurrent
                      ? "bg-[#1B2A24] text-white ring-4 ring-[#1B2A24]/10"
                      : "bg-slate-200 text-slate-500"
                  }`}
                >
                  {isDone ? <Check size={14} strokeWidth={3} /> : i + 1}
                </span>
                <span
                  className={`text-xs sm:text-sm font-semibold whitespace-nowrap ${
                    isCurrent
                      ? "text-[#1B2A24] font-bold"
                      : isDone
                      ? "text-[#D97706]"
                      : "text-slate-400"
                  }`}
                >
                  {s.label}
                </span>
              </div>

              {/* Connecting Divider Line */}
              {i < steps.length - 1 && (
                <div
                  className={`flex-1 h-0.5 mx-2 transition-colors ${
                    i < step ? "bg-[#D97706]" : "bg-slate-200"
                  }`}
                />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
