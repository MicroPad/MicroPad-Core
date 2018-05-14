var downloadData;

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
	$('#parents > span:first-child').html(notepad.title+' (<a href="#!" onclick="$(\'#sync-manager\').modal(\'open\')">Uploading: {0} parts remaining...</a>)'.format(putRequests.length));
	if (putRequests.length <= 1) {
		setTimeout(() => {
			$('#parents > span:first-child').html(notepad.title+' (<a href="#!" onclick="$(\'#sync-manager\').modal(\'open\')">Synced</a>)');
		}, 500);
	}
}

syncWorker.onmessage = function(event) {
	var msg = event.data;

	switch (msg.req) {
		case "hasAddedNotepad":
			var isTrue = (msg.text === 'true');
			hasAddedNotepad = isTrue;

			if (isTrue) {
				$('#sync-button').show();
				$('#not-syncing-pitch').hide();
				$('#sync-options').show();
				msSync();
			}
			else {
				$('#sync-button').hide();
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
			$('#toast-container').show();
			Materialize.toast('<span>A newer version of this notepad has been synced</span><a class="btn-flat amber-text" style="font-weight: 500;" href="javascript:msDownload();">Download</a>', 6000);
			downloadData = msg;
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
				parser.parseAssets(msg.text, a => {
					if (!a.assets) return;
					notepadAssets = new Set();
					for (var i = 0; i < a.assets.length; i++) {
						if (!notepadAssets.has(a.assets[i].uuid)) notepadAssets.add(a.assets[i].uuid);
						assetStorage.setItem(a.assets[i].uuid, a.assets[i].data);
					}
				});
				while (!parser.notepad) if (parser.notepad) break;
				notepad = parser.notepad;
				notepad.notepadAssets = notepadAssets;

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
		getAssets(assets => {
			syncWorker.postMessage({
				syncURL: window.syncURL,
				req: 'sync',
				token: res,
				filename: '{0}.npx'.format(notepad.title.replace(/[^a-z0-9 ]/gi, '')),
				notepad: notepad,
				assets: assets,
				method: syncMethod
			});
		});
	});
}

function msDownload() {
	$('#toast-container').fadeOut();
	appStorage.getItem('syncToken', function(err, token) {
		if (err || token === null) return;
		syncWorker.postMessage({
			req: "download",
			syncURL: window.syncURL,
			token: token,
			localMap: downloadData.localMap,
			remoteMap: downloadData.remoteMap,
			chunks: downloadData.chunks,
			filename: downloadData.filename
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

function downloadNotepad(filename) {
	$('#open-microsync').modal('close');
	notepad = parser.createNotepad(filename.split('.npx')[0]);
	notepad.lastModified = moment().subtract(100, 'years').format('YYYY-MM-DDTHH:mm:ss.SSSZ');
	window.initNotepad();
}
