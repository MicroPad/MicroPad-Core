// Initialize your app
var appUi = new Framework7({
	init: false,
	tapHold: true
});

// Export selectors engine
var $$ = Dom7;

// Add view
var mainView = appUi.addView('.view-main', {
	dynamicNavbar: true
});

var npObjIndex;
var notepadObjects;

appUi.onPageBeforeInit('notepad', page => {
	$$('#notepad-title').html(notepad.title);
	displayNotepad();
});

function displayNotepad() {
	npObjIndex = 0;
	notepadObjects = [];

	//Add sections/notes to the accordion
	$$('#accordion-holder').html('');
	insertAccordions($$('#accordion-holder')[0], notepad);

	$$('.accordion-item').off('taphold');
	$$('.accordion-item').on('taphold', e => {
		e.stopPropagation();
		var obj = notepadObjects[$$(e.target).closest('li')[0].id.split("npobj-")[1]];
		var buttons = [
			[
				{
					text: "Delete",
					color: "red",
					onClick: () => {
						navigator.notification.confirm("Are you sure you want to delete this?", buttonIndex => {
							if (buttonIndex === 1) {
								if (obj.sections) {
									//Delete a section
									obj.parent.sections = obj.parent.sections.filter(s => { return s !== obj; });
									$$(e.target).closest('li').remove();
									saveNotepad();
								}
								else {
									//Delete a note
									obj.parent.notes = obj.parent.notes.filter(n => { return n !== obj; });
									$$(e.target).closest('li').remove();
									saveNotepad();
								}
							}
						}, "Delete", ["Yes", "No"]);
					}
				},
				{
					text: "Rename",
					onClick: () => {
						navigator.notification.prompt("Notepad Title:", (results) => {
							if (results.buttonIndex !== 1 || results.input1.length < 1) return;

							var title = results.input1;
							obj.title = title;
							$$(e.target).find('.item-title').add($$(e.target).closest('.item-title')).text(title);
							saveNotepad();
						}, "Rename", ["Rename", "Cancel"]);
					}
				}
			]
		];

		if (obj.sections) {
			let moreButtons = [
				{
					text: "New Note",
					onClick: () => {
						navigator.notification.prompt("Note Title:", (results) => {
							if (results.buttonIndex !== 1 || results.input1.length < 1) return;

							var title = results.input1;
							var n = parser.createNote(title, ["asciimath"]);
							n.parent = obj;
							obj.addNote(n);
							notepadObjects.push(n);
							saveNotepad();

							var selection = $$(e.target).closest('li').find('.note-holder');
							$$(selection[selection.length - 1]).append('<li id="npobj-{1}"><a href="javascript:loadNote(\'{1}\');" class="item-link item-content note-item"><div class="item-inner"><div class="item-title">{0}</div></div></a></li>'.format(n.title, npObjIndex++));
						}, "New Note", ["Create", "Cancel"]);
					}
				},
				{
					text: "New Section",
					onClick: () => {
						newSection(obj);
					}
				}
			];
			buttons.push(moreButtons);
		}

		appUi.actions(e.target, buttons);
	});
}

function insertAccordions(parentElement, parent) {

	$$(parentElement).html('<div class="content-block-title">Sections</div><div class="list-block"><ul class="section-holder" /></div><div class="content-block-title">Notes</div><div class="list-block"><ul class="note-holder" /></div>');
	if (parent.notes) $$(parentElement).css('border-left', '5px solid {0}'.format(Please.make_color({from_hash: parent.title})));

	for (var i = 0; i < parent.sections.length; i++) {
		var section = parent.sections[i];
		notepadObjects.push(section);
		var sectionAccordion = $$('<li id="npobj-{1}" class="accordion-item"><a href="#!" class="item-link item-content section-item"><div class="item-inner"><div class="item-title">{0}</div></div></a><div class="accordion-item-content" /></li>'.format(section.title, npObjIndex++));
		$$($$(parentElement).find('ul.section-holder')[0]).append(sectionAccordion);
		insertAccordions(sectionAccordion.find(".accordion-item-content"), section);
	}

	if (!parent.notes) return;
	for (var i = 0; i < parent.notes.length; i++) {
		var n = parent.notes[i];
		notepadObjects.push(n);
		var noteList = $$('<li id="npobj-{1}"><a href="javascript:loadNote(\'{1}\');" class="item-link item-content note-item"><div class="item-inner"><div class="item-title">{0}</div></div></a></li>'.format(n.title, npObjIndex++));
		$$(parentElement).find('ul.note-holder').append(noteList);
	}
}

appUi.onPageReinit('index', updateNotepadList);

function updateNotepadList() {
	notepadStorage.keys((err, keys) => {
		$$('#notepadList').html('');
		for (var i = 0; i < keys.length; i++) {
			var key = keys[i];
			$$('#notepadList').append('<li><a href="javascript:loadNotepad(\'{1}\');" class="item-link item-content notepad-item"><div class="item-inner"><div class="item-title">{0}</div></div></a></li>'.format(key, key.replace(/[\\"']/g, '\\$&').replace(/\u0000/g, '\\0')));
		}

		$$('#notepadList > li > a').off('taphold');
		$$('#notepadList > li > a').on('taphold', e => {
			var notepadTitle = $$(e.currentTarget).find('.item-title').text();

			var buttons = [
				[
					{
						text: "Delete",
						color: "red",
						onClick: () => {
							navigator.notification.confirm("Are you sure you want to delete this notepad?", buttonIndex => {
								if (buttonIndex === 1) {
									notepadStorage.removeItem(notepadTitle, () => {
										notepad = undefined;
										updateNotepadList();
									});
								}
							}, "Delete Notepad", ["Yes", "No"]);
						}
					},
					{
						text: "Rename",
						onClick: () => {
							navigator.notification.prompt("Notepad Title:", (results) => {
								if (results.buttonIndex !== 1 || results.input1.length < 1) return;

								var title = results.input1;
								notepadStorage.getItem(notepadTitle, function(err, res) {
									if (err || res === null) return;

									res = JSON.parse(res);
									notepad = parser.restoreNotepad(res);
									notepad.notepadAssets = res.notepadAssets;
									notepad.title = title;

									notepadStorage.removeItem(notepadTitle, () => {
										saveNotepad(updateNotepadList);
									});
								});
							}, "Rename Notepad", ["Rename", "Cancel"]);
						}
					}
				]
			];
			appUi.actions(e.target, buttons);
		});
	});
}

function newNotepad() {
	navigator.notification.prompt("Notepad Title:", (results) => {
		if (results.buttonIndex !== 1 || results.input1.length < 1) return;

		var title = results.input1;
		notepad = parser.createNotepad(title);

		var demoNote = parser.createNote("Example Note", ['asciimath']);
		var demoSection = parser.createSection("Example Section");
		demoSection.addNote(demoNote);
		notepad.addSection(demoSection);

		saveNotepad(() => {
			updateNotepadList();
			initNotepad();
		});

	}, "New Notepad", ["Create", "Cancel"]);
}

function addSectionBtn() {
	newSection(notepad);
}

function newSection(parent) {
	navigator.notification.prompt("Section Title:", (results) => {
		if (results.buttonIndex !== 1 || results.input1.length < 1) return;

		var title = results.input1;
		var s = parser.createSection(title);
		s.parent = parent;
		parent.addSection(s);
		notepadObjects.push(s);
		saveNotepad(displayNotepad);
	}, "New Section", ["Create", "Cancel"]);
}
