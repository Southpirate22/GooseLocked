document.addEventListener('DOMContentLoaded', () => {
  // Navigation Tabs
  const navBtns = document.querySelectorAll('.nav-btn');
  const tabs = document.querySelectorAll('.tab-content');

  navBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      navBtns.forEach(b => b.classList.remove('active'));
      tabs.forEach(t => t.classList.remove('active'));
      btn.classList.add('active');
      document.getElementById(btn.dataset.target).classList.add('active');
    });
  });

  // Elements
  const swipeBtn = document.getElementById('swipeBtn');
  const whitelistInput = document.getElementById('whitelistInput');
  const addWhitelistBtn = document.getElementById('addWhitelistBtn');
  const whitelistUl = document.getElementById('whitelistUl');
  const shortcutTrigger = document.getElementById('shortcutTrigger');
  const shortcutUrl = document.getElementById('shortcutUrl');
  const addShortcutBtn = document.getElementById('addShortcutBtn');
  const shortcutList = document.getElementById('shortcutList');
  const blockInput = document.getElementById('blockInput');
  const blockList = document.getElementById('blockList');
  const consoleLog = document.getElementById('consoleLog');
  const clearLogsBtn = document.getElementById('clearLogsBtn');
  const status = document.getElementById('status');

  function logMessage(msg) {
    chrome.storage.local.get(['logs'], (data) => {
      const logs = data.logs || [];
      const timestamp = new Date().toLocaleTimeString();
      logs.push(`[${timestamp}] ${msg}`);
      chrome.storage.local.set({ logs });
      renderLogs(logs);
    });
  }

  function renderLogs(logs) {
    consoleLog.innerHTML = logs.map(l => `<div class="log-line">${l}</div>`).join('');
    consoleLog.scrollTop = consoleLog.scrollHeight;
  }

  // Load Saved Data
  function loadData() {
    chrome.storage.sync.get(['shortcuts', 'blockedSites', 'whitelist'], (syncData) => {
      renderShortcuts(syncData.shortcuts || {});
      renderBlocklist(syncData.blockedSites || []);
      renderWhitelist(syncData.whitelist || []);
    });
  }
  loadData();

  chrome.storage.local.get(['logs'], (localData) => {
    renderLogs(localData.logs || ["Extension initialized..."]);
  });

  // Goose Swipe Logic
  swipeBtn.addEventListener('click', () => {
    status.textContent = "Swiping local data...";
    logMessage("EXECUTION: Goose Swipe triggered");

    chrome.browsingData.remove({
      "since": 0
    }, {
      "cache": true,
      "cookies": true,
      "downloads": true,
      "formData": true,
      "history": true,
      "localStorage": true
    }, () => {
      status.textContent = "Goose Swipe Complete! ✨";
      logMessage("SUCCESS: Local cache, history, and cookies cleared");
      setTimeout(() => { status.textContent = "Ready"; }, 2000);
    });
  });

  // Save Whitelist Item
  addWhitelistBtn.addEventListener('click', () => {
    const site = whitelistInput.value.trim().toLowerCase();
    if (site) {
      chrome.storage.sync.get(['whitelist'], (data) => {
        const whitelist = data.whitelist || [];
        if (!whitelist.includes(site)) {
          whitelist.push(site);
          chrome.storage.sync.set({ whitelist }, () => {
            renderWhitelist(whitelist);
            logMessage(`SETTING: Added '${site}' to Whitelist`);
            whitelistInput.value = '';
          });
        }
      });
    }
  });

  // Save Custom Shortcut
  addShortcutBtn.addEventListener('click', () => {
    const trigger = shortcutTrigger.value.trim().toLowerCase();
    let url = shortcutUrl.value.trim();

    if (trigger && url) {
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        url = 'https://' + url;
      }
      chrome.storage.sync.get(['shortcuts'], (data) => {
        const shortcuts = data.shortcuts || {};
        shortcuts[trigger] = url;
        chrome.storage.sync.set({ shortcuts }, () => {
          renderShortcuts(shortcuts);
          logMessage(`SHORTCUT: Saved ,,${trigger} ➔ ${url}`);
          shortcutTrigger.value = '';
          shortcutUrl.value = '';
        });
      });
    }
  });

  // Save Blocklist Item
  blockInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && blockInput.value.trim() !== '') {
      const site = blockInput.value.trim().toLowerCase();
      chrome.storage.sync.get(['blockedSites'], (data) => {
        const sites = data.blockedSites || [];
        if (!sites.includes(site)) {
          sites.push(site);
          chrome.storage.sync.set({ blockedSites: sites }, () => {
            renderBlocklist(sites);
            logMessage(`BLOCKLIST: Added '${site}' to Blocklist`);
            blockInput.value = '';
          });
        }
      });
    }
  });

  // Clear Console Logs
  clearLogsBtn.addEventListener('click', () => {
    chrome.storage.local.set({ logs: ["Logs cleared..."] }, () => {
      renderLogs(["Logs cleared..."]);
    });
  });

  // RENDER FUNCTIONS WITH DELETE BUTTONS
  function renderShortcuts(shortcuts) {
    shortcutList.innerHTML = '';
    Object.keys(shortcuts).forEach(key => {
      const li = document.createElement('li');
      li.innerHTML = `<span>,,${key} ➔ ${shortcuts[key]}</span>`;
      const delBtn = document.createElement('button');
      delBtn.className = 'delete-btn';
      delBtn.textContent = '✕';
      delBtn.onclick = () => {
        delete shortcuts[key];
        chrome.storage.sync.set({ shortcuts }, () => {
          renderShortcuts(shortcuts);
          logMessage(`REMOVED: Deleted shortcut ,,${key}`);
        });
      };
      li.appendChild(delBtn);
      shortcutList.appendChild(li);
    });
  }

  function renderBlocklist(sites) {
    blockList.innerHTML = '';
    sites.forEach(site => {
      const li = document.createElement('li');
      li.innerHTML = `<span>${site}</span>`;
      const delBtn = document.createElement('button');
      delBtn.className = 'delete-btn';
      delBtn.textContent = '✕';
      delBtn.onclick = () => {
        const updated = sites.filter(s => s !== site);
        chrome.storage.sync.set({ blockedSites: updated }, () => {
          renderBlocklist(updated);
          logMessage(`REMOVED: Removed '${site}' from Blocklist`);
        });
      };
      li.appendChild(delBtn);
      blockList.appendChild(li);
    });
  }

  function renderWhitelist(whitelist) {
    whitelistUl.innerHTML = '';
    whitelist.forEach(site => {
      const li = document.createElement('li');
      li.innerHTML = `<span>${site}</span>`;
      const delBtn = document.createElement('button');
      delBtn.className = 'delete-btn';
      delBtn.textContent = '✕';
      delBtn.onclick = () => {
        const updated = whitelist.filter(w => w !== site);
        chrome.storage.sync.set({ whitelist: updated }, () => {
          renderWhitelist(updated);
          logMessage(`REMOVED: Removed '${site}' from Whitelist`);
        });
      };
      li.appendChild(delBtn);
      whitelistUl.appendChild(li);
    });
  }
});