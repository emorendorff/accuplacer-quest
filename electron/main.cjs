// Electron main process: opens one window and serves the built game into it.
//
// The game is a static site (Vite's `dist/`). Rather than loading it from a
// file:// path, it's served from a private scheme, app://game/, which behaves
// like a normal https origin: absolute asset paths work, and localStorage
// (where progress is saved) is tied to a stable origin across app updates.

const { app, BrowserWindow, net, protocol, shell } = require('electron');
const path = require('node:path');
const { pathToFileURL } = require('node:url');

const SCHEME = 'app';
const HOST = 'game';
const DIST = path.join(__dirname, '..', 'dist');

// Must happen before the app is ready.
protocol.registerSchemesAsPrivileged([
  { scheme: SCHEME, privileges: { standard: true, secure: true, supportFetchAPI: true } },
]);

// One copy of the game at a time; a second launch just focuses the first.
if (!app.requestSingleInstanceLock()) app.quit();

let win = null;

function createWindow() {
  win = new BrowserWindow({
    width: 1180,
    height: 860,
    minWidth: 720,
    minHeight: 560,
    title: "Numbers Don't Lie",
    backgroundColor: '#121110', // matches the game, so there's no white flash on launch
    show: false,
    webPreferences: {
      // Electron's secure defaults, spelled out: the page is plain web code
      // with no access to Node or the file system.
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  win.once('ready-to-show', () => win.show());

  // During development, point at the Vite dev server for hot reload.
  const devUrl = process.env.ELECTRON_DEV_URL;
  win.loadURL(devUrl || `${SCHEME}://${HOST}/index.html`);

  // The game never navigates away; anything external opens in the real browser.
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('https://')) shell.openExternal(url);
    return { action: 'deny' };
  });
  win.webContents.on('will-navigate', (event, url) => {
    if (!url.startsWith(`${SCHEME}://${HOST}/`) && !(devUrl && url.startsWith(devUrl))) event.preventDefault();
  });

  win.on('closed', () => (win = null));
}

app.whenReady().then(() => {
  protocol.handle(SCHEME, (request) => {
    const { pathname } = new URL(request.url);
    const filePath = path.normalize(path.join(DIST, decodeURIComponent(pathname)));
    // Refuse anything that tries to escape dist/ (e.g. ../../).
    if (!filePath.startsWith(DIST + path.sep)) return new Response('Not found', { status: 404 });
    return net.fetch(pathToFileURL(filePath).toString());
  });

  createWindow();
});

app.on('second-instance', () => {
  if (win) {
    if (win.isMinimized()) win.restore();
    win.focus();
  }
});

// Mac convention: closing the window keeps the app in the Dock; clicking the icon reopens it.
app.on('activate', () => {
  if (!win) createWindow();
});
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
