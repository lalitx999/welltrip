"use client";
import { useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Clock, ArrowUpRight } from "lucide-react";
import { getFoods,getOTOPProducts,getWellnessServices } from "@/lib/api/catalog";
import { ListError,ListLoading } from "@/components/catalog/DataStates";
import { extractErrorMessage } from "@/lib/api/errors";
import { useCartStore } from "@/store/cart-store";
import { formatBaht } from "@/lib/format";
import { useTravelCopy } from "./travel-shell";
import { Media,PageHeading,Pagination } from "./Primitives";
import { FOOD_WELLNESS_CATEGORIES,OTOP_CATEGORIES,type FoodWellnessCategory,type OTOPCategory } from "@/types/catalog";
const foodLabels:Record<FoodWellnessCategory,[string,string]>={LOW_SUGAR:["หวานน้อย","Low sugar"],LOW_SODIUM:["โซเดียมต่ำ","Low sodium"],ORGANIC:["ออร์แกนิก","Organic"],HERBAL:["สมุนไพร","Herbal"],VEGAN:["วีแกน","Vegan"]};
const productLabels:Record<OTOPCategory,[string,string]>={HERBAL_PRODUCT:["สมุนไพร","Herbal"],TEXTILE:["ผ้าทอ","Textiles"],PROCESSED_FOOD:["อาหารแปรรูป","Food products"],CRAFT:["หัตถกรรม","Crafts"]};
export function Catalog({kind}:{kind:"foods"|"wellness"|"otop"}){
 const copy=useTravelCopy();const [page,setPage]=useState(1);const [category,setCategory]=useState("");const [draft,setDraft]=useState("");const [search,setSearch]=useState("");const [notice,setNotice]=useState("");const addItem=useCartStore(s=>s.addItem);
 const foods=useQuery({queryKey:["foods",category,page],queryFn:()=>getFoods({category:category?category as FoodWellnessCategory:undefined,page,limit:12}),enabled:kind==="foods"});
 const wellness=useQuery({queryKey:["wellness",page],queryFn:()=>getWellnessServices({page,limit:12}),enabled:kind==="wellness"});
 const otop=useQuery({queryKey:["otop",category,search,page],queryFn:()=>getOTOPProducts({category:category?category as OTOPCategory:undefined,search,page,limit:12}),enabled:kind==="otop"});
 const query=kind==="foods"?foods:kind==="wellness"?wellness:otop;
 const options=kind==="foods"?FOOD_WELLNESS_CATEGORIES.map(key=>({key,label:copy(...foodLabels[key])})):kind==="otop"?OTOP_CATEGORIES.map(key=>({key,label:copy(...productLabels[key])})):[];
 const rows=kind==="foods"?(foods.data?.data??[]).map(r=>({id:r.id,title:r.name,description:r.description,price:r.price,image:r.image_url,available:r.is_available,meta:r.calorie_estimate!==null?`${r.calorie_estimate} kcal`:copy(...foodLabels[r.wellness_category])})):kind==="wellness"?(wellness.data?.data??[]).map(r=>({id:r.id,title:r.title,description:r.description,price:r.price,image:r.image_url,available:r.is_active,meta:`${r.duration_minutes} ${copy("นาที","min")}`})):(otop.data?.data??[]).map(r=>({id:r.id,title:r.name,description:r.description,price:r.price,image:r.image_url,available:r.is_active&&r.stock_quantity>0,meta:copy(...productLabels[r.category])}));
 return <div className="wt-page"><PageHeading eyebrow={kind==="foods"?"LOCAL FLAVOURS":kind==="wellness"?"TIME TO UNWIND":"LOCAL TREASURES"} title={kind==="foods"?copy("อาหารอร่อยจากชุมชน","A taste of the community"):kind==="wellness"?copy("ให้วันนี้เป็นวันพักผ่อน","Make room for a little rest"):copy("ของดีที่มีเรื่องราว","Bring a little story home")} description={copy("เลือกจากรายการของผู้ให้บริการในระบบ ราคาและรายละเอียดแสดงตามข้อมูลล่าสุดที่ได้รับ","Explore provider listings, with prices and details from the current catalog.")} />
 {kind==="otop"&&<form className="wt-form wt-panel" onSubmit={e=>{e.preventDefault();setPage(1);setSearch(draft.trim());}}><label htmlFor="catalog-search">{copy("ค้นหาสินค้า","Search products")}<input id="catalog-search" value={draft} onChange={e=>setDraft(e.target.value)} /></label><button className="wt-button">{copy("ค้นหา","Search")}</button></form>}
 {options.length>0&&<div className="wt-filters" aria-label={copy("หมวดหมู่","Categories")}>{[{key:"",label:copy("ทั้งหมด","All")},...options].map(o=><button key={o.key} className="wt-chip" aria-pressed={category===o.key} onClick={()=>{setCategory(o.key);setPage(1);}}>{o.label}</button>)}</div>}
 <p role="status" className="wt-muted">{notice}</p>
 {query.isLoading?<ListLoading/>:query.isError?<ListError message={extractErrorMessage(query.error)} onRetry={()=>{void query.refetch();}}/>:!rows.length?<div className="wt-empty">{copy("ยังไม่มีรายการในหมวดนี้ ลองเปลี่ยนหมวดหรือกลับมาใหม่","No listings in this category yet. Try another category or return later.")}</div>:<div className="wt-grid">{rows.map(row=><article className="wt-card" key={row.id}><Media src={row.image} alt={row.title}/><span className="wt-card-meta">{kind==="wellness"&&<Clock size={14}/>} {row.meta}</span><h2>{row.title}</h2><p className="wt-price">{formatBaht(row.price)}</p><details><summary className="wt-muted">{copy("รายละเอียด","Details")}</summary><p>{row.description||copy("สอบถามรายละเอียดเพิ่มเติมจากผู้ให้บริการ","Contact the provider for more details.")}</p></details><div className="wt-actions">{kind==="wellness"?<Link className="wt-button" href={`/wellness/${row.id}`}>{copy("ดูรอบเวลา","View sessions")}<ArrowUpRight size={16}/></Link>:<button className="wt-button" disabled={!row.available} onClick={()=>{addItem({item_type:kind==="foods"?"FOOD_ORDER":"OTOP_GOODS",entity_id:row.id,title:row.title,quantity:1,unit_price:Number(row.price),image_url:row.image});setNotice(copy(`เพิ่ม ${row.title} ลงตะกร้าแล้ว`,`Added ${row.title} to your cart.`));}}>{row.available?copy("เพิ่มลงตะกร้า","Add to cart"):copy("ยังไม่พร้อมจำหน่าย","Unavailable")}</button>}<Link className="wt-muted" href="/cart">{copy("ดูตะกร้า","View cart")}</Link></div></article>)}</div>}
 <Pagination page={page} total={query.data?.meta?.pagination?.total_pages??1} busy={query.isFetching} onChange={setPage}/>
 </div>;
}
