const ipcRenderer = require( 'electron' ).ipcRenderer;

class Message
{
	private events:
	{
		null: ( event: Electron.IpcRendererEvent, arg: any ) => void,
		[ keys: string ]: ( event: Electron.IpcRendererEvent, arg: any ) => void,
	};

	constructor()
	{
		this.events = { null: () => {} };

		ipcRenderer.on( 'asynchronous-reply', ( event, arg: { type: string, data: any } ) =>
		{
			if ( !this.events[ arg.type ] ) { return this.events.null( event, arg ); }
			this.events[ arg.type ]( event, arg.data );
		} );
	}

	public setDefault( type: string, func: ( event: Electron.IpcRendererEvent, arg: any ) => void )
	{
		this.events.null = func;
	}

	public set( type: string, func: ( event: Electron.IpcRendererEvent, arg: any ) => void )
	{
		this.events[ type ] = func;
	}

	public send( type: string, data: any )
	{
		ipcRenderer.send( 'asynchronous-message', { type: type, data: data } );
		//ipcRenderer.sendSync('synchronous-message', 'ping')
	}
}
