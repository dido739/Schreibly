export const countWords = (md = '') =>
  md.split(/\s+/).filter((w) => /[\p{L}\p{N}]/u.test(w)).length;

/** Level 1–2 headings (outside code fences) = chapters. Order matches the rendered DOM. */
export function parseChapters(md = '') {
  const out = [];
  let fence = false;
  for (const line of md.split('\n')) {
    if (/^\s*(```|~~~)/.test(line)) {
      fence = !fence;
      continue;
    }
    if (fence) continue;
    const m = /^(#{1,2})\s+(.+?)\s*#*\s*$/.exec(line);
    if (m) out.push({ level: m[1].length, title: m[2] });
  }
  return out;
}

const slug = (s) =>
  (s || 'document')
    .trim()
    .replace(/[\\/:*?"<>|]+/g, '')
    .replace(/\s+/g, '-')
    .slice(0, 80) || 'document';

export function download(filename, text, mime) {
  const url = URL.createObjectURL(new Blob([text], { type: `${mime};charset=utf-8` }));
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export const exportMarkdown = (title, md) => download(`${slug(title)}.md`, md, 'text/markdown');

export function exportHTML(title, bodyHtml) {
  const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');
  const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(title || 'Document')}</title>
<style>
  body{max-width:42rem;margin:3rem auto;padding:0 1.25rem;font:18px/1.8 Georgia,'Times New Roman',serif;color:#2b2b2b}
  h1,h2,h3{line-height:1.3} img{max-width:100%} blockquote{margin-left:0;padding-left:1rem;border-left:3px solid #ccc;color:#555}
  pre,code{background:#f3f3f3;border-radius:4px} pre{padding:1rem;overflow:auto} code{padding:.1em .3em}
  table{border-collapse:collapse} td,th{border:1px solid #ccc;padding:.3rem .6rem}
</style></head><body>
<h1>${esc(title || 'Document')}</h1>
${bodyHtml}
</body></html>`;
  download(`${slug(title)}.html`, html, 'text/html');
}
