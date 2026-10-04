"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowUpRight, ShoppingBag } from "lucide-react";
import type { AIRecommendationResponse, PackageItem } from "@/lib/api/ai";
import { PageHeading, Media } from "@/components/travel/Primitives";
import { useTravelCopy } from "@/components/travel/travel-shell";
import { formatPriceText } from "@/lib/format";
import { useI18n } from "@/lib/i18n";
import { useCartStore } from "@/store/cart-store";
export default function AIRecommendationPage(){
  const copy=useTravelCopy();const {locale}=useI18n();const add=useCartStore(s=>s.addItem);
  const [result,setResult]=useState<AIRecommendationResponse|null>(null);const [ready,setReady]=useState(false);const [notice,setNotice]=useState("");
  useEffect(()=>{try{const raw=sessionStorage.getItem("ai_recommendation_result");if(raw){const parsed=JSON.parse(raw);if(Array.isArray(parsed?.recommended_package?.items)&&parsed?.health_metrics)setResult(parsed);}}catch{}finally{setReady(true);}},[]);
  if(!ready)return <p role="status" className="wt-empty">{copy("กำลังโหลด…","Loading…")}</p>;
  if(!result)return <div className="wt-page"><PageHeading eyebrow="YOUR NEXT BREAK" title={copy("เริ่มออกแบบวันพักผ่อน","Start planning your next break")}/><Link className="wt-button" href="/health">{copy("เริ่มประเมิน","Start assessment")}</Link></div>;
  const pack=result.recommended_package;
  function destination(item:PackageItem){const fallback=item.item_type==="ROOM_RESERVATION"?"/hotels":"/wellness";return item.detail_url && /^\/(hotels|wellness)\/[a-zA-Z0-9-]+$/.test(item.detail_url)?item.detail_url:fallback;}
  return <div className="wt-page"><PageHeading eyebrow="YOUR NEXT BREAK" title={pack.package_title} description={pack.duration_label}/>
    <section className="wt-panel space-y-3"><h2 className="text-xl">{copy("ข้อมูลประกอบการเลือกทริป","A starting point for your trip")}</h2><p className="wt-muted">BMI {result.health_metrics.bmi} · {copy("คำนวณจากข้อมูลที่คุณส่ง","Calculated from your submitted information")}</p><p className="wt-detail">{result.deepseek_analysis}</p><p className="wt-muted">{pack.disclaimer}</p></section>
    <div className="wt-section-title wt-section"><h2>{copy("สำรวจตัวเลือกในระบบ","Explore catalog options")}</h2><Link href="/cart">{copy("ดูตะกร้า","View cart")}<ArrowUpRight size={16}/></Link></div><p role="status" className="wt-muted">{notice}</p>
    {!pack.items.length?<p className="wt-empty">{copy("ยังไม่มีบริการให้แนะนำในขณะนี้","No catalog options are available yet.")}</p>:<div className="wt-grid">{pack.items.map((item,i)=>{
      const needsSelection=item.item_type==="ROOM_RESERVATION"||item.item_type==="WELLNESS_SESSION";
      return <article key={`${item.item_type}-${item.entity_id}-${i}`} className="wt-card"><Media src={item.image_url} alt={item.title}/><span className="wt-card-meta">{item.category_label}</span><h3>{item.title}</h3><p className="wt-price">{formatPriceText(item.unit_price,locale)}</p>{needsSelection?<Link className="wt-button secondary" href={destination(item)}>{copy("เลือกวันหรือรอบเวลา","Choose dates or session")}<ArrowUpRight size={16}/></Link>:<button className="wt-button" onClick={()=>{add({item_type:item.item_type,entity_id:item.entity_id,title:item.title,unit_price:Number(item.unit_price),quantity:item.quantity,image_url:item.image_url});setNotice(copy(`เพิ่ม ${item.title} แล้ว`,`Added ${item.title}.`));}}><ShoppingBag size={16}/>{copy("เพิ่มลงตะกร้า","Add to cart")}</button>}</article>;
    })}</div>}
    <Link className="wt-button secondary wt-section" href="/health">{copy("ปรับข้อมูลของฉัน","Update my preferences")}</Link>
  </div>;
}
