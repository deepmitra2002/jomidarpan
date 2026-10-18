import {env} from 'cloudflare:workers';
import {answerQuestion,cleanQuestion,safeSummary,providerError} from '@/lib/ai/assistant';
export async function GET(){return Response.json({configured:!!env.GEMINI_API_KEY,provider:'Google Gemini'},{headers:{'Cache-Control':'no-store'}})}
export async function POST(request:Request){
 const headers={'Cache-Control':'no-store'};
 const origin=request.headers.get('origin');if(origin && origin!==new URL(request.url).origin)return Response.json({error:'এই অ্যাপ থেকেই প্রশ্ন পাঠান।'},{status:403,headers});
 let question,body;
 try{const raw=await request.text();if(raw.length>6000)throw new Error('INVALID_QUESTION');body=JSON.parse(raw);question=cleanQuestion(body.question)}catch(error){return Response.json({error:(error as Error).message==='PRIVATE_INPUT'?'পরিচয় নম্বর, ফোন বা ইমেইল বাদ দিয়ে সাধারণ প্রশ্ন করুন।':'৩ থেকে ৮০০ অক্ষরের মধ্যে একটি প্রশ্ন লিখুন।'},{status:400,headers})}
 if(!env.GEMINI_API_KEY || !env.DB)return Response.json({error:'AI সংযোগ এখন প্রস্তুত নয়। সাধারণ নির্দেশনা পড়তে পারেন।',code:'NOT_CONFIGURED'},{status:503,headers});
 try{
  const now=Date.now(),minute=Math.floor(now/60000),day=Math.floor(now/86400000);
  const ip=request.headers.get('cf-connecting-ip')||'anonymous';
  const hash=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(ip+'|'+day)))).map(b=>b.toString(16).padStart(2,'0')).join('');
  const take=async(bucket:string,limit:number,expires:number)=>{const row=await env.DB!.prepare('INSERT INTO ai_usage (bucket,count,expires) VALUES (?,1,?) ON CONFLICT(bucket) DO UPDATE SET count=count+1 WHERE count<? RETURNING count').bind(bucket,expires,limit).first();return !!row};
  if(!await take('m:'+hash+':'+minute,6,now+120000) || !await take('d:'+day,150,now+172800000))return Response.json({error:'এখন প্রশ্নের সীমা পূর্ণ হয়েছে। একটু পরে চেষ্টা করুন।',code:'RATE_LIMIT'},{status:429,headers});
  await env.DB.prepare('DELETE FROM ai_usage WHERE expires < ?').bind(now).run();
  const text=await answerQuestion({key:env.GEMINI_API_KEY,model:env.GEMINI_MODEL||'gemini-3.8-flash',baseURL:env.GEMINI_BASE_URL||'https://generativelanguage.googleapis.com/v1beta'},question,body.language==='en'?'en':'bn',safeSummary(body.summary));
  return Response.json({text,provider:'Google Gemini',notice:'AI ব্যাখ্যা; ডেটাবেসের সিদ্ধান্ত পরিবর্তন করে না।'},{headers});
 }catch(error){const issue=providerError(error);console.warn('assistant_request_failed',issue.code,{provider_status:(error as {statusCode?:number})?.statusCode||null});return Response.json({error:issue.message,code:issue.code},{status:issue.status,headers})}
}
