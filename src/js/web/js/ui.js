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
	parentSelector.append('<li id="exp-{1}" explorer-path="{2}" onclick="toggleExplorer(event, {1});"><i class="material-icons">book</i> {0} <span onclick="event.stopPropagation();loadSectionFromExplorer(\'{2}\')">(Open)</span><ul id="exp-{1}-s" class="expandable"></ul></li>'.format(sec.title, uid, currentPath.join()));

	for (var i = 0; i < sec.sections.length; i++) {
		addSectionToExplorer(sec, $('#exp-'+uid+'-s'), sec.sections[i], currentPath.concat([i]));
	}

	for (var i = 0; i < sec.notes.length; i++) {
		$('#exp-'+uid+'-s').append('<li class="exp-note" onclick="event.stopPropagation();loadNoteFromExplorer(\'{1}\');"><i class="material-icons">note</i> {0}</li>'.format(sec.notes[i].title, currentPath.concat([i]).join()));
	}
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
