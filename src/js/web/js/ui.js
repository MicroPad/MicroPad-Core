$('#new-notepad-title').keydown(e => {
	if (e.which === 13) {
		e.preventDefault();
		newNotepad();
		$('#new-notepad').modal('close');
	}
});

$('#new-section-title').keydown(e => {
	if (e.which === 13) {
		e.preventDefault();
		newSection();
		$('#new-section').modal('close');
	}
});

$('#new-note-title').keydown(e => {
	if (e.which === 13) {
		e.preventDefault();
		newNote();
		$('#new-note').modal('close');
	}
});

function showExplorer() {
	$('#viewer').removeClass('mobile');
	$('#notepad-explorer').show();
	$('#show-explorer').hide();
	isFullscreen = false;
}

var expUid = 0;
function updateNotepadExplorer() {
	expUid = 0;
	$('#notepad-explorer').html('<a href="javascript:toggleFullscreen();" style="color: white;">&raquo;</a> <strong>{0}</strong><ul id="exp-{1}-s"></ul>'.format(removeHTML(notepad.title), expUid));
	expUid++;

	for (var i = 0; i < notepad.sections.length; i++) {
		addSectionToExplorer(notepad, $('#notepad-explorer > ul'), notepad.sections[i], [i]);
	}

	toggleExplorer();
	autoExpandExplorer();
}

function addSectionToExplorer(parent, parentSelector, sec, currentPath) {
	var uid = expUid;
	expUid++;
	parentSelector.append('<li id="exp-{1}" explorer-path="{2}" onclick="toggleExplorer(event, {1});" oncontextmenu="event.stopPropagation();showContextMenu(event, \'{2}\', \'s\');return false;"><i class="material-icons">book</i> {0} <span onclick="event.stopPropagation();loadSectionFromExplorer(\'{2}\')">(Open)</span><ul id="exp-{1}-s" class="expandable"></ul></li>'.format(removeHTML(sec.title), uid, currentPath.join()));

	for (var i = 0; i < sec.sections.length; i++) {
		addSectionToExplorer(sec, $('#exp-'+uid+'-s'), sec.sections[i], currentPath.concat([i]));
	}

	for (var i = 0; i < sec.notes.length; i++) {
		$('#exp-'+uid+'-s').append('<li class="exp-note" onclick="event.stopPropagation();loadNoteFromExplorer(\'{1}\');" oncontextmenu="event.stopPropagation();showContextMenu(event, \'{1}\', \'n\');return false;"><i class="material-icons">note</i> {0}</li>'.format(removeHTML(sec.notes[i].title), currentPath.concat([i]).join()));
	}
}

function showContextMenu(event, currentPath, type) {
	switch (type) {
		case "s":
			loadSectionFromExplorer(currentPath);
			break;

		case "n":
			loadNoteFromExplorer(currentPath);
			break;
	}

	$('#explorer-menu').removeClass('hidden');
	$('#explorer-menu').attr('style', 'left: {0}; top: {1};'.format(event.pageX, event.pageY));
	return false;
}

function renameContext() {
	var existingTitle = "";
	if (note) {
		existingTitle = note.title;
	} else {
		existingTitle = parents[parents.length - 1].title;
	}

	updateTitle(ask("Rename:", existingTitle));
}

function deleteContext() {
	deleteOpen();
}

function toggleExplorer(event, uid, show) {
	if (event) event.stopPropagation();

	if (uid == undefined) {
		$('#notepad-explorer .expandable').toggle(1);
	}
	else {
		if (show) {
			$("#exp-"+uid+"-s").show(300);
		}
		else {
			$("#exp-"+uid+"-s").toggle(300);
		}
	}
}

function toggleFullscreen() {
	if (note) {
		if (!isFullscreen) {
			$('#viewer').addClass('mobile');
			$('#notepad-explorer').hide();
			Materialize.toast("Notepad Explorer hidden. Press \'F\' to show it again.", 1000);
			$('#show-explorer').show();
			isFullscreen = true;
		}
		else {
			showExplorer();
		}
	}
}

function autoExpandExplorer() {
	var currentPath = getCurrentPath();
	if (currentPath.length < 1) return;
	for (var i = 0; i < currentPath.length; i++) {
		var uid = $('[explorer-path="'+currentPath.slice(0, i+1).join()+'"]')[0].id.split('-')[1];
		toggleExplorer(undefined, uid, true);
	}
}

function mobileNav() {
	updateInstructions();
	if (isMobile()) {
		$('#viewer, #empty-viewer').addClass('mobile');
		$('#mob-np-dd').attr('data-activates', 'notepad-dropdown');
		$('#mob-np-dd').dropdown();
		$('#mob-s-dd').attr('data-activates', 'section-dropdown');
		$('#mob-n-dd').attr('data-activates', 'notes-dropdown');
		$('#mob-np-dd').dropdown();
		$('#mob-s-dd').dropdown();
		$('#mob-n-dd').dropdown();
	}
	else {
		$('#viewer, #empty-viewer').removeClass('mobile');
		$('#np-dd').attr('data-activates', 'notepad-dropdown');
		$('#np-dd').dropdown();
	}
}

function updateInstructions() {
	if (!notepad) {
		$('#empty-viewer').show();
		$('#instructions').html("You don't have a notepad open. Open or create one to <s>procrastinate</s> study.");
	}
	else if (parents.length === 1) {
		$('#empty-viewer').show();
		if (isMobile()) {
			$('#instructions').html("You can't put notes in notepads directly. Open the menu and use the sections menu to create a section.");
		}
		else {
			$('#instructions').html("Use the + button or the 'S' key to create a section. Or, use the <em>Notepad Explorer</em> to open a section.");
		}
	}
	else if (!note) {
		$('#empty-viewer').show();
		$('#instructions').html("You're in a section! You can either open/create a note or open/create a sub-section.");
	}
	else if (note.elements.length === 0) {
		$('#empty-viewer').show();
		$('#instructions').html("Welcome to your note! Press anywhere on here to insert an element.");
	}
	else {
		$('#empty-viewer').hide();
	}
}

function insertMarkdown(editor, type, openTag, closeTag) {
	if (/editor-preview-active/.test(editor.codemirror.getWrapperElement().lastChild.className)) return;

	closeTag = (typeof closeTag === 'undefined') ? openTag : closeTag;
	var cm = editor.codemirror;
	var text;
	var start = openTag;
	var end = closeTag;

	var startPoint = cm.getCursor('start');
	var endPoint = cm.getCursor('end');

	text = cm.getSelection();
	cm.replaceSelection(start + text + end);

	startPoint.ch += openTag.length;
	endPoint.ch = startPoint.ch + text.length;

	cm.setSelection(startPoint, endPoint);
	cm.focus();
}

var lastSpellchecked;
$(document).on('contextmenu', '.cm-spell-error', event => {
	event.stopPropagation();
	lastSpellchecked = event.target;

	if (!event.pageX) {
		let bounds = event.target.getBoundingClientRect();
		event.pageX = bounds.left;
		event.pageY = bounds.top;
	}
	console.log(event);

	var suggestions = dictionary.suggest(lastSpellchecked.innerHTML);
	$('#spellcheck-menu > ul').html('<li><em><a href="javascript:addToDictionary();">Add to dictionary</a></em></li>');
	if (suggestions.length > 0) {
		for (var i = 0; i < suggestions.length; i++) $('#spellcheck-menu > ul').append('<li><a href="javascript:replaceSpelling(\'{0}\');">{0}</a></li>'.format(suggestions[i]));
	}
	else {
		$('#spellcheck-menu > ul').append('<li>No suggestions</li>');
	}

	$('#spellcheck-menu').removeClass('hidden');
	$('#spellcheck-menu').attr('style', 'left: {0}; top: {1};'.format(event.pageX, event.pageY));

	event.preventDefault();
	return false;
});
$(document).on('click', event => {
	$('.context-menu').addClass('hidden');
});

$(document).on('contextmenu', '.CodeMirror-line', event => {
	if (event.originalEvent && event.originalEvent.button === 0) {
		let pos = simplemde.codemirror.getCursor();
		pos.line--;
		console.log(pos);

		var counter = 0;
		$('.CodeMirror-line').each(function(i) {
			if (i !== pos.line) return;
			
			$(this).find('span > span').each(function(j) {
				if (counter <= pos.ch) {
					counter += $(this).text().length;
				}
				else {
					console.log($(this));
					simplemde.codemirror.setCursor(pos);
					$(this).trigger('contextmenu');
					return false;
				}
			});

			return false;
		});

		event.preventDefault();
		return false;
	}
});

function replaceSpelling(replacement) {
	var word = simplemde.codemirror.findWordAt(simplemde.codemirror.getCursor());
	simplemde.codemirror.replaceRange(replacement, word.anchor, word.head);
}

function addToDictionary() {
	var wordPos = simplemde.codemirror.findWordAt(simplemde.codemirror.getCursor());
	var word = simplemde.codemirror.getLine(wordPos.anchor.line).substr(wordPos.anchor.ch, wordPos.head.ch-wordPos.anchor.ch);
	userDictionary.add(word.toLowerCase());
	appStorage.setItem("dictionary", Array.from(userDictionary));

	applyDictionary();
}

function applyDictionary() {
	$('.cm-spell-error').each(function(i) {
		if (userDictionary.has($(this).text().toLowerCase())) $(this).removeClass('cm-spell-error');
	});
}

$('#md-use-old-editor').change(event => {
	if (event.target.checked) {
		updateEditor(1);
	}
	else {
		updateEditor(0);
	}
});

function updateEditor(useOldEditor, init) {
	if (!init) appStorage.setItem("useOldEditor", useOldEditor);
	if (useOldEditor == 1) {
		$('#md-textarea-old').val(simplemde.value());
		$('#md-textarea-old').removeClass("hidden");

		$(simplemde.codemirror.getWrapperElement()).addClass("hidden");
		$('.editor-toolbar').addClass("hidden");
		$('.editor-statusbar').addClass("hidden");

		$('#md-use-old-editor').prop("checked", true);
	}
	else {
		simplemde.value($('#md-textarea-old').val());
		$('#md-textarea-old').addClass("hidden");

		$(simplemde.codemirror.getWrapperElement()).removeClass("hidden");
		$('.editor-toolbar').removeClass("hidden");
		$('.editor-statusbar').removeClass("hidden");

		$('#md-use-old-editor').prop("checked", false);
	}
}

function searchHashtag(hashtag) {
	$('#search-text').val(hashtag);
	$('#search').modal('open');
	$('#search-text').trigger('input');
}
