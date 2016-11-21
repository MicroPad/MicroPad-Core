var notepad;
var parents = [];
var note;
var noteID;
var lastEditedElement = undefined;
var lastClick = {x: 0, y: 0};
var canvasCtx = undefined;

/** Setup localforage */
var notepadStorage = localforage.createInstance({
	name: 'uPad',
	version: 1.0,
	storeName: 'notepads'
});

var appStorage = localforage.createInstance({
	name: 'uPad',
	version: 1.0,
	storeName: 'app'
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
		note = undefined;
		noteID = undefined;
		lastClick = {x: 0, y: 0};
		$('#menu-button').show();
		$('#open-type').html('Notepad')
		$('#title-input').val(notepad.title);
		// $('#title-input').bind('input propertychange', function() {
		// 	notepad.title = $('#title-input').val();
		// 	$('#parents > span:nth-last-child(2)').html(notepad.title);
		// });

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
		$('.display-with-note').hide();
		document.title = 'µPad';
	}

	/** Get the open notepads */
	updateNotepadList();
	
	$('.modal').modal();
	$('#menu-button').sideNav({
		closeOnClick: true
	});
	$('#menu-button').hide();
	$('.display-with-note').hide();

	/** Handle Notepad Upload */
	document.getElementById("upload").addEventListener("change", function(event) {
		var ext = $('#upload').val().split('.').pop().toLowerCase();
		switch (ext) {
			case "npx":
				readFileInputEventAsText(event, function(text) {
					parser.parse(text, ["asciimath"]);
					while (!parser.notepad) if (parser.notepad) break;
					notepad = parser.notepad;

					window.initNotepad();
					saveToBrowser();
				});
				break;

			case "zip":
				readFileInputEventAsArrayBuffer(event, function(arrayBuffer) {
					var zip = new JSZip();
					zip.loadAsync(arrayBuffer).then(function() {
						for (k in zip.files) {
							if (k.split('.').pop().toLowerCase() === 'npx') {
								zip.file(k).async('string').then(function success(text) {
									parser.parse(text, ["asciimath"]);
									while (!parser.notepad) if (parser.notepad) break;
									notepad = parser.notepad;

									window.initNotepad();
									saveToBrowser();
								});
							}
						}
					});
				});
				break;

		}
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
			$('#insert').modal('open');
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
		edges: {left: false, right: true, bottom: false, top: false},
		onend: function (event) {
			updateNote(event.target.id);
			justMoved = true;
		}
	}).on('resizemove', function(event) {
		$(event.target).css('width', parseInt($(event.target).css('width'))+event.dx);
		// $(event.target).css('height', parseInt($(event.target).css('height'))+event.dy);
		$(event.target).css('height', 'auto');
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
				lastEditedElement = element;
				switch (element.type) {
					case "markdown":
						$('#mdsw').val('');
						var source = undefined;
						for (var i = 0; i < note.bibliography.length; i++) {
							var mSource = note.bibliography[i];
							if (mSource.item == element.args.id) {
								source = mSource;
								$('#mdsw').val(source.content);
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
									source.content = $('#mdsw').val();
								}
								else if ($('#mdsw').val().length > 0) {
									note.addSource(note.bibliography.length+1, element.args.id, $('#mdsw').val());
								}
								updateBib();
							}
						});
						$('#mdEditor').modal('open');
						break;

					case "drawing":
						$('#drawingEditor').modal({
							ready: function() {
								resizeCanvas();
								if (element.content) {
									var img = new Image();
									img.onload = function() {
										canvasCtx.drawImage(img, 0, 0);
									}
									img.src = element.content;
								}
							},
							complete: function() {
								if (!isCanvasBlank($('#drawing-viewer')[0])) {
									element.content = $('#drawing-viewer')[0].toDataURL();
									
									var trimmed = trim($('#drawing-viewer')[0]).toDataURL();
									currentTarget.attr('src', trimmed);

									saveToBrowser();
								}
							}
						});
						$('#drawingEditor').modal('open');
						break;

					case "image":
						var source = undefined;
						for (var i = 0; i < note.bibliography.length; i++) {
							var mSource = note.bibliography[i];
							if (mSource.item == element.args.id) {
								source = mSource;
								$('#isw').val(source.content);
								break;
							}
						}

						$('#image-upload-name').val('');
						$('#image-upload').unbind();
						$('#image-upload').bind('change', function(event) {
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

						$('#iw').val(element.args.width);
						$('#iw').val(element.args.width);
						$('#iw').unbind();
						$('#iw').bind('input propertychange', function() {
							element.args.width = $('#iw').val();
							currentTarget.css('width', element.args.width);
							updateReference(event);
						});

						$('#ih').val(element.args.height);
						$('#ih').val(element.args.height);
						$('#ih').unbind();
						$('#ih').bind('input propertychange', function() {
							element.args.height = $('#ih').val();
							currentTarget.css('height', element.args.height);
							updateReference(event);
						});

						$('#imageEditor').modal({
							complete: function() {
								if (source) {
									source.content = $('#isw').val();
								}
								else if ($('#isw').val().length > 0) {
									note.bibliography.push({
										id: note.bibliography.length+1,
										item: element.args.id,
										contents: $('#isw').val()
									});
								}
								updateBib();
							}
						});
						$('#imageEditor').modal('open');
						break;

					case "file":
						alert("Files are not supported yet");
						break;
				}
				break;
			}
		}
	}).on('tap', function(event) {
		$('#'+event.currentTarget.id).trigger('click');
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

	/** Pen Input Handler */
	$(window).resize(function() {
		resizeCanvas();
	});
	canvasCtx = $('#drawing-viewer')[0].getContext("2d");
	resizeCanvas();
	canvasCtx.strokeStyle = "#000000";
	var ongoingTouches = new Array();
	$('#drawing-viewer')[0].onpointerdown = function(event) {
		if (true) {
			ongoingTouches.push(copyTouch(event));
			canvasCtx.beginPath();
		}
	}
	$('#drawing-viewer')[0].onpointermove = function(event) {
	  var pos = realPos(event);
		if (event.pressure > 0) {
			if (event.buttons === 32) {
				canvasCtx.clearRect(pos.x - 10, pos.y - 10, 20, 20);
			}
			else {
				var idx = ongoingTouchIndexById(event.pointerId);

				canvasCtx.beginPath();
				ongoingPos = realPos(ongoingTouches[idx]);
				canvasCtx.moveTo(ongoingPos.x, ongoingPos.y);
				canvasCtx.lineTo(pos.x, pos.y);
				canvasCtx.lineWidth = event.pressure*10;
				canvasCtx.lineCap = "round";
				canvasCtx.stroke();

				ongoingTouches.splice(idx, 1, copyTouch(event));
			}
		}
	}
	$('#drawing-viewer')[0].onpointerup = function(event) {
	  var pos = realPos(event);
		var idx = ongoingTouchIndexById(event.pointerId);
		if (idx >= 0 && event.buttons !== 32) {
			canvasCtx.lineWidth = event.pressure*10;
			canvasCtx.fillStyle = "#000000";
			canvasCtx.beginPath();
			ongoingPos = realPos(ongoingTouches[idx]);
			canvasCtx.moveTo(ongoingPos.x, ongoingPos.y);
			canvasCtx.lineTo(pos.x, pos.y);

			ongoingTouches.splice(idx, 1);
		}
	}
	$('#drawing-viewer')[0].onpointercancel = function(event) {
		var idx = ongoingTouchIndexById(event.pointerId);
		ongoingTouches.splice(idx, 1);
	}
	function copyTouch(touch) {
		return { identifier: touch.pointerId, pageX: touch.pageX, pageY: touch.pageY };
	}

	function realPos(touchEvent) {
		return { x: touchEvent.pageX - canvasOffset.left,
				 y: touchEvent.pageY - canvasOffset.top };
	}
	function ongoingTouchIndexById(idToFind) {
		for (var i = 0; i < ongoingTouches.length; i++) {
			var id = ongoingTouches[i].identifier;
			
			if (id == idToFind) {
				return i;
			}
		}
		return -1;
	}

	/** Restore to previous state */
	appStorage.getItem('lastSavedState', function(e, value) {
		if (value == null || e) return;

		notepad = parser.restoreNotepad(value.notepad);
		initNotepad();
		var prevParents = value.parents;
		for (var i = 0; i < prevParents.length-1; i++) {
			var prevParent = prevParents[i+1];
			loadSection(undefined, prevParent);
		}
		setTimeout(function() {
			loadNote(value.noteID);
		}, 1000);
	});
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

function deleteOpen() {
	if (confirm("Are you sure you want to delete this?")) {
		if (parents.length === 1) {
			//Delete Notepad
			notepadStorage.removeItem(notepad.title, function() {
				notepad = undefined;
				location.reload();
			});
		}
		else if (parents.length > 1 && !note) {
			//Delete Section
			parents[parents.length - 2].sections = parents[parents.length - 2].sections.filter(function(s) {return s !== parents[parents.length - 1]});
			saveToBrowser();
			loadParent(parents.length - 2)
		}
		else if (note) {
			//Delete Note
			parents[parents.length - 1].notes = parents[parents.length - 1].notes.filter(function(n) {return n !== note});
			saveToBrowser();
			loadParent(parents.length - 1);
		}
	}
}

function deleteElement() {
	if (confirm("Are you sure you want to delete this?") && lastEditedElement) {
		// lastEditedElement.content = undefined;
		note.elements = note.elements.filter(function(e) {return (e !== lastEditedElement);});
		$('#'+lastEditedElement.args.id).remove();
		saveToBrowser();
	}
}

function exportOpen() {
	var blob = new Blob([notepad.toXML()], {type: "text/xml;charset=utf-8"});
	saveAs(blob, '{0}.npx'.format(notepad.title.replace(/[^a-z0-9 ]/gi, '')));
}

function exportNotepads() {
	var zip = new JSZip();
	notepadStorage.iterate(function(value, key, i) {
		var blob = new Blob([parser.restoreNotepad(value).toXML()], {type: "text/xml;charset=utf-8"});
		zip.file(key.replace(/[^a-z0-9 ]/gi, '')+'.npx', blob);
	}, function() {
		zip.generateAsync({type:"blob"}).then(function(blob) {
			saveAs(blob, "notepads.zip");
		});
	});
}

function updateTitle() {
	if (parents.length === 1) {
		//Delete old Notepad
		notepadStorage.removeItem(notepad.title, function() {
			notepad.title = $('#title-input').val();
			$('#parents > span:nth-last-child(2)').html(notepad.title);
			saveToBrowser();
			setTimeout(function() {
				location.reload();
			}, 500);
		});
	}
	else if (parents.length > 1 && !note) {
		//Rename Section
		saveToBrowser();
	}
	else if (note) {
		//Rename Note
		saveToBrowser();
	}
}

var isUpdating = false;
var arrOfKeys = [];
function updateNotepadList() {
	if (isUpdating) return;
	notepadStorage.keys().then(function(keys) {
		if (JSON.stringify(keys) !== JSON.stringify(arrOfKeys)) {
			arrOfKeys = keys;
			isUpdating = true;
			$('#notepadList').html('');
			notepadStorage.iterate(function(value, key, i) {
				$('#notepadList').append('<li><a href="javascript:loadFromBrowser(\'{0}\');">{0}</a></li>'.format(key));
			}, function() {
				isUpdating = false;
			});
		}
	});
}

function loadParent(index) {
	if (index === 0) {
		initNotepad();
		return;
	}

	var oldParents = parents.slice(0, index+1);
	parents = parents.slice(0, index);

	//Reset breadcrumbs
	$('#parents').children().each(function(i) {
		if(this.id == "open-note") return false;
		$(this).remove();
	});
	for (k in parents) {
		var p = parents[k];
		$('<span class="breadcrumb">{0}</span>'.format(p.title)).insertBefore('#open-note');
	}

	loadSection(undefined, oldParents[oldParents.length-1]);
}

function linkBreadcrumbs() {
	$('#parents').children().each(function(i) {
		if (this.id == "open-note") return false;

		$(this).attr('onclick', 'loadParent('+i+');');
	});
}

function updateSelector() {
	linkBreadcrumbs();
	$('<span class="breadcrumb">{0}</span>'.format(parents[parents.length-1].title)).insertBefore('#open-note');
	$('#sectionList').html('');
	$('#noteList').html('');

	if (parents.length > 0) $('#add-section-link').css('display', 'block');
	if (parents.length > 1) $('#add-note-link').css('display', 'block');
}

function loadSection(id, providedSection) {
	var section = parents[parents.length-1].sections[id];
	if (providedSection) section = providedSection;
	parents.push(section);
	note = undefined;
	$('.display-with-note').hide();
	document.title = 'µPad';
	$('#viewer').html('');
	$('#open-note').hide();
	updateSelector();
	$('#open-type').html('Section');
	$('#title-input').val(section.title);
	$('#title-input').unbind();
	$('#title-input').bind('input propertychange', function() {
		section.title = $('#title-input').val();
		$('#parents > span:nth-last-child(2)').html(section.title);
	});

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
		linkBreadcrumbs();
		$('#open-note').html('{0} <span class="time">{1}</span>'.format(note.title, moment(note.time).format('dddd, D MMMM h:mm A')));
		$('#viewer').html('');
		$('.display-with-note').show();

		/** Save state */
		appStorage.setItem('lastSavedState', {
			notepad: notepad,
			parents: parents,
			noteID: noteID
		});
	}
	$('#open-type').html('Note')
	$('#title-input').val(note.title);
	$('#title-input').bind('input propertychange', function() {
		note.title = $('#title-input').val();
		$('#parents > span:nth-last-child(2)').html(note.title);
	});

	for (var i = 0; i < note.elements.length; i++) {
		var element = note.elements[i];
		if (delta && $('#'+element.args.id).length) continue;
		switch (element.type) {
			case "markdown":
				$('#viewer').append('<div class="interact z-depth-2 hoverable" id="{6}" style="top: {0}; left: {1}; height: {2}; width: {3}; font-size: {4};">{5}</div>'.format(element.args.y, element.args.x, element.args.height, element.args.width, element.args.fontSize, md.makeHtml(element.content), element.args.id));
				asciimath.translate(undefined, true);
				MathJax.Hub.Typeset();
				break;
			case "image":
				$('#viewer').append('<img class="interact z-depth-2 hoverable" id="{4}" style="top: {0}; left: {1}; height: {2}; width: {3};" src="{5}" />'.format(element.args.y, element.args.x, element.args.height, element.args.width, element.args.id, element.content));
				// Materialize.fadeInImage('#'+element.args.id);
				break;
			case "drawing":
				$('#viewer').append('<img class="interact hoverable drawing" id="{0}" style="top: {1}; left: {2}; height: {3}; width: {4};" src="{5}" />'.format(element.args.id, element.args.y, element.args.x, 'auto', 'auto', element.content));
				break;
		}
	}
	updateBib();
	initDrawings();
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
		if ($('#'+element.args.id)[0]) {
			element.args.width = $('#'+element.args.id)[0].style.width;
			element.args.height = $('#'+element.args.id)[0].style.height;
		}

		resizePage($('#'+element.args.id));
		saveToBrowser();
	}
}

function insert(type, newElement) {
	$('#insert').modal('close');
	if (!newElement){
		var newElement = {
			args: {},
			content: '',
			type: type
		}
	}

	//Get ID
	var id = undefined;
	for (var i = 0; i < note.elements.length; i++) {
		var element = note.elements[i];
		if (element.type == type && !id){
			id = parseInt(element.args.id.split(element.type)[1]);
		}
		
		if (element.type == type) {
			id++;
		}
	}
	if (!id) id = 1;
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
		case "drawing":
			newElement.content = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGQAAABkCAQAAADa613fAAAAaElEQVR42u3PQREAAAwCoNm/9CL496ABuREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREWkezG8AZQ6nfncAAAAASUVORK5CYII=";
			break;
	}

	note.elements.push(newElement);

	loadNote(noteID, true);
	asciimath.translate(undefined, true);
	MathJax.Hub.Typeset();
	$('#'+newElement.args.id).trigger('click');
	return newElement.args.id;
}

function uploadDocx() {
	$('#docx-upload-name').val('');
	$('#docx-upload').unbind();
	$('#docx-upload').bind('change', function(event) {
		var file = event.target.files[0];
		if (!file) return;
		readFileInputEventAsArrayBuffer(event, function(arrayBuffer) {
			mammoth.convertToMarkdown({arrayBuffer: arrayBuffer}).then(function(res) {
				$('#docxEditor').modal('close');
				insert('markdown', {
					args: {},
					content: res.value,
					type: 'markdown'
				});
			});
		});
	});

	$('#insert').modal('close');
	$('#docxEditor').modal('open');
}

function updateBib() {
	for (var i = 0; i < note.bibliography.length; i++) {
		var source = note.bibliography[i];
		if ($('#source_'+source.item).length) $('#source_'+source.item).remove();
		if (source.content.length < 1) continue;
		var item = $('#'+source.item);
		$('#viewer').append('<div id="source_{4}" style="top: {2}; left: {3};"><a target="_blank" href="{1}">{0}</a></div>'.format('['+source.id+']', source.content, item.css('top'), parseInt(item.css('left'))+parseInt(item.css('width'))+10+"px", source.item));
	}
	saveToBrowser();
}

function initDrawings() {
	$('.drawing').each(function (i) {
		var img = $(this)[0];
		var tmpCanvas = $('<canvas width="{0}" height="{1}"></canvas>'.format(img.naturalWidth, img.naturalHeight))[0];
		var tmpCtx = tmpCanvas.getContext('2d');
		tmpCtx.clearRect(0, 0, tmpCanvas.width, tmpCanvas.height);
		tmpCtx.drawImage(img, 0, 0);

		var trimmed = trim(tmpCanvas).toDataURL();
		$(this).attr('src', trimmed);
	});
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

function readFileInputEventAsArrayBuffer(event, callback) {
	var file = event.target.files[0];

	var reader = new FileReader();
	
	reader.onload = function(loadEvent) {
		var arrayBuffer = loadEvent.target.result;
		callback(arrayBuffer);
	};
	
	reader.readAsArrayBuffer(file);
}

/** Make sure the page is always larger than it's elements */
function resizePage(selElement) {
	if (parseInt(selElement.css('left'))+parseInt(selElement.css('width'))+1000 > parseInt($('#viewer').css('width'))) {
		$('#viewer').css('width', parseInt(selElement.css('left'))+1000+'px');
		if ($('#viewer').width() > $('nav').width()) $('nav').css('width', parseInt(selElement.css('left'))+1000+'px');
	}
	if (parseInt(selElement.css('top'))+parseInt(selElement.css('height'))+1000 > parseInt($('#viewer').css('height'))){
		$('#viewer').css('height', parseInt(selElement.css('top'))+parseInt(selElement.css('height'))+1000+'px');
	}
}

var tooBig = '';
function saveToBrowser(retry) {
	/*
		I want to use the Filesystem and FileWriter API for this (https://www.html5rocks.com/en/tutorials/file/filesystem/)
		but only Chrome and Opera support it. For now I'll use IndexedDB with a sneaky async library.
	 */
	
	$('#viewer ul').each(function(i) {
		$(this).addClass('browser-default')
	});


	// var compressedNotepad = window.pako.deflate(JSON.stringify(notepad), {to: 'string'});
	try {
		notepadStorage.setItem(notepad.title, notepad, function() {
			updateNotepadList();
		});
	}
	catch (e) {
		if (retry && notepad.title != tooBig) {
			alert("This notepad is too big to fit in your browser's storage. To keep changes make sure to download it.")
			notepad.title = tooBig;
		}
		else if (notepad.title != tooBig) {
			notepadStorage.clear();
			saveToBrowser(true);
		}
	}
}

function loadFromBrowser(title) {
	notepadStorage.getItem(title, function(err, res) {
		// notepad = JSON.parse(window.pako.inflate(res, {to: 'string'}));
		notepad = parser.restoreNotepad(res);
		window.initNotepad();
	});
}

var canvasOffset = null;

function resizeCanvas() {
	var canvas = $('#drawing-viewer');
	var canvasHolder = $('#canvas-holder');
	canvasCtx.canvas.width = canvasHolder.width();
	canvasCtx.canvas.height = canvasHolder.height();
	canvasOffset = canvas.offset();
}

/** Utility functions */
function toBase64(str) {
	return window.btoa(unescape(encodeURIComponent(str)));
}

function fromBase64(str) {
	return decodeURIComponent(escape(window.atob(str)));
}

//Thanks to http://stackoverflow.com/a/4673436/998467
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

//Thanks to http://stackoverflow.com/a/17386803/998467
function isCanvasBlank(canvas) {
	var blank = document.createElement('canvas');
	blank.width = canvas.width;
	blank.height = canvas.height;

	return canvas.toDataURL() == blank.toDataURL();
}

