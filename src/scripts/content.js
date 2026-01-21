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
			return url === entry || url.startsWith(entry) || location.origin === entryUrl.origin;
		} catch {
			return url.includes(entry);
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
}

window.addEventListener('beforeunload', () => {
	chrome.storage.onChanged.removeListener(handleStorageChange);
});

init();
