const STORAGE_KEY = 'tml_logs_v1';

function nowIso() {
  return new Date().toISOString();
}

function shortSelector(el) {
  if (!el) return null;
  const tag = el.tagName ? el.tagName.toLowerCase() : 'node';
  const id = el.id ? `#${el.id}` : '';
  const cls = (el.className && typeof el.className === 'string')
    ? '.' + el.className.trim().split(/\s+/).slice(0, 3).join('.')
    : '';
  return `${tag}${id}${cls}`;
}

function redactValue(inputEl, raw) {
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

function toCsv(rows) {
  // Flatten all rows first
  const flattenedData = rows.map(item => flattenObject(item));

  // Collect all unique headers
  const headers = Array.from(
    new Set(flattenedData.flatMap(obj => Object.keys(obj)))
  );

  const csvRows = [headers.join(",")]; // first row is headers

  for (const obj of flattenedData) {
    const row = headers.map(h => {
      const val = obj[h] !== undefined ? obj[h] : "";
      if (typeof val === "string" && (val.includes(",") || val.includes("\"") || val.includes("\n"))) {
        return `"${val.replace(/"/g, '""')}"`;
      }
      return val;
    });
    csvRows.push(row.join(","));
  }

  return csvRows.join("\n");
}

function flattenObject(obj, parentKey = '', res = {}) {
  for (let key in obj) {
    if (!obj.hasOwnProperty(key)) continue;
    const propName = parentKey ? `${parentKey}.${key}` : key;

    if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
      flattenObject(obj[key], propName, res);
    } else if (Array.isArray(obj[key])) {
      obj[key].forEach((item, index) => {
        if (typeof item === 'object' && item !== null) {
          flattenObject(item, `${propName}[${index}]`, res);
        } else {
          res[`${propName}[${index}]`] = item;
        }
      });
    } else {
      res[propName] = obj[key];
    }
  }
  return res;
}
