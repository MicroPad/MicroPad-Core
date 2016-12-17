var me = {};
var oldMap = "";
var oldXML = "";

importScripts('libs/moment.js');
importScripts('libs/localforage.min.js');
importScripts('libs/encoding.js');
importScripts('libs/md5.js');
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
			// var np = parser.restoreNotepad(msg.notepad);
			// if (msg.hasBeenSynced) oldXML = np.toXML();
			apiPost(msg.req+'.php', {
				token: msg.token,
				filename: msg.filename,
				lastModified: msg.notepad.lastModified,
				newLines: 0
			}, function(res, code) {
				postMessage({
					req: msg.req,
					text: res,
					code: code
				});
			});
			break;

		case "upload":
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
						postMessage({
							req: "cuePUT",
							token: msg.token,
							syncURL: me.syncURL,
							url: res,
							data: np.toXML()
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
				postMessage({
					req: "cuePUT",
					token: msg.token,
					syncURL: me.syncURL,
					url: msg.url,
					data: diff
				});
			}

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

		case "setOldXML":
			oldXML = parser.restoreNotepad(msg.notepad).toXML();
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

function apiPostSync(url, params, callback) {
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

	xhr.open("POST", url, false);
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

	xhr.open("PUT", url, true);
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
