import { getRecords, DATASET } from '@/lib/jomi/store';
import { searchRecords } from '@/lib/jomi/service.js';
export async function GET(request:Request) {
 try {const u=new URL(request.url);const q=(u.searchParams.get('q')||'').slice(0,100);const records=await getRecords();return Response.json({dataset:DATASET,count:records.length,records:searchRecords(records,q,u.searchParams.get('type')||'all')},{headers:{'Cache-Control':'no-store'}})}
 catch {return Response.json({error:'তথ্যভান্ডার এখন পাওয়া যাচ্ছে না। আবার চেষ্টা করুন।'},{status:503})}
}
