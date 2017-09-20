class App
{
	private updarea: HTMLElement;
	private list: HTMLTextAreaElement;
	private warning: HTMLElement;
	private css: HTMLTextAreaElement;
	private prearea: HTMLElement;
	private sprite: HTMLImageElement;
	private menu: HTMLUListElement;
	private msg: Message;
	private loading: HTMLElement;
	private count: number;
	private warnFiles: string[];

	private spath: string;

	constructor()
	{
		let e: HTMLElement | null;

		this.count = 0;
		this.spath = '';
		this.warnFiles = [];

		this.msg = new Message();

		this.msg.set( 'sprite', ( event, data ) => { this.afterGenerate( data, false ); } );
		this.msg.set( 'generate', ( event, data ) => { this.afterGenerate( data, true ); } );

		this.updarea = <HTMLElement>document.getElementById( 'uploader' );

		this.list = <HTMLTextAreaElement>document.getElementById( 'list' );

		this.css = <HTMLTextAreaElement>document.getElementById( 'css' );

		this.prearea = <HTMLElement>document.getElementById( 'preview' );

		this.sprite = <HTMLImageElement>document.getElementById( 'sprite' );

		this.menu = <HTMLUListElement>document.getElementById( 'menu' );

		this.loading = <HTMLUListElement>document.getElementById( 'loading' );

		e = <HTMLElement>document.getElementById( 'generate' );
		e.addEventListener( 'click', () => { this.generate(); }, false );

		e = <HTMLElement>document.getElementById( 'reset' );
		e.addEventListener( 'click', () => { this.css.value = ''; this.list.value = ''; this.spath = ''; this.clearWarning(); }, false );

		this.warning = <HTMLElement>document.getElementById( 'errorfile' );
		this.warning.addEventListener( 'click', () => { this.openErrorLog(); }, false );

		document.body.addEventListener( 'dragover', noEvent, false );
		document.body.addEventListener( 'drop', noEvent, false );

		this.updarea.addEventListener( 'dragover', ( event ) =>
		{
			event.stopPropagation();
			event.preventDefault();
			event.dataTransfer.dropEffect = 'copy';
		}, false );
		this.updarea.addEventListener( 'drop', ( event )=> { this.dropFiles( event ); }, false );

		this.initMenu();
	}

	private dropFiles( event: DragEvent )
	{
		this.nowLoading();
		noEvent( event );

		const list = this.list.value.split( '\n' ).filter( ( v ) => { return !!v; } );

		const files = event.dataTransfer.files;

		for ( let i = 0 ; i < files.length ; ++i )
		{
			if ( 0 <= list.indexOf( files[ i ].path ) ) { continue; }
			list.push( files[ i ].path );
			const filename = <string>files[ i ].path.split( /\\|\// ).pop();
			if ( filename !== encodeURIComponent( filename ) )
			{
				this.addWarning( files[ i ].path );
			}
		}

		this.list.value = list.sort().join( '\n' );

		this.generateSprite( 'sprite', list );
	}

	private nowLoading() { this.loading.classList.add( 'open' ); }

	private beforeGenerate()
	{
		this.nowLoading();
	}

	private afterGenerate( data: { error: {} | null, path: string, css: string }, updpath: boolean )
	{
		if ( updpath ) { this.spath = data.path; }
		this.sprite.src = [ data.path, this.count++ ].join( '?' );
		this.css.value = data.css;
		this.loading.classList.remove( 'open' );
	}

	private initMenu()
	{
		const list: { type: string, name: string }[] = []

		//list.push( { type: 'sprite', name: 'Sprite' } );

		list.forEach( ( data ) =>
		{
			const e = document.createElement( 'li' );

			e.addEventListener( 'click', () => { this.changePreview( data.type ); }, false );
			e.textContent = data.name;

			this.menu.appendChild( e );
		} );
	}

	private changePreview( type: string )
	{
		const c = this.menu.classList;
		for ( let i = 0 ; i < c.length ; ++i ) { c.remove( c[ i ] ); }
		c.add( type );
	}

	private generate()
	{
		const list = this.list.value.split( '\n' ).filter( ( v ) => { return !!v; } );
		this.generateSprite( 'generate', list );
	}

	private generateSprite( type: string, list: string[] )
	{
		this.beforeGenerate();
		this.msg.send( type, { list: list, path: type === 'generate' ? this.spath : '' } );
	}

	private clearWarning()
	{
		this.warnFiles = [];
		this.warning.classList.add( 'hidden' );
	}

	private addWarning( path: string )
	{
		this.warnFiles.push( path );
		this.warning.classList.remove( 'hidden' );
	}

	private openErrorLog()
	{
		const lines = [ 'Files:' ];
		lines.push( ...this.warnFiles );
		window.alert( lines.join( '\n' ) );
	}
}

function noEvent( event: Event ) {event.stopPropagation();event.preventDefault();}
