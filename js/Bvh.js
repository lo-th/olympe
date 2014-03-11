var BVH = { REVISION:'0.1a'};

BVH.TO_RAD = Math.PI / 180;


BVH.Reader = function(){
	//this.statue = "";
	//this.info = "";
	//this.reader = new FileReader();
	//this.xmlhttp = null;
	//this.callbackCount = 0;
	this.debug = true;
	this.type = "";
	this.data = null;
	//this.done = false;
	this.root = null;
	this.numFrames = 0;
	this.secsPerFrame = 0;
	this.play = false;
	this.channels = null;
	this.lines = "";
}

BVH.Reader.prototype = {
    constructor: BVH.Reader,

    load:function(fname){
    	this.type = fname.substring(fname.length-3,fname.length);
    	console.log(this.type);

    	var _this = this;
		var h = new XMLHttpRequest();
		h.open( 'GET', fname, true );

		if(this.type === 'bvh'){
			h.onreadystatechange = function(){ if (h.readyState==4 ){ _this.parseData(h.responseText);}};			
	    } else {
	    	h.onreadystatechange = function(){ if (h.readyState==4 ){ _this.testData(h.responseText);}};
	    }
	    h.send( null );
    },
    testData:function(data){
    	if(this.type === "bip"){ 
    		this.data = SEA3D.File.LZMAUncompress(data);
    	}
    	else if(this.type === "zip"){ 
    		this.data = SEA3D.File.DeflateUncompress(data);

    	}
    	else this.data = data.split(/\s+/g);
    	console.log(data);
    },
    parseData:function(data){
    	this.data = data.split(/\s+/g);
		this.channels = [];
		var done = false;
		while (!done) {
			switch (this.data.shift()) {
			case 'ROOT':
				this.root = this.parseNode(this.data);
				scene.add(this.root);
				break;
			case 'MOTION':
				this.data.shift();
				this.numFrames = parseInt( this.data.shift() );
				this.data.shift();
				this.data.shift();
				this.secsPerFrame = parseFloat(this.data.shift());
				done = true;
			}
		}

		console.log(this.numFrames);
		console.log(this.secsPerFrame);
		this.startTime = Date.now();
		this.play = true;

		/*this.lines = data.split(/\r\n|\n/);
		this.lines = this.lines.slice( 275 );
		for (var i = 0, len = this.lines.length; i < len; i++) {
			this.lines[i] = this.lines[i].split(/\s+/g);
		}

		console.log( this.lines );	*/
		//return lines;
    },
    test:function ( name ) {
		var material = new THREE.MeshNormalMaterial( {});//{ opacity: 0.5, side: THREE.DoubleSide, transparent: true } );
		var geometry, axis;
		if ( name === 'Site' ) {
			geometry = new THREE.SphereGeometry( 1 );
			axis = new THREE.AxisHelper(2);
		} else { // use generic
			geometry = new THREE.BoxGeometry( 1, 1, 1 );
			axis = new THREE.AxisHelper(1)
		}
		var node = new THREE.Mesh(geometry, material);
		node.add(axis);
		return node;
	},
    parseNode:function(data){
    	var name, done, n, node, t;
		name = data.shift();
		if(this.debug) node = this.test( name );
		else node = new THREE.Object3D();
		node.rotation.order = 'ZXY';
		//node.rotation.order = 'XYZ';
		node.name = name;
		//console.log( node.name );	

		done = false;
		while ( !done ) {
			switch ( t = data.shift()) {
				case 'OFFSET':
					node.position.set( parseFloat( data.shift() ), parseFloat( data.shift() ), parseFloat( data.shift() ) );
					node.offset = node.position.clone();
					break;
				case 'CHANNELS':
					n = parseInt( data.shift() );
					for ( var i = 0;  0 <= n ? i < n : i > n;  0 <= n ? i++ : i-- ) {  // OMG
						this.channels.push({
							node: node,
							prop: data.shift()
						});
					}
					break;
				case 'JOINT':
				case 'End':
					node.add( this.parseNode(data) );
					break;
				case '}':
					done = true;
			}
		}
		return node;
    },
    animate:function( frame ){
    	var ch, frame;
		var n = frame % this.numFrames * this.channels.length;
		var ref = this.channels;
		for ( var i = 0, len = ref.length; i < len; i++) {
			ch = ref[ i ];
			switch ( ch.prop ) {
				case 'Xrotation':
					ch.node.rotation.x = (parseFloat(this.data[n])) * BVH.TO_RAD;
					break;
				case 'Yrotation':
					ch.node.rotation.y = (parseFloat(this.data[n])) * BVH.TO_RAD;
					break;
				case 'Zrotation':
					ch.node.rotation.z = (parseFloat(this.data[n])) * BVH.TO_RAD;
					break;
				case 'Xposition':
					ch.node.position.x = ch.node.offset.x + parseFloat(this.data[n]);
					break;
				case 'Yposition':
					ch.node.position.y = ch.node.offset.y + parseFloat(this.data[n]);
					break;
				case 'Zposition':
					ch.node.position.z = ch.node.offset.z + parseFloat(this.data[n]);
			}
			n++;
		}
    }, 
    update:function( frame ){
    	if ( this.play ) { 
			var frame = ( (Date.now() - this.startTime ) / this.secsPerFrame / 1000) | 0; 
			this.animate( frame );

		}
    }


}