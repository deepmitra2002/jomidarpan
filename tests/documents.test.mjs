import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {fields,fromCSV,fromPages,pdfLines} from '../public/ingest.js';
import {runComparison,searchRecords,publicCrime} from '../lib/jomi/service.js';
const records=JSON.parse(fs.readFileSync(new URL('../lib/jomi/reference.json',import.meta.url)));
const crime=JSON.parse(fs.readFileSync(new URL('../lib/jomi/crime.json',import.meta.url)));
const pdfjs=await import('../public/vendor/pdf.min.mjs');pdfjs.GlobalWorkerOptions.workerSrc=new URL('../public/vendor/pdf.worker.min.mjs',import.meta.url).href;
const outcomes=[];
test('All 100 submitted files extract and compare; paired field evidence agrees',async()=>{
 assert.equal(records.length,500);let goodPdf=0,goodCsv=0;
 for(let i=1;i<=50;i++){
  const n=String(i).padStart(3,'0'),expected=i<=30?'verified':'unverified';
  const csv=fromCSV(fs.readFileSync(new URL(`../public/downloads/csv/submission-${n}.csv`,import.meta.url),'utf8'));
  const doc=await pdfjs.getDocument({data:new Uint8Array(fs.readFileSync(new URL(`../public/downloads/pdf/submission-${n}.pdf`,import.meta.url))),verbosity:0,disableFontFace:true,useSystemFonts:true}).promise;
  const pages=[];for(let p=1;p<=doc.numPages;p++)pages.push({page:p,text:pdfLines((await(await doc.getPage(p)).getTextContent()).items),method:'text-layer'});
  const pdf=fromPages(pages);await doc.destroy();
  const id='LND-'+String(i).padStart(4,'0');
  const a=runComparison(csv.values,records,id,csv.provenance),b=runComparison(pdf.values,records,id,pdf.provenance);
  assert.equal(a.outcome,expected,`CSV ${n}`);assert.equal(b.outcome,expected,`PDF ${n}`);
  for(const k of fields)assert.equal(b.comparisons.find(c=>c.field===k).status,a.comparisons.find(c=>c.field===k).status,`${n} ${k}: PDF=${pdf.values[k]} CSV=${csv.values[k]}`);
  if(a.outcome==='verified')goodCsv++;if(b.outcome==='verified')goodPdf++;
  outcomes.push({submission:n,reference:id,csv:a.outcome,pdf:b.outcome,matched:a.matched_fields.length,different:a.mismatched_fields,missing:a.missing_fields});
 }
 assert.equal(goodPdf,30);assert.equal(goodCsv,30);
 fs.writeFileSync(new URL('../public/downloads/test-report.json',import.meta.url),JSON.stringify({project:'জমিদর্পণ',tested_at:new Date().toISOString(),reference_count:500,test_method:'Actual PDF.js extraction, shared CSV parser and application comparison service; isolated Node environment. Hosted browser uploads not tested.',pdf:{verified:goodPdf,unverified:50-goodPdf},csv:{verified:goodCsv,unverified:50-goodCsv},cases:outcomes},null,2));
});
test('Search identifiers, Bangla digits, ambiguity and no results',()=>{
 assert.equal(searchRecords(records,'২০০১','plot')[0].record_id,'LND-0001');
 assert.equal(searchRecords(records,'LND-0001')[0].plot,'2001');
 assert.equal(searchRecords(records,'১০০১','khatian')[0].record_id,'LND-0001');
 assert.equal(searchRecords(records,'40001','deed_number')[0].record_id,'LND-0001');
 assert.equal(searchRecords(records,'999999999').length,0);
 assert.equal(searchRecords([...records,{...records[0],record_id:'OTHER'}],'2001','plot').length,2);
 assert.equal(searchRecords(records,'').length,0);
});
test('Changing file values changes outcome; expected metadata cannot override it',()=>{
 const x={...records[0],baseline_record_id:'LND-0001',expected_status:'MATCHED_WITH_DATABASE',owner:'Different Name'};
 assert.equal(runComparison(x,records,'LND-0001').outcome,'unverified');
 x.owner=records[0].owner;assert.equal(runComparison(x,records,'LND-0001').outcome,'verified');
 delete x.tax_year;assert.equal(runComparison(x,records,'LND-0001').outcome,'unverified');
 assert.equal(runComparison(x,records,'unknown').outcome,'unverified');
 assert.equal(runComparison({},records,'LND-0001').outcome,'unverified');assert.equal(runComparison({},records,'LND-0001').missing_fields.length,21);
 const v={...records[0],plot:'২০০১',area:'11.250',seller_share:'1/1'};
 assert.equal(runComparison(v,records,'LND-0001').outcome,'verified');
});
test('Crime result reveals public reports only',()=>{
 assert.equal(publicCrime(crime,'LND-0001').length,1);
 assert.equal(publicCrime(crime,'LND-0005').length,0);
 assert.equal(publicCrime(crime,'LND-0499').length,0);
 assert(!JSON.stringify(publicCrime(crime,'LND-0005')).includes('CRQA-005'));
});
test('Invalid CSV and multiple records are rejected',()=>{
 assert.throws(()=>fromCSV('a,b\n1,2'));
 assert.throws(()=>fromCSV('owner,plot\na,1\nb,2'));
 assert.throws(()=>fromCSV('owner,owner\na,b'));
 assert.throws(()=>fromCSV('owner,plot\n"unclosed,2'));
});
