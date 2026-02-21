let isDarkMode = true;
let isEnabled = true;
let websites = [];
let config = { title: '', message: '' };
let blocked = false;

const hideSheet = document.createElement('style');
hideSheet.textContent = 'html { visibility: hidden !important; opacity: 0 !important; }';
document.documentElement.appendChild(hideSheet);

function blockPage() {
	if (blocked) return;
	blocked = true;

	window.stop();

	document.documentElement.innerHTML = `
		<html lang="en">
		<head>
			<meta charset="UTF-8">
			<title>Blocked</title>
			<style>
				* { margin: 0; padding: 0; box-sizing: border-box; }
				body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f8f9fa; color: #212529; }
				body.dark { background: #1c1c1c; color: #fff; }
				.block-overlay { width: 100vw; height: 100vh; display: flex; flex-direction: column; justify-content: center; align-items: center; text-align: center; padding: 2rem; }
				.block-title { font-size: clamp(64px, 15vw, 160px); font-weight: 900; margin-bottom: 1rem; }
				.block-message { font-size: clamp(32px, 8vw, 80px); font-weight: 500; }
			</style>
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
	if (!blocked) return;
	blocked = false;
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

function showPage() {
	hideSheet.remove();
}

function applyBlock() {
	if (isEnabled && shouldBlock(location.href)) {
		blockPage();
	} else {
		showPage();
		unblockPage();
	}
}

function handleStorageChange(changes, areaName) {
	if (areaName !== 'local') return;

	let needsRecheck = false;

	if (changes.isEnabled) {
		isEnabled = changes.isEnabled.newValue;
		needsRecheck = true;
	}

	if (changes.isDarkMode) {
		isDarkMode = changes.isDarkMode.newValue;
		if (blocked) {
			document.body?.classList.toggle('dark', isDarkMode);
		}
	}

	if (changes.websites) {
		try {
			websites = JSON.parse(changes.websites.newValue || '[]');
		} catch {
			websites = [];
		}
		needsRecheck = true;
	}

	if (changes.title) {
		config.title = changes.title.newValue;
	}
	if (changes.message) {
		config.message = changes.message.newValue;
	}

	if (needsRecheck) {
		applyBlock();
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
			applyBlock();
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
