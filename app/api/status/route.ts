import {getRecords,DATASET} from '@/lib/jomi/store';
import {getChatGPTUser} from '@/app/chatgpt-auth';
export async function GET(){try{return Response.json({count:(await getRecords()).length,dataset:DATASET,version:5,user:(await getChatGPTUser())?.displayName||null},{headers:{'Cache-Control':'no-store'}})}catch{return Response.json({error:'ডেটাবেস সংযোগ পাওয়া যায়নি।'},{status:503})}}
