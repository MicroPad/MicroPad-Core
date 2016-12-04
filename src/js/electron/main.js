const {app, BrowserWindow} = require('electron')

let win //This is the window object

function createWindow() {
	win = new BrowserWindow({width: 1300, height: 800});
	win.setMenu(null);
	win.loadURL(`file://${__dirname}/static/index.html`);

	win.webContents.openDevTools();

	win.on('closed', () => {
		win = null;
	});
}

app.on('ready', createWindow);

/** Handle macOS conventions */
app.on('window-all-closed', () => {
	if (process.platform !== 'darwin') app.quit();
});
app.on('activate', () => {
	if (win === null) createWindow();
});