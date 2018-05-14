var S3Url = function(request, protocol, syncUrl) {
	this.request = request;
	this.protocol = protocol;
	this.syncUrl = syncUrl;
	this.url = "";
	this.filename = "";
	this.diffIndexes = undefined;
	this.expireTime = new Date(0);
}

S3Url.prototype.getUrl = function(token, filename, callback, diffIndexes) {
	var notepadChanged = !(this.filename === filename && (this.diffIndexes === undefined || this.diffIndexes === diffIndexes));

	if (!notepadChanged && this.url.length > 0 && (this.expireTime > new Date())) {
		callback(this.url, 200);
	}
	else {
		var params = {
			token: token,
			filename: filename,
			index: "0",
			md5: "m"
		};
		if (diffIndexes) params.multidex = diffIndexes;

		switch(this.protocol) {
			case "GET":
				this.reqGet(this.syncUrl+this.request+'.php?token={0}&filename={1}&r={2}'.format(token, filename, new Date().getTime()), (url, code) => {
					this.updateDate();
					this.url = url;
					if (code != 200) this.url = "";

					callback(this.url, code);

					if (notepadChanged) {
						this.filename = filename;
						this.diffIndexes = diffIndexes;
					}
				});
				break;
			case "POST":
				this.apiPost(this.request+'.php', params, (url, code) => {
					this.updateDate();
					this.url = url;
					if (code != 200) this.url = "";

					callback(this.url, code);

					if (notepadChanged) {
						this.filename = filename;
						this.diffIndexes = diffIndexes;
					}
				});
				break;
		}
	}
}

S3Url.prototype.getUrlSync = function(token, filename, callback, diffIndexes) {
	var notepadChanged = !(this.filename === filename && (this.diffIndexes === undefined || this.diffIndexes === diffIndexes));
	if (notepadChanged) {
		this.filename = filename;
		this.diffIndexes = diffIndexes;
	}

	if (!notepadChanged && this.url.length > 0 && (this.expireTime > new Date())) {
		callback(this.url, 200);
	}
	else {
		var params = {
			token: token,
			filename: filename,
			index: "0",
			md5: "m"
		};
		if (diffIndexes !== undefined && diffIndexes !== null) params.multidex = diffIndexes;

		switch(this.protocol) {
			case "GET":
				this.reqGetSync(this.syncUrl+this.request+'.php?token={0}&filename={1}&r={2}'.format(token, filename, new Date().getTime()), (url, code) => {
					this.updateDate();
					this.url = url;
					if (code != 200) this.url = "";

					callback(this.url, code);

					if (notepadChanged) {
						this.filename = filename;
						this.diffIndexes = diffIndexes;
					}
				});
				break;
			case "POST":
				this.apiPostSync(this.request+'.php', params, (url, code) => {
					this.updateDate();
					this.url = url;
					if (code != 200) this.url = "";

					callback(this.url, code);

					if (notepadChanged) {
						this.filename = filename;
						this.diffIndexes = diffIndexes;
					}
				});
				break;
		}
	}
}

S3Url.prototype.updateDate = function() {
	this.expireTime = new Date();
	this.expireTime.setMinutes(this.expireTime.getMinutes()+15);
}

S3Url.prototype.apiPost = function(url, params, callback) {
	url = this.syncUrl+url;
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

S3Url.prototype.apiPostSync = function(url, params, callback) {
	url = this.syncUrl+url;
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

S3Url.prototype.reqGet = function(url, callback) {
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

S3Url.prototype.reqGetSync = function(url, callback) {
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
