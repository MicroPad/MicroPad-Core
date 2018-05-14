function enableKeyboardShortcuts() {
	Mousetrap.bind('s', e => {
		if (parents.length > 0 && (!note || note.elements.length > 0)) {
			e.preventDefault();
			$('#new-section').modal('open');
		}
	});
	Mousetrap.bind('n', e => {
		if (parents[parents.length-1].notes && (!note || note.elements.length > 0)) {
			e.preventDefault();
			$('#new-note').modal('open');
		}
	});
	Mousetrap.bind('f', e => {
		toggleFullscreen();
	});
	Mousetrap.bind('e', e => {
		if (note && lastEditedElement) {
			e.preventDefault();
			$('#'+lastEditedElement.args.id).click();
		}
	});
	Mousetrap.bind('mod+f', e => {
		if (parents.length > 0 && (!note || note.elements.length > 0)) {
			e.preventDefault();
			$('#search').modal('open');
		}
	});
	Mousetrap.bind('mod+p', e => {
		if (note) {
			e.preventDefault();
			exportToPdf();
		}
	});
	Mousetrap.bind('mod+1', e => {
		if (parents.length > 0) {
			e.preventDefault();
			loadParent(0);
		}
	});
	Mousetrap.bind('mod+2', e => {
		if (parents.length > 1) {
			e.preventDefault();
			loadParent(1);
		}
	});
	Mousetrap.bind('mod+3', e => {
		if (parents.length > 2) {
			e.preventDefault();
			loadParent(2);
		}
	});
	Mousetrap.bind('mod+4', e => {
		if (parents.length > 3) {
			e.preventDefault();
			loadParent(3);
		}
	});
	Mousetrap.bind('mod+5', e => {
		if (parents.length > 4) {
			e.preventDefault();
			loadParent(4);
		}
	});
	Mousetrap.bind('mod+6', e => {
		if (parents.length > 5) {
			e.preventDefault();
			loadParent(5);
		}
	});
	Mousetrap.bind('mod+7', e => {
		if (parents.length > 6) {
			e.preventDefault();
			loadParent(6);
		}
	});
	Mousetrap.bind('mod+8', e => {
		if (parents.length > 7) {
			e.preventDefault();
			loadParent(7);
		}
	});
	Mousetrap.bind('mod+9', e => {
		if (parents.length > 8) {
			e.preventDefault();
			loadParent(8);
		}
	});
}
