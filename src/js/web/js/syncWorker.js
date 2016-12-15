var me = {};
var oldXML = '';

importScripts('libs/moment.js');
importScripts('libs/localforage.min.js');
importScripts('parser.js');

var appStorage = localforage.createInstance({
	name: 'uPad',
	version: 1.0,
	storeName: 'app'
});

onmessage = function(event) {
	var msg = event.data;
	me.syncURL = msg.syncURL;

	switch (msg.req) {
		case "hasAddedNotepad":
			apiPost('hasAddedNotepad.php', {
				token: msg.token,
				filename: msg.filename
			}, function(res, code) {
				postMessage({
					req: msg.req,
					text: res,
					code: code
				});
			});
			break;

		case "signup":
		case "login":
			apiPost(msg.req+'.php', {
				username: msg.username,
				password: msg.password
			}, function(res, code) {
				postMessage({
					req: msg.req,
					text: res,
					code: code
				});
			});
			break;

		case "addNotepad":
			apiPost(msg.req+'.php', {
				token: msg.token,
				filename: msg.filename,
				lastModified: msg.lastModified
			}, function(res, code) {
				postMessage({
					req: msg.req,
					text: res,
					code: code
				});
			});
			break;

		case "sync":
			var np = parser.restoreNotepad(msg.notepad);
			// if (msg.hasBeenSynced) oldXML = np.toXML();
			var newLines = np.makeDiff(oldXML).split(/\r\n|\r|\n/).length - oldXML.split(/\r\n|\r|\n/).length;
			apiPost(msg.req+'.php', {
				token: msg.token,
				filename: msg.filename,
				lastModified: np.lastModified,
				newLines: newLines
			}, function(res, code) {
				postMessage({
					req: msg.req,
					text: res,
					code: code
				});
			});
			break;

		case "upload":
			// var notepadXML = parser.xmlObjToXML(msg.notepad);
			// var notepadXMLArr = notepadXML.split(/\r?\n/);
			// var old = oldXML.split(/\r?\n/);
			// oldXML = notepadXML;
			// var diff = {};

			//Generate diff
			// for (var i = 0; i < notepadXMLArr.length; i++) {
			// 	if (notepadXMLArr[i] !== old[i]) diff[i] = notepadXMLArr[i];
			// }

			// if (Object.keys(diff).length < 1) {
			// 	postMessage({
			// 		req: 'upload',
			// 		code: 200
			// 	});
			// 	break;
			// }
			var np = parser.restoreNotepad(msg.notepad);
			var diff = np.makeDiff(oldXML);
			if (diff.length < 1) {
				postMessage({
					req: 'upload',
					code: 200
				});
				return;
			}
			if (byteLength(diff) > 10000000 && byteLength(diff) <= 1000000000) {
				//Diff >10MB; do a direct upload
				apiPost('directUpload.php', {
					token: msg.token,
					filename: '{0}.npx'.format(np.title.replace(/[^a-z0-9 ]/gi, ''))
				}, function(res, code) {
					if (code === 200) {
						console.log(res);
						reqPUT(res, np.toXML(), function(res, code) {
							postMessage({
								req: 'upload',
								code: code
							});
						});
					}
					else {
						console.log(res);
						return;
					}
				});
			}
			else if (byteLength(diff) > 1000000000) {
				//Diff >1GB; don't upload
				postMessage({
					req: 'error',
					message: "Wowza! Your notepad is so big we can't store it.<br><br>It might be a good idea to split up your notepad, it'll also improve performance."
				});
			}
			else {
				reqPUT(msg.url, diff, function(res, code) {
					postMessage({
						req: 'upload',
						code: code
					});
				});
			}

			appStorage.getItem('syncedNotepads', function(err, syncList) {
				if (syncList === null) syncList = {};
				syncList[np.title] = true;
				appStorage.setItem('syncedNotepads', syncList);
			});

			oldXML = np.toXML();

			break;

		case "download":
			reqGET(msg.url, function(res, code) {
				if (code === 200 && res.length > 0) oldXML = res;
				postMessage({
					req: 'download',
					code: code,
					text: res
				});
			});
			break;
	}
}

function apiPost(url, params, callback) {
	url = me.syncURL+url;
	var paramString = "";
	for (var param in params) {
		if (paramString.length > 0) paramString += "&";
		paramString += param+"="+encodeURIComponent(params[param]);
	}

	var xhr = new XMLHttpRequest();
	xhr.onreadystatechange = function() {
		if (xhr.readyState == 4) {
			callback(xhr.responseText, xhr.status);
		}
	}

	xhr.open("POST", url, true);
	xhr.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
	xhr.send(paramString);
}

function reqGET(url, callback) {
	var xhr = new XMLHttpRequest();
	xhr.addEventListener("progress", function(event) {
		progress(event, "Download");
	});
	xhr.onreadystatechange = function() {
		if (xhr.readyState == 4) {
			callback(xhr.responseText, xhr.status);
		}
	}
	xhr.open("GET", url, true);
	xhr.send();
}

function reqPUT(url, data, callback) {
	var xhr = new XMLHttpRequest();
	xhr.upload.addEventListener("progress", function(event) {
		progress(event, "Upload");
	});
	xhr.onreadystatechange = function() {
		if (xhr.readyState == 4) {
			callback(xhr.responseText, xhr.status);
		}
	}

	xhr.open("PUT", url, false);
	xhr.setRequestHeader('Content-Type', 'text/plain');
	xhr.send(data);
}

function progress(event, type) {
	if (event.lengthComputable) {
		postMessage({
			req: "progress",
			type: type,
			percentage: parseInt((event.loaded/event.total)*100)
		});
	}
}

//Thanks to http://stackoverflow.com/a/23329386/998467
function byteLength(str) {
	// returns the byte length of an utf8 string
	var s = str.length;
	for (var i=str.length-1; i>=0; i--) {
		var code = str.charCodeAt(i);
		if (code > 0x7f && code <= 0x7ff) s++;
		else if (code > 0x7ff && code <= 0xffff) s+=2;
		if (code >= 0xDC00 && code <= 0xDFFF) i--; //trail surrogate
	}
	return s;
}
