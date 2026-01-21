chrome.storage.onChanged.addListener((changes, areaName) => {
	if (areaName !== 'local') return;
	if (changes.isEnabled || changes.websites) {
		chrome.tabs.query({}, (tabs) => {
			tabs.forEach((tab) => {
				if (tab.id && tab.url && !tab.url.startsWith('chrome://')) {
					chrome.tabs.sendMessage(tab.id, { type: 'checkBlock' }).catch(() => {});
				}
			});
		});
	}
});
