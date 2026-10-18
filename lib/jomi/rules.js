export const RULE_VERSION='p5-1.0';
export const truth=v=>v===true||v==='true';
export const normalize=v=>String(v??'').normalize('NFKC').replace(/[০-৯]/g,c=>String('০১২৩৪৫৬৭৮৯'.indexOf(c))).trim().replace(/\s+/g,' ').toLowerCase();
const definitions=[
['001','Owner-name comparison','মালিকের নাম তুলনা','owner','deed_owner','Confirm the recorded parties and their documented shares; similar names do not prove identity.'],
['002','Plot-number comparison','দাগ নম্বর তুলনা','plot','deed_plot','Recheck both pages and supply clarification for the plot numbers.'],
['003','Khatian-number comparison','খতিয়ান নম্বর তুলনা','khatian','deed_khatian','Confirm whether the records refer to the same khatian and survey.'],
['004','Area comparison','জমির পরিমাণ তুলনা','area','deed_area','Confirm area, unit, scope and ownership share in the source documents.'],
['005','Supporting deed','সহায়ক দলিল',null,null,'Provide the supporting deed and its reference.'],
['006','Mutation evidence','নামজারির প্রমাণ',null,null,'Provide the relevant mutation order or application status evidence.'],
['007','Document readability','নথির পাঠযোগ্যতা',null,null,'Upload a complete readable copy and confirm its pages.'],
['008','Ownership-history links','মালিকানা ইতিহাস',null,null,'Provide the missing prior deed or succession link.'],
['009','Tax receipt details','দাখিলার তথ্য',null,null,'Provide the relevant tax receipt and resolve differing plot references.'],
['010','Duplicate supplied claim','নমুনায় একই জমির দাবি',null,null,'Review overlapping claims within this dataset; no registry search was performed.'],
['011','Acquisition status','অধিগ্রহণ অবস্থা',null,null,'Obtain case-specific confirmation from the responsible acquisition office.'],
['012','Mortgage status','বন্ধকের অবস্থা',null,null,'Obtain appropriate encumbrance evidence and professional review.'],
['013','Dispute status','মামলার অবস্থা',null,null,'Obtain case-specific evidence from the relevant court or authorized source.'],
['014','Khas-land status','খাস জমির অবস্থা',null,null,'Seek authoritative confirmation from the responsible land office.'],
['015','Extracted-field confirmation','তথ্য নিশ্চিতকরণ',null,null,'Check uncertain values against the source and confirm or correct them.'],
['016','Mouza comparison','মৌজা তুলনা','mouza','deed_mouza','Clarify the mouza and jurisdiction of each supplied document.'],
['017','Deed chronology','দলিলের তারিখ',null,null,'Review the transfer chronology and provide dated evidence.'],
['018','Survey comparison','জরিপ তুলনা','survey','deed_survey','Provide documented linkage between surveys; differing survey numbers alone do not prove fraud.'],
['019','Official-verification claim','সরকারি যাচাইয়ের দাবি',null,null,'Supply independently authenticated evidence; a seller claim or screenshot is not an official API response.'],
['020','Core evidence completeness','মূল প্রমাণের পূর্ণতা',null,null,'Provide sufficient core property fields and supporting records for comparison.']
];
export const RULES=definitions.map(([n,name,bn,a,b,next_action])=>({id:`VR-${n}`,name,bn,fields:[a,b].filter(Boolean),required_inputs:[a,b].filter(Boolean),comparison:a?'Normalize and compare submitted values':'Evidence-specific rule',severity:['001','002','003','004','010'].includes(n)?'high':'medium',evidence_requirements:'Reviewed source document or explicitly labelled synthetic field',next_action,limitations:'Internal evidence comparison only; does not establish title, authenticity or absence of legal risk.'}));
export function verify(data,dataset=[],config={}){
 const checks=[];
 const add=(id,status,expected='',observed='',explanation='',sources=[])=>{const def=RULES.find(r=>r.id===id);checks.push({rule_id:id,name:def.name,bn:def.bn,dimension:Number(id.slice(3))>=11&&Number(id.slice(3))<=14||id==='VR-019'?'authoritative':['VR-005','VR-006','VR-007','VR-008','VR-015','VR-020'].includes(id)?'completeness':'consistency',status,severity:def.severity,expected:String(expected??''),observed:String(observed??''),explanation:explanation||def.name,explanation_bn:status==='flagged'?'দেওয়া তথ্যের মধ্যে অমিল পাওয়া গেছে। মূল নথি দেখে ব্যাখ্যা বা সংশোধন দিন।':status==='passed'?'প্রদত্ত তথ্যের এই তুলনায় অমিল পাওয়া যায়নি। এটি মালিকানা বা নথির সত্যতার প্রমাণ নয়।':'যাচাই অসম্পূর্ণ। প্রয়োজনীয় প্রমাণ দিন বা অনুমোদিত উৎসে নিশ্চিত করুন।',next_action:def.next_action,limitations:def.limitations,sources:sources.length?sources:[{type:truth(data.synthetic)?'synthetic_dataset':'user_confirmed_field',case_id:data.case_id,fields:def.fields}],resolution:'unresolved',automated:true});};
 for(const r of RULES.filter(r=>r.fields.length)){
  let [a,b]=r.fields,va=data[a],vb=data[b];let status=!normalize(va)||!normalize(vb)?'needs_documents':normalize(va)===normalize(vb)?'passed':'flagged';
  if(r.id==='VR-004'){
   const unit=normalize(data.unit),other=normalize(data.deed_unit||data.unit);const factors={decimal:1,acre:100,sqft:1/435.6};
   if(!factors[unit]||!factors[other])status='manual_review';
   else if(normalize(va)&&normalize(vb)){const aa=Number(normalize(va)),bb=Number(normalize(vb));status=!Number.isFinite(aa)||!Number.isFinite(bb)?'manual_review':Math.abs(aa*factors[unit]-bb*factors[other])<0.00001?'passed':'flagged';}
  }
  add(r.id,status,va,vb,status==='flagged'?`${a} and ${b} differ in the supplied evidence.`:status==='passed'?'Submitted values agree for this comparison.':'Insufficient or incomparable field values.');
 }
 add('VR-005',normalize(data.deed_number)?'passed':'needs_documents','deed reference',data.deed_number);
 add('VR-006',data.mutation_required===false||data.mutation_required==='false'?'not_applicable':truth(data.mutation_present)&&['completed','synthetic_order_supplied'].includes(normalize(data.mutation_status))?'passed':!truth(data.mutation_present)?'needs_documents':'manual_review','mutation evidence',data.mutation_status);
 add('VR-007',truth(data.readable)?'passed':'manual_review','readable complete documents',data.readable);
 add('VR-008',data.history_required===false||data.history_required==='false'?'not_applicable':truth(data.history_complete)&&normalize(data.previous_deed)?'passed':'needs_documents','linked prior deed or succession evidence',data.previous_deed);
 add('VR-009',data.tax_required===false||data.tax_required==='false'?'not_applicable':!truth(data.tax_present)?'needs_documents':!normalize(data.tax_plot)?'needs_documents':normalize(data.tax_plot)!==normalize(data.plot)?'flagged':'passed',data.plot,data.tax_plot);
 const same=dataset.filter(x=>x.case_id!==data.case_id&&normalize(x.plot)&&normalize(x.plot)===normalize(data.plot)&&['mouza','survey','district','upazila'].every(f=>normalize(x[f])===normalize(data[f])));
 add('VR-010',same.length?'flagged':'passed','no overlapping parcel claims in supplied dataset',same.map(x=>x.case_id).join(', '),'Dataset-only duplicate comparison; no external registry searched.');
 for(const [n,f]of[['011','acquisition_claim'],['012','mortgage_claim'],['013','dispute_claim'],['014','khas_claim']])add(`VR-${n}`,normalize(data[f])&&!['none','unknown','unavailable','false','not_checked'].includes(normalize(data[f]))?'manual_review':'official_unavailable','authoritative evidence',data[f]||'not provided','Not verified against an official source. Any supplied claim needs authoritative review.');
 add('VR-015',truth(data.ocr_confirmed)?'passed':'manual_review','user-confirmed source fields',data.ocr_confirmed);
 const a=String(data.deed_date||''),b=String(data.previous_deed_date||'');const dates=[a,b].every(x=>/^\d{4}-\d{2}-\d{2}$/.test(x)&&!Number.isNaN(Date.parse(x))&&new Date(x).toISOString().slice(0,10)===x);
 add('VR-017',!dates?'needs_documents':a<b?'flagged':'passed',b,a,'Compare supplied deed dates; chronological order alone does not establish validity.');
 add('VR-019',normalize(data.official_claim)&&!['false','none','not_checked','unavailable'].includes(normalize(data.official_claim))?'manual_review':'official_unavailable','authenticated official evidence',data.official_claim||'none','No official integration is configured. A user claim is not authenticated verification.');
 add('VR-020',truth(data.core_evidence_present)&&['plot','khatian','mouza','owner'].every(k=>normalize(data[k]))?'passed':'needs_documents','core property evidence',data.core_evidence_present);
 const selected=checks.map(c=>config.disabled_rules?.includes(c.rule_id)?{...c,status:'not_applicable',explanation:'Disabled by the case checklist configuration.'}:c).sort((a,b)=>a.rule_id.localeCompare(b.rule_id));
 let documents=[];try{documents=JSON.parse(data.documents_json||'[]')}catch{}
 for(const check of selected){const fields=RULES.find(x=>x.id===check.rule_id).fields;const refs=documents.filter(doc=>fields.some(field=>Object.hasOwn(doc.fields||{},field.replace(/^deed_/,'')))).map(doc=>({type:'synthetic_document_metadata',document_id:doc.id,file:doc.file,page:doc.page,document_type:doc.type,fields:doc.fields,limitation:'Synthetic document metadata; not an official record or independently authenticated upload.'}));if(refs.length)check.sources=refs;}
 const flags=selected.filter(c=>c.status==='flagged'),needs=selected.some(c=>c.status==='needs_documents'),manual=selected.some(c=>c.status==='manual_review');
 return {version:RULE_VERSION,checks:selected,flags,overall:flags.length?'Unresolved concerns':needs?'Incomplete':manual?'Review required':'Official verification pending',official_verification:'Not verified against an official source',dimensions:{consistency:selected.filter(c=>c.dimension==='consistency'),completeness:selected.filter(c=>c.dimension==='completeness'),authoritative:selected.filter(c=>c.dimension==='authoritative')}};
}
