import { STORAGE_KEY, toCsv, nowIso, shortSelector, redactValue } from './utils-module.js';

async function appendLog(event) {
  const logs = (await chrome.storage.local.get(STORAGE_KEY))[STORAGE_KEY] || [];
  logs.push(event);
  await chrome.storage.local.set({ [STORAGE_KEY]: logs });
}

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  console.log("[Background] Received message:", msg, "Sender:", sender);
  if (msg?.type === 'module') {
    const tab = sender?.tab || {};
    const base = {
      ts: nowIso(),
      tabId: tab.id,
      winId: tab.windowId,
      url: tab.url || msg.url || null,
      title: tab.title || null,
      frameId: sender?.frameId,
      event: msg.event,
      data: msg.data || {}
    };
    console.log("[Background] Logging event:", base);
    appendLog(base);
    sendResponse({ ok: true });
    return true;
  }
  if (msg?.type === 'tml:event') {
    appendLog({
      ts: nowIso(),
      event: msg.event,
      data: msg.data,
      url: msg.url,
      tabId: sender?.tab?.id,
      winId: sender?.tab?.windowId
    });
    sendResponse({ status: 'logged' });
  }
});

chrome.tabs.onActivated.addListener(async activeInfo => {
  console.log("[Background] Tab activated:", activeInfo);
  const tab = await chrome.tabs.get(activeInfo.tabId);
  appendLog({
    ts: nowIso(),
    event: 'tab_activated',
    tabId: tab.id,
    winId: tab.windowId,
    url: tab.url,
    title: tab.title
  });
});

chrome.windows.onFocusChanged.addListener(async windowId => {
  console.log("[Background] Window focus changed:", windowId);
  if (windowId === chrome.windows.WINDOW_ID_NONE) return;
  appendLog({
    ts: nowIso(),
    event: 'window_focus_changed',
    winId: windowId
  });
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'loading') {
    console.log("[Background] Tab loading:", tabId, changeInfo);
    appendLog({
      ts: nowIso(),
      event: 'tab_loading',
      tabId,
      url: changeInfo.url || tab.url
    });
  }
  if (changeInfo.status === 'complete') {
    console.log("[Background] Tab complete:", tabId, tab);
    appendLog({
      ts: nowIso(),
      event: 'tab_complete',
      tabId,
      url: tab.url,
      title: tab.title
    });
  }
});

chrome.commands.onCommand.addListener(async (command) => {
  console.log("[Background] Command triggered:", command);
  if (command === 'export-logs') {
    await exportCsvFromBackground();
  }
});

async function exportCsvFromBackground() {
  console.log("[Background] Export logs started");
  const { [STORAGE_KEY]: logs = [] } = await chrome.storage.local.get(STORAGE_KEY);
  console.log("[Background] Exporting logs count:", logs.length);

  const csv = toCsv(logs);

  const dataUrl = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv);
  await chrome.downloads.download({
    url: dataUrl,
    filename: `task-mining-logs-${Date.now()}.csv`,
    saveAs: true
  });
  console.log("[Background] Export complete, CSV triggered");
}