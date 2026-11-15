/**
 * pdf.js - tiny dependency-free PDF writer used by the capacity-history export (UC-2, FR-6).
 * Purpose: produce a valid text-only PDF (Helvetica, A4-like pages) without adding a library in Part 1.
 * Owner: Hoang Pham (UC-2).
 */
const esc = (s) => String(s).replace(/[^\x20-\x7e]/g, '?').replace(/[\\()]/g, '\\$&');

/** @returns {Uint8Array} bytes of a PDF whose pages hold `title` and then one text line per entry of `lines`. */
export function buildPdf(title, lines, linesPerPage = 40) {
  const pages = [];
  for (let i = 0; i < Math.max(lines.length, 1); i += linesPerPage) pages.push(lines.slice(i, i + linesPerPage));
  const objects = []; // index = object number - 1
  const add = (body) => objects.push(body) && objects.length;
  const catalog = add('');
  const pagesObj = add('');
  const font = add('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>');
  const pageIds = pages.map((chunk, p) => {
    const text = [`BT /F1 14 Tf 50 790 Td 18 TL (${esc(title)}${pages.length > 1 ? ` - page ${p + 1}` : ''}) Tj ET`];
    text.push('BT /F1 10 Tf 50 765 Td 14 TL');
    chunk.forEach((l, i) => text.push(`${i === 0 ? '' : 'T* '}(${esc(l)}) Tj`));
    text.push('ET');
    const stream = text.join('\n');
    const content = add(`<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`);
    return add(`<< /Type /Page /Parent ${pagesObj} 0 R /MediaBox [0 0 595 842] /Contents ${content} 0 R /Resources << /Font << /F1 ${font} 0 R >> >> >>`);
  });
  objects[catalog - 1] = `<< /Type /Catalog /Pages ${pagesObj} 0 R >>`;
  objects[pagesObj - 1] = `<< /Type /Pages /Kids [${pageIds.map((id) => `${id} 0 R`).join(' ')}] /Count ${pageIds.length} >>`;
  let out = '%PDF-1.4\n';
  const offsets = [];
  objects.forEach((body, i) => { offsets.push(out.length); out += `${i + 1} 0 obj\n${body}\nendobj\n`; });
  const xref = out.length;
  out += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  offsets.forEach((o) => { out += `${String(o).padStart(10, '0')} 00000 n \n`; });
  out += `trailer\n<< /Size ${objects.length + 1} /Root ${catalog} 0 R >>\nstartxref\n${xref}\n%%EOF\n`;
  return new TextEncoder().encode(out);
}
