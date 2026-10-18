/** Synthetic comparison only. A selected record determines scope, never legal identity. */
export const DATABASE_FIELDS=Object.freeze(['owner','previous_owner','district','upazila','mouza','survey','khatian','plot','area','unit','seller_share','deed_number','deed_date','registration_date','previous_deed','previous_deed_date','mutation_status','tax_year','tax_status','jl','classification']);
const DATASETS={'landtech-reference-v4':4,'landtech-reference-v5':5};
const normalize=value=>String(value??'').normalize('NFC').replace(/[০-৯]/g,c=>String('০১২৩৪৫৬৭৮৯'.indexOf(c))).replace(/\s+/g,' ').trim();
const present=value=>normalize(value)!=='';
const registry=['registry_office','registry_book','registry_page'];
const parcel=['district','upazila','mouza','survey','plot','khatian'];
const units={acre:43560,acres:43560,একর:43560,decimal:435.6,decimals:435.6,শতক:435.6,শতাংশ:435.6,ডেসিমেল:435.6,sqft:1,'sq ft':1,'square feet':1,'বর্গফুট':1,sqm:10.763910416709722,'square metre':10.763910416709722,'square meter':10.763910416709722,hectare:107639.10416709722};
const unitFactor=value=>units[normalize(value).toLowerCase()];
function number(value){const s=normalize(value);if(/^[+-]?\d+(?:\.\d+)?$/.test(s))return Number(s);if(/^\d+\s*\/\s*\d+$/.test(s)){const [a,b]=s.split('/').map(Number);return b>0?a/b:null}return null;}
const equalNumber=(a,b)=>a!==null&&b!==null&&Math.abs(a-b)<=1e-8*Math.max(1,Math.abs(a),Math.abs(b));
function isoDate(value){let s=normalize(value).replaceAll('/', '-');if(/^\d{2}-\d{2}-\d{4}$/.test(s)){const [d,m,y]=s.split('-');s=`${y}-${m}-${d}`}if(!/^\d{4}-\d{2}-\d{2}$/.test(s))return null;const d=new Date(`${s}T00:00:00Z`);return Number.isFinite(+d)&&d.toISOString().slice(0,10)===s?s:null;}
function equivalent(field,observed,expected,input,record){
 if(field==='area'){const a=number(observed),b=number(expected),u=unitFactor(input.unit),v=unitFactor(record.unit);return u&&v?equalNumber(a===null?null:a*u,b===null?null:b*v):normalize(input.unit)===normalize(record.unit)&&equalNumber(a,b);}
 if(field==='unit'){const u=unitFactor(observed),v=unitFactor(expected);return u&&v?u===v||equivalent('area',input.area,record.area,input,record):normalize(observed)===normalize(expected);}
 if(field==='seller_share')return equalNumber(number(observed),number(expected))||normalize(observed)===normalize(expected);
 if(field.endsWith('_date')){const a=isoDate(observed),b=isoDate(expected);return a&&b?a===b:normalize(observed)===normalize(expected);}
 return normalize(observed)===normalize(expected);
}
function candidate(record){return Object.fromEntries(['record_id','dataset_id','record_version','owner',...parcel,...registry].map(key=>[key,record[key]??null]));}
export function compareBaseline(input={},records=[],options={}){
 const data=input&&typeof input==='object'?input:{};
 const available=Array.isArray(records)?records:records?.records||[];
 const DATASET=Object.hasOwn(DATASETS,options.dataset_id)?options.dataset_id:Object.hasOwn(DATASETS,data.dataset_id)?data.dataset_id:available.find(r=>Object.hasOwn(DATASETS,r?.dataset_id))?.dataset_id||'landtech-reference-v5';
 const version=DATASETS[DATASET];
 const sourceRecords=(Array.isArray(records)?records:records?.records||[]).filter(r=>r&&r.dataset_id===DATASET&&Number(r.record_version)===version&&/^LND-\d{4}$/.test(r.record_id));
 const selected=normalize(data.baseline_record_id);
 const base={status:'INSUFFICIENT_INFORMATION',official_status:'OFFICIAL_VERIFICATION_NOT_PERFORMED',officially_verified:false,input_confirmed:options.confirmed===true,selection_confirmed:options.selectionConfirmed===true,baseline_record_id:selected||null,record_id:null,record_ids:[],dataset_id:DATASET,dataset_version:version,record_version:version,matched_fields:[],mismatched_fields:[],missing_fields:[],rules_executed:[],comparisons:[],candidates:[],selection_method:selected?'explicit_baseline_record_id':null,identity_proven:false,scope:'synthetic_baseline_comparison',timestamp:new Date().toISOString()};
 const insufficient=(reason,candidates=[])=>({...base,reason,candidates:candidates.map(candidate)});
 if(options.confirmed===false)return insufficient('INPUT_CONFIRMATION_REQUIRED');
 let candidates=[];
 if(selected){candidates=sourceRecords.filter(r=>r.record_id===selected);if(!candidates.length)return insufficient('BASELINE_RECORD_NOT_FOUND',sourceRecords);if(options.selectionConfirmed===false)return insufficient('BASELINE_SELECTION_CONFIRMATION_REQUIRED',candidates);}
 else {
  const complete=fields=>fields.every(f=>present(data[f]));
  const matching=fields=>sourceRecords.filter(r=>fields.every(f=>present(r[f])&&normalize(data[f])===normalize(r[f])));
  const registryCandidates=complete(registry)?matching(registry):[];
  const parcelCandidates=complete(parcel)?matching(parcel):[];
  if(registryCandidates.length){candidates=registryCandidates;base.selection_method='automatic_registry_anchor';}
  else if(parcelCandidates.length){candidates=parcelCandidates;base.selection_method='automatic_parcel_anchor';}
  else return insufficient('NO_UNIQUE_STRONG_ANCHOR');
 }
 if(candidates.length!==1)return insufficient('AMBIGUOUS_BASELINE',candidates);
 const record=candidates[0];
 Object.assign(base,{record_id:record.record_id,record_ids:[record.record_id],source_date:record.source_date||null,baseline_record_id:record.record_id,candidates:[candidate(record)]});
 const comparisons=DATABASE_FIELDS.map((field,index)=>{
  const observed=data[field]??null,expected=record[field]??null;
  const missing=!present(observed)||!present(expected);
  const status=missing?'MISSING':equivalent(field,observed,expected,data,record)?'MATCHED':'MISMATCHED';
  return {rule_id:`DB-${String(index+1).padStart(3,'0')}`,field,expected,database_value:expected,observed,document_value:observed,status,source:{record_id:record.record_id,dataset_id:record.dataset_id,record_version:record.record_version,field},severity:status==='MISSING'?'missing_information':status==='MISMATCHED'?'difference':'none',next:status==='MATCHED'?'Retain the source evidence.':status==='MISSING'?'Supply the missing field and compare again.':'Review the document and baseline source for this field.',explanation:status==='MATCHED'?'Supplied value agrees with this synthetic baseline field after supported normalization.':status==='MISSING'?'The document or baseline field is missing; this is a data gap, not a fraud finding.':'Supplied value differs from this synthetic baseline field; this is not a finding of fraud.'};
 });
 const matched_fields=comparisons.filter(c=>c.status==='MATCHED').map(c=>c.field),mismatched_fields=comparisons.filter(c=>c.status==='MISMATCHED').map(c=>c.field),missing_fields=comparisons.filter(c=>c.status==='MISSING').map(c=>c.field);
 return {...base,status:mismatched_fields.length||missing_fields.length?'MISMATCHED_WITH_DATABASE':'MATCHED_WITH_DATABASE',reason:null,matched_fields,mismatched_fields,missing_fields,rules_executed:comparisons.map(c=>c.rule_id),comparisons};
}

// Project the same comparator outcome into the existing report components.
// This prevents legacy snapshot lookups from becoming a second dataset verdict.
export function withDatabaseEvidence(report,database){
 const status=database.status==='MATCHED_WITH_DATABASE'?'passed':database.status==='MISMATCHED_WITH_DATABASE'?'flagged':'needs_documents';
 const explainEn=database.status==='MATCHED_WITH_DATABASE'?'Compared fields agree with the selected QA baseline. Official verification has not been performed.':database.status==='MISMATCHED_WITH_DATABASE'?'The document has different or missing fields against the selected QA baseline. Review the values and original evidence; this is not proof of fraud.':'A unique comparison scope or sufficient information is missing. Official verification has not been performed.';
 const explainBn=database.status==='MATCHED_WITH_DATABASE'?'তুলনা করা তথ্য নির্বাচিত পরীক্ষার রেকর্ডের সঙ্গে মিলেছে। সরকারি যাচাই করা হয়নি।':database.status==='MISMATCHED_WITH_DATABASE'?'নির্বাচিত পরীক্ষার রেকর্ডের সঙ্গে কিছু তথ্য ভিন্ন বা অনুপস্থিত। মান ও মূল প্রমাণ দেখুন; এটি জালিয়াতির প্রমাণ নয়।':'একক তুলনার পরিসর বা পর্যাপ্ত তথ্য পাওয়া যায়নি। সরকারি যাচাই করা হয়নি।';
 return {...report,database,reference:{database:database.dataset_id,database_version:database.dataset_version,database_size:500,reference_id:database.record_id,record_version:database.record_version,source_date:database.source_date||null,officially_verified:false,status,candidate_ids:database.record_ids||[],explanation_en:explainEn,explanation_bn:explainBn,limitations:'QA comparison only; official authentication and legal title remain unverified.',comparisons:(database.comparisons||[]).map(c=>({field:c.field,rule_id:c.rule_id,label:c.field.replaceAll('_',' '),expected:c.database_value,observed:c.document_value,status:c.status==='MATCHED'?'passed':c.status==='MISSING'?'needs_documents':'flagged',explanation:c.explanation,next_action:c.next,source:{reference_id:database.record_id,record_version:database.record_version,field:c.field,date:database.source_date||null}}))}};
}
