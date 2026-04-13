document.addEventListener('DOMContentLoaded', function() {
  const enableToggle = document.getElementById('enableToggle');
  const convertNowBtn = document.getElementById('convertNow');
  const statusText = document.getElementById('status');

  chrome.storage.sync.get(['enabled'], function(result) {
    enableToggle.checked = result.enabled !== false;
    updateStatus(enableToggle.checked);
  });

  enableToggle.addEventListener('change', function() {
    const enabled = this.checked;
    chrome.storage.sync.set({ enabled: enabled });
    updateStatus(enabled);
  });

  convertNowBtn.addEventListener('click', function() {
    chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
      chrome.tabs.sendMessage(tabs[0].id, { action: 'convertNow' });
      statusText.textContent = '✓ Conversion triggered!';
      setTimeout(() => updateStatus(enableToggle.checked), 2000);
    });
  });

  function updateStatus(enabled) {
    statusText.textContent = enabled ? '✓ Active on this page' : '✗ Disabled';
  }
});