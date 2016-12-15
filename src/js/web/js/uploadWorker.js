onmessage = function(event) {
	var msg = event.data;

	var xhr = new XMLHttpRequest();
	xhr.upload.addEventListener("progress", function(event) {
		progress(event, "Upload");
	});
	xhr.onreadystatechange = function() {
		if (xhr.readyState == 4) {
			if (xhr.status == 200) {
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

function progress(event, type) {
	if (event.lengthComputable) {
		postMessage({
			req: "progress",
			type: type,
			percentage: parseInt((event.loaded/event.total)*100)
		});
	}
}
