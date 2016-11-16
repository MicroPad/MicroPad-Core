var notepad;
var parents = [];
var note;
var noteID;
var sectionIDs = [];
var lastClick = {x: 0, y: 0};

/** Setup localforage */
localforage.config({
	name: 'uPad',
	version: 1.0,
	storeName: 'notepads'
});

document.addEventListener("DOMContentLoaded", function(event) {
	window.initNotepad = function() {
		parents = [];
		note;
		noteID;
		sectionIDs = [];
		lastClick = {x: 0, y: 0};

		parents.push(notepad);	

		//Clear old lists
		$('#sectionList').html('');
		$('#noteList').html('');
		$('#parents > span:not(#open-note)').remove();
		$('#open-note').hide();

		$('<span class="breadcrumb">{0}</span>'.format(notepad.title)).insertBefore('#open-note');
		for (k in notepad.sections) {
			var section = notepad.sections[k];
			$('#sectionList').append('<li><a href="javascript:loadSection({0});">{1}</a></li>'.format(k, section.title));
		}
		$('#add-section-link').css('display', 'block');
		$('#add-note-link').css('display', 'none');
	}

	/** Get the open notepads */
	updateNotepadList();

	/** Handle Notepad Upload */
	document.getElementById("upload").addEventListener("change", function(event) {
		readFileInputEventAsText(event, function(text) {
			parser.parse(text, ["asciimath"]);
			while (!parser.notepad) if (parser.notepad) break;
			notepad = parser.notepad;

			window.initNotepad();
			saveToBrowser();
		});
	}, false);

	$('.modal').modal();
});

function newNotepad() {
	var title = $('#new-notepad-title').val();
	notepad = parser.createNotepad(title);
	window.initNotepad();
	saveToBrowser();

	$('#new-notepad-title').val('');
}

function updateNotepadList() {
	$('#notepadList').html('');
	localforage.iterate(function(value, key, i) {
		$('#notepadList').append('<li><a href="javascript:loadFromBrowser(\'{0}\');">{0}</a></li>'.format(key));
	});
}


function updateSelector() {
	//TODO: Loop through parents and make any <span> tags into <a> tags
	$('<span class="breadcrumb">{0}</span>'.format(parents[parents.length-1].title)).insertBefore('#open-note');
	$('#sectionList').html('');
	$('#noteList').html('');

	if (parents.length > 0) $('#add-section-link').css('display', 'block');
	if (parents.length > 1) $('#add-note-link').css('display', 'block');
}

function loadSection(id) {
	var section = parents[parents.length-1].sections[id];
	sectionIDs.push(id);
	parents.push(section);
	note = undefined;
	$('#open-note').hide()
	updateSelector();

	$('#selectorTitle').html(section.title);
	for (k in section.sections) {
		var mSection = section.sections[k];
		$('#sectionList').append('<li><a href="javascript:loadSection({0});">{1}</a></li>'.format(k, mSection.title));
	}

	for (k in section.notes) {
		var note = section.notes[k];
		$('#noteList').append('<li><a href="javascript:loadNote({0});">{1}</a></li>'.format(k, note.title));
	}
}

function loadNote(id, delta) {
	//TODO: Load note in viewer.html in the iframe
	noteID = id;
	oldNote = note;
	note = parents[parents.length-1].notes[id];
	// var newBC = '<span class="breadcrumb">{0}</span>'.format(note.title);
	// if (!oldNote) {
	// 	$('#parents').append(newBC);
	// }
	// else {
	// 	$('#parents span:last-child').html(newBC);
	// }
	$('#open-note').html(note.title);
	$('#open-note').show();
}

function updateBib() {
	for (var i = 0; i < note.bibliography.length; i++) {
		var source = note.bibliography[i];
		if ($('#source_'+source.item).length) $('#source_'+source.item).remove();
		if (source.contents.length < 1) continue;
		var item = $('#'+source.item);
		$('#viewer').append('<div id="source_{4}" style="top: {2}; left: {3};"><a target="_blank" href="{1}">{0}</a></div>'.format('['+source.id+']', source.contents, parseInt(item.css('top')), parseInt(item.css('left'))+parseInt(item.css('width'))+20+"px", source.item));
	}
	saveToBrowser();
}

function readFileInputEventAsText(event, callback) {
	var file = event.target.files[0];

	var reader = new FileReader();
	
	reader.onload = function() {
		var text = reader.result;
		callback(text);
	};
	
	reader.readAsText(file);
}

/** Make sure the page is always larger than it's elements */
function resizePage(selElement) {
	if (parseInt(selElement.css('left'))+parseInt(selElement.css('width'))+1000 > parseInt($('#viewer').css('width'))) $('#viewer').css('width', parseInt(selElement.css('left'))+1000+'px');
	if (parseInt(selElement.css('top'))+parseInt(selElement.css('height'))+1000 > parseInt($('#viewer').css('height'))) $('#viewer').css('height', parseInt(selElement.css('top'))+parseInt(selElement.css('height'))+1000+'px');
}

var tooBig = '';
function saveToBrowser(retry) {
	/*
		I want to use the Filesystem and FileWriter API for this (https://www.html5rocks.com/en/tutorials/file/filesystem/)
		but only Chrome and Opera support it. For now I'll use IndexedDB with a sneaky async library.
	 */
	// var compressedNotepad = window.pako.deflate(JSON.stringify(notepad), {to: 'string'});
	try {
		localforage.setItem(notepad.title, notepad, function() {
			updateNotepadList();
		});
	}
	catch (e) {
		if (retry && notepad.title != tooBig) {
			alert("This notepad is too big to fit in your browser's storage. To keep changes make sure to download it.")
			notepad.title = tooBig;
		}
		else if (notepad.title != tooBig) {
			localforage.clear();
			saveToBrowser(true);
		}
	}
}

function loadFromBrowser(title) {
	localforage.getItem(title, function(err, res) {
		// notepad = JSON.parse(window.pako.inflate(res, {to: 'string'}));
		notepad = res;
		window.initNotepad();
	});
}

/** Utility functions */
function toBase64(str) {
	return window.btoa(unescape(encodeURIComponent(str)));
}

function fromBase64(str) {
	return decodeURIComponent(escape(window.atob(str)));
}

// Thanks to http://stackoverflow.com/a/4673436/998467
if (!String.prototype.format) {
	String.prototype.format = function() {
		var args = arguments;
		return this.replace(/{(\d+)}/g, function(match, number) { 
			return typeof args[number] != 'undefined'
				? args[number]
				: match
			;
		});
	};
}
