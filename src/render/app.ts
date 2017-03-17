class App
{
	private updarea: HTMLElement;
	private list: HTMLTextAreaElement;
	private css: HTMLTextAreaElement;
	private prearea: HTMLElement;
	private sprite: HTMLImageElement;
	private menu: HTMLUListElement;
	private msg: Message;
	private loading: HTMLElement;
	private count: number;

	private spath: string;

	constructor()
	{
		let e: HTMLElement | null;

		this.count = 0;
		this.spath = '';

		this.msg = new Message();

		this.msg.set( 'sprite', ( event, data ) => { this.afterGenerate( data, false ); } );
		this.msg.set( 'generate', ( event, data ) => { this.afterGenerate( data, true ); } );

		e = document.getElementById( 'uploader' );
		if ( !e ) { return; }
		this.updarea = e;

		e = document.getElementById( 'list' );
		if ( !e ) { return; }
		this.list = <HTMLTextAreaElement>e;

		e = document.getElementById( 'css' );
		if ( !e ) { return; }
		this.css = <HTMLTextAreaElement>e;

		e = document.getElementById( 'preview' );
		if ( !e ) { return; }
		this.prearea = e;

		e = document.getElementById( 'sprite' );
		if ( !e ) { return; }
		this.sprite = <HTMLImageElement>e;

		e = document.getElementById( 'menu' );
		if ( !e ) { return; }
		this.menu = <HTMLUListElement>e;

		e = document.getElementById( 'loading' );
		if ( !e ) { return; }
		this.loading = <HTMLUListElement>e;

		e = document.getElementById( 'generate' );
		if ( !e ) { return; }
		e.addEventListener( 'click', () => { this.generate(); }, false );

		document.body.addEventListener( 'dragover', noEvent, false );
		document.body.addEventListener( 'drop', noEvent, false );

		this.updarea.addEventListener( 'dragover', (evt) =>
		{
			evt.stopPropagation();
			evt.preventDefault();
			evt.dataTransfer.dropEffect = 'copy';
		}, false);
		this.updarea.addEventListener( 'drop', ( event )=> { this.dropFiles( event ); }, false );

		this.initMenu();
	}

	private dropFiles( event: DragEvent )
	{
		noEvent( event );

		const list = this.list.value.split( '\n' ).filter( ( v ) => { return !!v; } );

		const files = event.dataTransfer.files;

		for ( let i = 0 ; i < files.length ; ++i )
		{
			if ( 0 <= list.indexOf( files[ i ].path ) ) { continue; }
			list.push( files[ i ].path );
		}

		this.list.value = list.sort().join( '\n' );

		this.generateSprite( 'sprite', list );
	}

	private beforeGenerate()
	{
		this.loading.classList.add( 'open' );
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

		list.push( { type: 'sprite', name: 'Sprite' } );

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
}

function noEvent( event: Event ) {event.stopPropagation();event.preventDefault();}
