(function(global, factory) {
	'use strict';
	var VisibleSpacesEditor = factory();

	global.VisibleSpacesEditor = global.VisibleSpacesEditor || VisibleSpacesEditor;

	global.visiblespaces = global.visiblespaces || {
		edit: function(contenteditableElement) {
			return new global.VisibleSpacesEditor(contenteditableElement);
		},
	};
	return VisibleSpacesEditor;
})(this, function() {
	'use strict';
	var CONSTS = {
		CLASSNAME_VISIBLE_SPACE: 'vse-visible-space-box',
		CLASSNAME_SINGLE: 'vse-visible-space-box-singlebyte',
		CLASSNAME_MULTI: 'vse-visible-space-box-multibyte',
		CLASSNAME_TAB: 'vse-visible-space-box-tabchar',
		EVENT_TYPES: {
			CHANGE_VALUE: 'change_value',
		},
	};
	var bindCall = function(fn) {
		return fn.call.bind(fn);
	};
	var forEach = bindCall(Array.prototype.forEach);
	var findIndex = bindCall(Array.prototype.findIndex);
	function isTextNode(node) {
		return document.TEXT_NODE === node.nodeType;
	}
	function isElementNode(node) {
		return document.ELEMENT_NODE === node.nodeType;
	}
	function isVisibleSpaceSpan(node) {
		return node.classList.contains(CONSTS.CLASSNAME_VISIBLE_SPACE) && node.tagName === 'SPAN';
	}
	function isSpaceChar(c) {
		return c === ' ' || c === '　' || c === '\t' || c === '\u00A0';
	}
	function getSpaceCharClassName(c) {
		switch (c) {
		case ' ' :
		case '\u00A0' :
			return CONSTS.CLASSNAME_SINGLE;
		case '　' :
			return CONSTS.CLASSNAME_MULTI;
		case '\t' :
			return CONSTS.CLASSNAME_TAB;
		}
		return '';
	}
	function getSpaceCharIndex(text) {
		return findIndex(text, isSpaceChar);
	}
	function removeHighlight(node) {
		var parent = node.parentElement;
		if (parent === null) {
			return null;
		}
		var text = node.innerText;
		if (text === '\n') {
			parent.insertBefore(document.createElement('br'), node);
			parent.removeChild(node);
			return null;
		} else {
			var textNode = document.createTextNode(text);
			parent.insertBefore(textNode, node);
			parent.removeChild(node);
			return textNode;
		}
	}
	function highlight(textNode) {
		var nodeText = textNode.textContent;
		var index = getSpaceCharIndex(nodeText);
		if (index > -1) {
			var parent = textNode.parentElement;
			if (isSpaceChar(nodeText) && isVisibleSpaceSpan(parent)) {
				return false;
			}
			while (index > -1) {
				var span = document.createElement('span');
				span.classList.add(CONSTS.CLASSNAME_VISIBLE_SPACE, getSpaceCharClassName(nodeText[index]));
				span.textContent = nodeText.substr(index, 1);

				parent.insertBefore(document.createTextNode(nodeText.substr(0, index)), textNode);
				parent.insertBefore(span, textNode);
				nodeText = nodeText.substr(index + 1);
				index = getSpaceCharIndex(nodeText);
			}
			if (nodeText) {
				parent.insertBefore(document.createTextNode(nodeText), textNode);
			}
			parent.removeChild(textNode);
			return true;
		} else {
			return false;
		}
	}
	function refreshHighlight(node) {
		if (isTextNode(node)) {
			//add space-class target
			if (highlight(node)) {
				return {
					change: true,
					changeChild: true,
				};
			} else {
				return {
					change: false,
					changeChild: false,
				};
			}
		} else if (isElementNode(node)) {
			if (isVisibleSpaceSpan(node)) {
				if (isSpaceChar(node.innerText)) {
					return {
						change: false,
						changeChild: false,
					};
				}
				//remove space-class target
				var textNode = removeHighlight(node);
				if (textNode) {
					highlight(textNode);
				}
				return {
					change: true,
					changeChild: true,
				};
			} else {
				var change = false;
				var normalizeFlg = false;
				forEach(node.childNodes, function(c) {
					var ret = refreshHighlight(c);
					change = change || ret.change;
					normalizeFlg = normalizeFlg || ret.changeChild;
				});
				if (normalizeFlg) {
					node.normalize();
				}
				return {
					change: change,
					changeChild: false,
				};
			}
		}
		return {
			change: false,
			changeChild: false,
		};
	}
	function getTextLength(node) {
		var text = node.innerText || node.textContent;
		var length = text.length;
		if (length > 0 && text[length - 1] === '\n') {
			return length;
		} else if (node.tagName === 'DIV') {
			return length + 1;
		} else {
			var next = node.nextSibling;
			if (next && next.tagName === 'DIV') {
				return length + 1;
			}
		}
		return length;
	}
	function getTextOffset(node, baseNode) {
		if (node === null) {
			return 0;
		}
		if (node === baseNode) {
			return 0;
		}
		var offset = 0;
		var prev = node.previousSibling;
		while (prev) {
			offset += getTextLength(prev);
			prev = prev.previousSibling;
		}
		return offset + getTextOffset(node.parentElement, baseNode);
	}
	function getCaret(node, offset, baseNode) {
		if (isTextNode(node)) {
			return offset + getTextOffset(node, baseNode);
		} else if (isElementNode(node)) {
			var textOffset = 0;
			for (var i = 0; i < offset; i++) {
				var c = node.childNodes[i];
				textOffset += getTextLength(c);
			}
			return textOffset + getTextOffset(node, baseNode);
		}
		return 0;
	}
	function setCaret(node, offset, setFn) {
		if (offset === 0) {
			setFn(node, 0);
		}
		if (isTextNode(node)) {
			setFn(node, offset);
		} else {
			var textOffset = 0;
			for (var i = 0; i < node.childNodes.length; i++) {
				var c = node.childNodes[i];
				if (textOffset === offset) {
					setFn(c, 0);
					return;
				}
				var nextOffset = textOffset + getTextLength(c);
				if (nextOffset > offset) {
					setCaret(c, offset - textOffset, setFn);
					return;
				}
				textOffset = nextOffset;
			}
			if (textOffset === offset) {
				setFn(node, node.childNodes.length);
			}
		}
	}
	function getSelectionObject(baseNode) {
		var selection = window.getSelection();
		if (!selection.rangeCount) {
			return null;
		}
		var range = selection.getRangeAt(0);
		return {
			start: getCaret(range.startContainer, range.startOffset, baseNode),
			end: getCaret(range.endContainer, range.endOffset, baseNode),
		};
	}
	function setSelectionObject(baseNode, object) {
		var selection = window.getSelection();
		var newRange = document.createRange();
		setCaret(baseNode, object.start, newRange.setStart.bind(newRange));
		setCaret(baseNode, object.end, newRange.setEnd.bind(newRange));

		selection.removeAllRanges();
		selection.addRange(newRange);
	}

	var VisibleSpacesEditor = function(edit) {
		var fireEvnet;
		var lastHtml = edit.innerHTML;
		function isModify() {
			var html = edit.innerHTML;
			if (lastHtml === html) {
				return false;
			}
			lastHtml = html;
			return true;
		}
		function onChangeHighlight() {
			fireEvnet(CONSTS.EVENT_TYPES.CHANGE_VALUE);

			var ret;
			if ((ret = refreshHighlight(edit)).changeChild) {
				edit.normalize();
			}

			return ret.change;
		}
		function isIncEdit(node) {
			var e = node;
			while (e) {
				if (e === edit) {
					return true;
				}
				e = e.parentElement;
			}
			return false;
		}
		function onChangeHighlightCaretFix(e) {
			if (!isModify()) {
				return;
			}
			if (!isIncEdit(document.activeElement)) {
				onChangeHighlight();
				return;
			}
			var selection = getSelectionObject(edit);
			if (selection === null) {
				onChangeHighlight();
				return;
			}

			if (!onChangeHighlight()) {
				return;
			}

			setSelectionObject(edit, selection);
		}
		this._edit = edit;
		this._highlight = onChangeHighlight;
		this._callbackMap = {};
		this._elementEvents = {};
		var addElementEvent = function(key, fn) {
			this._elementEvents[key] = fn;
			edit.addEventListener(key, fn);
		}.bind(this);
		fireEvnet = function(eventType) {
			forEach(this._callbackMap[eventType] || [], function(fn) {
				fn.bind(this)();
			}.bind(this));
		}.bind(this);

		edit.style['white-space'] = 'pre';
		edit.style['-webkit-user-modify'] = '';
		edit.setAttribute('contenteditable', true);

		var isComposition = false;
		//blur keypress keyup paste copy cut mouseup
		addElementEvent('blur', function() {
			if (isModify()) {
				onChangeHighlight();
			}
		});
		addElementEvent('keydown', function(e) {
			if (!isComposition) {
				onChangeHighlightCaretFix(e);
			}
		});
		addElementEvent('keyup', function(e) {
			if (!isComposition) {
				onChangeHighlightCaretFix(e);
			}
		});
		addElementEvent('paste', function(e) {
			setTimeout(function() {
				var selection = getSelectionObject(edit);
				edit.innerText = edit.innerText.replace('\u00A0', ' ');
				if (!onChangeHighlight()) {
					return;
				}
				if (selection === null) {
					return;
				}
				setSelectionObject(edit, selection);
			}, 0);
		});
		addElementEvent('copy', onChangeHighlightCaretFix);
		addElementEvent('cut', onChangeHighlightCaretFix);
		addElementEvent('mouseup', onChangeHighlightCaretFix);

		addElementEvent('compositionstart', function(e) {
			isComposition = true;
		});
		addElementEvent('compositionend', function(e) {
			isComposition = false;
			onChangeHighlightCaretFix(e);
		});
	};

	VisibleSpacesEditor.prototype.getValue = function() {
		return this._edit.innerText.replace('\u00A0', ' ');
	};
	VisibleSpacesEditor.prototype.setValue = function(value) {
		this._edit.innerText = value;
		this._highlight();
	};
	VisibleSpacesEditor.EVENT_TYPES = CONSTS.EVENT_TYPES;
	VisibleSpacesEditor.prototype.on = function(eventType, fn) {
		var funcs = this._callbackMap[eventType] || (this._callbackMap[eventType] = []);
		funcs.push(fn);
	};
	VisibleSpacesEditor.prototype.dispose = function() {
		for (var key in this._elementEvents) {
			this._edit.removeEventListener(key, this._elementEvents[key]);
		}
		this._elementEvents = null;
		this._callbackMap = null;
	};

	return VisibleSpacesEditor;
});