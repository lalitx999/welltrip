"use client";
import { useTravelCopy } from "./travel-shell";
export function BookingSteps({step}:{step:0|1|2}) {
  const copy=useTravelCopy();
  return <ol className="wt-steps" aria-label={copy("ขั้นตอนการจอง","Booking progress")}>{[copy("ตะกร้า","Cart"),copy("ตรวจสอบ","Review"),copy("ชำระเงิน","Payment")].map((label,i)=><li key={label} aria-current={step===i?"step":undefined}>{i+1}. {label}</li>)}</ol>;
}
