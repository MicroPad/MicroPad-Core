var FilesystemHandler = function() {
	this.notepadDir = null;
	this.assetsDir = null;

	window.requestFileSystem(LocalFileSystem.PERSISTENT, 0, fs => {
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
	});
}
