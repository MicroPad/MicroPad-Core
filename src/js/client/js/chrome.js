var notepad;
var parents = [];
var note;
var noteID;
var sectionIDs = [];
var lastClick = {x: 0, y: 0};

/** Setup md parser */
var md = new showdown.Converter({
	parseImgDimensions: true,
	simplifiedAutoLink: true,
	strikethrough: true,
	tables: true,
	tasklists: true
});

/** Setup localforage */
localforage.config({
	name: 'uPad',
	version: 1.0,
	storeName: 'notepads'
});

document.addEventListener("DOMContentLoaded", function(event) {
	document.getElementById("upload").addEventListener("change", function(event) {
		readFileInputEventAsText(event, function(text) {
			parser.parse(text, ["asciimath"]);
			while (!parser.notepad) if (parser.notepad) break;
			notepad = parser.notepad;

			window.initNotepad();
			saveToBrowser();
		});
	}, false);

	window.initNotepad = function() {
		console.log(notepad);
		parents.push(notepad);
	
		parents = [];
		note;
		noteID;
		sectionIDs = [];
		lastClick = {x: 0, y: 0};

		$('#parents').html('<span class="breadcrumb">{0}</span>'.format(notepad.title));
		for (k in notepad.sections) {
			var section = notepad.sections[k];
			$('#sectionList').append('<li><a href="javascript:loadSection({0});">{1}</a></li>'.format(k, section.title));
		}
	}

});


function clearSelector() {
	$('#selectorTitle').html('');
	$('#sectionList').html('');
	$('#noteList').html('');
}

function loadSection(id) {
	clearSelector();
	var section = parents[parents.length-1].sections[id];
	sectionIDs.push(id);
	parents.push(section);

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
	if (!delta) {
		$('#sectionListHolder').hide();
		$('#viewer').show();
		$('#viewer').html('');
		noteID = id;
		note = parents[parents.length-1].notes[id];
		document.title = note.title+" - µPad";
	}

	for (var i = 0; i < note.elements.length; i++) {
		var element = note.elements[i];
		if (delta && $('#'+element.args.id).length) continue;
		switch (element.type) {
			case "markdown":
				$('#viewer').append('<div class="interact" id="{6}" style="top: {0}; left: {1}; height: {2}; width: {3}; font-size: {4};">{5}</div>'.format(element.args.y, element.args.x, element.args.height, element.args.width, element.args.fontSize, md.makeHtml(element.content), element.args.id));
				asciimath.translate(undefined, true);
				MathJax.Hub.Typeset();
				break;
			case "image":
				$('#viewer').append('<img class="interact" id="{4}" style="top: {0}; left: {1}; height: {2}; width: {3};" src="{5}" />'.format(element.args.y, element.args.x, element.args.height, element.args.width, element.args.id, element.content));
				break;
			case "table":
				$('#viewer').append('<table class="interact" id="{0}" style="top: {1}; left: {2}; height: auto; width: auto;"></table>'.format(element.args.id, element.args.y, element.args.x, element.args.height, element.args.width));
				for (var j = 0; j < element.content.length; j++) {
					var row = element.content[j];
					var rowHTML = '<tr>';
						for (var l = 0; l < row.length; l++) {
							var cell = row[l];
							rowHTML += '<td>{0}</td>'.format(md.makeHtml(cell));
						}
					rowHTML += '</tr>';
					$('#'+element.args.id).append(rowHTML);
				}
				asciimath.translate(undefined, true);
				MathJax.Hub.Typeset();
				break;
		}
	}
	updateBib();
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
		localforage.setItem(notepad.title, notepad);
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
		console.log("Loading: "+title);
		console.log(res);
		// notepad = JSON.parse(window.pako.inflate(res, {to: 'string'}));
		notepad = res;
		parents = [];
		note = undefined;
		noteID = undefined;
		sectionIDs = [];
		lastClick = {x: 0, y: 0};
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
