import {normalize,truth} from './rules.js';
const categories=['court','acquisition','restriction'];
const keys=['id','category','reference','source_name','source_url','record_date','checked_at','status','method','district','upazila','mouza','survey','plot','khatian','document_reference','page'];
const iso=v=>/^\d{4}-\d{2}-\d{2}$/.test(v||'')&&Number.isFinite(Date.parse(v))&&new Date(v).toISOString().slice(0,10)===v;
export function validateLegalEntry(input){
 const errors=[],value={};for(const key of keys){if(input?.[key]!==undefined&&input[key]!==null)value[key]=String(input[key]).trim().slice(0,key==='source_url'?500:200);}
 if(!categories.includes(value.category))errors.push('Choose court, acquisition or restriction');
 for(const k of ['reference','source_name','method','status'])if(!value[k])errors.push('Required '+k);
 for(const k of ['record_date','checked_at'])if(value[k]&&!iso(value[k]))errors.push('Invalid '+k);
 if(value.source_url){try{if(new URL(value.source_url).protocol!=='https:')throw Error()}catch{errors.push('Use HTTPS source URL')}}
 if(value.page&&(!/^\d+$/.test(value.page)||Number(value.page)<1||Number(value.page)>20))errors.push('Invalid page');
 value.officially_authenticated=false;return {value,errors};
}
export function legalEntries(data){try{const entries=JSON.parse(data?.legal_references_json||'[]');return Array.isArray(entries)?entries.slice(0,30):[]}catch{return []}}
export function legalAnalysis(data,entries=legalEntries(data),today=new Date().toISOString().slice(0,10)){
 const records=entries.slice(0,30).map((input,i)=>{
  const {value,errors}=validateLegalEntry(input),scope=['district','upazila','mouza','survey','plot'];
  const parcel_link=scope.some(k=>!normalize(data[k])||!normalize(value[k]))?'insufficient_identifiers':scope.some(k=>normalize(data[k])!==normalize(value[k]))?'identifiers_conflict':'identifiers_match';
  const age=iso(value.checked_at)?Math.floor((Date.parse(today)-Date.parse(value.checked_at))/86400000):null;
  return {...value,id:value.id||'legal-'+i,evidence_status:truth(data.synthetic)?'synthetic':'user_supplied',officially_authenticated:false,parcel_link,freshness:age===null?'date_missing':age<0?'future_date':age>90?'outdated':'recently_recorded',input_errors:errors,matched_fields:scope.filter(k=>normalize(data[k])&&normalize(data[k])===normalize(value[k])),conflicting_fields:scope.filter(k=>normalize(data[k])&&normalize(value[k])&&normalize(data[k])!==normalize(value[k]))};
 });
 return {officially_verified:false,checked_scope:'supplied_evidence_only',freshness_policy_days:90,categories:categories.map(category=>({category,status:records.some(r=>r.category===category)?'partially_checked':'not_checked',records:records.filter(r=>r.category===category)})),records};
}
