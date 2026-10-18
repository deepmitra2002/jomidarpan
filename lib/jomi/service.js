import { compareBaseline } from './database.js';
import { analyzeClaims } from './claims.js';
export const norm=v=>String(v??'').normalize('NFC').replace(/[০-৯]/g,c=>String('০১২৩৪৫৬৭৮৯'.indexOf(c))).replace(/\s+/g,' ').trim();
export function searchRecords(records,q,type='all') {
 const query=norm(q); if(!query)return [];
 const keys=['record_id','plot','khatian','deed_number'];
 const fields=keys.includes(type)?[type]:keys;
 return records.filter(r=>fields.some(k=>norm(r[k]).toLowerCase()===query.toLowerCase() || (k==='record_id' && /^\d+$/.test(query) && Number(r[k].replace('LND-',''))===Number(query))));
}
export function runComparison(values,records,selected,provenance={}) {
 const fields={...values,baseline_record_id:selected};
 const result=compareBaseline(fields,records,{confirmed:true,selectionConfirmed:true,dataset_id:'landtech-reference-v5'});
 const status=result.status==='MATCHED_WITH_DATABASE'?'verified':'unverified';
 const current=records.find(r=>r.record_id===result.record_id);
 return {...result,outcome:status,comparisons:result.comparisons.map(c=>({...c,document_source:provenance[c.field]||'পর্যালোচনায় দেওয়া তথ্য'})),claims:current?analyzeClaims({...current,...values,case_id:current.case_id},records.filter(r=>r.record_id!==current.record_id)):null};
}
export function publicCrime(reports,id) {return reports.filter(r=>r.record_id===id && r.visibility==='public_qa').map(r=>({report_id:r.report_id,record_id:r.record_id,category:r.category,status:r.status,reported_date:r.reported_date,summary:r.summary,reporting_authority:r.reporting_authority,evidence_references:r.evidence_references}));}
