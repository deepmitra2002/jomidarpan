// Label-based candidates only. No legal inference or model confidence is generated.
const labels = {
  owner: ['owner', 'Recorded owner', 'মালিক'],
  previous_owner: ['previous_owner', 'Previous owner', 'পূর্ববর্তী মালিক'],
  district: ['district', 'জেলা'],
  upazila: ['upazila', 'উপজেলা'],
  mouza: ['mouza', 'মৌজা'],
  survey: ['survey', 'জরিপ'],
  khatian: ['khatian', 'Khatian number', 'খতিয়ান নম্বর', 'খতিয়ান নম্বর'],
  plot: ['plot', 'Plot number', 'দাগ নম্বর'],
  area: ['area', 'জমির পরিমাণ'],
  unit: ['unit', 'একক'],
  seller_share: ['seller_share', 'Share', 'Seller share', 'অংশ'],
  deed_number: ['deed_number', 'Deed number', 'দলিল নম্বর'],
  deed_date: ['deed_date', 'Deed date', 'দলিলের তারিখ'],
  registration_date: ['registration_date', 'Registration date', 'নিবন্ধনের তারিখ'],
  previous_deed: ['previous_deed', 'Previous deed', 'পূর্বের দলিল'],
  previous_deed_date: ['previous_deed_date', 'Previous deed date', 'পূর্বের দলিলের তারিখ'],
  mutation_status: ['mutation_status', 'Mutation status', 'নামজারির অবস্থা'],
  tax_year: ['tax_year', 'Tax year', 'কর বছর'],
  tax_status: ['tax_status', 'Tax status', 'করের অবস্থা'],
  jl: ['jl', 'JL number', 'জে এল নম্বর'],
  classification: ['classification', 'শ্রেণি'],
  registry_office: ['registry_office', 'Registry office', 'রেজিস্ট্রি অফিস'],
  registry_book: ['registry_book', 'Registry book', 'রেজিস্ট্রি বই'],
  registry_page: ['registry_page', 'Registry page', 'রেজিস্ট্রি পৃষ্ঠা'],
  baseline_record_id: ['baseline_record_id', 'Database reference'],
};
// Keep the original fixture's explicit machine labels, without inferring prose.
for (const key of ['division', 'total_area', 'offered_area', 'ownership_share', 'mutation_required', 'mutation_present', 'history_required', 'history_complete', 'tax_required', 'tax_present', 'tax_plot', 'readable', 'core_evidence_present', 'dispute_claim', 'acquisition_claim', 'mortgage_claim', 'khas_claim', 'official_claim']) labels[key] = [key];

const escapeRegex = value => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const allLabels = new Set(Object.values(labels).flat().map(label => label.toLowerCase()));
const labeledValue = new RegExp('^(?:' + [...allLabels].map(escapeRegex).join('|') + ')[ \t]*[:：]', 'i');
const numericFields = new Set(['plot', 'khatian', 'deed_plot', 'deed_khatian', 'area', 'deed_area', 'total_area', 'offered_area', 'deed_number', 'previous_deed', 'tax_plot', 'deed_date', 'previous_deed_date', 'registration_date', 'seller_share', 'tax_year', 'jl', 'registry_book', 'registry_page']);

export function extractFields(pages) {
  const out = [];
  for (const p of pages) {
    const text = String(p.text || '').replace(/\r\n?/g, '\n');
    const type = text.match(/(?:^|\n)[ \t]*document_type[ \t]*(?:[:：][ \t]*|\n[ \t]*|[ \t]{2,})(khatian|deed|mutation|tax|history)\b/i)?.[1]?.toLowerCase();
    for (const [field, names] of Object.entries(labels)) {
      let match;
      for (const label of names) {
        // A label must occupy the start of a line and have an explicit separator.
        // Values are confined to one source line; blank fields cannot consume the next label.
        match = text.match(new RegExp('(?:^|\\n)[ \\t]*' + escapeRegex(label) + '[ \\t]*(?:[:：][ \\t]*|\\n[ \\t]*|[ \\t]{2,})([^\\n]+)', 'i'));
        if (match && !allLabels.has(match[1].trim().replace(/[:：]$/, '').toLowerCase()) && !labeledValue.test(match[1].trim())) break;
        match = undefined;
      }
      if (!match) continue;
      let target = field;
      if (type === 'deed' && ['owner', 'plot', 'khatian', 'area', 'mouza', 'survey', 'unit'].includes(field)) target = 'deed_' + field;
      if (type === 'history' && field === 'deed_number') target = 'previous_deed';
      else if (type === 'history' && field === 'deed_date') target = 'previous_deed_date';
      else if (type === 'history') continue;
      else if (type === 'tax') {
        if (field === 'plot') target = 'tax_plot';
        else continue;
      } else if (type === 'mutation') continue;
      const original = match[1].trim().slice(0, 200);
      if (!original) continue;
      let candidate = original.replace(/\s+/g, ' ');
      if (numericFields.has(target)) candidate = candidate.replace(/[০-৯]/g, c => String('০১২৩৪৫৬৭৮৯'.indexOf(c)));
      if (/date$/.test(target) && /^\d{4}\/\d{2}\/\d{2}$/.test(candidate)) candidate = candidate.replaceAll('/', '-');
      out.push({field: target, original_value: original, extracted_value: candidate, corrected_value: candidate, page: p.page, method: p.method, confidence: null, confidence_label: 'unconfirmed_label_candidate', review_status: 'unconfirmed'});
    }
  }
  return out;
}
