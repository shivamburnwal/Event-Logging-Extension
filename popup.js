import { STORAGE_KEY, toCsv, nowIso, shortSelector, redactValue } from './utils-module.js';

document.addEventListener("DOMContentLoaded", () => {
  const viewLogsBtn = document.getElementById("viewLogs");
  const downloadCSVBtn = document.getElementById("downloadCSV");
  const downloadTXTBtn = document.getElementById("downloadTXT");
  const clearLogsBtn = document.getElementById("clearLogs");
  const logList = document.getElementById("logList");
  const status = document.getElementById("status");
  const countEl = document.getElementById("logCount");

  function setStatus(msg, isError = false) {
    if (!status) return;
    status.textContent = msg || "";
    status.style.color = isError ? "crimson" : "";
    if (msg) setTimeout(() => { status.textContent = ""; }, 5000);
  }

  // Read logs from storage (returns promise)
  function loadLogs() {
    return new Promise((resolve) => {
      chrome.storage.local.get(STORAGE_KEY, (result) => {
        resolve(result[STORAGE_KEY] || []);
      });
    });
  }

  // Render logs into the popup
  async function displayLogs() {
    try {
      const logs = await loadLogs();
      logList.innerHTML = "";
      countEl.textContent = `${logs.length} log${logs.length === 1 ? "" : "s"}`;

      if (!logs.length) {
        const li = document.createElement("li");
        li.textContent = "No logs found.";
        li.style.opacity = "0.8";
        logList.appendChild(li);
        return;
      }

      // show most recent first
      const slice = logs.slice().reverse();
      for (const log of slice) {
        const li = document.createElement("li");
        li.style.marginBottom = "6px";
        // Normalize fields that your background uses: ts,event,url,title,tabId,winId,data
        const ts = log.ts || log.timestamp || "";
        const ev = log.event || log.type || "";
        const url = log.url || "";
        const title = log.title || "";
        // Show an abbreviated line and expand details on click
        li.textContent = `[${ts}] ${ev} — ${title || url || "(no title/url)"}`;
        li.title = JSON.stringify(log, null, 2);

        // Click to toggle expanded JSON below item
        li.addEventListener("click", () => {
          const next = li.nextElementSibling;
          if (next && next.classList.contains("details")) {
            next.remove();
            return;
          }
          const details = document.createElement("pre");
          details.className = "details";
          details.style.whiteSpace = "pre-wrap";
          details.style.maxHeight = "200px";
          details.style.overflow = "auto";
          details.style.background = "#f7f7f7";
          details.style.padding = "6px";
          details.style.borderRadius = "4px";
          details.textContent = JSON.stringify(log, null, 2);
          li.parentNode.insertBefore(details, li.nextSibling);
        });

        logList.appendChild(li);
      }
    } catch (err) {
      console.error("displayLogs error:", err);
      setStatus("Failed to load logs", true);
    }
  }

  // Plain text export (pretty JSON)
  function exportLogsAsText(logs) {
    return logs.map(l => JSON.stringify(l, null, 2)).join("\n\n---\n\n");
  }

  // Download helper using blob
  function downloadFile(filename, content, mime) {
    try {
      const blob = new Blob([content], { type: mime });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 5000);
      setStatus(`Download started: ${filename}`);
    } catch (err) {
      console.error("downloadFile error:", err);
      setStatus("Failed to start download", true);
    }
  }

  // Clear logs
  function clearLogs() {
    chrome.storage.local.remove([STORAGE_KEY], () => {
      if (chrome.runtime.lastError) {
        console.error("clearLogs error:", chrome.runtime.lastError);
        setStatus("Failed to clear logs", true);
      } else {
        setStatus("Logs cleared");
        displayLogs();
      }
    });
  }

  // Hook up buttons
  viewLogsBtn.addEventListener("click", () => {
    displayLogs();
  });

  downloadCSVBtn.addEventListener("click", async () => {
    const logs = await loadLogs();
    if (!logs || logs.length === 0) {
      setStatus("No logs to export", true);
      return;
    }
    const csv = toCsv(logs);
    downloadFile("browser_logs.csv", csv, "text/csv;charset=utf-8;");
  });

  downloadTXTBtn.addEventListener("click", async () => {
    const logs = await loadLogs();
    if (!logs || logs.length === 0) {
      setStatus("No logs to export", true);
      return;
    }
    const txt = exportLogsAsText(logs);
    downloadFile("browser_logs.txt", txt, "text/plain;charset=utf-8;");
  });

  clearLogsBtn.addEventListener("click", () => {
    if (!confirm("Remove all stored logs? This cannot be undone.")) return;
    clearLogs();
  });

  chrome.storage.local.get(STORAGE_KEY, (result) => {
    const logs = result[STORAGE_KEY] || [];
    countEl.textContent = `${logs.length} logs`;
  });

  // Auto-display on open
  // displayLogs();
});
