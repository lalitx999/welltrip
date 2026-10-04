import { ContentDetail } from "@/components/travel/ContentPages";
export default async function Page({params}:{params:Promise<{id:string}>}){const {id}=await params;return <ContentDetail id={id}/>;}
