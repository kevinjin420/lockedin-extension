const sunIcon = `<svg width="20" height="20" viewBox="0 0 16 16" fill="currentColor"><path d="M8 11a3 3 0 1 1 0-6 3 3 0 0 1 0 6zm0 1a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM8 0a.5.5 0 0 1 .5.5v2a.5.5 0 0 1-1 0v-2A.5.5 0 0 1 8 0zm0 13a.5.5 0 0 1 .5.5v2a.5.5 0 0 1-1 0v-2A.5.5 0 0 1 8 13zm8-5a.5.5 0 0 1-.5.5h-2a.5.5 0 0 1 0-1h2a.5.5 0 0 1 .5.5zM3 8a.5.5 0 0 1-.5.5h-2a.5.5 0 0 1 0-1h2A.5.5 0 0 1 3 8zm10.657-5.657a.5.5 0 0 1 0 .707l-1.414 1.415a.5.5 0 1 1-.707-.708l1.414-1.414a.5.5 0 0 1 .707 0zm-9.193 9.193a.5.5 0 0 1 0 .707L3.05 13.657a.5.5 0 0 1-.707-.707l1.414-1.414a.5.5 0 0 1 .707 0zm9.193 2.121a.5.5 0 0 1-.707 0l-1.414-1.414a.5.5 0 0 1 .707-.707l1.414 1.414a.5.5 0 0 1 0 .707zM4.464 4.465a.5.5 0 0 1-.707 0L2.343 3.05a.5.5 0 1 1 .707-.707l1.414 1.414a.5.5 0 0 1 0 .708z"/></svg>`;
const moonIcon = `<svg width="20" height="20" viewBox="0 0 16 16" fill="currentColor"><path d="M6 .278a.768.768 0 0 1 .08.858 7.208 7.208 0 0 0-.878 3.46c0 4.021 3.278 7.277 7.318 7.277.527 0 1.04-.055 1.533-.16a.787.787 0 0 1 .81.316.733.733 0 0 1-.031.893A8.349 8.349 0 0 1 8.344 16C3.734 16 0 12.286 0 7.71 0 4.266 2.114 1.312 5.124.06A.752.752 0 0 1 6 .278z"/></svg>`;
const trashIcon = `<svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6z"/><path fill-rule="evenodd" d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1v1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4H4.118zM2.5 3V2h11v1h-11z"/></svg>`;

let isDarkMode = true;
let isEnabled = true;
let websites = [];
let savedTitle = '';
let savedMessage = '';

const enabledSwitch = document.getElementById('enabledSwitch');
const disabledLabel = document.getElementById('disabledLabel');
const enabledLabel = document.getElementById('enabledLabel');
const themeBtn = document.getElementById('themeBtn');
const titleInput = document.getElementById('titleInput');
const messageInput = document.getElementById('messageInput');
const messageForm = document.getElementById('messageForm');
const unsavedIndicator = document.getElementById('unsavedIndicator');
const urlForm = document.getElementById('urlForm');
const urlInput = document.getElementById('urlInput');
const websiteList = document.getElementById('websiteList');

function updateThemeUI() {
	document.body.classList.toggle('dark', isDarkMode);
	themeBtn.innerHTML = isDarkMode ? moonIcon : sunIcon;
}

function updateEnabledUI() {
	enabledSwitch.checked = isEnabled;
	disabledLabel.classList.toggle('active', !isEnabled);
	enabledLabel.classList.toggle('active', isEnabled);
}

function checkDirty() {
	const dirty = titleInput.value !== savedTitle || messageInput.value !== savedMessage;
	unsavedIndicator.classList.toggle('hidden', !dirty);
}

function renderWebsites() {
	websiteList.innerHTML = '';
	websites.forEach((site, index) => {
		const li = document.createElement('li');
		li.className = 'website-item';
		li.innerHTML = `
			<img src="https://www.google.com/s2/favicons?domain=${encodeURIComponent(site)}&sz=32" alt="" class="favicon">
			<span class="site-url">${site}</span>
			<button class="delete-btn" data-index="${index}" title="Remove">${trashIcon}</button>
		`;
		websiteList.appendChild(li);
	});
}

function syncWebsites() {
	chrome.storage.local.set({ websites: JSON.stringify(websites) });
}

chrome.storage.local.get(['isDarkMode', 'isEnabled', 'websites', 'title', 'message'], (result) => {
	isDarkMode = result.isDarkMode ?? true;
	isEnabled = result.isEnabled ?? true;
	titleInput.value = result.title ?? '';
	messageInput.value = result.message ?? '';
	savedTitle = titleInput.value;
	savedMessage = messageInput.value;

	try {
		websites = JSON.parse(result.websites || '[]');
	} catch {
		websites = [];
	}

	updateThemeUI();
	updateEnabledUI();
	renderWebsites();
	urlInput.focus();
});

chrome.storage.onChanged.addListener((changes, areaName) => {
	if (areaName !== 'local') return;

	if (changes.isDarkMode) {
		isDarkMode = changes.isDarkMode.newValue;
		updateThemeUI();
	}
	if (changes.isEnabled) {
		isEnabled = changes.isEnabled.newValue;
		updateEnabledUI();
	}
	if (changes.title) {
		savedTitle = changes.title.newValue;
		titleInput.value = savedTitle;
		checkDirty();
	}
	if (changes.message) {
		savedMessage = changes.message.newValue;
		messageInput.value = savedMessage;
		checkDirty();
	}
});

enabledSwitch.addEventListener('change', () => {
	isEnabled = enabledSwitch.checked;
	chrome.storage.local.set({ isEnabled });
	updateEnabledUI();
});

themeBtn.addEventListener('click', () => {
	isDarkMode = !isDarkMode;
	chrome.storage.local.set({ isDarkMode });
	updateThemeUI();
});

titleInput.addEventListener('input', checkDirty);
messageInput.addEventListener('input', checkDirty);

messageForm.addEventListener('submit', (e) => {
	e.preventDefault();
	chrome.storage.local.set({
		title: titleInput.value,
		message: messageInput.value
	});
	savedTitle = titleInput.value;
	savedMessage = messageInput.value;
	checkDirty();
});

urlForm.addEventListener('submit', (e) => {
	e.preventDefault();
	const trimmed = urlInput.value.trim();
	if (trimmed) {
		websites.push(trimmed);
		urlInput.value = '';
		syncWebsites();
		renderWebsites();
		urlInput.focus();
	}
});

websiteList.addEventListener('click', (e) => {
	const btn = e.target.closest('.delete-btn');
	if (btn) {
		const index = parseInt(btn.dataset.index, 10);
		websites.splice(index, 1);
		syncWebsites();
		renderWebsites();
	}
});
