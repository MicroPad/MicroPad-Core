var notepad;
var parents = [];
var note;
var noteID;
var lastEditedElement = undefined;
var lastClick = { x: 0, y: 0 };
var canvasCtx = undefined;
try {
	var rec = new Recorder();
}
catch(err) {}
var wasMobile = isMobile();
var stillLoading = false;
var syncWorker = new Worker('js/syncWorker.js');
var syncMethod = "block";
var hasAddedNotepad = "unknown";
var todoShowToggle = {};

var uploadWorker = new Worker('js/uploadWorker.js');
var putRequests = [];

/** Setup localforage */
var notepadStorage = localforage.createInstance({
	name: 'MicroPad',
	storeName: 'notepads'
});

var appStorage = localforage.createInstance({
	name: 'MicroPad',
	version: 1.0,
	storeName: 'app'
});

/** Setup md parser */
showdown.extension('maths', function() {
	var matches = [];
	return [
		{
			type: 'lang',
			regex: /===([^]+?)===/gi,
			replace: function(s, match) {
				matches.push('===' + match + '===');
				var n = matches.length - 1;
				return '%PLACEHOLDER1' + n + 'ENDPLACEHOLDER1%';
			}
		},
		{
			type: 'output',
			filter: function(text) {
				for (var i = 0; i < matches.length; ++i) {
					var pat = '%PLACEHOLDER1' + i + 'ENDPLACEHOLDER1%';
					text = text.replace(new RegExp(pat, 'gi'), matches[i]);
				}
				//reset array
				matches = [];
				return text;
			}
		}
	]
});

showdown.extension('graphs', function() {
	var matches = [];
	return [
		{
			type: 'lang',
			regex: /=-=([^]+?)=-=/gi,
			replace: function(s, match) {
				matches.push("<embed width='400' height='400' src='img/d.svg' script='{0}'></embed>".format(match));
				var n = matches.length - 1;
				return '%PLACEHOLDER2' + n + 'ENDPLACEHOLDER2%';
			}
		},
		{
			type: 'output',
			filter: function(text) {
				for (var i = 0; i < matches.length; ++i) {
					var pat = '%PLACEHOLDER2' + i + 'ENDPLACEHOLDER2%';
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
	prefixHeaderId: 'mdheader_',
	smoothLivePreview: true,
	extensions: ['maths', 'graphs']
});

$(document).ready(function() {
	$('#sidenav-options').hide();
});

window.onload = function() {
	/** Get the open notepads */
	updateNotepadList();

	/** Get a list of notepads */
	updateOpenList();

	$('.modal').modal();
	$('#menu-button').sideNav({
		// closeOnClick: true
	});
	$('#stop-recording-btn').hide();
	$('.display-with-note').hide();
	$('#not-syncing-pitch').hide();
	$('#sync-options').hide();
	$('#menu-button').sideNav();
	wasMobile = isMobile();

	if (navigator.maxTouchPoints && navigator.maxTouchPoints > 0) {
		$('#notepad-explorer').addClass('touch');
	}

	if (window.platform === 'web') {
		/** Restore to previous notepad */
		appStorage.getItem('lastNotepadTitle', function(e, title) {
			if (title == null || e) return;
			notepadStorage.iterate(function(value, key, i) {
				if (title === key) {
					notepad = parser.restoreNotepad(JSON.parse(value));
					initNotepad();
				}
			});
		});

		/** Handle Notepad Upload */
		document.getElementById("upload").addEventListener("change", function(event) {
			handleUpload(event);
		}, false);
		document.getElementById("mob-upload").addEventListener("change", function(event) {
			handleUpload(event);
		}, false);
	}


	/** Listen for when new elements are added to #viewer */
	var observer = new MutationObserver(function(mutations) {
		mutations.forEach(function(mutation) {
			saveToBrowser();
			for (k in mutation.addedNodes) {
				var selector = '#'+mutation.addedNodes[k].id;
				if (selector.length <= 1) continue;
				var selElement = $(selector);
				resizePage(selElement);
				updateInstructions();
			}
		});
	});
	observer.observe(document.getElementById('viewer'), { attributes: false, childList: true, characterData: true });

	/** Creating elements */
	$('#viewer').click(function(e) {
		if (e.target == this && note && !isDropdownActive()) {
			lastClick.x = e.pageX;
			lastClick.y = e.pageY - 128;
			$('#insert').modal('open');
		}
	});
	function isDropdownActive() {
		return $('.dropdown-content.active').length > 0;
	}

	$('#microsync-checkout-form').hide();
	$('#change-subscription').modal({
		complete: () => {
			$('#microsync-checkout-form').hide();
		}
	});

	/** Editing elements */
	var justMoved = false;
	interact('.interact').on('click', function(event) {
		if (justMoved) {
			justMoved = false;
			return;
		}
		var path = event.originalEvent.path || (event.originalEvent.composedPath && event.originalEvent.composedPath()) || [event.originalEvent.target];
		if (path[0].tagName.toLowerCase() === 'a') return;

		var currentTarget = $('#' + event.currentTarget.id);
		for (k in note.elements) {
			notepad.lastModified = moment().format('YYYY-MM-DDTHH:mm:ss.SSSZ');
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
							currentTarget.html('<p class="handle">::::</p>'+md.makeHtml(element.content));

							var checkedTodoItems = currentTarget.find('.task-list-item input:checked');
							if (checkedTodoItems.length > 5) {
								checkedTodoItems.parentsUntil('ul').hide();
								currentTarget.append('<a class="hidden-todo-msg" href="javascript:showTodo(\'{0}\')">Show/Hide {1} Completed Items</a>'.format(currentTarget[0].id, checkedTodoItems.length));
							}

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
						$('#mdw').unbind();
						$('#mdw').bind('input propertychange', function() {
							element.args.width = $('#mdw').val();
							currentTarget.css('width', element.args.width);
							updateReference(event);
						});

						$('#mdh').val(element.args.height);
						$('#mdh').unbind();
						$('#mdh').bind('input propertychange', function() {
							element.args.height = $('#mdh').val();
							currentTarget.css('height', element.args.height);
							updateReference(event);
						});

						$('#mdEditor').modal({
							inDuration: 100,
							complete: function() {
								asciimath.translate(undefined, true);
								drawPictures();
								MathJax.Hub.Typeset();

								if (source) {
									source.content = $('#mdsw').val();
								}
								else if ($('#mdsw').val().length > 0) {
									note.addSource(note.bibliography.length + 1, element.args.id, $('#mdsw').val());
								}
								updateBib();
							}
						});
						$('#mdEditor').modal('open');
						setTimeout(function() {
							$('#mdEditor').modal('open');
						}, 500);
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
								confirmAsync("Do you want to save this drawing?").then(function(answer) {
									if (answer) {
										if (!isCanvasBlank($('#drawing-viewer')[0])) {
											element.content = $('#drawing-viewer')[0].toDataURL();

											var trimmed = URL.createObjectURL(dataURItoBlob(trim($('#drawing-viewer')[0]).toDataURL()));
											$("#"+element.args.id+" > img").attr('src', trimmed);

											notepad.lastModified = moment().format('YYYY-MM-DDTHH:mm:ss.SSSZ');
											saveToBrowser();
										}
									}
								});
							}
						});
						$('#drawingEditor').modal('open');
						setTimeout(function() {
							$('#drawingEditor').modal('open');
						}, 500);
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
								$("#"+element.args.id+" > img").attr('src', URL.createObjectURL(dataURItoBlob(element.content)));
								updateReference(event);
								setTimeout(() => {
									resizePage($("#"+element.args.id), true);
								}, 500);
							}
						});

						$('#iw').val(element.args.width);
						$('#iw').unbind();
						$('#iw').bind('input propertychange', function() {
							element.args.width = $('#iw').val();
							currentTarget.css('width', element.args.width);
							updateReference(event);
						});

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
										id: note.bibliography.length + 1,
										item: element.args.id,
										content: $('#isw').val()
									});
								}
								updateBib();
							}
						});
						$('#imageEditor').modal('open');
						setTimeout(function() {
							$('#imageEditor').modal('open');
						}, 500);
						break;

					case "file":
						source = undefined;
						$('#fsw').val('');
						for (var i = 0; i < note.bibliography.length; i++) {
							var mSource = note.bibliography[i];
							if (mSource.item == element.args.id) {
								source = mSource;
								$('#fsw').val(source.content);
								break;
							}
						}

						$('#file-upload-name').val('');
						$('#file-upload').unbind();
						$('#file-upload').bind('change', function(event) {
							var reader = new FileReader();
							var file = event.target.files[0];
							element.args.filename = file.name;
							if (!file) return;
							reader.readAsDataURL(file);

							reader.onload = function() {
								element.content = reader.result;
								$('#' + element.args.id + '> .fileHolder > a').attr('href', 'javascript:downloadFile(\'{0}\');'.format(element.args.id));
								$('#' + element.args.id + '> .fileHolder > a').html(element.args.filename);
							}
						});

						$('#fileEditor').modal({
							complete: function() {
								if (source) {
									source.content = $('#fsw').val();
								}
								else if ($('#fsw').val().length > 0) {
									note.bibliography.push({
										id: note.bibliography.length + 1,
										item: element.args.id,
										content: $('#fsw').val()
									});
								}
								updateBib();
							}
						});
						$('#fileEditor').modal('open');
						setTimeout(function() {
							$('#fileEditor').modal('open');
						}, 500);
						break;
				}
				break;
			}
		}
	}).on('tap', function(event) {
		if (event.pointer === 'mouse') return;
		var path = event.originalEvent.path || (event.originalEvent.composedPath && event.originalEvent.composedPath()) || [event.originalEvent.target];
		if (path[0].tagName.toLowerCase() === 'a') return;
		$('#' + event.currentTarget.id).trigger('click');
	});

	if (!isMobile()) {
		interact('.resize').resizable({
			preserveAspectRatio: false,
			edges: { left: false, right: true, bottom: false, top: false },
			onend: function(event) {
				updateNote(event.target.id);
				justMoved = true;
			}
		}).on('resizemove', function(event) {
			var resizeObj = event.target;
			if ($(event.target).prop("tagName") == "IMG") resizeObj = $('#'+event.target.id.split("_")[1])[0];
			$(resizeObj).css('width', parseInt($(resizeObj).css('width')) + 10 + event.dx);
			$(resizeObj).css('height', 'auto');
			resizePage($(resizeObj));
			event.target = resizeObj;
			updateReference(event);
			justMoved = true;
		})
	}

	function updateReference(event) {
		if ($('#source_' + event.target.id).length) {
			$('#source_' + event.target.id).css('left', parseInt($('#' + event.target.id).css('left')) + parseInt($('#' + event.target.id).css('width')) + 10 + "px");
			$('#source_' + event.target.id).css('top', $('#' + event.target.id).css('top'));
		}
	}

	/** Pen Input Handler */
	$(window).resize(function() {
		resizeCanvas();
		mobileNav();
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
				canvasCtx.lineWidth = event.pressure * 10;
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
			canvasCtx.lineWidth = event.pressure * 10;
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
		return {
			x: touchEvent.pageX - canvasOffset.left,
			y: touchEvent.pageY - canvasOffset.top
		};
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

	$('#new-notepad').modal({
		ready: () => {
			$('#new-notepad-title').focus();
		}
	});

	$('#new-section').modal({
		ready: () => {
			$('#new-section-title').focus();
		}
	});

	$('#new-note').modal({
		ready: () => {
			$('#new-note-title').focus();
		}
	});

	/** Search Notes */
	$('#search').modal({
		ready: () => {
			$('#search-text').focus();
		},
		complete: () => {
			$('#search-text').val('');
			$('#search-results').html('');
		}
	});
	$('#search-text').bind('input propertychange', function(event) {
		$('#search-results').html('');

		var query = $('#search-text').val();
		if (query.length < 1) return;
		latestResults = notepad.search(query);
		for (k in latestResults) {
			var result = latestResults[k];
			$('#search-results').append('<li style="opacity: 0;"><h4><a href="javascript:loadSearchResult({1});">{0}</a></h4></li>'.format(result.title, k));
		}
		if (latestResults.length > 0) Materialize.showStaggeredList('#search-results');
	});

	/** Recording Stuff */
	$('#stop-recording-btn').on('click', function(event) {
		rec.stop();
		$('#stop-recording-btn').hide();
	});
	$('#viewer').on('click', '.recording-text', function(event) {
		if (justMoved) {
			justMoved = false;
			return;
		}

		var currentTarget = $(event.currentTarget).parent();
		var id = currentTarget.attr('id');
		for (var i = 0; i < note.elements.length; i++) {
			var element = note.elements[i];
			if (element.args.id === id) {
				lastEditedElement = element;
				break;
			}
		}


		$('#rposl').val(lastEditedElement.args.x);
		$('#rposl').unbind();
		$('#rposl').bind('input propertychange', function() {
			lastEditedElement.args.x = $('#rposl').val();
			currentTarget.css('left', lastEditedElement.args.x);
		});

		$('#rpost').val(lastEditedElement.args.y);
		$('#rpost').unbind();
		$('#rpost').bind('input propertychange', function() {
			lastEditedElement.args.y = $('#rpost').val();
			currentTarget.css('top', lastEditedElement.args.y);
		});

		$('#recordingEditor').modal('open');
	});

	/** Auto create md-element on typing in empty note */
	$(document).keypress(function(e) {
		var charcode = e.charCode;
		var char = String.fromCharCode(charcode);
		if (char && note && note.elements.length === 0) {
			lastClick = {
				x: 10,
				y: 10
			};
			insert('markdown');
			$('#md-textarea').focus();
		}
	});

	/** Keyboard Shortcuts - Navigation */
	Mousetrap.bind('s', e => {
		if (parents.length > 0 && (!note || note.elements.length > 0)) {
			e.preventDefault();
			$('#new-section').modal('open');
		}
	});
	Mousetrap.bind('n', e => {
		if (parents[parents.length-1].notes && (!note || note.elements.length > 0)) {
			e.preventDefault();
			$('#new-note').modal('open');
		}
	});
	Mousetrap.bind('f', e => {
		if (parents.length > 0 && (!note || note.elements.length > 0)) {
			e.preventDefault();
			$('#search').modal('open');
		}
	});
	Mousetrap.bind('e', e => {
		if (note && lastEditedElement) {
			e.preventDefault();
			$('#'+lastEditedElement.args.id).click();
		}
	});
	Mousetrap.bind('mod+p', e => {
		if (note) {
			e.preventDefault();
			exportToPdf();
		}
	});
	Mousetrap.bind('mod+1', e => {
		if (parents.length > 0) {
			e.preventDefault();
			loadParent(0);
		}
	});
	Mousetrap.bind('mod+2', e => {
		if (parents.length > 1) {
			e.preventDefault();
			loadParent(1);
		}
	});
	Mousetrap.bind('mod+3', e => {
		if (parents.length > 2) {
			e.preventDefault();
			loadParent(2);
		}
	});
	Mousetrap.bind('mod+4', e => {
		if (parents.length > 3) {
			e.preventDefault();
			loadParent(3);
		}
	});
	Mousetrap.bind('mod+5', e => {
		if (parents.length > 4) {
			e.preventDefault();
			loadParent(4);
		}
	});
	Mousetrap.bind('mod+6', e => {
		if (parents.length > 5) {
			e.preventDefault();
			loadParent(5);
		}
	});
	Mousetrap.bind('mod+7', e => {
		if (parents.length > 6) {
			e.preventDefault();
			loadParent(6);
		}
	});
	Mousetrap.bind('mod+8', e => {
		if (parents.length > 7) {
			e.preventDefault();
			loadParent(7);
		}
	});
	Mousetrap.bind('mod+9', e => {
		if (parents.length > 8) {
			e.preventDefault();
			loadParent(8);
		}
	});

	mobileNav();
	updateInstructions();

	$('.drag-target').bind('click', function() {
		$('#sidenav-overlay').trigger('click');
		setTimeout(function() {
			$('#sidenav-overlay').trigger('click');
		}, 300);
	});

	/** Page has loaded. Turn off the spinner */
	setTimeout(function() {
		if (stillLoading) return;
		$('#preloader').css('opacity', '0');
		$('body').css('background-color', '#fff');
		$('#loadedContent').addClass('visible');
		setTimeout(function() {
			$('#preloader').remove();
		}, 1000);
	}, 500);

	if (navigator.storage && navigator.storage.persist) {
		navigator.storage.persist();
	}
};
/**** END OF ONLOAD CODE */

window.initNotepad = function() {
	parents = [];
	note = undefined;
	noteID = undefined;
	hasAddedNotepad = "unknown";
	lastClick = { x: 0, y: 0 };
	$('#sidenav-options').show();
	// $('#search-button').show();
	$('#open-type').html('Notepad')
	$('#title-input').val(notepad.title);

	parents.push(notepad);

	//Clear old lists
	$('#sectionList').html('');
	$('#noteList').html('');
	$('#viewer').html('');
	$('#parents > span:not(#open-note)').remove();
	$('#open-note').hide();
	$('#mob-n-dd').css('color', '#AAAFB4');
	$('#mob-n-dd').css('pointer-events', 'none');
	$('#mob-s-dd').css('color', '#000');
	$('#mob-s-dd').css('pointer-events', 'auto');
	$('#search-link').css('color', '#fff');
	$('#search-link').css('pointer-events', 'auto');
	$('#notepadTitle').html(notepad.title);

	updateNotepadExplorer();
	updateInstructions();

	appStorage.getItem('syncToken', function(err, res) {
		if (err) return;

		if (res !== null) {
			var filename = '{0}.npx'.format(notepad.title.replace(/[^a-z0-9 ]/gi, ''));
			
			syncWorker.postMessage({
				syncURL: window.syncURL,
				req: "hasAddedNotepad",
				token: res,
				filename: filename
			});
		}
		else {
			$('#parents > span:first-child').append(' (<a href="#!" onclick="$(\'#login\').modal(\'open\')">Connect to µSync</a>)');
		}
	});

	$('<span class="breadcrumb">{0}</span>'.format(notepad.title)).insertBefore('#open-note');
	for (k in notepad.sections) {
		var section = notepad.sections[k];
		$('#sectionList').append('<li><a href="javascript:loadSection({0});">{1}</a></li>'.format(k, section.title));
	}
	$('#add-section-link').css('display', 'block');
	$('#add-note-link').css('display', 'none');
	$('.display-with-note').hide();
	document.title = 'µPad';

	appStorage.setItem('lastNotepadTitle', notepad.title);
}

function updateOpenList() {
	appStorage.getItem('syncToken', function(err, res) {
		if (err) return;

		if (res !== null) {
			$('#sync-list-results').html('');
			$.get(window.syncURL+'getNotepads.php', {token: res}, function(data) {
				$('#connect-to-sync').hide();
				for (var i = 0; i < data.length; i++) {
					var notepadTitle = data[i];
					$('#sync-list-results').append('<li style="opacity: 0;"><h5 style="display: inline;"><a href="javascript:downloadNotepad(\'{0}\');">{0}</a></h5> <a href="javascript:msRemoveNotepad(\'{0}\');">(Remove Notepad)</a></li><br />'.format(notepadTitle));
				}
				Materialize.showStaggeredList('#sync-list-results');
			}, 'json').fail(data => {
				if (data.statusCode().status > 0) msLogout();
			});
		}
		else {
			$('#open-from-sync-button').hide();
		}
	});
}

function downloadNotepad(filename) {
	$('#open-microsync').modal('close');
	notepad = parser.createNotepad(filename.split('.npx')[0]);
	notepad.lastModified = moment().subtract(100, 'years').format('YYYY-MM-DDTHH:mm:ss.SSSZ');
	window.initNotepad();
}

var latestResults = [];
function loadSearchResult(resID) {
	$('#search').modal('close');
	parents = [];
	var result = latestResults[resID];
	recalculateParents(result);

	$('#sectionList').html('');
	for (k in parents[parents.length - 1].sections) {
		var mSection = parents[parents.length - 1].sections[k];
		$('#sectionList').append('<li><a href="javascript:loadSection({0});">{1}</a></li>'.format(k, mSection.title));
	}

	$('#noteList').html('');
	for (k in parents[parents.length - 1].notes) {
		var note = parents[parents.length - 1].notes[k];
		$('#noteList').append('<li><a href="javascript:loadNote({0});">{1}</a></li>'.format(k, note.title));
	}
	if (parents.length > 0) $('#add-section-link').css('display', 'block');
	if (parents.length > 1) $('#add-note-link').css('display', 'block');
	$('#n-dd').css('color', '#fff');
	$('#n-dd').css('pointer-events', 'auto');

	for (var i = 0; i < parents[parents.length - 1].notes.length; i++) {
		var n = parents[parents.length - 1].notes[i];
		if (n === result) {
			loadNote(i);
			break;
		}
	}
	latestResults = [];
}

function recalculateParents(baseObj) {
	parents.unshift(baseObj.parent);
	if (parents[0].parent) {
		recalculateParents(parents[0]);
	}

	//Reset breadcrumbs
	$('#parents').children().each(function(i) {
		if (this.id == "open-note") return false;
		$(this).remove();
	});
	for (k in parents) {
		var p = parents[k];
		$('<span class="breadcrumb">{0}</span>'.format(p.title)).insertBefore('#open-note');
	}
	scrollBreadcrumbs();
	linkBreadcrumbs();
}

function getCurrentPath() {
	var currentPath = [];
	for (var i = parents.length - 1; i >= 1; i--) {
		currentPath.unshift(parents[i-1].sections.indexOf(parents[i]));
	}
	return currentPath;
}

function scrollBreadcrumbs() {
	$('#parents').scrollLeft($('#breadcrumb-holder').width());
}

function newNotepad() {
	var title = $('#new-notepad-title').val();
	notepad = parser.createNotepad(title);
	window.initNotepad();
	saveToBrowser();

	$('#new-notepad-title').val('');
}

function newSection() {
	if (parents.length < 1) {
		$('#new-note-title').val('');
		alert("You have to create a notepad before adding a section");
		return;
	}

	var title = $('#new-section-title').val();
	var newSection = parser.createSection(title);
	newSection.parent = parents[parents.length - 1];
	var index = parents[parents.length - 1].sections.push(newSection) - 1;
	loadSection(index);
	notepad.lastModified = moment().format('YYYY-MM-DDTHH:mm:ss.SSSZ');
	saveToBrowser();

	$('#new-section-title').val('');
	updateNotepadExplorer();
}

function newNote() {
	if (parents.length < 2) {
		$('#new-note-title').val('');
		alert("You have to create a section before adding a note");
		return;
	}

	var title = $('#new-note-title').val();
	var newNote = parser.createNote(title, ['asciimath']);
	newNote.parent = parents[parents.length - 1];
	var notesInParent = parents[parents.length - 1].notes;
	var index = notesInParent.push(newNote) - 1;
	$('#noteList').append('<li><a href="javascript:loadNote({0});">{1}</a></li>'.format(index, newNote.title));
	loadNote(index);
	notepad.lastModified = moment().format('YYYY-MM-DDTHH:mm:ss.SSSZ');
	saveToBrowser();

	$('#new-note-title').val('');
	updateNotepadExplorer();
}

function deleteOpen() {
	confirmAsync("Are you sure you want to delete this?").then(function(answer) {
		if (answer) {
			if (parents.length === 1) {
				//Delete Notepad
				appStorage.removeItem('lastNotepadTitle', function() {
					switch (window.platform) {
						case "web":
							notepadStorage.removeItem(notepad.title, function() {
								notepad = undefined;
								location.reload();
							});
							break;

						case "uwp":
							Windows.Storage.StorageFolder.getFolderFromPathAsync(storageDir)
							.then(function(folder) {
								return folder.getFileAsync('{0}.npx'.format(notepad.title.replace(/[^a-z0-9 ]/gi, '')));
							}).then(function(file) {
								return file.deleteAsync();
							}).done(function() {
								window.location.reload();
							});
							break;
					}
				});
			}
			else if (parents.length > 1 && !note) {
				//Delete Section
				parents[parents.length - 2].sections = parents[parents.length - 2].sections.filter(function(s) { return s !== parents[parents.length - 1] });
				notepad.lastModified = moment().format('YYYY-MM-DDTHH:mm:ss.SSSZ');
				saveToBrowser();
				updateNotepadExplorer();
				loadParent(parents.length - 2);
			}
			else if (note) {
				//Delete Note
				parents[parents.length - 1].notes = parents[parents.length - 1].notes.filter(function(n) { return n !== note });
				notepad.lastModified = moment().format('YYYY-MM-DDTHH:mm:ss.SSSZ');
				saveToBrowser();
				updateNotepadExplorer();
				loadParent(parents.length - 1);
			}
		}
	});
}

function deleteElement() {
	confirmAsync("Are you sure you want to delete this?").then(function(answer) {
		if (answer && lastEditedElement) {
			note.elements = note.elements.filter(e => { return (e !== lastEditedElement); });
			note.bibliography = note.bibliography.filter(s => { return (s.item !== lastEditedElement.args.id); });

			$('#'+lastEditedElement.args.id).remove();
			if ($('#source_'+lastEditedElement.args.id).length) $('#source_'+lastEditedElement.args.id).remove();

			notepad.lastModified = moment().format('YYYY-MM-DDTHH:mm:ss.SSSZ');
			saveToBrowser();
		}
	});
}

function exportOpen() {
	var blob = new Blob([notepad.toXML()], { type: "text/xml;charset=utf-8" });
	saveAs(blob, '{0}.npx'.format(notepad.title.replace(/[^a-z0-9 ]/gi, '')));
}

function exportToPdf() {
	var printContents = $('<style>body {background-color: #fff;} .element {margin: 10px; padding: 5px; border: 1px solid grey;} table, th, td {border: 1px solid black;border-collapse: collapse;background-color: #fff;}</style><div></div>');
	$('#viewer > .element').each(function(i) {
		if (this.id.startsWith('markdown')) {
			showTodo(this.id, true);
		}
		var cleanedElement = $(this.outerHTML.split('<p class="handle">::::</p>').join(''));
		if (this.id.startsWith('file') || this.id.startsWith('recording')) return;
		if (this.id.startsWith('markdown')) cleanedElement.css('width', '100%');

		cleanedElement.removeClass();
		cleanedElement.addClass('element');
		cleanedElement.css('top', 'initial');
		cleanedElement.css('left', 'initial');

		cleanedElement.find('.MathJax > .MJX_Assistive_MathML').each(function(j) {
			$(this).remove();
		});

		printContents.append(cleanedElement);
	});
	console.log(printContents);

	printContents.printThis({
		header: "<em>{0}</em><hr />".format(note.title)
	});
}

function exportNotepads(type) {
	var zip = new JSZip();
	var ext = "npxz";
	notepadStorage.iterate(function(value, key, i) {
		switch (type) {
			case "npx":
				var blob = new Blob([parser.restoreNotepad(JSON.parse(value)).toXML()], { type: "text/xml;charset=utf-8" });
				zip.file(key.replace(/[^a-z0-9 ]/gi, '') + '.npx', blob);
				break;
			case "md":
				ext = 'zip';
				for (var i = 0; i < parser.restoreNotepad(JSON.parse(value)).toMarkdown().length; i++) {
					var note = parser.restoreNotepad(JSON.parse(value)).toMarkdown()[i];

					var blob = new Blob([note.md], { type: "text/markdown;charset=utf-8" });
					zip.file('{0}/{1}.md'.format(key.replace(/[^a-z0-9 ]/gi, ''), note.title.replace(/[^a-z0-9 ]/gi, '')), blob);
				}
				break;
		}
	}, function() {
		zip.generateAsync({ type: "blob" }).then(function(blob) {
			saveAs(blob, "notepads."+ext);
		});
	});
}

function downloadFile(elementID) {
	var selElement;
	for (var i = 0; i < note.elements.length; i++) {
		element = note.elements[i];
		if (element.args.id === elementID) {
			selElement = element;
			break;
		}
	}
	var dataURI = selElement.content;
	var filename = selElement.args.filename;
	var blob = dataURItoBlob(dataURI);
	saveAs(blob, filename);
	$('#fileEditor').modal('close');
}

function updateTitle() {
	if (parents.length === 1) {
		//Delete old Notepad
		appStorage.getItem('syncToken', (err, token) => {
			function clientUpdate() {
				appStorage.removeItem('lastNotepadTitle', function() {
					switch (window.platform) {
						case "web":
							notepadStorage.removeItem(notepad.title, function() {
								notepad.title = $('#title-input').val();
								$('#parents > span:nth-child(1)').html(notepad.title);
								saveToBrowser();
								setTimeout(function() {
									location.reload();
								}, 500);
							});
							break;

						case "uwp":
							Windows.Storage.StorageFolder.getFolderFromPathAsync(storageDir)
								.then(function(folder) {
									return folder.getFileAsync('{0}.npx'.format(notepad.title.replace(/[^a-z0-9 ]/gi, '')));
								}).then(function(file) {
									return file.deleteAsync();
								}).done(function() {
									notepad.title = $('#title-input').val();
									saveToBrowser(undefined, true);
								});
							break;
					}
				});
			}

			if (!err && token !== null) {
				$.post(window.syncURL+'updateTitle.php', {
					token: token,
					filename: '{0}.npx'.format(notepad.title.replace(/[^a-z0-9 ]/gi, '')),
					newFilename: '{0}.npx'.format($('#title-input').val().replace(/[^a-z0-9 ]/gi, ''))
				}).always((res) => {
					console.log(res);
					clientUpdate();
				});
			}
			else {
				clientUpdate();
			}
		});
		
	}
	else if (parents.length > 1 && !note) {
		//Rename Section
		parents[parents.length - 1].title = $('#title-input').val();
		$('#parents > span:nth-last-child(2)').html(parents[parents.length - 1].title);
		notepad.lastModified = moment().format('YYYY-MM-DDTHH:mm:ss.SSSZ');
		saveToBrowser();
		updateNotepadExplorer();
	}
	else if (note) {
		//Rename Note
		note.title = $('#title-input').val();
		$('#open-note').html(note.title);
		notepad.lastModified = moment().format('YYYY-MM-DDTHH:mm:ss.SSSZ');
		saveToBrowser();
		updateNotepadExplorer();
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

	var oldParents = parents.slice(0, index + 1);
	parents = parents.slice(0, index);

	//Reset breadcrumbs
	$('#parents').children().each(function(i) {
		if (this.id == "open-note") return false;
		$(this).remove();
	});
	for (k in parents) {
		var p = parents[k];
		$('<span class="breadcrumb">{0}</span>'.format(p.title)).insertBefore('#open-note');
	}
	scrollBreadcrumbs();
	linkBreadcrumbs();

	loadSection(undefined, oldParents[oldParents.length - 1]);
}

function linkBreadcrumbs() {
	$('#parents').children().each(function(i) {
		if (this.id == "open-note") return false;

		$(this).attr('onclick', 'loadParent(' + i + ');');
	});
}

function updateSelector() {
	linkBreadcrumbs();
	$('<span class="breadcrumb">{0}</span>'.format(parents[parents.length - 1].title)).insertBefore('#open-note');
	scrollBreadcrumbs();
	$('#sectionList').html('');
	$('#noteList').html('');

	if (parents.length > 0) $('#add-section-link').css('display', 'block');
	if (parents.length > 1) $('#add-note-link').css('display', 'block');
}

function loadNoteFromExplorer(currentPath) {
	var currentPath = currentPath.split(',');
	var baseObj = {};
	for (var i = 0; i < currentPath.length; i++) {
		if (i === 0) {
			baseObj = notepad.sections[currentPath[i]];
		}
		else if (i === currentPath.length-1) {
			baseObj = baseObj.notes[currentPath[i]];
		}
		else {
			baseObj = baseObj.sections[currentPath[i]];
		}
	}
	parents = [];
	recalculateParents(baseObj); //baseObj now equals the note that we're loading
	loadNote(currentPath[currentPath.length-1]);
}

function loadSectionFromExplorer(currentPath) {
	var currentPath = currentPath.split(',');
	var baseObj = {};
	for (var i = 0; i < currentPath.length; i++) {
		if (i === 0) {
			baseObj = notepad.sections[currentPath[i]];
		}
		else {
			baseObj = baseObj.sections[currentPath[i]];
		}
	}
	parents = [];
	recalculateParents(baseObj); //baseObj now equals the section that we're loading
	loadSection(currentPath[currentPath.length-1]);
}

function loadSection(id, providedSection) {
	var section = parents[parents.length - 1].sections[id];
	if (providedSection) section = providedSection;
	parents.push(section);
	window.note = undefined;
	$('.display-with-note').hide();
	document.title = 'µPad';
	$('#viewer').html('');
	$('#open-note').hide();
	updateSelector();
	updateInstructions();
	$('#open-type').html('Section');
	$('#title-input').val(section.title);
	$('#mob-n-dd').css('color', '#000');
	$('#mob-n-dd').css('pointer-events', 'auto');

	$('#selectorTitle').html(section.title);
	for (k in section.sections) {
		var mSection = section.sections[k];
		$('#sectionList').append('<li><a href="javascript:loadSection({0});">{1}</a></li>'.format(k, mSection.title));
	}

	for (k in section.notes) {
		var note = section.notes[k];
		$('#noteList').append('<li><a href="javascript:loadNote({0});">{1}</a></li>'.format(k, note.title));
	}
	autoExpandExplorer();
}

function loadNote(id, delta) {
	if (!delta) {
		window.scrollTo(0, 0);
		noteID = id;
		oldNote = note;
		note = parents[parents.length - 1].notes[id];
		document.title = note.title + " - µPad";
		linkBreadcrumbs();
		$('#open-note').html('{0} <span class="time">{1}</span>'.format(note.title, moment(note.time).format('dddd, D MMMM h:mm A')));
		$('#viewer').html('');
		$('.display-with-note').show();
		scrollBreadcrumbs();

		//Don't ask me why this works - it just does
		$('#sidenav-overlay').trigger('click');
		setTimeout(function() {
			$('#sidenav-overlay').trigger('click');
		}, 800);
	}
	$('#open-type').html('Note');
	$('#title-input').val(note.title);

	for (var i = 0; i < note.elements.length; i++) {
		var element = note.elements[i];
		if (delta && $('#' + element.args.id).length) continue;
		$('#viewer').append('<div id="{0}" class="interact resize drag z-depth-2 hoverable element" style="left: {1}; top: {2}; width: {3}; height: {4};"><p class="handle">::::</p></div>'.format(element.args.id, element.args.x, element.args.y, element.args.width, element.args.height))
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
					checkedTodoItems.parentsUntil('ul').hide();
					elementDiv.innerHTML += '<a class="hidden-todo-msg" href="javascript:showTodo(\'{0}\')">Show/Hide {1} Completed Items</a>'.format(element.args.id, checkedTodoItems.length);
				}
				break;
			case "drawing":
				elementDiv.style.padding = "0px";
				elementDiv.innerHTML += '<img class="drawing" style="width: auto; height: auto;" src="{0}" />'.format(element.content);
				break;
			case "image":
				src = element.content;
				if (!delta) src = URL.createObjectURL(dataURItoBlob(element.content));

				elementDiv.style.padding = "0px";
				elementDiv.innerHTML += '<img id="img_{1}" class="resize" style="width: 100%; height: auto;" src="{0}" />'.format(src, element.args.id);
				break;
			case "file":
				elementDiv.innerHTML += '<div class="fileHolder" id="{4}" style="padding: 20px; height: {0}; width: {1};"><a href="javascript:downloadFile(\'{3}\');">{2}</a></div>'.format(element.args.height, element.args.width, element.args.filename, element.args.id);
				break;
			case "recording":
				$(elementDiv).addClass('recording');
				elementDiv.innerHTML += '<p class="recording-text"><em>{1}</em></p><audio controls="true" style="padding-top: 20px;" src="{0}"></audio>'.format(element.content, element.args.filename);
				if (!delta) edgeFix(dataURItoBlob(element.content), element.args.id);
				break;
		}
	}

	$('.drag').draggable({
		handle: ".handle",
		stack: ".drag",
		scroll: false,
		drag: function(event) {
			resizePage($(event.target));

			if ($('#source_'+event.target.id).length) {
				$('#source_'+event.target.id).attr("style", 'left: {0}; top: {1};'.format(parseInt(event.target.style.left)+$(event.target).width()+10+"px", event.target.style.top));
			}
		},
		stop: function(event) {
			var pos = $(event.target).position();
			if (pos.top < 0) event.target.style.top = "0px";
			if (pos.left < 0) event.target.style.left = "0px";

			if ($('#source_'+event.target.id).length) {
				$('#source_'+event.target.id).attr("style", 'left: {0}; top: {1};'.format(parseInt(event.target.style.left)+$(event.target).width()+10+"px", event.target.style.top));
			}

			updateNote(event.target.id);
			justMoved = true;
		}
	});

	updateBib();
	setTimeout(function() {
		initDrawings();
		updateNote(undefined, true);
	}, 1000);
	updateInstructions();
	autoExpandExplorer();
}

function showTodo(id, allOn) {
	if (allOn) {
		todoShowToggle[id] = true;
		$('#'+id+' .task-list-item input:checked').parentsUntil('#'+id).show();
	}
	else {
		todoShowToggle[id] = !todoShowToggle[id];
		if (todoShowToggle[id]) {
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

function insert(type, newElement) {
	$('#insert').modal('close');
	if (!newElement) {
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
		if (element.type == type && !id) {
			id = parseInt(element.args.id.split(element.type)[1]);
		}

		if (element.type == type) {
			id++;
		}
	}
	if (!id) id = 1;
	newElement.args.id = type + id;

	newElement.args.x = lastClick.x + 'px';
	newElement.args.y = lastClick.y + 'px';
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
		case "file":
			newElement.args.filename = "File";
			break;
		case "recording":
			newElement.args.filename = note.title.replace(/[^a-z0-9 ]/gi, '') + ' ' + new Date().toISOString() + ".ogg";
			break;
	}

	note.elements.push(newElement);

	loadNote(noteID, true);
	asciimath.translate(undefined, true);
	drawPictures();
	MathJax.Hub.Typeset();
	$('#' + newElement.args.id).trigger('click');
	return newElement.args.id;
}

/** Recording Stuff */
function insertRecording() {
	rec.initStream();
	$('#insert').modal('close');
	$('#empty-viewer').hide();
}

try {
	rec.addEventListener('streamReady', function(event) {
		rec.start();
		$('#stop-recording-btn').show();
	});
	rec.addEventListener("dataAvailable", function(e) {
		var blob = new Blob([e.detail], { type: 'audio/ogg' });
		var url = URL.createObjectURL(blob);

		var id = insert('recording');
		for (var i = 0; i < note.elements.length; i++) {
			var element = note.elements[i];
			if (id === element.args.id) {
				blobToDataURL(blob, function(dataURI) {
					element.content = dataURI;
					notepad.lastModified = moment().format('YYYY-MM-DDTHH:mm:ss.SSSZ');
					saveToBrowser();
				});
				break;
			}
		}

		$('#' + id + ' > audio').attr('src', url);
		edgeFix(blob, id);
	});
}
catch (err) {}

function edgeFix(blob, id) {
	if (window.navigator.userAgent.indexOf("Edge") > -1 || (navigator.userAgent.indexOf('Safari') != -1 && navigator.userAgent.indexOf('Chrome') == -1)) {
		//MS Edge sucks and can't opus. For them we'll use .wav
		var fileReader = new FileReader();
		fileReader.onload = function() {
			var arrayBuffer = this.result;
			var typedArray = new Uint8Array(arrayBuffer);
			var decoderWorker = new Worker('js/libs/recorderjs/decoderWorker.min.js');
			var wavWorker = new Worker('js/libs/recorderjs/waveWorker.min.js');
			var desiredSampleRate = 8000;

			decoderWorker.postMessage({
				command: 'init',
				decoderSampleRate: desiredSampleRate,
				outputBufferSampleRate: desiredSampleRate
			});

			wavWorker.postMessage({
				command: 'init',
				bitDepth: 16,
				sampleRate: desiredSampleRate
			});

			decoderWorker.onmessage = function(e) {
				if (e.data === null) {
					wavWorker.postMessage({ command: 'done' });
				}
				else {
					wavWorker.postMessage({
						command: 'record',
						buffers: e.data
					}, e.data.map(function(typedArray) {
						return typedArray.buffer;
					}));
				}
			};

			wavWorker.onmessage = function(e) {
				var blob = new Blob([e.data], { type: "audio/wav" });
				var url = URL.createObjectURL(blob);

				$('#' + id + ' > audio').attr('src', url);
			};

			decoderWorker.postMessage({
				command: 'decode',
				pages: typedArray
			}, [typedArray.buffer]);

			decoderWorker.postMessage({
				command: 'done'
			});
		};
		fileReader.readAsArrayBuffer(blob);
	}
}

function uploadDocx() {
	$('#docx-upload-name').val('');
	$('#docx-upload').unbind();
	$('#docx-upload').bind('change', function(event) {
		var file = event.target.files[0];
		if (!file) return;
		readFileInputEventAsArrayBuffer(event, function(arrayBuffer) {
			mammoth.convertToMarkdown({ arrayBuffer: arrayBuffer }).then(function(res) {
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
		if ($('#source_' + source.item).length) $('#source_' + source.item).remove();
		if (source.content.length < 1) continue;
		var item = $('#' + source.item);
		$('#viewer').append('<div id="source_{4}" style="top: {2}; left: {3};"><a target="_blank" href="{1}">{0}</a></div>'.format('[' + source.id + ']', source.content, item.css('top'), parseInt(item.css('left')) + parseInt(item.css('width')) + 10 + "px", source.item));
	}
	saveToBrowser();
}

function initDrawings() {
	$('.drawing').each(function(i) {
		var img = $(this)[0];
		var tmpCanvas = $('<canvas width="{0}" height="{1}"></canvas>'.format(img.naturalWidth, img.naturalHeight))[0];
		var tmpCtx = tmpCanvas.getContext('2d');
		tmpCtx.clearRect(0, 0, tmpCanvas.width, tmpCanvas.height);
		tmpCtx.drawImage(img, 0, 0);

		var trimmed = URL.createObjectURL(dataURItoBlob(trim(tmpCanvas).toDataURL()));
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
function resizePage(selElement, isImage) {
	if (!selElement[0]) return;
	var elementWidth = selElement.width();
	var elementHeight = selElement.height();

	if (isImage) {
		elementWidth = $('#'+selElement[0].id+' > img')[0].naturalWidth;
		elementHeight = $('#'+selElement[0].id+' > img')[0].naturalHeight;
	}

	if (selElement.position().left + elementWidth + 1000 > $('#viewer').width()) {
		$('#viewer').css('width', parseInt(selElement.css('left')) + elementWidth + 1000 + 'px');
	}
	if (selElement.position().top + elementHeight + 1000 > $('#viewer').height()) {
		$('#viewer').css('height', parseInt(selElement.css('top')) + elementHeight + 1000 + 'px');
	}
}

function saveToBrowser(retry) {
	/*
		I want to use the Filesystem and FileWriter API for this (https://www.html5rocks.com/en/tutorials/file/filesystem/)
		but only Chrome and Opera support it. For now I'll use IndexedDB with a sneaky async library.
	 */
	$('.save-status').html('Saving&hellip;');
	msHasNotepad();

	$('#viewer ul').each(function(i) {
		$(this).addClass('browser-default');
	});

	$('#viewer > .element').each(function(i) {
		resizePage($(this), false);
	});

	notepadStorage.setItem(notepad.title, stringify(notepad), function() {
		updateNotepadList();
		$('.save-status').html('All changes saved');
	});

	appStorage.setItem('lastNotepadTitle', notepad.title);
}

function loadFromBrowser(title) {
	notepadStorage.getItem(title, function(err, res) {
		if (err || res === null) return;

		notepad = parser.restoreNotepad(JSON.parse(res));
		window.initNotepad();

		getXmlObject(function(xmlObj) {
			syncWorker.postMessage({
				req: "setOld",
				xmlObj: xmlObj
			});
			msHasNotepad();
		});
	});
}

function handleUpload(event) {
	var uploadElement = $('#upload');
	if (isMobile()) uploadElement = $('#mob-upload');
	var ext = uploadElement.val().split('.').pop().toLowerCase();
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

		case "enex":
			readFileInputEventAsText(event, function(text) {
				parser.parseFromEvernote(text, ["asciimath"]);
				while (!parser.notepad) if (parser.notepad) break;
				notepad = parser.notepad;

				window.initNotepad();
				saveToBrowser();
			});
			break;

		case "zip":
		case "npxz":
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
}

var canvasOffset = null;

function resizeCanvas() {
	var canvas = $('#drawing-viewer');
	var canvasHolder = $('#canvas-holder');
	canvasCtx.canvas.width = canvasHolder.width();
	canvasCtx.canvas.height = canvasHolder.height();
	canvasOffset = canvas.offset();
}

function mobileNav() {
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
		$('#instructions').html("We don't put our notes in notepads directly. Use the sections menu to open or create a section.");
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

function zoom(zoomIn) {
	if (!note) return;

	var matrix = $('#viewer').css('transform').split('matrix(').pop().slice(0, -1).split(', ');
	curScale = parseFloat(matrix[0]);
	if (zoomIn) {
		curScale += 0.1;
	}
	else {
		curScale -= 0.1;
	}
	$('#viewer').css('transform', 'scale('+curScale+')');
}

uploadWorker.onmessage = function(event) {
	var msg = event.data;

	switch (msg.req) {
		case "done":
			putRequests.shift();
			cueUpload();
			break;

		case "progress":
			msg.percentage = msg.percentage.toFixed(1);
			if (msg.percentage < 100) {
				$('#parents > span:first-child').html(notepad.title+' (<a href="#!" onclick="$(\'#sync-manager\').modal(\'open\')">{0}ing: {1}%</a>)'.format(msg.type, msg.percentage));
			}
			else {
				$('#parents > span:first-child').html(notepad.title+' (<a href="#!" onclick="$(\'#sync-manager\').modal(\'open\')">Synced</a>)');
			}
			break;
	}
}

function cueUpload() {
	if (putRequests.length > 0) uploadWorker.postMessage(putRequests[0]);
}

/** Sync Functions */
syncWorker.onmessage = function(event) {
	var msg = event.data;

	switch (msg.req) {
		case "hasAddedNotepad":
			var isTrue = (msg.text === 'true');
			hasAddedNotepad = isTrue;

			if (isTrue) {
				$('#not-syncing-pitch').hide();
				$('#sync-options').show();
				msSync();
			}
			else {
				$('#parents > span:first-child').html(notepad.title+' (<a href="#!" onclick="$(\'#sync-manager\').modal(\'open\')">Enable µSync</a>)');
				$('#not-syncing-pitch').show();
				$('#sync-options').hide();
			}

			appStorage.getItem('syncToken', (err, token) => {
				if (err || token === null) $('#add-notepad-msg').hide();

				var req1 = $.get(window.syncURL+'payments/isSubscribed.php?token='+token);
				var req2 = $.get(window.syncURL+'getFreeSlots.php?token='+token);
				$.when(req1, req2).done((isSubscribed, freeSlots) => {
					if (isSubscribed[0] === "true" && freeSlots[0] > 0) {
						$('#add-notepad-msg').html('Start Syncing this Notepad ({0} slot(s) left)'.format(freeSlots[0]));
						$('#add-notepad-msg').show();
						$('#buy-slots-msg').hide();
					}
					else {
						$('#add-notepad-msg').hide();
					}

					if (isSubscribed[0] === "true") {
						$('#start-sub-btn').hide();
						$('#cancel-sub-btn').css('display', 'unset');
					}
					else {
						$('#start-sub-btn').show();
						$('#cancel-sub-btn').css('display', 'none');
					}
				}).fail(() => {
					$('#add-notepad-msg').hide();
				});
			});
			break;

		case "signup":
			if (msg.code === 201) {
				alert("Account Created! Login to get started.");
				$('#login').modal('open');
			}
			else {
				alert(msg.text);
			}
			break;

		case "login":
			if (msg.code === 200) {
				console.log(JSON.stringify(msg));
				appStorage.setItem('syncToken', msg.text, function() {
					window.location.reload();
				});
			}
			else {
				alert(msg.text);
			}
			break;

		case "addNotepad":
			switch (msg.code) {
				case 201:
					window.location.reload();
					break;

				default:
					alert(msg.text);
					break;	
			}
			break;

		case "sync":
			if (msg.code === 200) {
				if (msg.text.length === 0) $('#parents > span:first-child').html(notepad.title+' (<a href="#!" onclick="$(\'#sync-manager\').modal(\'open\')">Synced</a>)');
			}
			else {
				if (msg.text !== "Notepads are unprocessable if they have not been added") alert(msg.text);
			}
			break;

		case "askDownload":
			confirmAsync("A newer version of this notepad has been synced. Do you want to download it?").then(function(answer) {
				if (answer) {
					appStorage.getItem('syncToken', function(err, token) {
						if (err || token === null) return;
						syncWorker.postMessage({
							req: "download",
							syncURL: window.syncURL,
							token: token,
							localMap: msg.localMap,
							remoteMap: msg.remoteMap,
							chunks: msg.chunks,
							filename: msg.filename
						});
					});
				}
				else {
					notepad.lastModified = moment().format('YYYY-MM-DDTHH:mm:ss.SSSZ');
				}
			});
			break;

		case "upload":
			if (msg.code === 200) {
				$('#parents > span:first-child').html(notepad.title+' (<a href="#!" onclick="$(\'#sync-manager\').modal(\'open\')">Synced</a>)');
			}
			break;

		case "download":
			if (msg.code === 200) {
				if (msg.text.length === 0) return;
				parser.parse(msg.text, ["asciimath"]);
				while (!parser.notepad) if (parser.notepad) break;
				notepad = parser.notepad;

				window.initNotepad();
				$('#parents > span:first-child').html(notepad.title+' (<a href="#!" onclick="$(\'#sync-manager\').modal(\'open\')">Synced</a>)');
				saveToBrowser();
			}
			break;

		case "progress":
			msg.percentage = msg.percentage.toFixed(1);
			if (msg.percentage < 100) {
				$('#parents > span:first-child').html(notepad.title+' (<a href="#!" onclick="$(\'#sync-manager\').modal(\'open\')">{0}ing: {1}%</a>)'.format(msg.type, msg.percentage));
			}
			else {
				$('#parents > span:first-child').html(notepad.title+' (<a href="#!" onclick="$(\'#sync-manager\').modal(\'open\')">Synced</a>)');
			}
			break;

		case "error":
			$('#parents > span:first-child').html(notepad.title+' (<a href="#!" onclick="$(\'#sync-manager\').modal(\'open\')">Sync Error</a>)');
			$('#error-modal-text').html(msg.text);
			$('#error-modal').modal('open');
			break;

		case "cueGET":
		case "cuePUT":
			setTimeout(function() {
				putRequests.push(msg);

				if (putRequests.length === 1) {
					cueUpload();
				}
			}, 0);
			break;
	}
}

function msLogin(type) {
	var un = $('#username-input').val();
	$('#username-input').val('');
	var pw = $('#password-input').val();
	$('#password-input').val('');

	syncWorker.postMessage({
		syncURL: window.syncURL,
		req: type,
		username: un,
		password: pw
	});
}

function msAddNotepad() {
	appStorage.getItem('syncToken', function(err, res) {
		if (err || res === null) return;

		syncWorker.postMessage({
			syncURL: window.syncURL,
			req: 'addNotepad',
			token: res,
			filename: '{0}.npx'.format(notepad.title.replace(/[^a-z0-9 ]/gi, '')),
			lastModified: moment().subtract(100, 'years').format('YYYY-MM-DDTHH:mm:ss.SSSZ')
		});
	});
}

function msSync() {
	appStorage.getItem('syncToken', function(err, res) {
		if (err || res === null) return;

		$('#parents > span:first-child').html(notepad.title+' (<a href="#!" onclick="$(\'#sync-manager\').modal(\'open\')">Syncing&hellip;</a>)');
		syncWorker.postMessage({
			syncURL: window.syncURL,
			req: 'sync',
			token: res,
			filename: '{0}.npx'.format(notepad.title.replace(/[^a-z0-9 ]/gi, '')),
			notepad: notepad,
			method: syncMethod
		});
	});
}

function msHasNotepad() {
	if (hasAddedNotepad == "unknown") {
		appStorage.getItem('syncToken', function(err, res) {
			if (err || res === null) return;

			syncWorker.postMessage({
				syncURL: window.syncURL,
				req: "hasAddedNotepad",
				token: res,
				filename: '{0}.npx'.format(notepad.title.replace(/[^a-z0-9 ]/gi, ''))
			});
		});
	}
	else if (hasAddedNotepad === true) {
		msSync();
	}
}

function msLogout() {
	appStorage.removeItem("syncToken", () => {
		window.location.reload();
	});
}

function msRemoveNotepad(filename) {
	confirmAsync("This will permanently remove your notepad from our servers. Are you sure you want to continue?").then(a => {
		if (a) {
			appStorage.getItem("syncToken", function(err, token) {
				if (err || token === null) {
					alert("Error getting token");
					msLogout();
					return;
				}

				$.post(window.syncURL+"removeNotepad.php", {
					filename: filename,
					token: token
				}, () => {
					window.location.reload();
				}).fail(() => {
					alert("There was an error completing your request");
				});
			});
		}
	});
}

function syncOptions(option) {
	switch (option) {
		case "removeNotepad":
			msRemoveNotepad('{0}.npx'.format(notepad.title.replace(/[^a-z0-9 ]/gi, '')));
			break;
	}
}

function getXmlObject(callback) {
	setTimeout(function() {
		callback(notepad.toXMLObject());
	}, 0);
}

function formatMd(type) {
	switch (type) {
		case "bold":
			$('#md-textarea').surroundSelectedText("**", "**");
			break;

		case "italic":
			$('#md-textarea').surroundSelectedText("*", "*");
			break;

		case "b-list":
			$('#md-textarea').surroundSelectedText("- ", "");
			break;

		case "n-list":
			$('#md-textarea').surroundSelectedText("1. ", "");
			break;

		case "t-list":
			$('#md-textarea').surroundSelectedText("- [ ] ", "");
			break;

		case "indent":
			$('#md-textarea').surroundSelectedText("\t", "");
			break;

		case "equation":
			$('#md-textarea').surroundSelectedText(" ===", "=== ");
			break;

		case "strikethrough":
			$('#md-textarea').surroundSelectedText("~~", "~~");
			break;

		case "link":
			$('#md-textarea').replaceSelectedText("[{0}]({1})".format($('#md-textarea').getSelection().text, "https://example.com"));
			break;

		case "table":
			$('#md-textarea').replaceSelectedText("| Header 1 | Header 2 |\n|---|---|\n| Column 1 | Column 2 |\n| Row 2 |  |");
			break;
	}
}

/** Utility functions */
function toBase64(str) {
	return window.btoa(unescape(encodeURIComponent(str)));
}

function fromBase64(str) {
	return decodeURIComponent(escape(window.atob(str)));
}

function isMobile() {
	return $('#mobile-canary').is(':visible');
}

function confirmAsync(question) {
	switch (window.platform) {
		case "web":
			return Promise.resolve(confirm(question));
			break;
		case "uwp":
			var msgbox = new Windows.UI.Popups.MessageDialog(question, "Are you sure?");
			msgbox.commands.append(new Windows.UI.Popups.UICommand("No", null, 1));
			msgbox.commands.append(new Windows.UI.Popups.UICommand("Yes", null, 2));
			msgbox.defaultCommandIndex = 1;
			return msgbox.showAsync().then(function(command) {
				if (command) {
					if (command.id == 2) return true;
				}
				return false;
			});
			break;
	}
}

function stringify(obj) {
	var seen = [];
	return JSON.stringify(obj, (key, val) => {
		if (val != null && typeof val === "object") {
			if (seen.indexOf(val) > -1) return;
			seen.push(val);
		}
		return val;
	});
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

//Thanks to http://stackoverflow.com/a/12300351/998467
function dataURItoBlob(dataURI) {
	// convert base64 to raw binary data held in a string
	// doesn't handle URLEncoded DataURIs - see SO answer #6850276 for code that does this
	var byteString = atob(dataURI.split(',')[1]);

	// separate out the mime component
	var mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0]

	// write the bytes of the string to an ArrayBuffer
	var ab = new ArrayBuffer(byteString.length);
	var ia = new Uint8Array(ab);
	for (var i = 0; i < byteString.length; i++) {
		ia[i] = byteString.charCodeAt(i);
	}

	// write the ArrayBuffer to a blob, and you're done
	var blob = new Blob([ab], { type: mimeString });
	return blob;
}

function blobToDataURL(blob, callback) {
	var a = new FileReader();
	a.onload = function(e) { callback(e.target.result); }
	a.readAsDataURL(blob);
}
