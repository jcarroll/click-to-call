chrome.runtime.onInstalled.addListener(function() {
  chrome.storage.sync.set({ enabled: true });
});

chrome.action.onClicked.addListener(function(tab) {
  chrome.tabs.sendMessage(tab.id, { action: 'convertNow' });
});