importScripts('libs/moment.js');
importScripts('libs/localforage.min.js');
importScripts('libs/encoding.js');
importScripts('libs/md5.js');
importScripts('parser.js');

var me = {};
var oldMap = "";
var oldXML = "{}";
var lastSyncMoment = moment(0);

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
			apiPost(msg.req+'.php', {
				token: msg.token,
				filename: msg.filename,
				lastModified: msg.notepad.lastModified,
				method: msg.method
			}, function(res, code) {
				if (res == "download") {
					if (moment().isBefore(lastSyncMoment.add(3, 'seconds'))) {
						postMessage({
							req: msg.req,
							text: "",
							code: 200
						});
						return;
					}
				}
				lastSyncMoment = moment();

				postMessage({
					req: msg.req,
					text: res,
					code: code
				});
			});
			break;

		case "upload":
			var np = parser.restoreNotepad(msg.notepad);
			switch (msg.method) {
				case "block":
					var npxUInt8Arr = new TextEncoder().encode(np.toXML());
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

					var localMapJSON = JSON.stringify(localMap);
					if (oldMap === localMapJSON) {
						postMessage({
							req: 'upload',
							code: 200,
							text: ''
						});
						return;
					}
					oldMap = localMapJSON;

					reqGET(msg.url, function(res, code) {
						var remoteMap = JSON.parse(res);
						if (!remoteMap.lastModified) remoteMap.lastModified = moment(localMap.lastModified).subtract(100, 'years').format();
						if (moment(localMap.lastModified).isBefore(moment(remoteMap.lastModified))) {
							postMessage({
								req: 'upload',
								code: 200,
								text: ''
							});
							return;
						}

						if (res !== localMapJSON) {
							//Loop through the remote map to figure out which blocks are different
							for (var lineNumber in localMap) {
								if (lineNumber === 'lastModified') continue;
								if (!remoteMap[lineNumber] || localMap[lineNumber].md5 !== remoteMap[lineNumber].md5) {
									
									apiPostSync('getChunkUpload.php', {
										token: msg.token,
										filename: '{0}.npx'.format(np.title.replace(/[^a-z0-9 ]/gi, '')),
										index: lineNumber,
										md5: localMap[lineNumber].md5
									}, function(uploadURL, code) {
										if (code === 200) {
											//Add that chunk to the upload cue
											postMessage({
												req: "cuePUT",
												syncURL: me.syncURL,
												token: msg.token,
												url: uploadURL,
												data: new TextDecoder("utf-8").decode(chunks[lineNumber]),
												md5: localMap[lineNumber].md5,
												method: msg.method
											});
										}
										else {
											console.log(uploadURL);
											postMessage({
												req: 'upload',
												code: code,
												text: ''
											});
											return;
										}
									});
								}
							}
							
							//Add local map.json to the upload cue
							apiPost('getMapUpload.php', {
								token: msg.token,
								filename: '{0}.npx'.format(np.title.replace(/[^a-z0-9 ]/gi, ''))
							}, function(mapURL, code) {
								if (code === 200) {
									postMessage({
										req: "cuePUT",
										syncURL: me.syncURL,
										token: msg.token,
										url: mapURL,
										data: localMapJSON,
										method: msg.method
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
							//The remote map is identical to this one
							postMessage({
								req: 'upload',
								code: 200,
								text: ''
							});
							return;
						}
					});
					break;

				case "diff":
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
								postMessage({
									req: "cuePUT",
									token: msg.token,
									syncURL: me.syncURL,
									url: res,
									data: np.toXML(),
									method: msg.method
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
							message: "Wowza! Your notepad is so big we can't store it.<br><br>It might be a good idea to split up your notepad."
						});
					}
					else {
						postMessage({
							req: "cuePUT",
							token: msg.token,
							syncURL: me.syncURL,
							url: msg.url,
							data: diff,
							method: msg.method
						});
					}

					oldXML = np.toXML();
					break;
			}
			break;

		case "download":
			switch(msg.method) {
				case "block":
					reqGET(msg.url, function(res, code) {
						if (code === 200) {
							var np = parser.restoreNotepad(msg.notepad);
							var npxUInt8Arr = new TextEncoder().encode(np.toXML());
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

							var remoteMap = JSON.parse(res);
							var localMapJSON = JSON.stringify(localMap);
							oldMap = res;

							if (res !== localMapJSON) {
								//Loop through the remote map to figure out which blocks are different
								for (var lineNumber in remoteMap) {
									if (lineNumber === 'lastModified') continue;
									if (!localMap[lineNumber] || remoteMap[lineNumber].md5 !== localMap[lineNumber].md5) {
										apiPostSync('getChunkDownload.php', {
											token: msg.token,
											filename: '{0}.npx'.format(np.title.replace(/[^a-z0-9 ]/gi, '')),
											index: lineNumber,
											md5: remoteMap[lineNumber].md5
										}, function(downloadURL, code) {
											if (code === 200) {
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
											else {
												console.log(downloadURL);
												return;
											}
										});
									}
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
								//The remote map is identical to this one
								postMessage({
									req: 'download',
									code: 200,
									text: np.toXML()
								});
								return;
							}
						}
					});
					break;

				case "diff":
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
