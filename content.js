function send(event, data = {}) {
  console.log(`[Content] send called for event: ${event}`, data);
  chrome.runtime.sendMessage(
    { type: 'tml:event', event, data, url: location.href },
    (resp) => {
      console.log("[Content] Send response:", resp);
    }
  );
}

// Click event
window.addEventListener('click', (e) => {
  console.log("[Content] Click event listener triggered");
  const t = e.target;
  const rect = t.getBoundingClientRect?.();
  // Try to get label text from associated <label> or aria-label
  let labelText = '';
  if (t.labels && t.labels.length) {
    labelText = Array.from(t.labels).map(l => l.innerText).join(' ');
  } else if (t.getAttribute('aria-label')) {
    labelText = t.getAttribute('aria-label');
  }
  const payload = {
    selector: window.shortSelector(t),
    tag: t?.tagName?.toLowerCase(),
    id: t?.id,
    class: t?.className,
    name: t?.name,
    type: t?.type,
    role: t?.getAttribute('role'),
    ariaLabel: t?.getAttribute('aria-label'),
    labelText,
    placeholder: t?.placeholder,
    value: t?.value,
    checked: t?.checked,
    disabled: t?.disabled,
    visible: t?.offsetParent !== null,
    bbox: rect ? { x: Math.round(rect.x), y: Math.round(rect.y), w: Math.round(rect.width), h: Math.round(rect.height) } : null,
    innerText: (t?.innerText || '').trim().slice(0, 80),
    outerHTML: t?.outerHTML?.slice(0, 200),
    parentForm: t.form ? {
      selector: window.shortSelector(t.form),
      action: t.form.action,
      method: t.form.method
    } : null,
    mouse: {
      clientX: Math.round(e.clientX),
      clientY: Math.round(e.clientY),
      button: e.button,
      ctrl: e.ctrlKey,
      alt: e.altKey,
      shift: e.shiftKey,
      meta: e.metaKey
    },
    title: document.title,
    pageHeader: document.querySelector('h1')?.innerText || document.querySelector('header')?.innerText || ''
  };
  send('click', payload);
}, true);

// Keydown event
window.addEventListener('keydown', (e) => {
  console.log("[Content] Keydown event listener triggered");
  const t = e.target;
  const payload = {
    key: e.key,
    code: e.code,
    ctrl: e.ctrlKey, alt: e.altKey, shift: e.shiftKey, meta: e.metaKey,
    target: window.shortSelector(t),
    tag: t?.tagName?.toLowerCase(),
    type: t?.type,
    id: t?.id,
    name: t?.name,
    value: t?.value,
    ariaLabel: t?.getAttribute('aria-label'),
    labelText: t.labels && t.labels.length ? Array.from(t.labels).map(l => l.innerText).join(' ') : '',
    sensitive: (t?.type || '').toLowerCase() === 'password',
    title: document.title,
    pageHeader: document.querySelector('h1')?.innerText || document.querySelector('header')?.innerText || ''
  };
  send('keydown', payload);
}, true);

// Input event
window.addEventListener('input', (e) => {
  console.log("[Content] Input event listener triggered");
  if (!(e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement)) return;
  const t = e.target;
  const info = window.redactValue(t, t.value);
  const payload = {
    target: window.shortSelector(t),
    tag: t?.tagName?.toLowerCase(),
    type: t?.type,
    id: t?.id,
    name: t?.name,
    ariaLabel: t?.getAttribute('aria-label'),
    labelText: t.labels && t.labels.length ? Array.from(t.labels).map(l => l.innerText).join(' ') : '',
    placeholder: t?.placeholder,
    title: document.title,
    pageHeader: document.querySelector('h1')?.innerText || document.querySelector('header')?.innerText || '',
    ...info
  };
  if (!info.redacted) payload.value = t.value;
  send('input', payload);
}, true);

// Change event
window.addEventListener('change', (e) => {
  console.log("[Content] Change event listener triggered");
  if (!(e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLSelectElement)) return;
  const t = e.target;
  let value = t.value;
  const info = window.redactValue(t, value);
  const payload = {
    target: window.shortSelector(t),
    tag: t?.tagName?.toLowerCase(),
    type: t?.type,
    id: t?.id,
    name: t?.name,
    ariaLabel: t?.getAttribute('aria-label'),
    labelText: t.labels && t.labels.length ? Array.from(t.labels).map(l => l.innerText).join(' ') : '',
    placeholder: t?.placeholder,
    checked: t?.checked,
    selected: t.selectedIndex,
    title: document.title,
    pageHeader: document.querySelector('h1')?.innerText || document.querySelector('header')?.innerText || '',
    ...info
  };
  if (!info.redacted) payload.value = value;
  send('change', payload);
}, true);

// Focus event
window.addEventListener('focus', (e) => {
  const t = e.target;
  send('focus', {
    target: window.shortSelector(t),
    tag: t?.tagName?.toLowerCase(),
    title: document.title,
    pageHeader: document.querySelector('h1')?.innerText || document.querySelector('header')?.innerText || ''
  });
}, true);
