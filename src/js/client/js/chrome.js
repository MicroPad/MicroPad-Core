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

/** Setup md parser */
showdown.extension('math', function() {
    var matches = [];
    return [
        { 
            type: 'lang',
            regex: /===([^]+?)===/gi,
            replace: function(s, match) { 
                matches.push('==='+match+'===');
                var n = matches.length - 1;
                return '%PLACEHOLDER' + n + '%';
            }
        },
        {
            type: 'output',
            filter: function (text) {
                for (var i=0; i< matches.length; ++i) {
                    var pat = '%PLACEHOLDER' + i + '%';
                    text = text.replace(new RegExp(pat, 'gi'), matches[i]);
                }
                console.log(text);
                console.log(matches);
                //reset array
                matches = [];
                return text;
            }
        }
    ]
});
var md = new showdown.Converter({
	parseImgDimensions: true,
	simplifiedAutoLink: true,
	strikethrough: true,
	tables: true,
	tasklists: true,
	prefixHeaderId: 'mdheader',
	smoothLivePreview: true,
	extensions: ['math']
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
		$('#viewer').html('');
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
	
	$('.modal').modal();

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


	/** Listen for when new elements are added to #viewer */
	var observer = new MutationObserver(function(mutations) {
		mutations.forEach(function(mutation) {
			saveToBrowser();
			for (k in mutation.addedNodes) {
				var selElement = $('#'+mutation.addedNodes[k].id);
				resizePage(selElement);
			}
		});
	});
	observer.observe(document.getElementById('viewer'), {attributes: false, childList: true, characterData: true});

	/** Creating elements */
	$('#viewer').click(function (e) {
		if (e.target == this && note) {
			lastClick.x = e.pageX;
			lastClick.y = e.pageY;
			// $('#insert').modal('open');
		}
	});

	/** Editing elements */
	var justMoved = false;
	interact('.interact').draggable({
		onmove: dragMoveListener,
		onend: function (event) {
			updateNote(event.target.id);
			justMoved = true;
		},
		inertia: false,
		autoScroll: true
	}).resizable({
		preserveAspectRatio: false,
		edges: {left: false, right: true, bottom: true, top: false},
		onend: function (event) {
			updateNote(event.target.id);
			justMoved = true;
		}
	}).on('resizemove', function(event) {
		$(event.target).css('width', parseInt($(event.target).css('width'))+event.dx);
		$(event.target).css('height', parseInt($(event.target).css('height'))+event.dy);
		resizePage($(event.target));
		updateReference(event);
		justMoved = true;
	}).on('click', function(event) {
		if (justMoved) {
			justMoved = false;
			return;
		}
		var currentTarget = $('#'+event.currentTarget.id);
		for (k in note.elements) {
			var element = note.elements[k];
			if (element.args.id == event.currentTarget.id) {
				switch (element.type) {
					case "markdown":
						$('#mdsw').val('');
						var source = undefined;
						for (var i = 0; i < note.bibliography.length; i++) {
							var mSource = note.bibliography[i];
							if (mSource.item == element.args.id) {
								source = mSource;
								$('#mdsw').val(source.contents);
								break;
							}
						}

						$('#md-textarea').val(element.content);
						$('#md-textarea').unbind();
						$('#md-textarea').bind('input propertychange', function() {
							element.content = $('#md-textarea').val();
							currentTarget.html(md.makeHtml(element.content));
							updateReference(event);
						});

						$('#mdfs').val(element.args.fontSize);
						$('#mdfs').val(element.args.fontSize);
						$('#mdfs').unbind();
						$('#mdfs').bind('input propertychange', function() {
							element.args.fontSize = $('#mdfs').val();
							currentTarget.css('font-size', element.args.fontSize);
							updateReference(event);
						});

						$('#mdw').val(element.args.width);
						$('#mdw').val(element.args.width);
						$('#mdw').unbind();
						$('#mdw').bind('input propertychange', function() {
							element.args.width = $('#mdw').val();
							currentTarget.css('width', element.args.width);
							updateReference(event);
						});

						$('#mdh').val(element.args.height);
						$('#mdh').val(element.args.height);
						$('#mdh').unbind();
						$('#mdh').bind('input propertychange', function() {
							element.args.height = $('#mdh').val();
							currentTarget.css('height', element.args.height);
							updateReference(event);
						});

						$('#mdEditor').modal({
							complete: function() {
								asciimath.translate(undefined, true);
								MathJax.Hub.Typeset();

								if (source) {
									source.contents = $('#mdsw').val();
								}
								else {
									note.bibliography.push({
										id: note.bibliography.length+1,
										item: element.args.id,
										contents: $('#mdsw').val()
									});
								}
								updateBib();
							}
						});
						$('#mdEditor').modal('open');
						break;

					case "table":
						alert("Tables are not supported yet");
						break;

					case "image":
						var source = undefined;
						for (var i = 0; i < note.bibliography.length; i++) {
							var mSource = note.bibliography[i];
							if (mSource.item == element.args.id) {
								source = mSource;
								$('#imageEditor > input[name="source"]').val(source.contents);
								break;
							}
						}

						$('#imageEditor > input[name="upload"]').unbind();
						$('#imageEditor > input[name="upload"]').bind('change', function(event) {
							var reader = new FileReader();
							var file = event.target.files[0];
							if (!file) return;
							reader.readAsDataURL(file);

							reader.onload = function() {
								element.content = reader.result;
								currentTarget.attr('src', element.content);
								updateReference(event);
							}
						});

						$('#imageEditor > input[name="width"]').val(element.args.width);
						$('#imageEditor > input[name="width"]').val(element.args.width);
						$('#imageEditor > input[name="width"]').unbind();
						$('#imageEditor > input[name="width"]').bind('input propertychange', function() {
							element.args.width = $('#imageEditor > input[name="width"]').val();
							currentTarget.css('width', element.args.width);
							updateReference(event);
						});

						$('#imageEditor > input[name="height"]').val(element.args.height);
						$('#imageEditor > input[name="height"]').val(element.args.height);
						$('#imageEditor > input[name="height"]').unbind();
						$('#imageEditor > input[name="height"]').bind('input propertychange', function() {
							element.args.height = $('#imageEditor > input[name="height"]').val();
							currentTarget.css('height', element.args.height);
							updateReference(event);
						});

						$('#imageEditor').one($.modal.BEFORE_CLOSE, function(event, modal) {
							if (source) {
								source.contents = $('#imageEditor > input[name="source"]').val();
							}
							else {
								note.bibliography.push({
									id: note.bibliography.length+1,
									item: element.args.id,
									contents: $('#imageEditor > input[name="source"]').val()
								});
							}
							updateBib();
						});

						$('#imageEditor').modal({fadeDuration: 250});
						break;

					case "file":
						var source = undefined;
						for (var i = 0; i < note.bibliography.length; i++) {
							var mSource = note.bibliography[i];
							if (mSource.item == element.args.id) {
								source = mSource;
								$('#fileEditor > input[name="source"]').val(source.contents);
								break;
							}
						}

						$('#fileEditor > input[name="upload"]').unbind();
						$('#fileEditor > input[name="upload"]').bind('change', function(event) {
							var reader = new FileReader();
							var file = event.target.files[0];
							console.log(file);
							reader.readAsDataURL(file);

							reader.onload = function() {
								element.content = reader.result;
								element.args.filename = $('#fileEditor > input[name="upload"]').val();
								currentTarget.attr('href', element.content);
								currentTarget.html(element.args.filename);
								updateReference(event);
							}
						});

						$('#fileEditor').one($.modal.BEFORE_CLOSE, function(event, modal) {
							if (source) {
								source.contents = $('#fileEditor > input[name="source"]').val();
							}
							else {
								note.bibliography.push({
									id: note.bibliography.length+1,
									item: element.args.id,
									contents: $('#fileEditor > input[name="source"]').val()
								});
							}
							updateBib();
						});

						$('#fileEditor').modal({fadeDuration: 250});
						break;
				}
				break;
			}
		}
	});

	function dragMoveListener(event) {
		$(event.target).css('left', parseInt($(event.target).css('left'))+event.dx);
		$(event.target).css('top', parseInt($(event.target).css('top'))+event.dy);

		updateReference(event);
		resizePage($(event.target));
	}

	function updateReference(event) {
		if ($('#source_'+event.target.id).length) {
			$('#source_'+event.target.id).css('left', parseInt($('#'+event.target.id).css('left'))+parseInt($('#'+event.target.id).css('width'))+10+"px");
			$('#source_'+event.target.id).css('top', $('#'+event.target.id).css('top'));
		}
	}
	window.dragMoveListener = dragMoveListener;
});

function newNotepad() {
	var title = $('#new-notepad-title').val();
	notepad = parser.createNotepad(title);
	window.initNotepad();
	saveToBrowser();

	$('#new-notepad-title').val('');
}

function newSection() {
	var title = $('#new-section-title').val();
	var index = parents[parents.length-1].sections.push(parser.createSection(title)) - 1;
	loadSection(index);
	saveToBrowser();

	$('#new-section-title').val('');
}

function newNote() {
	var title = $('#new-note-title').val();
	var newNote = parser.createNote(title, ['asciimath']);
	var notesInParent = parents[parents.length-1].notes;
	var index = notesInParent.push(newNote) - 1;
	$('#noteList').append('<li><a href="javascript:loadNote({0});">{1}</a></li>'.format(index, newNote.title));
	loadNote(index);
	saveToBrowser();

	$('#new-note-title').val('');
}

var isUpdating = false;
function updateNotepadList() {
	if (isUpdating) return;
	isUpdating = true;
	$('#notepadList').html('');
	localforage.iterate(function(value, key, i) {
		$('#notepadList').append('<li><a href="javascript:loadFromBrowser(\'{0}\');">{0}</a></li>'.format(key));
	}, function() {
		isUpdating = false;
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
	$('#viewer').html('');
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
	if (!delta) {
		noteID = id;
		oldNote = note;
		note = parents[parents.length-1].notes[id];
		document.title = note.title+" - µPad";
		$('#open-note').html('{0} <span class="time">{1}</span>'.format(note.title, moment(note.time).format('dddd, D MMMM h:mm A')));
		$('#open-note').show();
		$('#viewer').html('');
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
	setTimeout(function() {
		MathJax.Hub.Reprocess();
	}, 1000);
}

function updateNote(id) {
	for (k in note.elements) {
		var element = note.elements[k];
		var sel = $('#'+element.args.id);
		element.args.x = $('#'+element.args.id).css('left');
		element.args.y = $('#'+element.args.id).css('top');
		element.args.width = $('#'+element.args.id).css('width');
		element.args.height = $('#'+element.args.id).css('height');

		resizePage($('#'+element.args.id));
		saveToBrowser();
	}
}

function insert(type) {
	var newElement = {
		args: {},
		content: '',
		type: type
	}

	//Get ID
	var id = 1;
	for (var i = 0; i < note.elements.length; i++) {
		var element = note.elements[i];
		if (element.type == type) id++;
	}
	newElement.args.id = type+id;

	newElement.args.x = lastClick.x+'px';
	newElement.args.y = lastClick.y+'px';
	newElement.args.width = 'auto';
	newElement.args.height = 'auto';

	//Handle element specific args
	switch (type) {
		case "markdown":
			newElement.args.fontSize = '16px';
			break;
	}

	note.elements.push(newElement);

	loadNote(noteID, true);
	asciimath.translate(undefined, true);
	MathJax.Hub.Typeset();
	$('#'+newElement.args.id).trigger('click');
}

function updateBib() {
	for (var i = 0; i < note.bibliography.length; i++) {
		var source = note.bibliography[i];
		if ($('#source_'+source.item).length) $('#source_'+source.item).remove();
		if (source.contents.length < 1) continue;
		var item = $('#'+source.item);
		$('#viewer').append('<div id="source_{4}" style="top: {2}; left: {3};"><a target="_blank" href="{1}">{0}</a></div>'.format('['+source.id+']', source.contents, item.css('top'), parseInt(item.css('left'))+parseInt(item.css('width'))+10+"px", source.item));
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
	if (parseInt(selElement.css('left'))+parseInt(selElement.css('width'))+1000 > parseInt($('#viewer').css('width'))) {
		$('#viewer').css('width', parseInt(selElement.css('left'))+1000+'px');
		if ($('#viewer').width() > $('nav').width()) $('nav').css('width', parseInt(selElement.css('left'))+1000+'px');
	}
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
