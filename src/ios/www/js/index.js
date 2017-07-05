var appStorage;
var notepadStorage;
var assetStorage;

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

	createContentPage();
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
