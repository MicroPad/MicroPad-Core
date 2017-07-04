var FilesystemHandler = function() {
	window.resolveLocalFileSystemURL(cordova.file.documentsDirectory, dir => {
		dir.getDirectory('MicroPad Notepads', {create: true}, (dir) => {
			this.notepadDir = dir;
		});
	});

	window.resolveLocalFileSystemURL(cordova.file.cacheDirectory, dir => {
		dir.getDirectory('MicroPad Notepads', {create: true}, (dir) => {
			this.assetsDir = assetsDir;
		});
	});
}
