import {getRecords} from '@/lib/jomi/store';
import reports from '@/lib/jomi/crime.json';
import {publicCrime} from '@/lib/jomi/service.js';
export async function GET(request:Request){
 const id=new URL(request.url).searchParams.get('record_id')||'';
 if(!/^LND-\d{4}$/.test(id))return Response.json({error:'প্রথমে জমির রেকর্ড বাছুন।'},{status:400});
 try{const records=await getRecords();if(!records.some(r=>r.record_id===id))return Response.json({error:'রেকর্ড পাওয়া যায়নি।'},{status:404});return Response.json({record_id:id,reports:publicCrime(reports,id),scope:'প্রদর্শনযোগ্য পরীক্ষার প্রতিবেদন; সরকারি বা পুলিশ অনুসন্ধান নয়।'},{headers:{'Cache-Control':'no-store'}})}catch{return Response.json({error:'অনুসন্ধান সম্পন্ন হয়নি। আবার চেষ্টা করুন।'},{status:503})}
}
