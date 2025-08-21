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
  const columns = [
    'ts', 'event', 'url', 'title', 'pageHeader',
    'selector', 'tag', 'id', 'class', 'name', 'type', 'role', 'ariaLabel', 'labelText', 'placeholder',
    'value', 'checked', 'disabled', 'visible',
    'sample', 'length', 'redacted',
    'innerText', 'outerHTML',
    'formSelector', 'formAction', 'formMethod',
    'mouse_clientX', 'mouse_clientY', 'mouse_button', 'mouse_ctrl', 'mouse_alt', 'mouse_shift', 'mouse_meta',
    'bbox_x', 'bbox_y', 'bbox_w', 'bbox_h',
    'selected', 'sensitive'
  ];

  function flatten(row) {
    const merged = { ...row, ...(row.data || {}) };

    return {
      ...merged,
      formSelector: merged.parentForm?.selector ?? '',
      formAction: merged.parentForm?.action ?? '',
      formMethod: merged.parentForm?.method ?? '',
      mouse_clientX: merged.mouse?.clientX ?? '',
      mouse_clientY: merged.mouse?.clientY ?? '',
      mouse_button: merged.mouse?.button ?? '',
      mouse_ctrl: merged.mouse?.ctrl ?? '',
      mouse_alt: merged.mouse?.alt ?? '',
      mouse_shift: merged.mouse?.shift ?? '',
      mouse_meta: merged.mouse?.meta ?? '',
      bbox_x: merged.bbox?.x ?? '',
      bbox_y: merged.bbox?.y ?? '',
      bbox_w: merged.bbox?.w ?? '',
      bbox_h: merged.bbox?.h ?? ''
    };
  }

  const esc = v => {
    const s = v == null ? '' : String(v).replaceAll('"', '""');
    return /[",\n]/.test(s) ? `"${s}"` : s;
  };

  const header = columns.join(',');
  const body = rows.map(r => {
    const flat = flatten(r);
    return columns.map(f => esc(flat[f])).join(',');
  }).join('\n');
  return header + '\n' + body;
}
