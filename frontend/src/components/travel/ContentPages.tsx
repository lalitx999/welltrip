"use client";
import { useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ArrowUpRight, Calendar, MapPin } from "lucide-react";
import { getContent,getContentDetail,type ContentKind } from "@/lib/api/experience";
import { useI18n } from "@/lib/i18n";
import { useTravelCopy } from "./travel-shell";
import { Media,PageHeading,Pagination } from "./Primitives";
import { ListError,ListLoading } from "@/components/catalog/DataStates";
import { extractErrorMessage } from "@/lib/api/errors";
import { formatDateText } from "@/lib/format";
export function ContentList({kind}:{kind:ContentKind}){
 const copy=useTravelCopy();const {locale}=useI18n();const [page,setPage]=useState(1);const q=useQuery({queryKey:["editorial",kind,page],queryFn:()=>getContent(kind,page)});
 return <div className="wt-page"><PageHeading eyebrow={kind==="STORY"?"STORIES & EVENTS":kind==="COMMUNITY"?"MEET THE COMMUNITY":"TRIP INSPIRATION"} title={kind==="STORY"?copy("เรื่องราวระหว่างทาง","Stories along the way"):kind==="COMMUNITY"?copy("ผู้คนที่ทำให้ทริปมีความหมาย","The people behind the journey"):copy("หาแรงบันดาลใจให้ทริปใหม่","Find your next inspiration")} description={copy("เรื่องราวและข้อมูลที่เผยแพร่โดยผู้ดูแลชุมชน","Stories and information published by the community team")}/>
 {kind==="ATTRACTION"&&<div className="wt-panel wt-actions"><span>{copy("อยากได้คำแนะนำจากเป้าหมายสุขภาพของคุณ?","Want suggestions based on your wellness goals?")}</span><Link href="/health" className="wt-button">{copy("เริ่มประเมิน","Start assessment")}</Link></div>}
 {q.isLoading?<ListLoading/>:q.isError?<ListError message={extractErrorMessage(q.error)} onRetry={()=>{void q.refetch();}}/>:!q.data?.data.length?<div className="wt-empty">{copy("ยังไม่มีเนื้อหาที่เผยแพร่ในหมวดนี้","No published content in this category yet.")}</div>:<div className="wt-grid">{q.data.data.map(item=>{const title=locale==="en"?(item.title_en||item.title):item.title;return <article className="wt-card" key={item.id}><Link href={`/stories/${item.id}`} aria-label={title}><Media src={item.image_url} alt={item.image_alt||title}/></Link>{item.starts_at&&<span className="wt-card-meta"><Calendar size={14}/>{formatDateText(item.starts_at,locale)}</span>}<h2>{title}</h2>{item.location&&<p className="wt-card-meta"><MapPin size={14}/>{item.location}</p>}<p>{locale==="en"?(item.summary_en||item.summary):item.summary}</p><Link className="wt-button secondary" href={`/stories/${item.id}`}>{copy("อ่านเรื่องราว","Read more")}<ArrowUpRight size={16}/></Link></article>;})}</div>}
 <Pagination page={page} total={q.data?.meta?.pagination?.total_pages??1} busy={q.isFetching} onChange={setPage}/></div>;
}
export function ContentDetail({id}:{id:string}){
 const copy=useTravelCopy();const {locale}=useI18n();const q=useQuery({queryKey:["editorial-detail",id],queryFn:()=>getContentDetail(id)});
 if(q.isLoading)return <ListLoading/>;if(q.isError)return <ListError message={extractErrorMessage(q.error)} onRetry={()=>{void q.refetch();}}/>;if(!q.data)return null;
 const item=q.data.data;const title=locale==="en"?(item.title_en||item.title):item.title;
 return <article className="wt-page" style={{maxWidth:800}}><Link className="wt-button secondary" href={item.kind==="STORY"?"/news":item.kind==="COMMUNITY"?"/community":"/recommended"}>{copy("กลับไปดูทั้งหมด","Back to collection")}</Link><PageHeading eyebrow="SISAKET STORIES" title={title} description={locale==="en"?(item.summary_en||item.summary):item.summary}/><Media priority src={item.image_url} alt={item.image_alt||title}/><p className="wt-muted">{item.location}{item.starts_at?` · ${formatDateText(item.starts_at,locale)}`:""}</p><div className="wt-detail wt-section">{locale==="en"?(item.body_en||item.body):item.body}</div><Link className="wt-button wt-section" href="/hotels">{copy("สำรวจที่พักในระบบ","Explore stays")}</Link></article>;
}
