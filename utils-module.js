export const STORAGE_KEY = 'tml_logs_v1';

export function nowIso() {
  return new Date().toISOString();
}

export function shortSelector(el) {
  if (!el) return null;
  const tag = el.tagName ? el.tagName.toLowerCase() : 'node';
  const id = el.id ? `#${el.id}` : '';
  const cls = (el.className && typeof el.className === 'string')
    ? '.' + el.className.trim().split(/\s+/).slice(0, 3).join('.')
    : '';
  return `${tag}${id}${cls}`;
}

export function redactValue(inputEl, raw) {
  const t = (inputEl?.type || '').toLowerCase();
  const name = (inputEl?.name || '').toLowerCase();
  const ac = (inputEl?.autocomplete || '').toLowerCase();
  const sensitiveTypes = ['password', 'tel'];
  const sensitiveHints = ['cc', 'card', 'cvv', 'ssn', 'aadhaar'];

  if (sensitiveTypes.includes(t)) {
    return { redacted: true, length: (raw?.length || 0) };
  }
  if (sensitiveHints.some(h => name.includes(h) || ac.includes(h))) {
    return { redacted: true, length: (raw?.length || 0) };
  }
  return {
    redacted: false,
    length: (raw?.length || 0),
    sample: raw ? String(raw).slice(0, 8) : ''
  };
}

export function toCsv(rows) {
  if (!rows?.length) return '';
  const fields = Object.keys(rows[0]);
  const esc = v => {
    const s = v == null ? '' : String(v).replaceAll('"', '""');
    return /[",\n]/.test(s) ? `"${s}"` : s;
  };
  const header = fields.join(',');
  const body = rows.map(r => fields.map(f => esc(r[f])).join(',')).join('\n');
  return header + '\n' + body;
}
