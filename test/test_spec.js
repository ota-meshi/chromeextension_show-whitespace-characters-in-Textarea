(function() {
	'use strict';

	function ctrlClick(select) {
		const evt = new MouseEvent('click', {
			bubbles: true,
			cancelable: true,
			view: window,
			ctrlKey: true,
		});
		select.dispatchEvent(evt);
	}

	function keyup(input) {
		const evt = document.createEvent('KeyboardEvent');
		evt.initEvent('keyup', true, true);
		input.dispatchEvent(evt);
	}

	describe('suite', () => {
		it('test', () => {
			expect(1).toBe(1);
		});

		if (window.jscoverage_report) {
			window.jscoverage_report();
		}
	});
})();