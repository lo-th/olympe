var BVH = { REVISION:'0.1a'};

BVH.TO_RAD = Math.PI / 180;
window.URL = window.URL || window.webkitURL;

BVH.Reader = function(){
	this.debug = false;
	this.type = "";
	this.data = null;
	this.root = null;
	this.numFrames = 0;
	this.secsPerFrame = 0;
	this.play = false;
	this.channels = null;
	this.lines = "";
	this.bones;
	this.dataInfo;
}

BVH.Reader.prototype = {
    constructor: BVH.Reader,

    load:function(fname){
    	this.type = fname.substring(fname.length-3,fname.length);
    	//console.log(this.type);

    	var _this = this;
		var xhr = new XMLHttpRequest();
		xhr.open( 'GET', fname, true );

		if(this.type === 'bvh'){ // direct from file
			xhr.onreadystatechange = function(){ if ( this.readyState == 4 ){ _this.parseData(this.responseText.split(/\s+/g));}};			
	    } else if(this.type === 'png'){ // from png compress
	    	xhr.responseType = 'blob';
	    	xhr.onload = function(e) {
	    		if (this.readyState == 4 ) {//if (this.status == 200) {
		    		var blob = this.response;
		    		var img = document.createElement('img');
		    		img.onload = function(e) {
		    			var c=document.createElement("canvas"), r='', pix, i, string = "";
		    			c.width = this.width;
		    			c.height = this.height;
		    			c.getContext('2d').drawImage(this, 0, 0);
		    			var d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data;
		    			for ( i = 0, l=d.length; i<l; i+=4){
							pix = d[i];
							if( pix>31 && pix<128 ) string += String.fromCharCode(pix);
						}
						//console.log(data);
						var array = string.split(",");
						_this.parseData(array);
		    		    window.URL.revokeObjectURL(img.src); // Clean up after yourself.
		    		}
		    		img.src = window.URL.createObjectURL(blob);
		    	}
	    	}
	    }
	    xhr.send( null );
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

    	this.data = data;
		this.channels = [];
		this.dataInfo = [];
		var done = false;
		while (!done) {
			switch (this.data.shift()) {
			case 'ROOT':
			    if(this.root !== null) this.clearNode();
			    this.bones = [];
				this.root = this.parseNode(this.data);
				if(this.debug) scene.add(this.root);

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

		//console.log("BVH loaded:" , this.numFrames, this.secsPerFrame);
		debugTell("BVH frame:"+this.numFrames+" s/f:"+this.secsPerFrame);

		this.startTime = Date.now();
		this.play = true;
    },
    addDebugNode:function ( name ) {

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
		this.bones.push(node);
		return node;
	},
    parseNode:function(data){
    	var name, done, n, node, t;
		name = data.shift();
		if(this.debug) node = this.addDebugNode( name );
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
						this.dataInfo.push({ name:name, pos:new THREE.Vector3(), rot:new THREE.Vector3()});
						this.channels.push({ node: node, prop: data.shift() });
						
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
    clearNode:function(){
    	if(this.debug){ 
    	for (var i=0; i<this.bones.length; i++){
			this.bones[i].geometry.dispose();
		}
    	scene.remove(this.root);
       }

    },
    animate:function( frame ){
    	var ch, frame;
		var n = frame % this.numFrames * this.channels.length;
		var ref = this.channels;
		var inf = this.dataInfo;
		//var rot,pos;
		//var d = {name = };
		//console.log(ref.length)
		for ( var i = 0, len = ref.length; i < len; i++) {
			ch = ref[ i ];
			ff = inf[ i ];

			//rot = new THREE.Vector3();
		    //pos = new THREE.Vector3();

			switch ( ch.prop ) {
				case 'Xrotation':
					ch.node.rotation.x = (parseFloat(this.data[n])) * BVH.TO_RAD ;
					ff.rot.x = (parseFloat(this.data[n])) * BVH.TO_RAD;
					break;
				case 'Yrotation':
					ch.node.rotation.y = (parseFloat(this.data[n])) * BVH.TO_RAD;
					ff.rot.y = (parseFloat(this.data[n])) * BVH.TO_RAD;
					break;
				case 'Zrotation':
					ch.node.rotation.z = (parseFloat(this.data[n])) * BVH.TO_RAD;
					ff.rot.z = (parseFloat(this.data[n])) * BVH.TO_RAD;
					break;
				case 'Xposition':
					ch.node.position.x = ch.node.offset.x + parseFloat(this.data[n]);
					ff.pos.x = ch.node.position.x;//ch.node.offset.x + parseFloat(this.data[n]);
					break;
				case 'Yposition':
					ch.node.position.y = ch.node.offset.y + parseFloat(this.data[n]);
					ff.pos.y = ch.node.position.y;//ch.node.offset.y + parseFloat(this.data[n]);
					break;
				case 'Zposition':
					ch.node.position.z = ch.node.offset.z + parseFloat(this.data[n]);
					ff.pos.z = ch.node.position.z;//ch.node.offset.z + parseFloat(this.data[n]);
				break;
			}

			n++;
		}
    }, 
    update:function( frame ){
    	if ( this.play ) { 
			var frame = ( (Date.now() - this.startTime ) / this.secsPerFrame / 1000) | 0; 
			this.animate( frame );

		}
    },
    stop:function(){
    	this.play = false;
    }


}