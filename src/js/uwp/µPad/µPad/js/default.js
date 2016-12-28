var storageDir;
var count = 0;
var saveWorker = new Worker('js/saveWorker.js');

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
					case ".enex":
						Windows.Storage.FileIO.readTextAsync(f).then(function(text) {
							parser.parseFromEvernote(text, ["asciimath"]);
							while (!parser.notepad) if (parser.notepad) break;
							notepad = parser.notepad;
							saveToBrowser(undefined, true);
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
			Windows.Storage.ApplicationData.current.localFolder.createFolderAsync("µPad Notepads", Windows.Storage.CreationCollisionOption.openIfExists).then(function(f) {
				appStorage.setItem('storageDir', f.path, function() {
					storageDir = f.path;
					refreshStorageDir();
				});
			});
		}
		else {
			storageDir = res;
			refreshStorageDir();
		}
	}).catch(function(err) {
		Windows.Storage.ApplicationData.current.localFolder.createFolderAsync("µPad Notepads", Windows.Storage.CreationCollisionOption.openIfExists).then(function(f) {
			appStorage.setItem('storageDir', f.path, function() {
				storageDir = f.path;
				refreshStorageDir();
			});
		});
	});
});

function refreshStorageDir() {
	Windows.Storage.StorageFolder.getFolderFromPathAsync(storageDir).then(function(folder) {
		$('#workingDir').html(folder.path);

		/** Restore to previous notepad */
		appStorage.getItem('lastNotepadTitle', function(e, title) {
			if (title == null || e) return;
			folder.getFilesAsync().done(function(files) {
				files.forEach(function(f) {
					if (title.replace(/[^a-z0-9 ]/gi, '') === f.displayName) loadFromBrowser(title);
				});
			});
		});
		updateNotepadList();
	}, function(err) {
		alert("Error accessing storage folder. Reverting to default ({0})".format(err));
		appStorage.setItem('storageDir', Windows.Storage.ApplicationData.current.localFolder.createFolderAsync("µPad Notepads", Windows.Storage.CreationCollisionOption.openIfExists).then(function(f) {
			storageDir = f.path;
			refreshStorageDir();
		}));
	});
}

function changeStorageLocation() {
	var folderPicker = new Windows.Storage.Pickers.FolderPicker();
	folderPicker.commitButtonText = "Set Notepad Storage Location";
	folderPicker.suggestedStartLocation = Windows.Storage.Pickers.PickerLocationId.documentsLibrary;
	folderPicker.fileTypeFilter.replaceAll(["*"]);
	folderPicker.pickSingleFolderAsync().then(function(folder) {
		return folder.createFolderAsync("µPad Notepads", Windows.Storage.CreationCollisionOption.openIfExists); })
		.then(function (newFolder) {
			//Give permission to access this directory without opening a picker everytime
			Windows.Storage.AccessCache.StorageApplicationPermissions.futureAccessList.addOrReplace('storageDir', newFolder);

			//Update settings an reload
			appStorage.setItem('storageDir', newFolder.path, function () {
				appStorage.removeItem('lastNotepadTitle', function () {
					window.location.reload();
				});
			});
		})
		.done(undefined, function(err) { alert("There was an error trying to access your selected folder"); });
}

function updateNotepadList() {
	if (isUpdating || !storageDir) return;
	Windows.Storage.StorageFolder.getFolderFromPathAsync(storageDir).then(function (folder) { return folder.getFilesAsync(); }).done(function (files) {
		isUpdating = true;
		$('#notepadList').html('');
		files.forEach(function (f) {
			if (f.fileType !== ".npx") return;
			$('#notepadList').append('<li><a href="javascript:loadFromBrowser(\'{0}\');">{0}</a></li>'.format(f.displayName));
		});
		isUpdating = false;
	}, function (err) {
		alert("Error accessing storage folder: {0}".format(err));
		changeStorageLocation();
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
						updateNotepadList();
						$('.save-status').html('All changes saved');
						if ((reload && !bulk) || (reload && bulk && bulk[0] >= bulk[1]-1)) window.location.reload();
					});
				});
			});
		});
	});
}

function saveToBrowser(retry, fileLoad, bulk) {	
	$('.save-status').html('Saving&hellip;');
	msHasNotepad();

	$('#viewer ul').each(function(i) {
		$(this).addClass('browser-default');
	});

	appStorage.setItem('lastNotepadTitle', notepad.title, function() {
		getXmlObject(function(xmlObj) {
			saveWorker.postMessage({ xmlObj: xmlObj, fileLoad: fileLoad, bulk: bulk });
		});
	});
}
saveWorker.onmessage = function(event) {
	var blob = event.data.xml;
	if (event.data.fileLoad) {
		appStorage.setItem('lastNotepadTitle', notepad.title, function() {
			saveToFilesystem(blob, '{0}.npx'.format(notepad.title.replace(/[^a-z0-9 ]/gi, '')), true, event.data.bulk);
		});
	}
	else {
		saveToFilesystem(blob, '{0}.npx'.format(notepad.title.replace(/[^a-z0-9 ]/gi, '')), false, event.data.bulk);
		appStorage.setItem('lastNotepadTitle', notepad.title);
	}
}

function getXmlObject(callback) {
	setTimeout(function() {
		callback(notepad.toXMLObject());
	}, 0);
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

			getXmlObject(xmlObj => {
				syncWorker.postMessage({
					req: "setOld",
					xmlObj: xmlObj
				});
				msHasNotepad();
			});
		});
}

function msGetOrderID(plan) {
	var prodNum;
	var prodName;
	var price;
	switch (plan) {
		case "s":
			prodNum = 1;
			prodName = "Single";
			price = '1.00';
			break;
		case "sp":
			prodNum = 2;
			prodName = "Study Pack";
			price = '2.95';
			break;
		case "pp":
			prodNum = 3;
			prodName = "Power Pack";
			price = '9.50';
			break;
	}

	$('#microsync-checkout-form > form > input[name="li_0_name"]').attr('value', 'µSync ({0})'.format(prodName));
	$('#microsync-checkout-form > form > input[name="li_0_price"]').attr('value', price);

	$('#microsync-checkout-form > form > input[value="product"]').attr('name', 'li_{0}_type'.format(prodNum));
	$('#microsync-checkout-form > form > input[name="li_0_name"]').attr('name', 'li_{0}_name'.format(prodNum));
	$('#microsync-checkout-form > form > input[name="li_0_price"]').attr('name', 'li_{0}_price'.format(prodNum));
	$('#microsync-checkout-form > form > input[name="li_0_quantity"]').attr('name', 'li_{0}_quantity'.format(prodNum));

	appStorage.getItem("syncToken", (err, token) => {
		if (err || token === null) return;

		$.post(window.syncURL + 'payments/newOrderID.php', { token: token }, data => {
			$('#microsync-checkout-form > form > input[name="merchant_order_id"]').val(data);
			$('#microsync-checkout-form > form').submit();
		});
	});
}
