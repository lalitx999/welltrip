"use client";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ArrowUpRight,House,Utensils,Flower2,ShoppingBag,Leaf,Users,Newspaper,MapPin } from "lucide-react";
import { AtmosphereCarousel } from "@/components/travel/AtmosphereCarousel";
import { LocationConsent } from "@/components/travel/LocationConsent";
import { Media } from "@/components/travel/Primitives";
import { useTravelCopy } from "@/components/travel/travel-shell";
import { getAccommodations,getOTOPProducts,getFoods,getWellnessServices } from "@/lib/api/catalog";
import { ListError,ListLoading } from "@/components/catalog/DataStates";
import { extractErrorMessage } from "@/lib/api/errors";
import { formatBaht } from "@/lib/format";
export default function Home(){
 const copy=useTravelCopy();
 const stays=useQuery({queryKey:["home-stays"],queryFn:()=>getAccommodations({page:1,limit:4}),staleTime:60000});
 const foods=useQuery({queryKey:["home-foods"],queryFn:()=>getFoods({page:1,limit:4}),staleTime:60000});
 const wellness=useQuery({queryKey:["home-wellness"],queryFn:()=>getWellnessServices({page:1,limit:4}),staleTime:60000});
 const products=useQuery({queryKey:["home-products"],queryFn:()=>getOTOPProducts({page:1,limit:4}),staleTime:60000});
 const sections=[
  {id:"stays",eyebrow:"STAY A LITTLE LONGER",title:copy("ที่พักสำหรับวันพักใจ","A place to slow down"),href:"/hotels",query:stays,rows:(stays.data?.data??[]).map(r=>({id:r.id,title:r.name,image:r.image_url,price:r.min_price_per_night,meta:[r.district,r.province].filter(Boolean).join(", "),href:`/hotels/${r.id}`,unit:copy("/ คืน","/ night")}))},
  {id:"foods",eyebrow:"TASTE SOMETHING LOCAL",title:copy("อร่อยใกล้ชุมชน","A taste of local life"),href:"/foods",query:foods,rows:(foods.data?.data??[]).map(r=>({id:r.id,title:r.name,image:r.image_url,price:r.price,meta:"",href:"/foods",unit:""}))},
  {id:"wellness",eyebrow:"TIME TO UNWIND",title:copy("เติมความสดชื่นให้ทริป","Make room for rest"),href:"/wellness",query:wellness,rows:(wellness.data?.data??[]).map(r=>({id:r.id,title:r.title,image:r.image_url,price:r.price,meta:`${r.duration_minutes} ${copy("นาที","min")}`,href:`/wellness/${r.id}`,unit:""}))},
  {id:"products",eyebrow:"LOCAL TREASURES",title:copy("ของฝากที่มีเรื่องราว","Bring a little story home"),href:"/otop",query:products,rows:(products.data?.data??[]).map(r=>({id:r.id,title:r.name,image:r.image_url,price:r.price,meta:"",href:"/otop",unit:""}))},
 ];
 return <div className="wt-page"><AtmosphereCarousel/>
 <section className="wt-section wt-categories" aria-label={copy("หมวดบริการ","Service categories")}>{[{href:"/hotels",icon:House,label:copy("ที่พัก","Stays")},{href:"/foods",icon:Utensils,label:copy("อาหาร","Dining")},{href:"/wellness",icon:Flower2,label:copy("กิจกรรม","Wellness")},{href:"/otop",icon:ShoppingBag,label:copy("ของฝาก","OTOP")}].map(({href,icon:Icon,label})=><Link key={href} href={href}><Icon aria-hidden="true"/><span>{label}</span></Link>)}</section>
 <LocationConsent/>
 {sections.map(section=><section key={section.id} className="wt-section" aria-labelledby={`home-${section.id}`}><div className="wt-section-title"><div><span className="wt-eyebrow">{section.eyebrow}</span><h2 id={`home-${section.id}`}>{section.title}</h2></div><Link href={section.href}>{copy("ดูทั้งหมด","View all")}<ArrowUpRight size={16}/></Link></div>{section.query.isLoading?<ListLoading/>:section.query.isError?<ListError message={extractErrorMessage(section.query.error)} onRetry={()=>{void section.query.refetch();}}/>:!section.rows.length?<div className="wt-empty">{copy("ยังไม่มีรายการที่เปิดให้บริการ","No listings available yet.")}</div>:<div className="wt-scroll-row">{section.rows.map(row=><Link href={row.href} className="wt-card" key={row.id}><Media src={row.image} alt={row.title}/><h3>{row.title}</h3>{row.meta&&<span className="wt-card-meta"><MapPin size={13}/>{row.meta}</span>}<p className="wt-price">{row.price!==null?formatBaht(row.price):copy("ดูรายละเอียดราคา","View pricing")} <small>{row.unit}</small></p></Link>)}</div>}</section>)}
 <section className="wt-section wt-panel"><span className="wt-eyebrow"><Leaf size={17}/>A LITTLE MORE YOU</span><h2 style={{fontSize:26,margin:"12px 0"}}>{copy("ให้ทริปนี้เหมาะกับคุณมากขึ้น","Find a trip that feels like you")}</h2><p className="wt-muted">{copy("เริ่มจากเป้าหมายการพักผ่อนและความชอบของคุณ","Start with your wellness goals and preferences")}</p><Link className="wt-button" style={{marginTop:16}} href="/health">{copy("เริ่มประเมินสุขภาพ","Start assessment")}<ArrowUpRight size={16}/></Link></section>
 <section className="wt-section"><Link className="wt-story-link" href="/community"><Users/><span>{copy("พบผู้คนและชุมชน","Meet the community")}<small>{copy("เรื่องราวจากผู้ให้บริการท้องถิ่น","Stories from local hosts")}</small></span><ArrowUpRight/></Link><Link className="wt-story-link" href="/news"><Newspaper/><span>{copy("ข่าวและกิจกรรมระหว่างทาง","Stories & events")}<small>{copy("หาแรงบันดาลใจสำหรับทริปถัดไป","Find inspiration for your next visit")}</small></span><ArrowUpRight/></Link></section>
 </div>;
}
