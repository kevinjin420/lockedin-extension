let isDarkMode = true;
let isEnabled = true;
let websites = [];
let config = { title: '', message: '' };

function blockPage() {
	window.stop();

	document.documentElement.innerHTML = `
		<html lang="en">
		<head>
			<meta charset="UTF-8">
			<title>Blocked</title>
			<link rel="stylesheet" href="${chrome.runtime.getURL('src/block/block.css')}">
		</head>
		<body class="${isDarkMode ? 'dark' : ''}">
			<div class="block-overlay">
				<h1 class="block-title">${escapeHtml(config.title) || 'Blocked'}</h1>
				<p class="block-message">${escapeHtml(config.message) || 'Stay focused!'}</p>
			</div>
		</body>
		</html>
	`;
}

function escapeHtml(str) {
	if (!str) return '';
	return str.replace(/[&<>"']/g, (c) => ({
		'&': '&amp;',
		'<': '&lt;',
		'>': '&gt;',
		'"': '&quot;',
		"'": '&#39;'
	}[c]));
}

function unblockPage() {
	const overlay = document.querySelector('.block-overlay');
	if (!overlay) return;
	location.reload();
}

function shouldBlock(url) {
	return websites.some((entry) => {
		try {
			const entryUrl = new URL(entry.includes('://') ? entry : 'https://' + entry);
			const entryHost = entryUrl.hostname.replace(/^www\./, '');
			const currentHost = location.hostname.replace(/^www\./, '');
			const hostMatches = currentHost === entryHost || currentHost.endsWith('.' + entryHost);

			if (!hostMatches) return false;

			const entryPath = entryUrl.pathname.replace(/\/+$/, '');
			if (!entryPath || entryPath === '') return true;

			const currentPath = location.pathname.replace(/\/+$/, '');
			return currentPath === entryPath || currentPath.startsWith(entryPath + '/');
		} catch {
			const cleanEntry = entry.replace(/^www\./, '');
			const currentHost = location.hostname.replace(/^www\./, '');
			return currentHost === cleanEntry || currentHost.endsWith('.' + cleanEntry);
		}
	});
}

function applyBlock() {
	if (isEnabled && shouldBlock(location.href)) {
		blockPage();
	} else {
		unblockPage();
	}
}

function handleStorageChange(changes, areaName) {
	if (areaName !== 'local') return;

	if (changes.isEnabled) {
		isEnabled = changes.isEnabled.newValue;
		applyBlock();
	}

	if (changes.isDarkMode) {
		isDarkMode = changes.isDarkMode.newValue;
		if (document.querySelector('.block-overlay')) {
			document.body.classList.toggle('dark', isDarkMode);
		}
	}

	if (changes.websites) {
		try {
			websites = JSON.parse(changes.websites.newValue || '[]');
		} catch {
			websites = [];
		}
		applyBlock();
	}

	if (changes.title) {
		config.title = changes.title.newValue;
	}
	if (changes.message) {
		config.message = changes.message.newValue;
	}
}

let lastUrl = location.href;

function checkUrlChange() {
	if (location.href !== lastUrl) {
		lastUrl = location.href;
		applyBlock();
	}
}

function init() {
	chrome.storage.local.get(['isDarkMode', 'isEnabled', 'websites', 'title', 'message'], (result) => {
		isDarkMode = result.isDarkMode ?? true;
		isEnabled = result.isEnabled ?? true;
		config.title = result.title ?? '';
		config.message = result.message ?? '';

		try {
			websites = JSON.parse(result.websites || '[]');
		} catch {
			websites = [];
		}

		applyBlock();
	});

	chrome.storage.onChanged.addListener(handleStorageChange);

	chrome.runtime.onMessage.addListener((message) => {
		if (message.type === 'checkBlock') {
			chrome.storage.local.get(['isDarkMode', 'isEnabled', 'websites', 'title', 'message'], (result) => {
				isDarkMode = result.isDarkMode ?? true;
				isEnabled = result.isEnabled ?? true;
				config.title = result.title ?? '';
				config.message = result.message ?? '';
				try {
					websites = JSON.parse(result.websites || '[]');
				} catch {
					websites = [];
				}
				applyBlock();
			});
		}
	});

	const originalPushState = history.pushState;
	const originalReplaceState = history.replaceState;
	history.pushState = function(...args) {
		originalPushState.apply(this, args);
		checkUrlChange();
	};
	history.replaceState = function(...args) {
		originalReplaceState.apply(this, args);
		checkUrlChange();
	};
	window.addEventListener('popstate', checkUrlChange);

	setInterval(checkUrlChange, 500);
}

window.addEventListener('beforeunload', () => {
	chrome.storage.onChanged.removeListener(handleStorageChange);
});

init();
