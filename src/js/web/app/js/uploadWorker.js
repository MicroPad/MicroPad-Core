var syncURL;

onmessage = function(event) {
	var msg = event.data;
	syncURL = msg.syncURL;
	var hasProcessedYet = (msg.method !== "diff");

	var xhr = new XMLHttpRequest();
	xhr.onreadystatechange = function() {
		if (xhr.readyState == 4) {
			if (xhr.status == 200) {
				while (!hasProcessedYet) {
					var until = new Date().getTime() + 3000; while(new Date().getTime() < until) {}; 
					hasProcessed(msg.token, decodeURIComponent(msg.url.split('/').pop().split('npx')[0]+'npx'), function(res) {
						hasProcessedYet = res;
					});
				}
				postMessage({req: "done"});
			}
			else {
				console.log(xhr.responseText);
			}
		}
	}

	xhr.open("PUT", msg.url, true);
	xhr.setRequestHeader('Content-Type', 'text/plain');
	// xhr.setRequestHeader('Content-MD5', btoa(msg.md5));
	xhr.send(msg.data);
}

function hasProcessed(token, filename, callback) {
	apiPostSync('getSyncStatus.php', {token: token, filename: filename}, function(res, code) {
		if (code === 200) {
			var res = JSON.parse(res);
			if (res.syncProcessed == 1) {
				callback(true);
			}
			else {
				callback(false);
			}
		}
		else {
			console.log(res);
			callback(false);
		}
	});

}

function apiPostSync(url, params, callback) {
	url = syncURL+url;
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
