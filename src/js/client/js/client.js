var notepad;
var parents = [];
var note;
var noteID;
var sectionIDs = [];

//Setup md parser
var md = new showdown.Converter({
	parseImgDimensions: true,
	simplifiedAutoLink: true,
	strikethrough: true,
	tables: true,
	tasklists: true
});

document.addEventListener("DOMContentLoaded", function(event) {
	document.getElementById("upload").addEventListener("change", function(event) {
		$('#upload').hide();
		readFileInputEventAsText(event, function(text) {
			parser.parse(text);
			while (!parser.notepad) if (parser.notepad) break;
			notepad = parser.notepad;
			parents.push(notepad);
			
			$('#selectorTitle').html(notepad.title);
			for (k in notepad.sections) {
				var section = notepad.sections[k];
				$('#sectionList').append('<li><a href="javascript:loadSection({0});">{1}</a></li>'.format(k, section.title));
			}
		});
	}, false);

	interact('.interact').draggable({
		onmove: dragMoveListener,
		onend: function (event) {
			updateNote(event.target.id);

		},
		inertia: false,
		autoScroll: true
	}).resizable({
		preserveAspectRatio: false,
		edges: {left: false, right: true, bottom: true, top: false},
		onend: function (event) {
			updateNote(event.target.id);
		}
	}).on('resizemove', function(event) {
		$(event.target).css('width', parseInt($(event.target).css('width'))+event.dx);
		$(event.target).css('height', parseInt($(event.target).css('height'))+event.dy);
	}).on('tap', function(event) {
		for (k in note.elements) {
			var element = note.elements[k];
			if (element.args.id == event.currentTarget.id) {
				switch (element.type) {
					case "markdown":
						$('#mdEditor > input').val('');
						var source = undefined;
						for (var i = 0; i < note.bibliography.length; i++) {
							var mSource = note.bibliography[i];
							if (mSource.item == element.args.id) {
								source = mSource;
								$('#mdEditor > input').val(source.contents);
								break;
							}
						}

						$('#mdEditor > textarea').val(element.content);
						$('#mdEditor > textarea').unbind();
						$('#mdEditor > textarea').bind('input propertychange', function() {
							element.content = $('#mdEditor > textarea').val();
							$('#'+event.currentTarget.id).html(md.makeHtml(element.content));
						});


						$('#mdEditor').one($.modal.BEFORE_CLOSE, function(event, modal) {
							asciimath.translate(undefined, true);
							MathJax.Hub.Typeset();

							if (source) {
								source.contents = $('#mdEditor > input').val();
							}
							else {
								note.bibliography.push({
									id: note.bibliography.length+1,
									item: element.args.id,
									contents: $('#mdEditor > input').val()
								});
							}
							updateBib();
						});

						$('#mdEditor').modal({fadeDuration: 250});
						break;
				}
				break;
			}
		}
	});

	function dragMoveListener(event) {
		$(event.target).css('left', parseInt($(event.target).css('left'))+event.dx);
		$(event.target).css('top', parseInt($(event.target).css('top'))+event.dy);

		//Update reference
		if ($('#source_'+event.target.id).length) {
			$('#source_'+event.target.id).css('left', parseInt($('#'+event.target.id).css('left'))+parseInt($('#'+event.target.id).css('width'))+10+"px");
			$('#source_'+event.target.id).css('top', $('#'+event.target.id).css('top'));
		}
	}
	window.dragMoveListener = dragMoveListener;
});

function updateNote(id) {
	for (k in note.elements) {
		var element = note.elements[k];
		var sel = $('#'+id);
		element.args.x = $('#'+id).css('left');
		element.args.y = $('#'+id).css('top');
		element.args.width = $('#'+id).css('width');
		element.args.height = $('#'+id).css('height');
	}
	// parents[parents.length-1].notes[noteID] = note;
	// parents[parents.length-2].sections[sectionIDs[sectionIDs.length-1]] = parents[parents.length-1];
	// for (var i = parents.length-3; i >= 0; i--) {
	// 	parents[i].sections[sectionIDs[i+1]] = parents[i+1];
	// }
	// notepad = parents[0];
}

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

function loadNote(id) {
	$('#sectionListHolder').hide();
	$('#viewer').html('');
	note = parents[parents.length-1].notes[id];
	document.title = note.title+" - µPad";

	for (var i = 0; i < note.elements.length; i++) {
		var element = note.elements[i];
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
				alert("Tables aren't supported yet");
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
		$('#viewer').append('<div id="source_{4}" style="top: {2}; left: {3};"><a target="_blank" href="{1}">{0}</a></div>'.format('['+source.id+']', source.contents, parseInt(item.css('top')), parseInt(item.css('left'))+parseInt(item.css('width'))+10+"px", source.item));
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
