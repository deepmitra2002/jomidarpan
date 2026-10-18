import {normalize} from './rules.js';
const scope=['district','upazila','mouza','survey','plot'];
const date=v=>/^\d{4}-\d{2}-\d{2}$/.test(v||'')&&Number.isFinite(Date.parse(v))&&new Date(v).toISOString().slice(0,10)===v?v:null;
const units={decimal:1,acre:100,sqft:1/435.6};
const str=v=>String(v??'');
function fraction(v){const s=normalize(v),m=/^(\d+)\s*\/\s*(\d+)$/.exec(s);const n=m?Number(m[1])/Number(m[2]):s?Number(s):NaN;return Number.isFinite(n)&&n>0&&n<=1?n:null;}
function evidence(p,fields){let docs=[];try{docs=JSON.parse(p.documents_json||'[]')}catch{}return (Array.isArray(docs)?docs:[]).filter(d=>d&&typeof d==='object'&&fields.some(f=>Object.hasOwn(d.fields||{},f)||Object.hasOwn(d.fields||{},f.replace(/^deed_/,'')))).slice(0,20).map(d=>({case_id:str(p.case_id),document_id:str(d.id),file:str(d.file),page:Number.isInteger(Number(d.page))&&Number(d.page)>0?Number(d.page):null,document_type:str(d.type),fields:fields.filter(f=>Object.hasOwn(d.fields||{},f)||Object.hasOwn(d.fields||{},f.replace(/^deed_/,''))),type:'supplied_document_metadata'}));}
function detail(p){const share=fraction(p.seller_share),total=Number(normalize(p.total_area)),offered=Number(normalize(p.offered_area)),tu=normalize(p.total_unit||p.unit),ou=normalize(p.offered_unit||p.unit);const comparable=share!==null&&normalize(p.total_area)&&normalize(p.offered_area)&&total>0&&offered>=0&&units[tu]&&units[ou]&&Number.isFinite(total)&&Number.isFinite(offered);return {share:str(p.seller_share),total_area:str(p.total_area),offered_area:str(p.offered_area),unit:str(p.unit),total_unit:tu,offered_unit:ou,documented_area:comparable?total*share:null,area_status:comparable?(offered*units[ou]>total*share*units[tu]+0.00001?'exceeds_share':'within_supplied_share'):'insufficient_evidence',evidence_refs:evidence(p,['deed_number','deed_date','plot','mouza','survey','khatian','seller_share','total_area','offered_area'])};}
function structured(f,records,matched,conflicting){const fields=[...new Set([...matched,...conflicting])];return {...f,rule_id:`P3-${f.code.toUpperCase().replaceAll('_','-')}`,matched_fields:matched,conflicting_fields:conflicting,evidence_refs:records.flatMap(p=>evidence(p,fields)),dataset:'Supplied matching-parcel submissions only; no government registry search.',evidence_strength:'Supplied fields and document metadata; not independently authenticated.',explanation:({area_exceeds_share:'The offered area exceeds total area multiplied by the supplied seller share in comparable known units.',parcel_evidence_mismatch:'Parcel identifiers disagree between the supplied record and deed fields.',potential_share_overlap:'Two unlinked claims explicitly describe the full parcel and their supplied shares may overlap. Co-ownership, partition and lawful transfers require source review.'})[f.code]||'Comparison of supplied parcel identifiers, deed references, parties and chronology; no fraud probability or legal entitlement is inferred.',next_action:'Review the referenced source pages, confirm party roles, scope and shares, and obtain the complete dated transfer chain.'};}
// Findings describe supplied claims, never legal entitlement or intentional fraud.
export function analyzeClaims(data,peers=[]){
 const missing=scope.filter(k=>!normalize(data[k]));
 if(missing.length)return {status:'incomplete',missing,claims:[],findings:[],compared:peers.length};
 const rows=[data,...peers.filter(p=>p.case_id!==data.case_id)].filter(p=>scope.every(k=>normalize(p[k])===normalize(data[k])));
 const claims=rows.map(p=>({case_id:String(p.case_id||''),party:String(p.deed_owner||p.owner||''),deed:String(p.deed_number||''),date:date(p.deed_date),previous_deed:String(p.previous_deed||''),previous_date:String(p.previous_deed_date||''),...detail(p)})).sort((a,b)=>(a.date||'9999').localeCompare(b.date||'9999')||a.case_id.localeCompare(b.case_id));
 const current=claims.find(c=>c.case_id===String(data.case_id||''));
 const validEdge=(from,to)=>from.date&&to.date&&to.date>from.date&&(!to.previous_date||date(to.previous_date)===from.date);
 const linked=(start,end)=>{
  const seen=new Set();const visit=node=>{if(node===end)return true;if(seen.has(node))return false;seen.add(node);return claims.some(next=>validEdge(node,next)&&normalize(next.previous_deed)===normalize(node.deed)&&normalize(node.deed)&&visit(next));};return visit(start);
 };
 const findings=claims.filter(c=>c!==current).map(other=>{
  let code;
  if(!normalize(current.deed)||!normalize(other.deed)||!normalize(current.party)||!normalize(other.party))code='incomplete_claim';
  else if(normalize(current.deed)===normalize(other.deed))code=normalize(current.party)===normalize(other.party)?'repeated_submission':'deed_party_conflict';
  else if(!current.date||!other.date)code='incomplete_claim';
  else {
   const link=normalize(other.previous_deed)===normalize(current.deed)?[current,other]:normalize(current.previous_deed)===normalize(other.deed)?[other,current]:null;
   code=link?(validEdge(link[0],link[1])?'linked_transfer':'chronology_conflict'):(linked(current,other)||linked(other,current)?'linked_transfer':'unlinked_claim');
  }
  return structured({code,case_id:other.case_id,deeds:[current.deed,other.deed],parties:[current.party,other.party],dates:[current.date,other.date]},[data,rows.find(p=>str(p.case_id)===other.case_id)],scope.concat(code==='repeated_submission'?['deed_number','deed_owner']:[]),code==='deed_party_conflict'?['deed_owner']:code==='chronology_conflict'?['deed_date','previous_deed_date']:[]);
 });
 for(const p of rows){const c=claims.find(c=>c.case_id===str(p.case_id));
  if(c.area_status==='exceeds_share')findings.push(structured({code:'area_exceeds_share',case_id:c.case_id,deeds:[c.deed],parties:[c.party],dates:[c.date]},[p],scope,['seller_share','offered_area','total_area']));
  const conflicts=['plot','mouza','survey','khatian'].filter(k=>normalize(p[k])&&normalize(p[`deed_${k}`])&&normalize(p[k])!==normalize(p[`deed_${k}`]));
  if(conflicts.length)findings.push(structured({code:'parcel_evidence_mismatch',case_id:c.case_id,deeds:[c.deed],parties:[c.party],dates:[c.date]},[p],scope.filter(k=>!conflicts.includes(k)),conflicts.flatMap(k=>[k,`deed_${k}`])));
 }
 for(const other of claims.filter(c=>c!==current)){
  const p=rows.find(p=>str(p.case_id)===other.case_id),base=findings.find(f=>f.case_id===other.case_id);
  const full=p=>['full_parcel','whole_parcel'].includes(normalize(p.claim_scope));
  if(full(data)&&full(p)&&fraction(data.seller_share)!==null&&fraction(p.seller_share)!==null&&fraction(data.seller_share)+fraction(p.seller_share)>1&&base?.code==='unlinked_claim')findings.push(structured({code:'potential_share_overlap',case_id:other.case_id,deeds:[current.deed,other.deed],parties:[current.party,other.party],dates:[current.date,other.date]},[data,p],scope.concat('claim_scope'),['seller_share']));
 }
 return {parcel:Object.fromEntries(scope.map(k=>[k,str(data[k])])),status:findings.some(f=>['deed_party_conflict','chronology_conflict','unlinked_claim','area_exceeds_share','parcel_evidence_mismatch','potential_share_overlap'].includes(f.code))?'review':findings.some(f=>f.code==='incomplete_claim')?'incomplete':'no_unresolved_link',missing:[],claims,findings,compared:peers.length};
}
