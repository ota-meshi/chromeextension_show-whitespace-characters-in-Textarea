(function() {
	'use strict';

	function ctrlClick(element) {
		var evt = new MouseEvent('click', {
			bubbles: true,
			cancelable: true,
			view: window,
			ctrlKey: true,
		});
		element.dispatchEvent(evt);
	}

	function keyup(element) {
		var evt = document.createEvent('KeyboardEvent');
		evt.initEvent('keyup', true, true);
		element.dispatchEvent(evt);
	}

	describe('suite', function() {
		it('Ctrl+Click', function() {
			var $textarea = $('<textarea>');
			$('#test').append($textarea);
			ctrlClick($textarea[0]);
			var vse = $textarea[0].previousSibling;
			expect(vse).toBeTruthy();
			expect(vse.tagName).toBe('DIV');
			expect(vse.contentEditable).toBe('true');
		});
		it('Click', function() {
			var $textarea = $('<textarea>');
			$('#test').append($textarea);
			$textarea.click();
			var vse = $textarea[0].previousSibling;
			expect(vse.tagName).not.toBe('DIV');
			expect(vse.contentEditable).toBe('inherit');
		});
		it('Ctrl+Click Ctrl+Click', function() {
			var $textarea = $('<textarea>');
			$('#test').append($textarea);
			ctrlClick($textarea[0]);
			var vse = $textarea[0].previousSibling;
			ctrlClick($textarea[0]);
			var vse2 = $textarea[0].previousSibling;
			expect(vse).toBe(vse2);
		});
		it('Ctrl+Click input', function() {
			var $input = $('<input>');
			$('#test').append($input);
			ctrlClick($input[0]);
			var vse = $input[0].previousSibling;
			expect(vse.tagName).not.toBe('DIV');
			expect(vse.contentEditable).toBe('inherit');
		});
		it('spaces', function() {
			var $textarea = $('<textarea>');
			$('#test').append($textarea);
			ctrlClick($textarea[0]);
			var vse = $textarea[0].previousSibling;
			vse.textContent = ' 　\t';
			keyup(vse);
			expect(vse.innerHTML).toBe('<span class="vse-visible-space-box vse-visible-space-box-singlebyte"> </span><span class="vse-visible-space-box vse-visible-space-box-multibyte">　</span><span class="vse-visible-space-box vse-visible-space-box-tabchar">	</span>');
		});

		if (window.jscoverage_report) {
			window.jscoverage_report();
		}
	});
})();