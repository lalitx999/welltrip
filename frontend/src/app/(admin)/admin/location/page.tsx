"use client";
import { useQuery } from "@tanstack/react-query";
import { MapPin, RefreshCw } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { getLocationLogs, getLocationPolicy } from "@/lib/api/experience";
import { extractErrorMessage } from "@/lib/api/errors";
import { PageHeading } from "@/components/travel/Primitives";
const labels={granted:"อนุญาต",denied:"ปฏิเสธสิทธิ์เบราว์เซอร์",timeout:"หมดเวลา",unavailable:"หาตำแหน่งไม่ได้"};
export default function LocationAdminPage(){
  const {user}=useAuth();const allowed=user?.role==="SUPER_ADMIN";
  const query=useQuery({queryKey:["location-admin"],queryFn:getLocationLogs,enabled:allowed,gcTime:0});
  const policy=useQuery({queryKey:["location-policy"],queryFn:getLocationPolicy,enabled:allowed});
  if(!allowed)return <p className="wt-empty">เฉพาะผู้ดูแลระบบสูงสุดเท่านั้น</p>;
  return <div className="wt-page space-y-6"><PageHeading eyebrow="LOCATION LOGS" title="บันทึกตำแหน่งโดยความยินยอม" description="100 รายการล่าสุดที่ยังไม่หมดอายุ ไม่แสดงชื่อผู้ใช้ และไม่มีการติดตามเบื้องหลัง"/>
    <div className="wt-panel space-y-2"><MapPin size={24}/><p>พิกัดถูกลดความละเอียดเหลือทศนิยม 2 ตำแหน่งก่อนจัดเก็บ</p><p className="wt-muted">ค่าความคลาดเคลื่อนมาจากอุปกรณ์ ไม่ใช่ความแม่นยำของพิกัดหลังปัดเศษ{policy.data?` · เก็บ ${policy.data.retention_days} วัน`:""}</p></div>
    <button className="wt-button secondary" disabled={query.isFetching} onClick={()=>void query.refetch()}><RefreshCw size={16}/>โหลดรายการล่าสุด</button>
    {query.isPending&&<p role="status">กำลังโหลด…</p>}
    {query.isError&&<p className="wt-error" role="alert">{extractErrorMessage(query.error,"โหลดบันทึกไม่สำเร็จ")}</p>}
    {query.data?.length===0&&<p className="wt-empty">ยังไม่มีบันทึกที่อยู่ในระยะจัดเก็บ</p>}
    {!!query.data?.length&&<div className="wt-admin-grid">{query.data.map(row=><article className="wt-panel space-y-3" key={row.id}><p className="wt-eyebrow">{labels[row.outcome]}</p><h2 className="text-xl">{row.latitude!==null&&row.longitude!==null?`${row.latitude}, ${row.longitude}`:"ไม่มีพิกัด"}</h2><dl className="wt-muted"><dt>วันที่บันทึก</dt><dd>{new Date(row.created_at).toLocaleString("th-TH")}</dd><dt>หมดอายุ</dt><dd>{new Date(row.expires_at).toLocaleString("th-TH")}</dd><dt>ความคลาดเคลื่อนอุปกรณ์</dt><dd>{row.accuracy_m===null?"—":`${row.accuracy_m} เมตร`}</dd><dt>เวอร์ชันความยินยอม</dt><dd>{row.consent_version}</dd></dl></article>)}</div>}
  </div>;
}
