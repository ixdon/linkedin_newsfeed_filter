document.getElementById('openSettings').addEventListener('click', () => {
  chrome.tabs.create({ url: chrome.runtime.getURL('settings.html') });
});