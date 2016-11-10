var notepad;
var parent;

document.addEventListener("DOMContentLoaded", function(event) {
	document.getElementById("upload").addEventListener("change", function(event) {
		readFileInputEventAsText(event, function(text) {
			parser.parse(text);
			while (!parser.notepad) if (parser.notepad) break;
			notepad = parser.notepad;
			parent = notepad;
			
			$('#selectorTitle').html(notepad.title);
			for (k in notepad.sections) {
				var section = notepad.sections[k];
				$('#sectionList').append('<li><a href="javascript:loadSection({0});">{1}</a></li>'.format(k, section.title));
			}
		});
	}, false);
});

function clearSelector() {
	$('#selectorTitle').html('');
	$('#sectionList').html('');
	$('#noteList').html('');
}

function loadSection(id) {
	clearSelector();
	var section = parent.sections[id];
	parent = section;

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

function readFileInputEventAsText(event, callback) {
	var file = event.target.files[0];

	var reader = new FileReader();
	
	reader.onload = function() {
		var text = reader.result;
		callback(text);
	};
	
	reader.readAsText(file);
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
