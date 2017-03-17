class App {
    constructor() {
        let e;
        this.count = 0;
        this.spath = '';
        this.msg = new Message();
        this.msg.set('sprite', (event, data) => { this.afterGenerate(data, false); });
        this.msg.set('generate', (event, data) => { this.afterGenerate(data, true); });
        e = document.getElementById('uploader');
        if (!e) {
            return;
        }
        this.updarea = e;
        e = document.getElementById('list');
        if (!e) {
            return;
        }
        this.list = e;
        e = document.getElementById('css');
        if (!e) {
            return;
        }
        this.css = e;
        e = document.getElementById('preview');
        if (!e) {
            return;
        }
        this.prearea = e;
        e = document.getElementById('sprite');
        if (!e) {
            return;
        }
        this.sprite = e;
        e = document.getElementById('menu');
        if (!e) {
            return;
        }
        this.menu = e;
        e = document.getElementById('loading');
        if (!e) {
            return;
        }
        this.loading = e;
        e = document.getElementById('generate');
        if (!e) {
            return;
        }
        e.addEventListener('click', () => { this.generate(); }, false);
        document.body.addEventListener('dragover', noEvent, false);
        document.body.addEventListener('drop', noEvent, false);
        this.updarea.addEventListener('dragover', (evt) => {
            evt.stopPropagation();
            evt.preventDefault();
            evt.dataTransfer.dropEffect = 'copy';
        }, false);
        this.updarea.addEventListener('drop', (event) => { this.dropFiles(event); }, false);
        this.initMenu();
    }
    dropFiles(event) {
        noEvent(event);
        const list = this.list.value.split('\n').filter((v) => { return !!v; });
        const files = event.dataTransfer.files;
        for (let i = 0; i < files.length; ++i) {
            if (0 <= list.indexOf(files[i].path)) {
                continue;
            }
            list.push(files[i].path);
        }
        this.list.value = list.sort().join('\n');
        this.generateSprite('sprite', list);
    }
    beforeGenerate() {
        this.loading.classList.add('open');
    }
    afterGenerate(data, updpath) {
        console.log(data);
        if (updpath) {
            this.spath = data.path;
        }
        this.sprite.src = [data.path, this.count++].join('?');
        this.css.value = data.css;
        this.loading.classList.remove('open');
    }
    initMenu() {
        const list = [];
        list.push({ type: 'sprite', name: 'Sprite' });
        list.forEach((data) => {
            const e = document.createElement('li');
            e.addEventListener('click', () => { this.changePreview(data.type); }, false);
            e.textContent = data.name;
            this.menu.appendChild(e);
        });
    }
    changePreview(type) {
        const c = this.menu.classList;
        for (let i = 0; i < c.length; ++i) {
            c.remove(c[i]);
        }
        c.add(type);
    }
    generate() {
        const list = this.list.value.split('\n').filter((v) => { return !!v; });
        this.generateSprite('generate', list);
    }
    generateSprite(type, list) {
        this.beforeGenerate();
        this.msg.send(type, { list: list, path: this.spath });
    }
}
function noEvent(event) { event.stopPropagation(); event.preventDefault(); }
document.addEventListener('DOMContentLoaded', () => {
    const app = new App();
}, false);
const ipcRenderer = require('electron').ipcRenderer;
class Message {
    constructor() {
        this.events = {};
        ipcRenderer.on('asynchronous-reply', (event, arg) => {
            if (!this.events[arg.type]) {
                return;
            }
            this.events[arg.type](event, arg.data);
        });
    }
    set(type, func) {
        this.events[type] = func;
    }
    send(type, data) {
        ipcRenderer.send('asynchronous-message', { type: type, data: data });
    }
}
