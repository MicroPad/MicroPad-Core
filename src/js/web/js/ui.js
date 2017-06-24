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
	$('#notepad-explorer').html('<strong>{0}</strong><ul id="exp-{1}-s"></ul>'.format(notepad.title, expUid));
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
	parentSelector.append('<li id="exp-{1}" explorer-path="{2}" onclick="toggleExplorer(event, {1});" oncontextmenu="event.stopPropagation();showContextMenu(\'{2}\', \'s\');return false;"><i class="material-icons">book</i> {0} <span onclick="event.stopPropagation();loadSectionFromExplorer(\'{2}\')">(Open)</span><ul id="exp-{1}-s" class="expandable"></ul></li>'.format(sec.title, uid, currentPath.join()));

	for (var i = 0; i < sec.sections.length; i++) {
		addSectionToExplorer(sec, $('#exp-'+uid+'-s'), sec.sections[i], currentPath.concat([i]));
	}

	for (var i = 0; i < sec.notes.length; i++) {
		$('#exp-'+uid+'-s').append('<li class="exp-note" onclick="event.stopPropagation();loadNoteFromExplorer(\'{1}\');" oncontextmenu="event.stopPropagation();showContextMenu(\'{1}\', \'n\');return false;"><i class="material-icons">note</i> {0}</li>'.format(sec.notes[i].title, currentPath.concat([i]).join()));
	}
}

function showContextMenu(currentPath, type) {
	switch (type) {
		case "s":
			loadSectionFromExplorer(currentPath);
			$('#menu-button').sideNav('show');
			break;

		case "n":
			loadNoteFromExplorer(currentPath);
			setTimeout(() => {$('#menu-button').sideNav('show');}, 900)
			break;
	}
	return false;
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
