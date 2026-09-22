// Add internal log helper
function appendLog(msg) {
  chrome.storage.local.get(['logs'], (data) => {
    const logs = data.logs || [];
    const timestamp = new Date().toLocaleTimeString();
    logs.push(`[${timestamp}] ${msg}`);
    chrome.storage.local.set({ logs });
  });
}

// 1. Omnibox Shortcut Execution (,,)
chrome.omnibox.onInputEntered.addListener((text) => {
  const parts = text.trim().split(' ');
  const trigger = parts[0].toLowerCase();
  const query = parts.slice(1).join(' ');

  chrome.storage.sync.get(['shortcuts'], (data) => {
    const shortcuts = data.shortcuts || {};

    if (shortcuts[trigger]) {
      let targetUrl = shortcuts[trigger];
      if (query && targetUrl.includes('{q}')) {
        targetUrl = targetUrl.replace('{q}', encodeURIComponent(query));
      } else if (query) {
        targetUrl = `${targetUrl}?q=${encodeURIComponent(query)}`;
      }
      appendLog(`OMNIBOX: Executing shortcut ,,${trigger}`);
      chrome.tabs.update({ url: targetUrl });
    } else {
      appendLog(`WARN: Shortcut ,,${trigger} not found`);
      const warningUrl = chrome.runtime.getURL(`warning.html?key=${encodeURIComponent(trigger)}`);
      chrome.tabs.update({ url: warningUrl });
    }
  });
});

// 2. URL Tracker Parameter Stripper
chrome.webNavigation.onBeforeNavigate.addListener((details) => {
  if (details.frameId !== 0) return;

  try {
    const url = new URL(details.url);
    const trackingParams = ['fbclid', 'gclid', 'utm_source', 'utm_medium', 'utm_campaign', 'msclkid'];
    let stripped = false;

    trackingParams.forEach(param => {
      if (url.searchParams.has(param)) {
        url.searchParams.delete(param);
        stripped = true;
      }
    });

    if (stripped) {
      appendLog(`SHIELD: Stripped tracker tags from ${url.hostname}`);
      chrome.tabs.update(details.tabId, { url: url.toString() });
    }
  } catch (e) {
    // Ignore invalid URLs
  }
});

// 3. Dynamic Blocklist Enforcer
chrome.webNavigation.onBeforeNavigate.addListener((details) => {
  if (details.frameId !== 0) return;

  chrome.storage.sync.get(['blockedSites'], (data) => {
    const blocked = data.blockedSites || [];
    const url = new URL(details.url);

    if (blocked.some(domain => url.hostname.includes(domain))) {
      appendLog(`BLOCK: Navigation blocked to ${url.hostname}`);
      const warningUrl = chrome.runtime.getURL(`warning.html?key=BLOCKED_SITE_${url.hostname}`);
      chrome.tabs.update(details.tabId, { url: warningUrl });
    }
  });
});