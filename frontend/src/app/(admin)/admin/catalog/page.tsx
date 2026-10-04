"use client";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Save, Pencil } from "lucide-react";
import { PageHeading, Media, Pagination } from "@/components/travel/Primitives";
import { ListError, ListLoading } from "@/components/catalog/DataStates";
import { getOTOPProducts, getAccommodations, getWellnessServices, getFoods } from "@/lib/api/catalog";
import { updateOtopProduct, updateAccommodation, updateWellness, updateFood } from "@/lib/api/vendor";
import { extractErrorMessage } from "@/lib/api/errors";
import { formatBaht } from "@/lib/format";
import { useAuth } from "@/hooks/use-auth";
type Kind="OTOP"|"ACCOMMODATION"|"WELLNESS"|"FOOD";
type Row={id:string;title:string;description:string;image?:string;price:string|null};
const tabs:Record<Kind,string>={OTOP:"ของดีชุมชน",ACCOMMODATION:"ที่พัก",WELLNESS:"นวดและกิจกรรม",FOOD:"อาหาร"};
export default function AdminCatalog(){
 const {user}=useAuth();const [kind,setKind]=useState<Kind>("OTOP");const [page,setPage]=useState(1);const [search,setSearch]=useState("");
 const products=useQuery({queryKey:["admin-catalog","OTOP",page],queryFn:()=>getOTOPProducts({page,limit:12}),enabled:kind==="OTOP"});
 const stays=useQuery({queryKey:["admin-catalog","ACCOMMODATION",page],queryFn:()=>getAccommodations({page,limit:12}),enabled:kind==="ACCOMMODATION"});
 const wellness=useQuery({queryKey:["admin-catalog","WELLNESS",page],queryFn:()=>getWellnessServices({page,limit:12}),enabled:kind==="WELLNESS"});
 const foods=useQuery({queryKey:["admin-catalog","FOOD",page],queryFn:()=>getFoods({page,limit:12}),enabled:kind==="FOOD"});
 const query=kind==="OTOP"?products:kind==="ACCOMMODATION"?stays:kind==="WELLNESS"?wellness:foods;
 const rows:Row[]=kind==="OTOP"?(products.data?.data??[]).map(x=>({id:x.id,title:x.name,description:x.description,image:x.image_url,price:x.price})):kind==="ACCOMMODATION"?(stays.data?.data??[]).map(x=>({id:x.id,title:x.name,description:x.description,image:x.image_url,price:x.min_price_per_night})):kind==="WELLNESS"?(wellness.data?.data??[]).map(x=>({id:x.id,title:x.title,description:x.description,image:x.image_url,price:x.price})):(foods.data?.data??[]).map(x=>({id:x.id,title:x.name,description:x.description,image:x.image_url,price:x.price}));
 const visible=rows.filter(row=>row.title.toLocaleLowerCase().includes(search.toLocaleLowerCase()));
 return <div className="wt-page"><PageHeading eyebrow="LIVE CATALOG" title="สินค้าและบริการที่เผยแพร่" description="รายการที่เปิดให้บริการจากฐานข้อมูล ผู้ดูแลระบบสูงสุดแก้ไขข้อมูลได้ ส่วนรายการที่ปิดให้บริการจัดการผ่านบัญชีเจ้าของ"/>
 <div className="wt-filters">{Object.entries(tabs).map(([value,label])=><button className="wt-chip" aria-pressed={kind===value} key={value} onClick={()=>{setKind(value as Kind);setPage(1);setSearch("");}}>{label}</button>)}</div>
 <label className="wt-form mb-6">ค้นหาในหน้านี้<input value={search} onChange={e=>setSearch(e.target.value)}/></label>
 {query.isLoading?<ListLoading/>:query.isError?<ListError message={extractErrorMessage(query.error,"โหลดรายการไม่สำเร็จ")} onRetry={()=>void query.refetch()}/>:!visible.length?<p className="wt-empty">ไม่พบรายการในหน้านี้</p>:<div className="wt-admin-grid">{visible.map(row=><CatalogRow key={`${kind}-${row.id}`} row={row} kind={kind} canEdit={user?.role==="SUPER_ADMIN"}/>)}</div>}
 <Pagination page={page} total={query.data?.meta?.pagination?.total_pages??1} busy={query.isFetching} onChange={setPage}/></div>;
}
function CatalogRow({row,kind,canEdit}:{row:Row;kind:Kind;canEdit:boolean}){
 const [title,setTitle]=useState(row.title);const [description,setDescription]=useState(row.description);const [price,setPrice]=useState(row.price??"");const [image,setImage]=useState(row.image??"");const client=useQueryClient();
 const mutation=useMutation({mutationFn:()=>{
  const payload:Record<string,unknown>={[kind==="WELLNESS"?"title":"name"]:title,description};
  if(kind!=="ACCOMMODATION"){payload.price=price;payload.image_url=image.trim();}
  return kind==="OTOP"?updateOtopProduct(row.id,payload):kind==="ACCOMMODATION"?updateAccommodation(row.id,payload):kind==="WELLNESS"?updateWellness(row.id,payload):updateFood(row.id,payload);
 },onSuccess:async()=>{await client.invalidateQueries();}});
 return <article className="wt-panel space-y-4"><Media src={row.image} alt={row.title}/><h2 className="text-xl">{row.title}</h2><p className="wt-muted">{row.description}</p><p>{row.price?formatBaht(row.price):"ยังไม่มีราคา"}{kind==="ACCOMMODATION"?" / คืน":""}</p>
 {canEdit&&<details><summary className="flex min-h-11 cursor-pointer items-center gap-2"><Pencil size={16}/>แก้ไขข้อมูล</summary><form className="wt-form mt-4" onSubmit={e=>{e.preventDefault();mutation.mutate();}}><fieldset className="wt-form" disabled={mutation.isPending}><label>ชื่อรายการ<input required maxLength={150} value={title} onChange={e=>setTitle(e.target.value)}/></label><label>รายละเอียด<textarea value={description} onChange={e=>setDescription(e.target.value)}/></label>{kind!=="ACCOMMODATION"&&<><label>ราคา (บาท)<input required type="number" min="0.01" step="0.01" value={price} onChange={e=>setPrice(e.target.value)}/></label><label>URL ภาพจริง<input type="url" maxLength={1000} value={image} onChange={e=>setImage(e.target.value)}/></label></>}<button className="wt-button" type="submit"><Save size={16}/>{mutation.isPending?"กำลังบันทึก…":"บันทึกข้อมูล"}</button></fieldset>{mutation.isError&&<p className="wt-error" role="alert">{extractErrorMessage(mutation.error,"บันทึกไม่สำเร็จ")}</p>}{mutation.isSuccess&&<p role="status">บันทึกแล้ว</p>}</form></details>}
 </article>;
}
