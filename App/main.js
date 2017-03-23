"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const electron = require("electron");
const path = require("path");
const fs = require("fs");
const App = electron.app;
const BrowserWindow = electron.BrowserWindow;
const ipcMain = electron.ipcMain;
const Spritesmith = require('spritesmith');
const Dialog = electron.dialog;
let win;
function createWindow() {
    win = new BrowserWindow({
        width: 400,
        height: 400,
        icon: __dirname + '/icon.png',
    });
    win.loadURL('file://' + __dirname + '/index.html');
    win.on('closed', () => {
    });
}
;
App.on('ready', createWindow);
App.on('window-all-closed', () => {
    if (process.platform != 'darwin') {
        App.quit();
    }
});
App.on('activate', () => {
    if (!win) {
        createWindow();
    }
});
class Message {
    constructor() {
        this.eventsAsync = {};
        this.eventsSync = {};
        ipcMain.on('asynchronous-message', (event, arg) => {
            if (!this.eventsAsync[arg.type]) {
                return;
            }
            this.eventsAsync[arg.type](event, arg.data);
        });
        ipcMain.on('synchronous-message', (event, arg) => {
            if (!this.eventsSync[arg.type]) {
                return;
            }
            this.eventsSync[arg.type](event, arg.data);
        });
    }
    set(key, func, sync = false) {
        this[sync ? 'eventsSync' : 'eventsAsync'][key] = func;
    }
}
const msg = new Message();
msg.set('sprite', (event, data) => {
    if (typeof data !== 'object' || !Array.isArray(data.list)) {
        event.sender.send('asynchronous-reply', { type: 'sprite', data: 'ng' });
        return;
    }
    generateSprite(event, 'sprite', App.getPath('userData'), data.list);
});
msg.set('generate', (event, data) => {
    if (typeof data !== 'object' || !Array.isArray(data.list)) {
        event.sender.send('asynchronous-reply', { type: 'generate', data: 'ng' });
        return;
    }
    const dir = data.path ? path.dirname(data.path) : (data.list && 0 < data.list.length ? path.dirname(data.list[0]) : '');
    Dialog.showOpenDialog(win, {
        properties: ['openDirectory'],
        title: 'Select folder',
        defaultPath: dir || '.',
    }, (folderNames) => {
        const folder = folderNames && 0 < folderNames.length ? folderNames[0] : '';
        generateSprite(event, 'generate', folder || App.getPath('userData'), data.list);
    });
});
function generateSprite(event, type, base, data) {
    Spritesmith.run({ src: data }, (err, result) => {
        const filepath = path.join(base, 'sprite');
        fs.writeFile(filepath + '.png', result.image, (err) => {
            const css = createCSS(result.coordinates, result.properties);
            fs.writeFileSync(filepath + '.css', css);
            event.sender.send('asynchronous-reply', { type: type, data: { error: err, path: filepath + '.png', css: css } });
        });
    });
}
function createCSS(coordinates, properties) {
    const list = [];
    const total_width = properties.width;
    const total_height = properties.height;
    Object.keys(coordinates).forEach((key) => {
        const data = coordinates[key];
        const name = path.basename(key).split('.')[0];
        const hname = (0 <= name.indexOf('_on')) ? name.replace(/\_on$/, '') : '';
        list.push(`/* ------ ${name}*/
.${name} ${hname ? ', .' + hname + ':hover' : ''} {
    background-position: ${data.x * -0.5}px ${data.y * -0.5}px;
    width: ${data.width / 2}px;
    height: ${data.height / 2}px;
    background-size: ${total_width / 2}px ${total_height / 2}px;
}
@media only screen and (min-width:1024px) {
    .${name} ${hname ? ', .' + hname + ':hover' : ''} {
        background-position: ${-data.x}px ${-data.y}px;
        width: ${data.width}px;
        height: ${data.height}px;
        background-size: ${total_width}px ${total_height}px;
    }
}
`);
    });
    return list.join('');
}
