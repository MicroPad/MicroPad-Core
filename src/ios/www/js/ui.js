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

appUi.onPageBeforeInit('note', page => {
	$$('#note-title').html(note.title);

	if (note.parent.title.length > 9) {
		backLabel = note.parent.title.substr(0, 8)+"&hellip;";
	} else {
		backLabel = note.parent.title;
	}

	$$('#parent-title').html(backLabel);
	// $('#viewer').panzoom();
});

appUi.onPageInit('note', page => {
	displayNote();
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
									notepad.lastModified = moment().format('YYYY-MM-DDTHH:mm:ss.SSSZ');
									saveNotepad();
								}
								else {
									//Delete a note
									obj.parent.notes = obj.parent.notes.filter(n => { return n !== obj; });
									$$(e.target).closest('li').remove();
									notepad.lastModified = moment().format('YYYY-MM-DDTHH:mm:ss.SSSZ');
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
							notepad.lastModified = moment().format('YYYY-MM-DDTHH:mm:ss.SSSZ');
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
							notepad.lastModified = moment().format('YYYY-MM-DDTHH:mm:ss.SSSZ');
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
	if (parent.notes) $$(parentElement).css('border-left', '5px solid {0}'.format(Please.make_color()));

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

function displayNote(delta) {
	appUi.showPreloader("Loading Note...");
	if (!delta) $('#viewer').html('');

	var elementCount = 0;
	for (let i = 0; i < note.elements.length; i++) {
		let element = note.elements[i];

		if (element.content !== "AS" && element.type !== "markdown") {
			try {
				let asset = new parser.Asset(dataURItoBlob(element.content));
				element.args.ext = asset.uuid;
				element.content = "AS";
				notepad.lastModified = moment().format('YYYY-MM-DDTHH:mm:ss.SSSZ');

				assetStorage.setItem(asset.uuid, asset.data).then(() => {
					if (!notepadAssets.has(asset)) notepadAssets.add(asset.uuid);
					displayElement(delta, element, (++elementCount === note.elements.length));
				});
			}
			catch(e) {
				note.elements.splice(note.elements.indexOf(element), 1);
				continue;
			}
		}
		else {
			displayElement(delta, element, (++elementCount === note.elements.length));
		}
	}

	function displayElement(delta, element, lastElement) {
		if (delta && $('#' + element.args.id).length) return;
		$('#viewer').append('<div id="{0}" class="drag z-depth-2" style="left: {1}; top: {2}; width: {3}; height: {4};"><p class="handle">::::</p></div>'.format(element.args.id, element.args.x, element.args.y, element.args.width, element.args.height))
		var elementDiv = document.getElementById(element.args.id);

		switch (element.type) {
			case "markdown":
				elementDiv.style.fontSize = element.args.fontSize;
				elementDiv.innerHTML += md.makeHtml(element.content);
				asciimath.translate(undefined, true);
				drawPictures();
				MathJax.Hub.Queue(["Typeset", MathJax.Hub]);

				var checkedTodoItems = $('#'+element.args.id+' .task-list-item input:checked');
				if (checkedTodoItems.length > 5) {
					todoShowToggle[element.args.id] = false;
					$(elementDiv).find('.handle').after($('<a class="hidden-todo-msg todo-toggle" href="javascript:showTodo(\'{0}\')">Toggle {1} Completed Items</a>'.format(element.args.id, checkedTodoItems.length)));
				}

				
				var inlineImages = [];
				element.content.replace(/!!\(([^]+?)\)/gi, (match, p1) => { inlineImages.push(p1); });
				element.content.replace(/!!\[([^]+?)\]/gi, (match, p1) => { inlineImages.push(p1); });

				if (inlineImages) {
					if (inlineImages) {
						for (let i = 0; i < inlineImages.length; i++) {
							let uuid = inlineImages[i];

							assetStorage.getItem(uuid, (err, blob) => {
								if (!blob) {
									setTimeout(() => {
										arguments.callee(err, blob);
									}, 500);
									return;
								}
								elementDiv.innerHTML = elementDiv.innerHTML.replace("!!\("+uuid+"\)", '<img src="{0}" />'.format(URL.createObjectURL(blob)));
								var drawingName = "inline-drawing-"+Math.random().toString(36).substring(7);
								elementDiv.innerHTML = elementDiv.innerHTML.replace("!!\["+uuid+"\]", '<img id="{1}" src="{0}" />'.format(URL.createObjectURL(blob), drawingName));
								if ($('#'+drawingName).length > 0) {
									var trimmed = false;
									$('#'+drawingName)[0].onload = function() {
										if (!trimmed) {
											trimmed = true;
											initDrawing($('#'+drawingName)[0]);
										}
									}
								}
							});
						}
					}
				}
				break;
			case "drawing":
				elementDiv.style.padding = "0px";

				assetStorage.getItem(element.args.ext).then(blob => {
					if (!notepadAssets.has(element.args.ext)) notepadAssets.add(element.args.ext);
					elementDiv.innerHTML += '<img class="drawing" style="width: auto; height: auto;" />';

					var trimmed = false;
					$(elementDiv).find('img')[0].onload = function() {
						if (!trimmed) {
							trimmed = true;
							initDrawing($(elementDiv).find('img')[0]);
						}
					};

					$(elementDiv).find('img')[0].src = URL.createObjectURL(blob);
				});
				break;
			case "image":
				elementDiv.style.padding = "0px";

				assetStorage.getItem(element.args.ext).then(blob => {
					if (!notepadAssets.has(element.args.ext)) notepadAssets.add(element.args.ext);
					elementDiv.innerHTML += '<img id="img_{1}" style="padding: 5px; width: 100%; height: auto;" src="{0}" />'.format(URL.createObjectURL(blob), element.args.id, element.args.width, element.args.height);
					elementDiv.style.padding = "0px";
				});
				break;
			case "file":
				elementDiv.innerHTML += '<div class="fileHolder" id="{4}" style="padding: 20px; height: {0}; width: {1};"><a href="javascript:downloadFile(\'{3}\');">{2}</a></div>'.format(element.args.height, element.args.width, element.args.filename, element.args.id);
				break;
			case "recording":
				$(elementDiv).addClass('recording');

				elementDiv.innerHTML += '<p class="recording-text"><em>{0}</em></p><audio controls="true" style="padding-top: 20px;"></audio>'.format(element.args.filename);
				assetStorage.getItem(element.args.ext).then(blob => {
					if (!notepadAssets.has(element.args.ext)) notepadAssets.add(element.args.ext);
					if (!delta) {
						$(elementDiv).find('audio')[0].src = URL.createObjectURL(blob);
					}
				});
				break;
		}

		if (lastElement) {
			appUi.stopPreloader();
			$('#viewer').removeClass('hidden');
			updateBib();
			setTimeout(function() {
				updateNote(undefined, true);
			}, 1000);
		}
	}
}

function showTodo(id, allOn) {
	if (allOn) {
		todoShowToggle[id] = false;
		$('#'+id+' .task-list-item input:checked').parentsUntil('#'+id).show();
	}
	else {
		todoShowToggle[id] = !todoShowToggle[id];
		if (!todoShowToggle[id]) {
			$('#'+id+' .task-list-item input:checked').parentsUntil('#'+id).show();
		}
		else {
			$('#'+id+' .task-list-item input:checked').parentsUntil('ul').hide();
		}
	}

	resizePage($('#'+id), false);
}

function updateNote(id, init) {
	for (k in note.elements) {
		var element = note.elements[k];
		var sel = $('#' + element.args.id);
		element.args.x = $('#' + element.args.id).css('left');
		element.args.y = $('#' + element.args.id).css('top');
		if ($('#' + element.args.id)[0]) {
			element.args.width = $('#' + element.args.id)[0].style.width;
			element.args.height = $('#' + element.args.id)[0].style.height;
		}

		resizePage($('#' + element.args.id));
		if (!init) notepad.lastModified = moment().format('YYYY-MM-DDTHH:mm:ss.SSSZ');
		saveToBrowser();
	}
}

appUi.onPageBeforeInit('index', page => {
	if (hasLoadedStorage) updateNotepadList();
});

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
										notepad.lastModified = moment().format('YYYY-MM-DDTHH:mm:ss.SSSZ');
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
		notepad.lastModified = moment().format('YYYY-MM-DDTHH:mm:ss.SSSZ');
		saveNotepad(displayNotepad);
	}, "New Section", ["Create", "Cancel"]);
}

function resizePage(element) {
	if (parseInt($(element).css('left')) + $(element).width() + 1000 > parseInt($('#content').css('width'))) {
		$('#content').css('width', parseInt($(element).css('left')) + $(element).width() + 1000 + 'px');
	}
	if (parseInt($(element).css('top')) + $(element).height() + 1000 > parseInt($('#content').css('height'))) {
		$('#content').css('height', parseInt($(element).css('top')) + $(element).height() + 1000 + 'px');
	}
}
