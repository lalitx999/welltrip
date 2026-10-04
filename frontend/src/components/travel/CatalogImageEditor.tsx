"use client";
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ImagePlus, Save } from "lucide-react";
import { updateOtopProduct, updateWellness } from "@/lib/api/vendor";
import { extractErrorMessage } from "@/lib/api/errors";
import { Media } from "./Primitives";
export function CatalogImageEditor({id,kind,image,title}:{id:string;kind:"otop"|"wellness";image?:string;title:string}){
  const [url,setUrl]=useState(image||"");const client=useQueryClient();
  const mutation=useMutation({mutationFn:()=>kind==="otop"?updateOtopProduct(id,{image_url:url.trim()}):updateWellness(id,{image_url:url.trim()}),onSuccess:async()=>{await Promise.all([client.invalidateQueries({queryKey:[kind]}),client.invalidateQueries({queryKey:[kind==="otop"?"portal-otop":"portal-services"]}),client.invalidateQueries({queryKey:[kind==="otop"?"home-products":"home-wellness"]}),client.invalidateQueries({queryKey:["wellness-slots",id]})]);}});
  return <details className="mt-4 border-t border-border pt-3"><summary className="flex min-h-11 cursor-pointer items-center gap-2 text-sm"><ImagePlus size={16}/>รูปภาพ {title}</summary><form className="wt-form mt-3" onSubmit={e=>{e.preventDefault();mutation.mutate();}}><label>URL ภาพจริงของสินค้า / บริการ<input type="url" maxLength={1000} value={url} onChange={e=>{setUrl(e.target.value);mutation.reset();}}/></label><p className="wt-muted">ใช้ภาพที่คุณมีสิทธิ์เผยแพร่ ล้างช่องนี้เพื่อเอาภาพออก</p>{url&&<div style={{maxWidth:240}}><Media src={url} alt={title}/></div>}<button disabled={mutation.isPending} className="wt-button" type="submit"><Save size={16}/>{mutation.isPending?"กำลังบันทึก…":"บันทึกภาพ"}</button>{mutation.isError&&<p role="alert" className="wt-error">{extractErrorMessage(mutation.error,"บันทึกภาพไม่สำเร็จ")}</p>}{mutation.isSuccess&&<p role="status" className="wt-muted">บันทึกภาพแล้ว</p>}</form></details>;
}
