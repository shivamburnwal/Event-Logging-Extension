function send(event, data = {}) {
  console.log(`[Content] send called for event: ${event}`, data);
  chrome.runtime.sendMessage(
    { type: 'tml:event', event, data, url: location.href },
    (resp) => {
      console.log("[Content] Send response:", resp);
    }
  );
}

// Track last value for each input
const lastInputValues = new WeakMap();

window.addEventListener('focus', (e) => {
  const t = e.target;
  if (t instanceof HTMLInputElement || t instanceof HTMLTextAreaElement) {
    lastInputValues.set(t, t.value);
  }
}, true);

window.addEventListener('blur', (e) => {
  const t = e.target;
  if (t instanceof HTMLInputElement || t instanceof HTMLTextAreaElement) {
    const prev = lastInputValues.get(t);
    if (t.value !== prev) {
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
      send('input_blur', payload);
    }
  }
}, true);

// Only log keydowns for important keys
window.addEventListener('keydown', (e) => {
  const importantKeys = [
    'Enter', 'Tab', 'Escape', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight',
    'Backspace', 'Delete', 'Home', 'End', 'PageUp', 'PageDown'
  ];
  if (
    importantKeys.includes(e.key) ||
    e.ctrlKey || e.altKey || e.metaKey
  ) {
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
  }
}, true);

// Change event for select, checkbox, radio
window.addEventListener('change', (e) => {
  const t = e.target;
  if (t instanceof HTMLSelectElement || t.type === 'checkbox' || t.type === 'radio') {
    const value = t.value;
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
  }
}, true);

// Click event (keep as is, but you can filter by tag if needed)
window.addEventListener('click', (e) => {
  const t = e.target;
  // Optionally: if you want only button/link clicks, uncomment below
  // if (!['button', 'a', 'input'].includes(t.tagName?.toLowerCase())) return;
  const rect = t.getBoundingClientRect?.();
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

window.addEventListener('submit', (e) => {
  const form = e.target;
  if (form instanceof HTMLFormElement) {
    const fields = Array.from(form.elements)
      .filter(el => el.name)
      .map(el => ({
        name: el.name,
        value: window.redactValue(el, el.value).redacted ? undefined : el.value
      }));
    send('form_submit', {
      formSelector: window.shortSelector(form),
      action: form.action,
      method: form.method,
      fields,
      title: document.title,
      pageHeader: document.querySelector('h1')?.innerText || document.querySelector('header')?.innerText || ''
    });
  }
}, true);
