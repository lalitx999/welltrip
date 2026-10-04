"use client";
import { useEffect, useRef, useState } from "react";
import { LocateFixed, Loader2 } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/hooks/use-auth";
import { useTravelCopy } from "./travel-shell";
import { getLocationPolicy, recordLocation, type LocationOutcome, type LocationPolicy } from "@/lib/api/experience";
export function LocationConsent() {
  const copy=useTravelCopy();const {status}=useAuth();
  const [policy,setPolicy]=useState<LocationPolicy|null>(null);const [consent,setConsent]=useState(false);const [busy,setBusy]=useState(false);const [message,setMessage]=useState("");
  const mounted=useRef(true);
  useEffect(()=>{mounted.current=true;return()=>{mounted.current=false;};},[]);
  async function loadPolicy(){try{setPolicy(await getLocationPolicy());setMessage("");}catch{setMessage(copy("ยังโหลดรายละเอียดการเก็บข้อมูลไม่ได้ โปรดลองอีกครั้ง","Could not load the data policy. Please try again."));}}
  async function requestLocation(){
    if(!policy||!consent||busy||status!=="authenticated")return;
    if(!window.isSecureContext||!navigator.geolocation){setMessage(copy("อุปกรณ์นี้ไม่รองรับ หรือเว็บไซต์ต้องใช้ HTTPS คุณยังใช้งานต่อได้โดยไม่แชร์ตำแหน่ง","Location requires a supported browser and HTTPS. You can continue without sharing."));return;}
    setBusy(true);setMessage("");
    const save=async(outcome:LocationOutcome,position?:GeolocationPosition)=>{
      if(!mounted.current)return;
      try{await recordLocation({consent:true,consent_version:policy.version,outcome,...(position?{latitude:Number(position.coords.latitude.toFixed(2)),longitude:Number(position.coords.longitude.toFixed(2)),accuracy_m:Math.min(40075000,Math.ceil(position.coords.accuracy))}:{})});if(mounted.current)setMessage(outcome==="granted"?copy("บันทึกตำแหน่งโดยประมาณแล้ว ไม่มีการติดตามต่อเนื่อง","Approximate location recorded. Continuous tracking is off."):copy("ไม่ได้รับตำแหน่ง บันทึกเฉพาะผลการขอสิทธิ์ คุณใช้งานต่อได้ตามปกติ","No location received. Only the request outcome was recorded. You can continue normally."));}
      catch{if(mounted.current)setMessage(copy("บันทึกไม่สำเร็จ ไม่มีการเก็บตำแหน่งไว้ในเบราว์เซอร์ โปรดลองใหม่ภายหลัง","Could not confirm saving. No coordinates are stored in your browser. Please try again later."));}
      finally{if(mounted.current){setBusy(false);setConsent(false);}}
    };
    navigator.geolocation.getCurrentPosition(p=>{void save("granted",p);},error=>{void save(error.code===1?"denied":error.code===3?"timeout":"unavailable");},{enableHighAccuracy:false,timeout:10000,maximumAge:60000});
  }
  return <details className="wt-location wt-panel" onToggle={e=>{if(e.currentTarget.open&&!policy)void loadPolicy();}}><summary><LocateFixed size={18} aria-hidden="true" />{copy("แชร์ตำแหน่งปัจจุบัน (ไม่บังคับ)","Share current location (optional)")}</summary><fieldset disabled={busy}>
    <p className="wt-muted">{copy("เราจะขอตำแหน่งหนึ่งครั้งเพื่อเก็บประวัติการใช้งานตำแหน่ง ไม่ติดตามเบื้องหลัง และไม่ส่งให้บริการ AI","We request location once to keep a location usage record. No background tracking or AI sharing.")}</p>
    {policy?<p className="wt-muted">{copy(`บันทึกเฉพาะพิกัดที่ปัดเหลือ 2 ตำแหน่งทศนิยม (ประมาณระดับกิโลเมตร) ค่าความคลาดเคลื่อน เวลา และบัญชีผู้ใช้ เก็บ ${policy.retention_days} วัน ผู้ดูแลระบบสูงสุดเข้าถึงได้ ลบประวัติได้ในหน้าตั้งค่า หากปฏิเสธจะบันทึกเฉพาะผลการขอสิทธิ์`,`Only coordinates rounded to 2 decimals (roughly kilometre-scale), reported accuracy, time and account are stored for ${policy.retention_days} days. Only super admins can access them. Delete records in Settings. A refusal records only the request outcome.`)}</p>:<button type="button" className="wt-button secondary" onClick={()=>void loadPolicy()}>{copy("โหลดรายละเอียดการเก็บข้อมูล","Load data policy")}</button>}
    {status==="authenticated"?<><label className="wt-check"><input type="checkbox" checked={consent} disabled={!policy} onChange={e=>setConsent(e.target.checked)} /><span>{copy("ยินยอมให้ขอตำแหน่งและบันทึกข้อมูลตามรายละเอียดข้างต้น","I agree to the location request and logging described above.")}</span></label><button className="wt-button" type="button" disabled={!policy||!consent||busy} onClick={()=>void requestLocation()}>{busy?<Loader2 size={17} className="animate-spin" />:<LocateFixed size={17} />}{copy("ใช้ตำแหน่งครั้งนี้","Share once")}</button></>:<Link className="wt-button secondary" href="/login">{copy("เข้าสู่ระบบก่อนแชร์ตำแหน่ง","Sign in to share location")}</Link>}
    <p role="status" className="wt-muted">{message}</p></fieldset></details>;
}
