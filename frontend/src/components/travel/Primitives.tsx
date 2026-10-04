"use client";
import { useState } from "react";
import { ImageOff, ChevronLeft, ChevronRight } from "lucide-react";
import { useTravelCopy } from "./travel-shell";
export function Media({src,alt,priority=false,className=""}:{src?:string|null;alt:string;priority?:boolean;className?:string}){
  const [failed,setFailed]=useState<string|null>(null);const copy=useTravelCopy();
  return <div className={`wt-media ${className}`}>{src&&failed!==src?<img src={src} alt={alt} loading={priority?"eager":"lazy"} decoding="async" width={640} height={640} onError={()=>setFailed(src)} />:<span className="wt-media-fallback"><ImageOff aria-hidden="true" /><span>{copy("ยังไม่มีภาพจากผู้ให้บริการ","Provider image not available")}</span></span>}</div>;
}
export function PageHeading({eyebrow,title,description}:{eyebrow:string;title:string;description?:string}){return <header className="wt-page-head"><span className="wt-eyebrow">{eyebrow}</span><h1>{title}</h1>{description&&<p>{description}</p>}</header>;}
export function Pagination({page,total,busy,onChange}:{page:number;total:number;busy?:boolean;onChange:(page:number)=>void}){const copy=useTravelCopy();return total>1?<nav className="wt-pagination" aria-label={copy("เปลี่ยนหน้า","Pagination")}><button disabled={page<=1||busy} onClick={()=>onChange(page-1)} aria-label={copy("หน้าก่อน","Previous page")}><ChevronLeft size={18}/></button><span>{page} / {total}</span><button disabled={page>=total||busy} onClick={()=>onChange(page+1)} aria-label={copy("หน้าถัดไป","Next page")}><ChevronRight size={18}/></button></nav>:null;}
