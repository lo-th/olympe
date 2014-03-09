var BVH = { REVISION:'0.1a'};

BVH.TO_RAD = Math.PI / 180;


BVH.Reader = function(){
	//this.statue = "";
	//this.info = "";
	//this.reader = new FileReader();
	//this.xmlhttp = null;
	//this.callbackCount = 0;
	this.data = null;
	//this.done = false;
	this.root = null;
	this.numFrames = 0;
	this.secsPerFrame = 0;
	this.play = false;
	this.channels = null;
}

BVH.Reader.prototype = {
    constructor: BVH.Reader,

    load:function(fname){
    	var _this = this;
		var h = new XMLHttpRequest();
		h.open( 'GET', fname, true );
		h.onreadystatechange = function(){ if (h.readyState==4 ){ _this.parseData(h.responseText);}};
		h.send( null );
    },
    testData:function(data){
    	this.data = data.split(/\s+/g);
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
				//scene.add(this.root);
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
    },
    parseNode:function(data){
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