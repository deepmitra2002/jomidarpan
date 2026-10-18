import {getRecords} from '@/lib/jomi/store';
import {runComparison} from '@/lib/jomi/service.js';
import {DATABASE_FIELDS} from '@/lib/jomi/database.js';
export async function POST(request:Request) {
 if(Number(request.headers.get('content-length')||0)>40000)return Response.json({error:'অনুরোধটি বেশি বড়।'},{status:413});
 try {
 const raw=await request.text();if(raw.length>40000)return Response.json({error:'অনুরোধটি বেশি বড়।'},{status:413});
 const body=JSON.parse(raw);
 if(body.confirmed!==true || typeof body.record_id!=='string' || !body.values || typeof body.values!=='object')return Response.json({error:'রেফারেন্স বাছুন এবং নথির তথ্য পর্যালোচনা নিশ্চিত করুন।'},{status:400});
 const values:Record<string,string>={},provenance:Record<string,string>={};
 for(const key of [...DATABASE_FIELDS,'registry_office','registry_book','registry_page']){
  if(typeof body.values[key]==='string')values[key]=body.values[key].slice(0,250);
  if(typeof body.provenance?.[key]==='string')provenance[key]=body.provenance[key].slice(0,150);
 }
 const result=runComparison(values,await getRecords(),body.record_id,provenance);
 return Response.json(result,{headers:{'Cache-Control':'no-store'}});
 }catch{return Response.json({error:'তুলনা সম্পন্ন হয়নি। সংযোগ ও ফাইলের তথ্য পরীক্ষা করে আবার চেষ্টা করুন।'},{status:503})}
}
