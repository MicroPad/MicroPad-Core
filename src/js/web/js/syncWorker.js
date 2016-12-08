onmessage = function(event) {
	var msg = event.data;

	switch (msg.req) {
		case "hasAddedNotepad":
			reqPOST('hasAddedNotepad.php', {
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
			reqPOST(msg.req+'.php', {
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
	}
}

function reqGET(url, callback) {
	url = msg.syncURL+url;
	var xhr = new XMLHttpRequest();
	xhr.onreadystatechange = function() {
		if (xhr.readyState == 4) {
			callback(xhr.responseText, xhr.status);
		}
	}
	xhr.open("GET", url, true);
	xhr.send();
}

function reqPOST(url, params, callback) {
	url = msg.syncURL+url;
	var paramString = "";
	for (var param in params) {
		if (paramString.length > 0) paramString += "&";
		paramString += param+"="+params[param];
	}

	xhr.onload = function() {
		if (xhr.readyState == 4) {
			callback(xhr.responseText, xhr.status);
		}
	}

	xhr.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
	xhr.open("POST", url, true);
	xhr.send(paramString);
}
