// Remove ES module imports for content scripts; use global functions if needed
console.log("[Content] content.js loaded");

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
  const payload = {
    selector: window.shortSelector(t),
    tag: t?.tagName?.toLowerCase(),
    x: Math.round(e.clientX), y: Math.round(e.clientY),
    bbox: rect ? { x: Math.round(rect.x), y: Math.round(rect.y), w: Math.round(rect.width), h: Math.round(rect.height) } : null,
    textSample: (t?.innerText || '').trim().slice(0, 40)
  };
  send('click', payload);
}, true);

// Keydown event
window.addEventListener('keydown', (e) => {
  console.log("[Content] Keydown event listener triggered");
  const t = e.target;
  const payload = {
    key: e.key && e.key.length === 1 ? 'CHAR' : e.key,
    ctrl: e.ctrlKey, alt: e.altKey, shift: e.shiftKey, meta: e.metaKey,
    target: window.shortSelector(t),
    sensitive: (t?.type || '').toLowerCase() === 'password'
  };
  send('keydown', payload);
}, true);

// Input event
window.addEventListener('input', (e) => {
  console.log("[Content] Input event listener triggered");
  if (!(e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement)) return;
  const info = window.redactValue(e.target, e.target.value);
  const payload = { target: window.shortSelector(e.target), type: (e.target.type||'').toLowerCase(), ...info };
  if (!info.redacted) payload.value = e.target.value;
  send('input', payload);
}, true);

// Change event
window.addEventListener('change', (e) => {
  console.log("[Content] Change event listener triggered");
  if (!(e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLSelectElement)) return;
  let value = null;
  if (e.target instanceof HTMLSelectElement) value = e.target.value;
  else value = e.target.value;
  const info = window.redactValue(e.target, value);
  const payload = { target: window.shortSelector(e.target), type: (e.target.type||'').toLowerCase(), ...info };
  if (!info.redacted) payload.value = value;
  send('change', payload);
}, true);
