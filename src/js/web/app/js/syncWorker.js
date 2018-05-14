importScripts('libs/moment.js');
importScripts('libs/localforage.min.js');
importScripts('libs/encoding.js');
importScripts('libs/md5.js');
importScripts('parser.js');
importScripts('S3Url.js')

var me = {};
var lastSyncAsk = new Date(0);

var appStorage = localforage.createInstance({
	name: 'uPad',
	version: 1.0,
	storeName: 'app'
});

onmessage = function(event) {
	var msg = event.data;

	if (Object.keys(me).length === 0) {
		me.S3UrlMap = {
			getChunkUpload: new S3Url("getChunkUpload", "POST", msg.syncURL),
			getChunkDownload: new S3Url("getChunkDownload", "POST", msg.syncURL),
			getMapUpload: new S3Url("getMapUpload", "POST", msg.syncURL),
			getMapDownload: new S3Url("getMapDownload", "GET", msg.syncURL)
		};
	}

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
			if (new Date() - lastSyncAsk < 2000) {
				postMessage({
					req: 'upload',
					code: 200,
					text: ''
				});
				return;
			}
			lastSyncAsk = new Date();

			me.S3UrlMap.getMapDownload.getUrl(msg.token, msg.filename, (res, code) => {
				if (code == 200) {
					var np = parser.restoreNotepad(msg.notepad);
					msg.assets.__proto__ = parser.Assets.prototype;
					for (var i = 0; i < msg.assets.assets.length; i++) msg.assets.assets[i].__proto__ = parser.Asset.prototype;

					np.toXML(xml => {
						var npxUInt8Arr = new TextEncoder().encode(xml);
						var chunks = [];
						var localMap = {lastModified: np.lastModified};

						//Split the octet array (npxUInt8Arr) chunks of 1000000B (where 1B = 8b)
						var pos = 0;
						var count = 0;
						while (!chunks[chunks.length-1] || chunks[chunks.length-1].length === 1000000) {
							var chunk = npxUInt8Arr.slice(pos, pos+1000000);
							chunks.push(chunk);
							pos += chunk.length;

							localMap[count++] = {md5: md5(new TextDecoder("utf-8").decode(chunk))};
						}

						if (chunks.length > 1000) {
							postMessage({
								req: 'error',
								text: "Wowza! Your notepad is so big we can't store it.<br><br>It might be a good idea to split up your notepad."
							});
							return;
						}

						reqGET(res, (remoteMapJSON, code) => {

							var remoteMap = JSON.parse(remoteMapJSON);
							if (!remoteMap.lastModified) upload(msg.token, localMap, remoteMap, chunks, msg.filename);

							if (moment(localMap.lastModified).isBefore(remoteMap.lastModified)) {
								postMessage({
									req: "askDownload",
									localMap: localMap,
									remoteMap: remoteMap,
									chunks: chunks,
									filename: msg.filename
								});
							}
							else if (moment(localMap.lastModified).isAfter(remoteMap.lastModified)) {
								upload(msg.token, localMap, remoteMap, chunks, msg.filename);
							}
						});
					}, msg.assets);
				}
			});
			break;

		case "download":
			var localMap = msg.localMap;
			var remoteMap = msg.remoteMap;
			var chunks = msg.chunks;

			//Loop through the remote map to figure out which blocks are different
			diffIndexes = "";
			for (var lineNumber in remoteMap) {
				if (lineNumber === 'lastModified') continue;
				if (!localMap[lineNumber] || remoteMap[lineNumber].md5 !== localMap[lineNumber].md5) {
					if (diffIndexes.length > 0) diffIndexes += ",";
					diffIndexes += lineNumber;
				}
			}

			me.S3UrlMap.getChunkDownload.getUrlSync(msg.token, msg.filename, (downloadURLs, code) => {
				if (code === 200) {
					var downloadURLs = JSON.parse(downloadURLs);
					for (lineNumber in downloadURLs) {
						lineNumber = parseInt(lineNumber.split("i")[1]);
						var downloadURL = downloadURLs["i"+lineNumber];

						//Download chunk
						postMessage({
							req: "progress",
							type: "Download",
							percentage: ((parseInt(lineNumber))/(Object.keys(remoteMap).length-1))*100
						});
						reqGetSync(downloadURL, function(res, code) {
							chunks[lineNumber] = new TextEncoder().encode(res);
							postMessage({
								req: "progress",
								type: "Download",
								percentage: ((parseInt(lineNumber)+1)/(Object.keys(remoteMap).length-1))*100
							});
						});
					}

					var newNotepadStr = "";
					for (var i = 0; i < chunks.length; i++) {
						var chunk = chunks[i];
						newNotepadStr += new TextDecoder("utf-8").decode(chunk);
					}
					postMessage({
						req: 'download',
						code: 200,
						text: newNotepadStr
					});
				}
				else {
					console.log(downloadURLs);
					return;
				}
			}, diffIndexes);
			break;
	}
}

function upload(token, localMap, remoteMap, chunks, filename) {
	if (!remoteMap.lastModified) remoteMap.lastModified = moment(localMap.lastModified).subtract(100, 'years').format('YYYY-MM-DDTHH:mm:ss.SSSZ');
	if (moment(localMap.lastModified).isBefore(moment(remoteMap.lastModified))) {
		postMessage({
			req: 'upload',
			code: 200,
			text: ''
		});
		return;
	}

	//Loop through the remote map to figure out which blocks are different
	diffIndexes = "";
	for (var lineNumber in localMap) {
		if (lineNumber === 'lastModified') continue;
		if (!remoteMap[lineNumber] || localMap[lineNumber].md5 !== remoteMap[lineNumber].md5) {
			if (diffIndexes.length > 0) diffIndexes += ",";
			diffIndexes += lineNumber;
		}
	}

	me.S3UrlMap.getChunkUpload.getUrlSync(token, filename, (uploadURLs, code) => {
		if (code === 200) {
			var uploadURLs = JSON.parse(uploadURLs);
			for (lineNumber in uploadURLs) {
				lineNumber = parseInt(lineNumber.split("i")[1]);
				var uploadURL = uploadURLs["i"+lineNumber];

				//Add that chunk to the upload cue
				postMessage({
					req: "cuePUT",
					syncURL: me.syncURL,
					token: token,
					url: uploadURL,
					data: new TextDecoder("utf-8").decode(chunks[lineNumber]),
					md5: 1,
					method: "block"
				});
			}

			//Add local map.json to the upload cue
			me.S3UrlMap.getMapUpload.getUrl(token, filename, (mapURL, code) => {
				if (code === 200) {
					postMessage({
						req: "cuePUT",
						syncURL: me.syncURL,
						token: token,
						url: mapURL,
						data: JSON.stringify(localMap),
						method: "block"
					});
				}
				else {
					console.log(mapURL);
					postMessage({
						req: 'upload',
						code: code,
						text: ''
					});
					return;
				}
			});
		}
		else {
			console.log(uploadURLs);
			postMessage({
				req: 'upload',
				code: code,
				text: ''
			});
			return;
		}
	}, diffIndexes);
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
	xhr.setRequestHeader("Cache-Control", "max-age=0");
	xhr.send();
}

function reqGetSync(url, callback) {
	var xhr = new XMLHttpRequest();
	xhr.addEventListener("progress", function(event) {
		progress(event, "Download");
	});
	xhr.onreadystatechange = function() {
		if (xhr.readyState == 4) {
			callback(xhr.responseText, xhr.status);
		}
	}
	xhr.open("GET", url, false);
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
