import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';
const require = createRequire(import.meta.url);
const wranglerRequire = createRequire(require.resolve('wrangler'));
const { Miniflare } = await import(pathToFileURL(wranglerRequire.resolve('miniflare')).href);
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {fromCSV} from '../public/ingest.js';
const mf=new Miniflare({modules:[{type:'ESModule',path:'dist/server/index.js'},...fs.readdirSync('dist/server',{recursive:true}).filter(p=>p.endsWith('.js') && p!=='index.js').map(p=>({type:'ESModule',path:'dist/server/'+p}))],compatibilityDate:'2026-05-15',compatibilityFlags:['nodejs_compat'],d1Databases:['DB'],bindings:{GEMINI_API_KEY:'test-only-secret',GEMINI_MODEL:'gemini-3.8-flash',GEMINI_BASE_URL:'https://generativelanguage.googleapis.com/v1beta'},outboundService:async()=>Response.json({candidates:[{content:{role:'model',parts:[{text:'মূল কাগজ দেখে তথ্য মিলিয়ে নিন।'}]},finishReason:'STOP'}],usageMetadata:{promptTokenCount:10,candidatesTokenCount:10,totalTokenCount:20}}),assets:{directory:'dist/client',binding:'ASSETS',routerConfig:{has_user_worker:true,invoke_user_worker_ahead_of_assets:true}},log:undefined});
try{
 const db=await mf.getD1Database('DB');for(const migration of fs.readdirSync('drizzle').filter(n=>n.endsWith('.sql')).sort())await db.exec(fs.readFileSync('drizzle/'+migration,'utf8').replace(/\n/g,' '));
 async function get(path){const r=await mf.dispatchFetch('http://test.local'+path);const body=await r.text();assert.equal(r.status,200,`${path} ${body.slice(0,300)}`);return JSON.parse(body)}
 const status=await get('/api/status');assert.equal(status.count,500);assert.equal((await get('/api/assistant')).configured,true);for(let ai=0;ai<7;ai++){const response=await mf.dispatchFetch('http://test.local/api/assistant',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({question:'খতিয়ান কী?',language:'bn'})});assert.equal(response.status,ai<6?200:429);if(ai===0)assert((await response.json()).text.includes('তথ্য'));}const cross=await mf.dispatchFetch('http://test.local/api/assistant',{method:'POST',headers:{Origin:'https://other.test'},body:JSON.stringify({question:'খতিয়ান কী?'})});assert.equal(cross.status,403);
 assert.equal((await db.prepare('SELECT COUNT(*) AS n FROM land_records').first()).n,500);
 for(const q of ['2001','২০০১'])assert.equal((await get('/api/land?q='+encodeURIComponent(q)+'&type=plot')).records[0].record_id,'LND-0001');
 assert.equal((await get('/api/land?q=99999999')).records.length,0);
 const aggregate={verified:0,unverified:0};
 for(let i=1;i<=50;i++){
  const n=String(i).padStart(3,'0'),parsed=fromCSV(fs.readFileSync(`public/downloads/csv/submission-${n}.csv`,'utf8'));
  const response=await mf.dispatchFetch('http://test.local/api/compare',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({record_id:'LND-'+String(i).padStart(4,'0'),confirmed:true,values:parsed.values,provenance:parsed.provenance})});
  assert.equal(response.status,200);const result=await response.json();assert.equal(result.outcome,i<=30?'verified':'unverified');aggregate[result.outcome]++;
 }
 assert.equal((await get('/api/crime?record_id=LND-0001')).reports.length,1);
 const restricted=await get('/api/crime?record_id=LND-0005');assert.equal(restricted.reports.length,0);assert(!JSON.stringify(restricted).includes('CRQA-005'));
 const invalid=await mf.dispatchFetch('http://test.local/api/compare',{method:'POST',body:JSON.stringify({confirmed:false})});assert.equal(invalid.status,400);
 await db.prepare('DELETE FROM land_records WHERE id = ?').bind('LND-0500').run();
 assert.equal((await mf.dispatchFetch('http://test.local/api/status')).status,503);
 console.log(JSON.stringify({server_tests:'passed',d1_records:500,search:'English/Bangla digits, missing',compare_api:aggregate,private_crime:'not exposed',partial_database:'fails closed',validation:'400 for missing confirmation'}));
}catch(error){console.error(error);process.exitCode=1}finally{await mf.dispose();process.exit(process.exitCode||0)}
