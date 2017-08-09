var appStorage;
var notepadStorage;
var assetStorage;
var hasLoadedStorage = false;

var notepad;
var note;
var parents = [];

var lastClick = { x: 0, y: 0 };
var canvasCtx = undefined;
try {
	var rec = new Recorder();
}
catch(err) {}
var todoShowToggle = {};


localforage.defineDriver(window.cordovaSQLiteDriver).then(() => {
		return localforage.setDriver([
			// Try setting cordovaSQLiteDriver if available,
			window.cordovaSQLiteDriver._driver,
			// otherwise use one of the default localforage drivers as a fallback.
			// This should allow you to transparently do your tests in a browser
			localforage.INDEXEDDB,
			localforage.WEBSQL,
			localforage.LOCALSTORAGE
		]);
}).then(() => {
	notepadStorage = localforage.createInstance({
		name: 'MicroPad',
		storeName: 'notepads'
	});

	appStorage = localforage.createInstance({
		name: 'MicroPad',
		version: 1.0,
		storeName: 'app'
	});

	assetStorage = localforage.createInstance({
		name: 'MicroPad',
		storeName: 'assets'
	});

	hasLoadedStorage = true;
	updateNotepadList();
});

var app = {
	// Application Constructor
	initialize: function() {
		document.addEventListener('deviceready', this.onDeviceReady.bind(this), false);
	},

	// deviceready Event Handler
	//
	// Bind any cordova events here. Common events are:
	// 'pause', 'resume', etc.
	onDeviceReady: function() {
		this.receivedEvent('deviceready');
	},

	// Update DOM on a Received Event
	receivedEvent: function(id) {
		switch (id) {
			case "deviceready":
				appUi.init();
				break;
		}
	}
};

app.initialize();

function initNotepad() {
	parents = [notepad];

	note = undefined;
	lastClick = { x: 0, y: 0 };
	todoShowToggle = {};

	if (notepad.notepadAssets) {
		notepadAssets = new Set(notepad.notepadAssets);
	} else {
		notepadAssets = new Set();
	}

	mainView.router.loadPage("notepad.html");
}

function loadNotepad(title) {
	notepadStorage.getItem(title, function(err, res) {
		if (err || res === null) return;

		res = JSON.parse(res);
		notepad = parser.restoreNotepad(res);
		notepad.notepadAssets = res.notepadAssets;
		initNotepad();
	});
}

function saveNotepad(callback) {
	notepad.notepadAssets = Array.from(notepadAssets);
	notepadStorage.setItem(notepad.title, stringify(notepad), function() {
		if (callback) callback();
	});
}

function stringify(obj) {
	var seen = [];
	return JSON.stringify(obj, (key, val) => {
		if (val != null && typeof val === "object") {
			if (seen.indexOf(val) > -1) return;
			seen.push(val);
		}
		return val;
	});
}

function loadNote(id) {
	note = notepadObjects[id];
	mainView.router.loadPage("note.html");
}

//Thanks to http://stackoverflow.com/a/4673436/998467
if (!String.prototype.format) {
	String.prototype.format = function() {
		var args = arguments;
		return this.replace(/{(\d+)}/g, function(match, number) {
			return typeof args[number] != 'undefined'
				? args[number]
				: match
			;
		});
	};
}

//Thanks to http://stackoverflow.com/a/17386803/998467
function isCanvasBlank(canvas) {
	var blank = document.createElement('canvas');
	blank.width = canvas.width;
	blank.height = canvas.height;

	return canvas.toDataURL() == blank.toDataURL();
}

//Thanks to http://stackoverflow.com/a/12300351/998467
function dataURItoBlob(dataURI) {
	// convert base64 to raw binary data held in a string
	// doesn't handle URLEncoded DataURIs - see SO answer #6850276 for code that does this
	var byteString = atob(dataURI.split(',')[1]);

	// separate out the mime component
	var mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0]

	// write the bytes of the string to an ArrayBuffer
	var ab = new ArrayBuffer(byteString.length);
	var ia = new Uint8Array(ab);
	for (var i = 0; i < byteString.length; i++) {
		ia[i] = byteString.charCodeAt(i);
	}

	// write the ArrayBuffer to a blob, and you're done
	var blob = new Blob([ab], { type: mimeString });
	return blob;
}

function blobToDataURL(blob, callback) {
	var a = new FileReader();
	a.onload = function(e) { callback(e.target.result); }
	a.readAsDataURL(blob);
}
