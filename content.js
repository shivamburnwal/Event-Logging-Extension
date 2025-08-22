function send(event, data = {}) {
  console.log(`[Content] send called for event: ${event}`, data);
  chrome.runtime.sendMessage(
    { type: 'tml:event', event, data, url: location.href },
    () => {}
  );
}

// Track last value for each input
const lastInputValues = new WeakMap();

window.addEventListener('focus', (e) => {
  const t = e.target;
  if (t instanceof HTMLInputElement || t instanceof HTMLTextAreaElement) {
    lastInputValues.set(t, t.value);
    console.log('[Content] Focus event:', t, 'Initial value:', t.value);
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
      console.log('[Content] Blur event:', t, 'Previous value:', prev, 'New value:', t.value, 'Payload:', payload);
      send('input_blur', payload);
    } else {
      console.log('[Content] Blur event: value unchanged for', t);
    }
  }
}, true);

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
    console.log('[Content] Keydown event:', e.key, payload);
    send('keydown', payload);
  }
}, true);

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
    console.log('[Content] Change event:', t, payload);
    send('change', payload);
  }
}, true);

window.addEventListener('click', (e) => {
  const t = e.target;
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
  console.log('[Content] Click event:', t, payload);
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
    const payload = {
      formSelector: window.shortSelector(form),
      action: form.action,
      method: form.method,
      fields,
      title: document.title,
      pageHeader: document.querySelector('h1')?.innerText || document.querySelector('header')?.innerText || ''
    };
    console.log('[Content] Submit event:', form, payload);
    send('form_submit', payload);
  }
}, true);

// Clipboard events
['copy', 'paste', 'cut'].forEach(evt => {
  window.addEventListener(evt, (e) => {
    const payload = {
      url: location.href,
      title: document.title,
      target: window.shortSelector(e.target),
      pageHeader: document.querySelector('h1')?.innerText || document.querySelector('header')?.innerText || ''
    };
    console.log(`[Content] Clipboard event: ${evt}`, e.target, payload);
    send('clipboard_' + evt, payload);
  }, true);
});

// Drag & drop
window.addEventListener('dragstart', (e) => {
  const payload = {
    target: window.shortSelector(e.target),
    title: document.title
  };
  console.log('[Content] Dragstart event:', e.target, payload);
  send('dragstart', payload);
}, true);
window.addEventListener('drop', (e) => {
  const payload = {
    target: window.shortSelector(e.target),
    title: document.title
  };
  console.log('[Content] Drop event:', e.target, payload);
  send('drop', payload);
}, true);

window.addEventListener('resize', () => {
  const payload = {
    width: window.innerWidth,
    height: window.innerHeight,
    title: document.title
  };
  console.log('[Content] Resize event:', payload);
  send('window_resize', payload);
});

let lastScrollY = window.scrollY;
window.addEventListener('scroll', () => {
  if (Math.abs(window.scrollY - lastScrollY) > 100) {
    lastScrollY = window.scrollY;
    const payload = {
      scrollY: window.scrollY,
      title: document.title
    };
    console.log('[Content] Scroll event:', payload);
    send('scroll', payload);
  }
}, true);

let lastFocusedElement = null;

window.addEventListener('focus', (e) => {
  const t = e.target;
  // If focus is moving from another element, log its value/state
  if (lastFocusedElement && lastFocusedElement !== t) {
    logElementValue(lastFocusedElement);
  }
  lastFocusedElement = t;
}, true);

// Also log when the page loses focus (e.g., user switches tab)
window.addEventListener('blur', (e) => {
  if (lastFocusedElement) {
    logElementValue(lastFocusedElement);
    lastFocusedElement = null;
  }
}, true);

function logElementValue(el) {
  if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) {
    const info = window.redactValue(el, el.value);
    const payload = {
      target: window.shortSelector(el),
      tag: el.tagName?.toLowerCase(),
      type: el.type,
      id: el.id,
      name: el.name,
      ariaLabel: el.getAttribute('aria-label'),
      labelText: el.labels && el.labels.length ? Array.from(el.labels).map(l => l.innerText).join(' ') : '',
      placeholder: el.placeholder,
      title: document.title,
      pageHeader: document.querySelector('h1')?.innerText || document.querySelector('header')?.innerText || '',
      ...info
    };
    if (!info.redacted) payload.value = el.value;
    console.log('[Content] Focus changed, logging input/textarea:', el, payload);
    send('focus_change_input', payload);
  } else if (el instanceof HTMLSelectElement) {
    const payload = {
      target: window.shortSelector(el),
      tag: el.tagName?.toLowerCase(),
      type: el.type,
      id: el.id,
      name: el.name,
      selected: el.selectedIndex,
      value: el.value,
      ariaLabel: el.getAttribute('aria-label'),
      labelText: el.labels && el.labels.length ? Array.from(el.labels).map(l => l.innerText).join(' ') : '',
      title: document.title,
      pageHeader: document.querySelector('h1')?.innerText || document.querySelector('header')?.innerText || ''
    };
    console.log('[Content] Focus changed, logging select:', el, payload);
    send('focus_change_select', payload);
  } else if (el instanceof HTMLTextAreaElement) {
    // Already covered by input/textarea above
  } else {
    // Optionally log other elements (e.g., contenteditable, custom widgets)
  }
}