// For an introduction to the Blank template, see the following documentation:
// http://go.microsoft.com/fwlink/?LinkId=232509
var storageDir;
var count = 0;
(function () {
	"use strict";

	var app = WinJS.Application;
	var activation = Windows.ApplicationModel.Activation;

	app.onactivated = function (args) {
		if (args.detail.kind === activation.ActivationKind.file) {
			if (args.detail.files.size > 0) {
				stillLoading = true;
				$('.preloader-text').html('Importing Notepad...');
				var f = args.detail.files[0];
				switch (f.fileType) {
					case ".npx":
						Windows.Storage.FileIO.readTextAsync(f).then(function (text) {
							parser.parse(text, ["asciimath"]);
							while (!parser.notepad) if (parser.notepad) break;
							notepad = parser.notepad;
							saveToBrowser(undefined, true);
						});
						break;
					case ".zip":
					case ".npxz":
						Windows.Storage.FileIO.readBufferAsync(f).then(function (buffer) {
							var bytes = new Uint8Array(buffer.length);
							var dataReader = Windows.Storage.Streams.DataReader.fromBuffer(buffer);
							dataReader.readBytes(bytes);
							dataReader.close();

							var zip = new JSZip();
							zip.loadAsync(bytes).then(function () {
								count = 0;
								for (var k in zip.files) {
									if (k.split('.').pop().toLowerCase() === 'npx') {
										zip.file(k).async('string').then(function success(text) {
											parser.parse(text, ["asciimath"]);
											while (!parser.notepad) if (parser.notepad) break;
											notepad = parser.notepad;
											saveToBrowser(undefined, true, [count, Object.keys(zip.files).length]);

											count++;
										});
									}
								}
							});
						});
						break;
				}
			}
		}

		if (args.detail.kind === activation.ActivationKind.launch) {
			if (args.detail.previousExecutionState !== activation.ApplicationExecutionState.terminated) {
				// TODO: This application has been newly launched. Initialize your application here.
			}
			else {
				// TODO: This application was suspended and then terminated.
				// To create a smooth user experience, restore application state here so that it looks like the app never stopped running.
			}
			args.setPromise(WinJS.UI.processAll());
		}
	};

	app.oncheckpoint = function (args) {
		// TODO: This application is about to be suspended. Save any state that needs to persist across suspensions here.
		// You might use the WinJS.Application.sessionState object, which is automatically saved and restored across suspension.
		// If you need to complete an asynchronous operation before your application is suspended, call args.setPromise().
	};

	app.start();
})();

$(document).ready(function () {
	//TODO: Check if we're using a different working dir before doing this
	appStorage.getItem('storageDir').then(function(res) {
		if (res === null) {
			appStorage.setItem('storageDir', Windows.Storage.KnownFolders.documentsLibrary.createFolderAsync("µPad Notepads", Windows.Storage.CreationCollisionOption.openIfExists).then(function (f) {
				storageDir = f.path;
				refreshStorageDir();
			}));
		}
		else {
			storageDir = res;
			refreshStorageDir();
		}
	});
});

function refreshStorageDir() {
	Windows.Storage.StorageFolder.getFolderFromPathAsync(storageDir).then(function (folder) {
		$('#workingDir').html(folder.path);
	}, function (err) {
		alert("Error accessing storage folder. Reverting to default: {0}".format(err));
		appStorage.setItem('storageDir', Windows.Storage.KnownFolders.documentsLibrary.createFolderAsync("µPad Notepads", Windows.Storage.CreationCollisionOption.openIfExists).then(function (f) {
			storageDir = f.path;
		}));
	});
}

function changeStorageLocation() {
	var folderPicker = new Windows.Storage.Pickers.FolderPicker();
	folderPicker.commitButtonText = "Set Notepad Storage Location";
	folderPicker.suggestedStartLocation = Windows.Storage.Pickers.PickerLocationId.documentsLibrary;
	folderPicker.fileTypeFilter.replaceAll(["*"]);
	folderPicker.pickSingleFolderAsync().then(function (folder) {
		folder.createFolderAsync("µPad Notepads", Windows.Storage.CreationCollisionOption.openIfExists).then(function (newFolder) {
			//Give permission to access this directory without opening a picker everytime
			Windows.Storage.AccessCache.StorageApplicationPermissions.futureAccessList.addOrReplace('storageDir', newFolder);

			//Update settings an reload
			appStorage.setItem('storageDir', newFolder.path, function () {
				appStorage.removeItem('lastNotepadTitle', function () {
					window.location.reload();
				});
			});
		});
	}, function (err) { alert("There was an error trying to access your selected folder"); });
}

function loadNote(id, delta) {
	if (!delta) {
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
		setTimeout(function () {
			$('#sidenav-overlay').trigger('click');
		}, 800);
	}
	$('#open-type').html('Note');
	$('#title-input').val(note.title);

	for (var i = 0; i < note.elements.length; i++) {
		var element = note.elements[i];
		if (delta && $('#' + element.args.id).length) continue;
		switch (element.type) {
			case "markdown":
				$('#viewer').append('<div class="interact z-depth-2 hoverable" id="{6}" style="top: {0}; left: {1}; height: {2}; width: {3}; font-size: {4};">{5}</div>'.format(element.args.y, element.args.x, element.args.height, element.args.width, element.args.fontSize, md.makeHtml(element.content), element.args.id));
				asciimath.translate(undefined, true);
				break;
			case "drawing":
				$('#viewer').append('<img class="interact hoverable drawing" id="{0}" style="top: {1}; left: {2}; height: {3}; width: {4};" src="{5}" />'.format(element.args.id, element.args.y, element.args.x, 'auto', 'auto', element.content));
				break;
			case "image":
				src = element.content;
				if (!delta) src = URL.createObjectURL(dataURItoBlob(element.content));
				$('#viewer').append('<img class="interact z-depth-2 hoverable" id="{4}" style="top: {0}; left: {1}; height: {2}; width: {3};" src="{5}" />'.format(element.args.y, element.args.x, element.args.height, element.args.width, element.args.id, src));
				break;
			case "file":
				$('#viewer').append('<div class="interact z-depth-2 hoverable fileHolder" id="{5}" style="top: {0}; left: {1}; height: {2}; width: {3};"><a href="javascript:downloadFile(\'{5}\');">{4}</a></div>'.format(element.args.y, element.args.x, element.args.height, element.args.width, element.args.filename, element.args.id));
				break;
			case "recording":
				$('#viewer').append('<div class="z-depth-2 hoverable interact recording" id="{6}" style="top: {0}; left: {1}; height: {2}; width: {3};"><audio controls="true" src="{5}"></audio><p class="recording-text"><em>{4}</em></p></div>'.format(element.args.y, element.args.x, element.args.height, element.args.width, element.args.filename, element.content, element.args.id));
				if (!delta) edgeFix(dataURItoBlob(element.content), element.args.id);
				if (window.navigator.userAgent.indexOf("Edge") > -1) $('#' + element.args.id).removeClass('interact');
				break;
		}
	}
	updateBib();
	setTimeout(function () {
		MathJax.Hub.Typeset();
		initDrawings();
	}, 1000);
	updateInstructions();
}

function updateNotepadList() {
	if (isUpdating) return;
	Windows.Storage.StorageFolder.getFolderFromPathAsync(storageDir).then(function (folder) { return folder.getFilesAsync(); }).done(function (files) {
		isUpdating = true;
		$('#notepadList').html('');
		files.forEach(function (f) {
			if (f.fileType !== ".npx") return;
			$('#notepadList').append('<li><a href="javascript:loadFromBrowser(\'{0}\');">{0}</a></li>'.format(f.displayName));
		});
		isUpdating = false;
	}, function (err) {
		appStorage.setItem('storageDir', Windows.Storage.KnownFolders.documentsLibrary.createFolderAsync("µPad Notepads", Windows.Storage.CreationCollisionOption.openIfExists).then(function (f) {
			storageDir = f.path;
			refreshStorageDir();
			updateNotepadList();
		}));
	});
}

function saveToFilesystem(blob, filename, reload, bulk) {
	Windows.Storage.StorageFolder.getFolderFromPathAsync(storageDir).then(function (folder) {
		folder.createFileAsync(filename, Windows.Storage.CreationCollisionOption.replaceExisting).then(function (file) {
			file.openAsync(Windows.Storage.FileAccessMode.readWrite).then(function (output) {
				var input = blob.msDetachStream();
				Windows.Storage.Streams.RandomAccessStream.copyAsync(input, output).then(function () {
					output.flushAsync().done(function () {
						input.close();
						output.close();
						if ((reload && !bulk) || (reload && bulk && bulk[0] >= bulk[1]-1)) window.location.reload();
					});
				});
			});
		});
	});
}

function saveToBrowser(retry, fileLoad, bulk) {	
	$('#viewer ul').each(function(i) {
		$(this).addClass('browser-default');
	});

	if (fileLoad) {
		notepadStorage.setItem(notepad.title, '', function () {
			appStorage.setItem('lastNotepadTitle', notepad.title, function () {
				var blob = new Blob([notepad.toXML()], { type: "text/xml;charset=utf-8" });
				saveToFilesystem(blob, '{0}.npx'.format(notepad.title.replace(/[^a-z0-9 ]/gi, '')), true, bulk);
			});
		});
	}
	else {
		notepadStorage.setItem(notepad.title, '', function () {
			updateNotepadList();
		});

		//Save to the FS
		var blob = new Blob([notepad.toXML()], { type: "text/xml;charset=utf-8" });
		saveToFilesystem(blob, '{0}.npx'.format(notepad.title.replace(/[^a-z0-9 ]/gi, '')), false, bulk);

		appStorage.setItem('lastNotepadTitle', notepad.title);
	}
}

function saveAs(blob, filename) {
	Windows.Storage.ApplicationData.current.temporaryFolder.createFileAsync(filename, Windows.Storage.CreationCollisionOption.replaceExisting).then(function (file) {
		file.openAsync(Windows.Storage.FileAccessMode.readWrite).then(function (output) {
			var input = blob.msDetachStream();
			Windows.Storage.Streams.RandomAccessStream.copyAsync(input, output).then(function () {
				output.flushAsync().done(function () {
					input.close();
					output.close();
					Windows.System.Launcher.launchFileAsync(file).done();
				});
			});
		});
	});
}
function loadFromBrowser(title) {
	Windows.Storage.StorageFolder.getFolderFromPathAsync(storageDir).then(function (folder) { return folder.getFileAsync('{0}.npx'.format(title.replace(/[^a-z0-9 ]/gi, ''))); })
		.then(function (file) { return Windows.Storage.FileIO.readTextAsync(file); }, function (err) { notepad = undefined; })
		.then(function (text) {
			if (!text || text.length === 0) {
				notepad = undefined;
				return;
			}
			parser.parse(text, ["asciimath"]);
			while (!parser.notepad) if (parser.notepad) break;
			notepad = parser.notepad;
			window.initNotepad();
		});
}

function deleteOpen() {
	confirmAsync("Are you sure you want to delete this?").then(function (answer) {
		if (answer) {
			if (parents.length === 1) {
				//Delete Notepad
				appStorage.removeItem('lastNotepadTitle', function () {
					Windows.Storage.StorageFolder.getFolderFromPathAsync(storageDir)
						.then(function (folder) {
							return folder.getFileAsync('{0}.npx'.format(notepad.title.replace(/[^a-z0-9 ]/gi, '')));
						}).then(function (file) {
							return file.deleteAsync();
						}).done(function () {
							window.location.reload();
						});
				});
			}
			else if (parents.length > 1 && !note) {
				//Delete Section
				parents[parents.length - 2].sections = parents[parents.length - 2].sections.filter(function (s) { return s !== parents[parents.length - 1] });
				saveToBrowser();
				loadParent(parents.length - 2)
			}
			else if (note) {
				//Delete Note
				parents[parents.length - 1].notes = parents[parents.length - 1].notes.filter(function (n) { return n !== note });
				saveToBrowser();
				loadParent(parents.length - 1);
			}
		}
	});
}
