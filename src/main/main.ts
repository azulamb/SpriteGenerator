import * as electron from 'electron';
import * as path from 'path';
import * as fs from 'fs';
const App = electron.app;
const BrowserWindow = electron.BrowserWindow;
const ipcMain = electron.ipcMain;
const Spritesmith = require('spritesmith');
const Dialog = electron.dialog;


interface SPRITE_IMAGE
{
	x: number,
	y: number,
	width: number,
	height: number,
}

let win: Electron.BrowserWindow;

function createWindow()
{
	win = new BrowserWindow(
	{
		width: 400,
		height: 400,
	} );


	win.loadURL('file://' + __dirname + '/index.html');

	win.on( 'closed', () =>
	{
		//win = null;
	} );
};

App.on( 'ready', createWindow );

App.on('window-all-closed', () =>
{
	if ( process.platform != 'darwin' )
	{
		App.quit();
	}
} );

App.on('activate', () =>
{
	if ( !win ) { createWindow(); }
} );

class Message
{
	private eventsAsync: { [ keys: string ]: ( event: Electron.IpcMainEvent, arg: any ) => void };
	private eventsSync: { [ keys: string ]: ( event: Electron.IpcMainEvent, arg: any ) => void };

	constructor()
	{
		this.eventsAsync = {};
		this.eventsSync = {};

		ipcMain.on( 'asynchronous-message', ( event, arg: { type: string, data: any } ) =>
		{
			if ( !this.eventsAsync[ arg.type ] ) { return; }
			this.eventsAsync[ arg.type ]( event, arg.data );
			//event.sender.send( 'asynchronous-reply', '' );
		} );

		ipcMain.on( 'synchronous-message', ( event, arg ) =>
		{
			if ( !this.eventsSync[ arg.type ] ) { return; }
			this.eventsSync[ arg.type ]( event, arg.data );
			//event.returnValue = '';
		} );
	}

	public set( key: string, func: ( event: Electron.IpcMainEvent, arg: any ) => void, sync = false )
	{
		this[ sync ? 'eventsSync' : 'eventsAsync' ][ key ] = func;
	}
}

const msg = new Message();

msg.set( 'sprite', ( event, data ) =>
{
	if ( typeof data !== 'object' || !Array.isArray( data.list ) )
	{
		event.sender.send( 'asynchronous-reply', { type: 'sprite', data: 'ng' } );
		return;
	}
	generateSprite( event, 'sprite', App.getPath( 'userData' ), data.list );
} );

msg.set( 'generate', ( event, data )=>
{
	if ( typeof data !== 'object' || !Array.isArray( data.list ) )
	{
		event.sender.send( 'asynchronous-reply', { type: 'generate', data: 'ng' } );
		return;
	}

	// Default open path.
	const dir = data.path ? path.dirname( data.path ) : ( data.list && 0 < data.list.length ? path.dirname( data.list[ 0 ] ) : '' );

	Dialog.showOpenDialog( win,
	{
		properties: [ 'openDirectory' ],
		title: 'Select folder',
		defaultPath: dir || '.',
	}, ( folderNames ) =>
	{
		const folder = folderNames && 0 < folderNames.length ? folderNames[ 0 ] : '';
		generateSprite( event, 'generate', folder || App.getPath( 'userData' ), data.list );
	} );
} );

function generateSprite( event: Electron.IpcMainEvent, type: string, base: string, data: string[] )
{
	Spritesmith.run( { src: data }, ( err: any, result: { image: Buffer, coordinates: { [ keys: string ]: SPRITE_IMAGE }, properties: { width: number, height: number } } ) =>
	{
		const filepath = path.join( base, 'sprite' );
		fs.writeFile( filepath + '.png', result.image, ( err ) =>
		{
			const css = createCSS( result.coordinates, result.properties );
			fs.writeFileSync( filepath + '.css', css );
			event.sender.send( 'asynchronous-reply', { type: type, data: { error: err, path: filepath + '.png', css: css } } );
		} );
	} );

}

function createCSS( coordinates: { [ keys: string ]: SPRITE_IMAGE }, properties: { width: number, height: number } )
{
	const list: string[] = [];

	const total_width = properties.width;
	const total_height = properties.height;

	Object.keys( coordinates ).forEach( ( key ) =>
	{
		const data = coordinates[ key ];
		const name = path.basename( key ).split( '.' )[ 0 ];

		const hname = ( 0 <= name.indexOf( '_on' ) ) ? name.replace( /\_on$/, '' ) : '';

		list.push( `/* ------ ${name}*/
.${ name } ${ hname ? ', .' + hname + ':hover' : '' } {
    background-position: ${ data.x * -0.5 }px ${ data.y * -0.5 }px;
    width: ${ data.width / 2 }px;
    height: ${ data.height / 2 }px;
    background-size: ${ total_width / 2 }px ${ total_height / 2 }px;
}
@media only screen and (min-width:1024px) {
    .${ name } ${ hname ? ', .' + hname + ':hover' : '' } {
        background-position: ${ -data.x }px ${ -data.y }px;
        width: ${ data.width }px;
        height: ${ data.height }px;
        background-size: ${ total_width }px ${ total_height }px;
    }
}
` );
	} );

	return list.join( '' );
}
