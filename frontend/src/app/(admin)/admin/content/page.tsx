"use client";
import { useState, useRef, type FormEvent } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Save, Pencil, Eye, FileText } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/hooks/use-auth";
import { getAdminContent, saveContent, type ContentDraft, type ContentEntry } from "@/lib/api/experience";
import { extractErrorMessage } from "@/lib/api/errors";
import { PageHeading, Media } from "@/components/travel/Primitives";

const empty: ContentDraft = { kind:"STORY",title:"",title_en:"",summary:"",summary_en:"",body:"",body_en:"",image_url:"",image_alt:"",location:"",starts_at:null,ends_at:null,is_published:false };
const kinds = { STORY:"ข่าวและกิจกรรม",COMMUNITY:"ชุมชนและผู้ให้บริการ",ATTRACTION:"สถานที่แนะนำ" };
export default function ContentAdminPage() {
  const {user} = useAuth(); const client = useQueryClient();
  const allowed = user?.role === "SUPER_ADMIN";
  const [draft,setDraft] = useState<ContentDraft>(empty); const [editing,setEditing] = useState<string>(); const [message,setMessage] = useState("");
  const form = useRef<HTMLFormElement>(null);
  const query = useQuery({queryKey:["admin-content"],queryFn:getAdminContent,enabled:allowed});
  const mutation = useMutation({mutationFn:()=>saveContent(draft,editing),onSuccess:async()=>{
    await Promise.all([client.invalidateQueries({queryKey:["admin-content"]}),client.invalidateQueries({queryKey:["editorial"]}),client.invalidateQueries({queryKey:["editorial-detail"]})]);
    setMessage(draft.is_published ? "บันทึกและเผยแพร่แล้ว" : "บันทึกฉบับร่างแล้ว");setDraft(empty);setEditing(undefined);
  }});
  function edit(entry:ContentEntry) {const {id,updated_at,...values}=entry;setEditing(id);setDraft(values);setMessage("");mutation.reset();form.current?.scrollIntoView({block:"start"});form.current?.querySelector<HTMLInputElement>('input[name="title"]')?.focus();}
  function submit(event:FormEvent) {event.preventDefault();setMessage("");mutation.mutate();}
  if(!allowed) return <p className="wt-empty">เฉพาะผู้ดูแลระบบสูงสุดเท่านั้น</p>;
  return <div className="wt-page">
    <PageHeading eyebrow="EDITORIAL STUDIO" title="เรื่องราวที่พาคนออกเดินทาง" description="จัดการข่าว กิจกรรม ชุมชน และสถานที่แนะนำจากฐานข้อมูลเดียวกับหน้าเว็บ" />
    <div className="wt-two-column">
      <section aria-label="รายการเนื้อหา" className="space-y-4">
        <button className="wt-button secondary" onClick={()=>{setEditing(undefined);setDraft(empty);mutation.reset();setMessage("");}}><Plus size={18}/>สร้างเรื่องใหม่</button>
        <p className="wt-muted">แสดง 100 รายการที่แก้ไขล่าสุด · ภาพและสถานที่ควรตรงกับข้อมูลจริง</p>
        {query.isPending&&<p role="status">กำลังโหลดเนื้อหา…</p>}
        {query.isError&&<div className="wt-empty" role="alert">{extractErrorMessage(query.error,"โหลดเนื้อหาไม่สำเร็จ")}<button className="wt-button secondary" onClick={()=>void query.refetch()}>ลองใหม่</button></div>}
        {query.data?.length===0&&<p className="wt-empty">ยังไม่มีเนื้อหา เริ่มจากบันทึกฉบับร่างด้านข้าง</p>}
        {query.data?.map(entry=><article className="wt-panel space-y-3" key={entry.id}>
          <span className="wt-eyebrow"><FileText size={14}/>{kinds[entry.kind]} · {entry.is_published?"เผยแพร่แล้ว":"ฉบับร่าง"}</span>
          <h2 className="text-xl">{entry.title}</h2><p className="wt-muted">{entry.summary}</p>
          <div className="wt-actions"><button className="wt-button secondary" onClick={()=>edit(entry)}><Pencil size={16}/>แก้ไข</button>{entry.is_published&&<Link className="wt-button secondary" href={`/stories/${entry.id}`}><Eye size={16}/>ดูหน้าเว็บ</Link>}</div>
        </article>)}
      </section>
      <form ref={form} className="wt-panel wt-form" onSubmit={submit}>
        <h2 className="text-xl">{editing?"แก้ไขเนื้อหา":"สร้างเนื้อหาใหม่"}</h2>
        <fieldset disabled={mutation.isPending} className="wt-form">
          <label>ประเภท<select value={draft.kind} onChange={e=>setDraft({...draft,kind:e.target.value as ContentDraft["kind"]})}>{Object.entries(kinds).map(([value,label])=><option key={value} value={value}>{label}</option>)}</select></label>
          <label>ชื่อเรื่องภาษาไทย<input name="title" required maxLength={200} value={draft.title} onChange={e=>setDraft({...draft,title:e.target.value})}/></label>
          <label>ชื่อเรื่องภาษาอังกฤษ<input maxLength={200} value={draft.title_en} onChange={e=>setDraft({...draft,title_en:e.target.value})}/></label>
          <label>คำโปรยภาษาไทย<textarea value={draft.summary} onChange={e=>setDraft({...draft,summary:e.target.value})}/></label>
          <label>คำโปรยภาษาอังกฤษ<textarea value={draft.summary_en} onChange={e=>setDraft({...draft,summary_en:e.target.value})}/></label>
          <label>เรื่องราวภาษาไทย<textarea required rows={8} value={draft.body} onChange={e=>setDraft({...draft,body:e.target.value})}/></label>
          <label>เรื่องราวภาษาอังกฤษ<textarea rows={6} value={draft.body_en} onChange={e=>setDraft({...draft,body_en:e.target.value})}/></label>
          <label>URL รูปภาพ<input type="url" maxLength={1000} value={draft.image_url} onChange={e=>setDraft({...draft,image_url:e.target.value})}/></label>
          <label>คำอธิบายภาพ<input maxLength={200} value={draft.image_alt} onChange={e=>setDraft({...draft,image_alt:e.target.value})}/></label>
          {draft.image_url&&<Media src={draft.image_url} alt={draft.image_alt||draft.title}/>}
          <label>สถานที่<input maxLength={200} value={draft.location} onChange={e=>setDraft({...draft,location:e.target.value})}/></label>
          <p className="wt-muted">วันกิจกรรม (ถ้ามี) ใช้เขตเวลาของอุปกรณ์นี้</p>
          <label>เริ่ม<input type="datetime-local" value={localDate(draft.starts_at)} onChange={e=>setDraft({...draft,starts_at:e.target.value?new Date(e.target.value).toISOString():null})}/></label>
          <label>สิ้นสุด<input type="datetime-local" value={localDate(draft.ends_at)} min={localDate(draft.starts_at)||undefined} onChange={e=>setDraft({...draft,ends_at:e.target.value?new Date(e.target.value).toISOString():null})}/></label>
          <div><label className="!flex !flex-row items-center"><input className="!w-5 !min-h-5" type="checkbox" checked={draft.is_published} onChange={e=>setDraft({...draft,is_published:e.target.checked})}/>เผยแพร่บนหน้าเว็บ</label></div>
          <button className="wt-button" type="submit"><Save size={18}/>{mutation.isPending?"กำลังบันทึก…":"บันทึกเนื้อหา"}</button>
        </fieldset>
        {mutation.isError&&<p className="wt-error" role="alert">{extractErrorMessage(mutation.error,"บันทึกไม่สำเร็จ กรุณาตรวจสอบข้อมูลและลองใหม่")}</p>}
        {message&&<p role="status">{message}</p>}
      </form>
    </div>
  </div>;
}
function localDate(value:string|null) {if(!value)return "";const date=new Date(value);return new Date(date.getTime()-date.getTimezoneOffset()*60000).toISOString().slice(0,16);}
