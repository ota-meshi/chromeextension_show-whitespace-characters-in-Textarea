(function() {
	'use strict';

	function getAllEvents(element) {
		const result = [];
		for (const key in element) {
			if (key.indexOf('on') === 0) {
				result.push(key.slice(2));
			}
		}
		return result;
	}
	function dispatchAllEvents(src, dest) {
		getAllEvents(dest).forEach(function(eventName) {
			src.addEventListener(eventName, function(e) {
				try {
					if (e instanceof ClipboardEvent) {
						const newE = document.createEvent('Event');
						newE.initEvent(e.type, true, true);
						newE.clipboardData = e.clipboardData;
						dest.dispatchEvent(newE);
					} else {
						const newE = new e.constructor(e.type, e);

						if (e.type === 'keydown' && e.keyCode === 8) {
							newE.preventDefault();
						}


						dest.dispatchEvent(newE);
					}
				} catch (err) {
					console.log(e, err);
				}
			});
		});
	}
	function copyAllStyles(src, dest) {
		const styles = getComputedStyle(src);
		const destStyles = getComputedStyle(dest);

		for (const styleName in styles) {
			if (destStyles[styleName] === styles[styleName]) {
				continue;
			}
			dest.style[styleName] = styles[styleName];
		}
	}

	function toVisibleSpacesEditor(textarea) {
		const editBase = document.createElement('div');
		textarea.parentElement.insertBefore(editBase, textarea);

		copyAllStyles(textarea, editBase);

		editBase.style['white-space'] = 'pre';
		editBase.style['-webkit-user-modify'] = '';

		const editor = window.visiblespaces.edit(editBase);
		editor.setValue(textarea.value);

		editor.on(VisibleSpacesEditor.EVENT_TYPES.CHANGE_VALUE, function() {
			textarea.value = editor.getValue();
		});

		//bind all events
		dispatchAllEvents(editBase, textarea);

		textarea.style.opacity = 0;
		textarea.style['pointer-events'] = 'none';
		textarea.style.position = 'fixed';
		textarea.style.top = '-100%';
		textarea.style.left = '-100%';

		textarea.focus();
	}

	const textareaTargets = [];

	document.addEventListener('click', function(e) {
		if (e.ctrlKey && e.target.tagName.toLowerCase() === 'textarea') {
			if (textareaTargets.indexOf(e.target) > -1) {
				return;
			}
			textareaTargets.push(e.target);
			toVisibleSpacesEditor(e.target);
		}
	});
})();

