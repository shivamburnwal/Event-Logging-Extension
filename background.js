import { STORAGE_KEY, toCsv, nowIso } from './utils-module.js';

async function appendLog(event) {
  console.log('[Background] appendLog:', event);
  const logs = (await chrome.storage.local.get(STORAGE_KEY))[STORAGE_KEY] || [];
  logs.push(event);
  await chrome.storage.local.set({ [STORAGE_KEY]: logs });
}

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  console.log("[Background] Received message:", msg, "Sender:", sender);
  if (msg?.type === 'tml:event') {
    const logEvent = {
      ts: nowIso(),
      event: msg.event,
      data: msg.data,
      url: msg.url,
      tabId: sender?.tab?.id || null,
      winId: sender?.tab?.windowId || null
    };
    console.log('[Background] Logging tml:event:', logEvent);
    appendLog(logEvent);
    sendResponse({ status: 'logged' });
  }
});

chrome.tabs.onActivated.addListener(async activeInfo => {
  const tab = await chrome.tabs.get(activeInfo.tabId);
  const payload = {
    ts: nowIso(),
    event: 'tab_activated',
    tabId: tab.id,
    winId: tab.windowId,
    url: tab.url,
    title: tab.title
  };
  console.log('[Background] Tab activated:', payload);
  appendLog(payload);
});

// Listen for window focus changes
// chrome.windows.onFocusChanged.addListener(async windowId => {
//   if (windowId === chrome.windows.WINDOW_ID_NONE) return;
//   const windows = await chrome.windows.getAll({ populate: true });
//   const win = windows.find(w => w.id === windowId);
//   const payload = {
//     ts: nowIso(),
//     event: 'window_focus_changed',
//     winId: windowId,
//     tabCount: win ? win.tabs.length : undefined
//   };
//   console.log('[Background] Window focus changed:', payload);
//   appendLog(payload);
// });

// Listen for tab updates (navigation, loading, completed)
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'loading' || changeInfo.status === 'complete') {
    const payload = {
      ts: nowIso(),
      event: `tab_${changeInfo.status}`,
      tabId,
      winId: tab.windowId,
      url: tab.url,
      title: tab.title
    };
    console.log('[Background] Tab updated:', payload);
    appendLog(payload);
  }
  // Optionally, log navigation (URL change)
  if (changeInfo.url) {
    const payload = {
      ts: nowIso(),
      event: 'tab_url_changed',
      tabId,
      winId: tab.windowId,
      url: changeInfo.url,
      title: tab.title
    };
    console.log('[Background] Tab URL changed:', payload);
    appendLog(payload);
  }
});

// Listen for tab creation
chrome.tabs.onCreated.addListener(tab => {
  const payload = {
    ts: nowIso(),
    event: 'tab_created',
    tabId: tab.id,
    winId: tab.windowId,
    url: tab.url,
    title: tab.title
  };
  console.log('[Background] Tab created:', payload);
  appendLog(payload);
});

// Listen for tab removal
chrome.tabs.onRemoved.addListener((tabId, removeInfo) => {
  const payload = {
    ts: nowIso(),
    event: 'tab_removed',
    tabId,
    winId: removeInfo.windowId,
    isWindowClosing: removeInfo.isWindowClosing
  };
  console.log('[Background] Tab removed:', payload);
  appendLog(payload);
});

// Listen for window creation
chrome.windows.onCreated.addListener(win => {
  const payload = {
    ts: nowIso(),
    event: 'window_created',
    winId: win.id,
    tabCount: win.tabs ? win.tabs.length : undefined
  };
  console.log('[Background] Window created:', payload);
  appendLog(payload);
});

// Listen for window removal
chrome.windows.onRemoved.addListener(winId => {
  const payload = {
    ts: nowIso(),
    event: 'window_removed',
    winId
  };
  console.log('[Background] Window removed:', payload);
  appendLog(payload);
});

// Listen for extension commands (e.g., export logs)
chrome.commands.onCommand.addListener(async (command) => {
  console.log('[Background] Command received:', command);
  if (command === 'export-logs') {
    await exportCsvFromBackground();
  }
});

async function exportCsvFromBackground() {
  const { [STORAGE_KEY]: logs = [] } = await chrome.storage.local.get(STORAGE_KEY);
  const csv = toCsv(logs);
  const dataUrl = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv);
  console.log('[Background] Exporting logs as CSV:', logs.length);
  await chrome.downloads.download({
    url: dataUrl,
    filename: `task-mining-logs-${Date.now()}.csv`,
    saveAs: true
  });
}