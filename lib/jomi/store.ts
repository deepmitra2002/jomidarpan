import { env } from 'cloudflare:workers';
import source from './reference.json';
export const DATASET = 'landtech-reference-v5';
export async function getRecords(): Promise<Record<string,string>[]> {
 const db=env.DB;
 if(!db) throw new Error('Reference database is unavailable. Please try again later.');
 let rows=await db.prepare('SELECT data FROM land_records WHERE dataset = ? ORDER BY id').bind(DATASET).all<{data:string}>();
 if(rows.results.length===0) {
  // Idempotent data initialization, separate from schema migrations. No submitted files are stored.
  for(let i=0;i<source.length;i+=50) await db.batch(source.slice(i,i+50).map(r=>db.prepare('INSERT OR IGNORE INTO land_records (id,dataset,data) VALUES (?,?,?)').bind(r.record_id,DATASET,JSON.stringify(r))));
  rows=await db.prepare('SELECT data FROM land_records WHERE dataset = ? ORDER BY id').bind(DATASET).all<{data:string}>();
 }
 if(rows.results.length!==500) throw new Error('Reference database is incomplete; comparison is paused.');
 return rows.results.map(r=>JSON.parse(r.data));
}
