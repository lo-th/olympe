var BVH = { REVISION:'0.1a'};

BVH.TO_RAD = Math.PI / 180;
window.URL = window.URL || window.webkitURL;

BVH.Reader = function(){
	this.debug = true;
	this.type = "";
	this.data = null;
	this.root = null;
	this.numFrames = 0;
	this.secsPerFrame = 0;
	this.play = false;
	this.channels = null;
	this.lines = "";
	this.bones = [];
	this.order = "XYZ";
	this.speed = 1;

	this.nodes = null;
	
	this.frame = 0;
	this.oldFrame = 0;
	this.startTime = 0;
	
	this.position = new THREE.Vector3( 0, 0, 0 );
	this.scale = 1;

	this.tmpOrder = "";
	this.tmpAngle = [];

	this.squeleton = null;
	this.skeletonBones = null;
}

BVH.Reader.prototype = {
    constructor: BVH.Reader,

    load:function(fname, Order){
    	//this.order = Order || "ZXY";
    	this.type = fname.substring(fname.length-3,fname.length);

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
							if( pix<96 ) string += String.fromCharCode(pix+32);
						}
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
    parseData:function(data){
    	this.data = data;
		this.channels = [];
		this.nodes = [];
		var done = false;
		while (!done) {
			switch (this.data.shift()) {
			case 'ROOT':
			    if(this.root !== null) this.clearNode();
			    this.bones = [];
				this.root = this.parseNode(this.data);
				if(this.debug){ 
					scene.add(this.root);
					this.root.position.copy(this.position);
					//this.root.scale.set(this.scale,this.scale,this.scale);

					this.addSkeleton( this.nodes.length );
				}
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

		debugTell("BVH frame:"+this.numFrames+" s/f:"+this.secsPerFrame + " channels:"+this.channels.length + " node:"+ this.nodes.length);
		this.getNodeList();
		this.startTime = Date.now();
		this.play = true;
    },
    getNodeList:function () {
    	var n = this.nodes.length, node, s = "";
    	for(var i=0; i<n; i++){
    		node = this.nodes[i];
    		s += node.name + " _ "+ i +"<br>"//+" _ "+node.parent.name +" _ "+node.children[0].name+"<br>";
    	}
    	if(out2)out2.innerHTML = s;
    },
    addSkeleton:function ( n ) {
    	this.squeleton = new THREE.Object3D();
    	this.skeletonBones = [];

    	var n = this.nodes.length, node;
    	var geo = new THREE.CubeGeometry( 0.2, 0.2, 10 );//new THREE.Geometry();
    	geo.applyMatrix( new THREE.Matrix4().makeTranslation( 0, 0, 6 ) );
    	var mat = new THREE.MeshNormalMaterial();


    	//var mat = new THREE.LineBasicMaterial( { color: 0xffff00 } );
    	//var pos = new THREE.Vector3( 0, 0, 0 );

    	for(var i=0; i<n; i++){
    		node = this.nodes[i];
    		if ( node.name !== 'Site' ){
	    		this.skeletonBones[i] = new THREE.Mesh(geo, mat);
	    		this.skeletonBones[i].name = node.name;
	    		this.squeleton.add(this.skeletonBones[i])
    	    }
    		//pos = new THREE.Vector3( 0, 0, 0 );
    		//pos.setFromMatrixPosition( this.nodes[i].matrix );
    		//pos = this.nodes[i].position;
    		//geo.vertices.push( pos );
    		
    	}
		//geo.vertices.push( new THREE.Vector3( 0, 10, 0 ) );

    	//this.squeleton = new THREE.Line( geo, mat, THREE.LinePieces );
    	//this.root.add( this.squeleton );
    	scene.add( this.squeleton );

    },
    updateSkeleton:function (  ) {
    	var mtx, node;
    	var n = this.nodes.length;
    	var target;
    	for(var i=0; i<n; i++){
    		node = this.nodes[i];
    		if ( node.name !== 'Site' ){
	    		mtx = node.matrixWorld;
	    		this.skeletonBones[i].position.setFromMatrixPosition( mtx );
	    		//this.skeletonBones[i].rotation.setFromRotationMatrix( mtx );
	    		if(node.parent){
	    			target = new THREE.Vector3().setFromMatrixPosition( node.parent.matrixWorld );
	    			this.skeletonBones[i].lookAt(target);
	    		}
	    	}
    	}
    	/*var pos = new THREE.Vector3();
    	var pos2 = new THREE.Vector3();
    	var geo = this.squeleton.geometry;

    	var np = 0;
    	if(geo.vertices.length === (n*2)-2){

	    	for(var i=1; i<n; i++){
	    		//this.nodes[i-1].updateMatrixWorld();
	    		pos = new THREE.Vector3()
	    		pos.setFromMatrixPosition( this.bones[i-1].matrixWorld );
	    		//pos = this.nodes[i-1].position;
	    		geo.vertices[np].set( pos.x, pos.y, pos.z );
	    		np++
	    		//this.nodes[i].updateMatrixWorld();
	    		pos = new THREE.Vector3()
	    		pos.setFromMatrixPosition( this.bones[i].matrixWorld );
	    		//pos = this.nodes[i].position;
	    		geo.vertices[np].set( pos.x, pos.y, pos.z  );
	    		np++;

geo.verticesNeedUpdate = true;
	    	}
	    	
	    }*/
    },
    addDebugNode:function ( name ) {

		var material = new THREE.MeshNormalMaterial( {});//{ opacity: 0.5, side: THREE.DoubleSide, transparent: true } );
		var geometry, axis;
		if ( name === 'Site' ) {
			geometry = new THREE.SphereGeometry( 0.3 );
			axis = new THREE.AxisHelper(2);
		} else if(name==="Head"){
			geometry = new THREE.BoxGeometry( 2, 2, 2 );
		} else { // use generic
			geometry = new THREE.BoxGeometry( 1, 1, 1 );
			axis = new THREE.AxisHelper(1)
		}
		var node = new THREE.Mesh(geometry, material);
		node.add(axis);
		this.bones.push(node);
		return node;
	},
	transposeName:function(name){
		if(name==="hip") name = "Hips";
		if(name==="abdomen") name = "Spine1";
		if(name==="chest") name = "Chest";
		if(name==="neck") name = "Neck";
		if(name==="head") name = "Head";
		if(name==="lCollar") name = "LeftCollar";
		if(name==="rCollar") name = "RightCollar";
		if(name==="lShldr") name = "LeftUpArm";
		if(name==="rShldr") name = "RightUpArm";
		if(name==="lForeArm") name = "LeftLowArm";
		if(name==="rForeArm") name = "RightLowArm";
		if(name==="lHand") name = "LeftHand";
		if(name==="rHand") name = "RightHand";
		if(name==="lFoot") name = "LeftFoot";
		if(name==="rFoot") name = "RightFoot";
		if(name==="lThigh") name = "LeftUpLeg";
		if(name==="rThigh") name = "RightUpLeg";
		if(name==="lShin") name = "RightLowLeg";
		if(name==="rShin") name = "LeftLowLeg";

		// leg
		if(name==="RightHip") name = "RightUpLeg";
		if(name==="LeftHip") name = "LeftUpLeg";
		if(name==="RightKnee") name = "RightLowLeg";
		if(name==="LeftKnee") name = "LeftLowLeg";
		if(name==="RightAnkle") name = "RightFoot";
		if(name==="LeftAnkle") name = "LeftFoot";
		// arm
		if(name==="RightShoulder") name = "RightUpArm";
		if(name==="LeftShoulder") name = "LeftUpArm";
		if(name==="RightElbow") name = "RightLowArm";
		if(name==="LeftElbow") name = "LeftLowArm";
		if(name==="RightWrist") name = "RightHand";
		if(name==="LeftWrist") name = "LeftHand";

		if(name==="rcollar") name = "RightCollar";
		if(name==="lcollar") name = "LeftCollar";

		if(name==="rtoes") name = "RightToe";
		if(name==="ltoes") name = "LeftToe";

		if(name==="upperback") name = "Spine1";
		
		return name;
	},
    parseNode:function(data){
    	var name, done, n, node, t;
		name = data.shift();
		name = this.transposeName(name);

		if(this.debug) node = this.addDebugNode( name );
		else node = new THREE.Object3D();
		//node.rotation.order = this.order;//'ZXY';
		//node.matrixAutoUpdate = false;
		//node.rotation.order = 'XYZ';
		//node.rotation.order = 'ZYX';
		//node.rotation.order = 'YXZ';
		node.name = name;

		done = false;
		while ( !done ) {
			switch ( t = data.shift()) {
				case 'OFFSET':
					node.position.set( parseFloat( data.shift() ), parseFloat( data.shift() ), parseFloat( data.shift() ) );
					node.offset = node.position.clone();
					break;
				case 'CHANNELS':
					n = parseInt( data.shift() );
					for ( var i = 0;  0 <= n ? i < n : i > n;  0 <= n ? i++ : i-- ) { 
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
		//if ( name !== 'Site' ){
			this.nodes.push(node);
			//node.castShadow = true;
		//}
		return node;
    },
    clearNode:function(){
    	if(this.debug && this.bones.length){ 
    	for (var i=0; i<this.bones.length; i++){
			this.bones[i].geometry.dispose();
		}
    	scene.remove(this.root);
       }

       scene.remove( this.squeleton );

    },
    animate:function(){
    	//debugTell("frame" +  this.frame);
    	var ch;
		var n =  this.frame % this.numFrames * this.channels.length;
		var ref = this.channels;

		for ( var i = 0, len = ref.length; i < len; i++) {
			ch = ref[ i ];

			switch ( ch.prop ) {
				case 'Xrotation':
				    this.autoDetectRotation(ch.node, "X", parseFloat(this.data[n]));
					//ch.node.rotation.x = (parseFloat(this.data[n])) * BVH.TO_RAD;
					break;
				case 'Yrotation':
				    this.autoDetectRotation(ch.node, "Y", parseFloat(this.data[n]));
					//ch.node.rotation.y = (parseFloat(this.data[n])) * BVH.TO_RAD;
					break;
				case 'Zrotation':
				    this.autoDetectRotation(ch.node, "Z", parseFloat(this.data[n]));
					//ch.node.rotation.z = (parseFloat(this.data[n])) * BVH.TO_RAD;
					break;
				case 'Xposition':
					ch.node.position.x = ch.node.offset.x + parseFloat(this.data[n]);
					break;
				case 'Yposition':
					ch.node.position.y = ch.node.offset.y + parseFloat(this.data[n]);
					break;
				case 'Zposition':
					ch.node.position.z = ch.node.offset.z + parseFloat(this.data[n]);
				break;
			}

			n++;
		}

		this.updateSkeleton();
		
    },
    autoDetectRotation:function(Obj, Axe, Angle){

    	this.tmpOrder+=Axe;
    	var angle = Angle * BVH.TO_RAD;

    	if(Axe === "X")this.tmpAngle[0] = angle;
    	else if(Axe === "Y")this.tmpAngle[1] = angle;
    	else this.tmpAngle[2] = angle;

    	if(this.tmpOrder.length===3){
    		var e = new THREE.Euler( this.tmpAngle[0], this.tmpAngle[1], this.tmpAngle[2], this.tmpOrder );
    		Obj.setRotationFromEuler(e);

    		Obj.updateMatrixWorld();

    		this.tmpOrder = "";
    		this.tmpAngle.length = 0;
    	}

    },
    matrixRotation:function(Obj, Axe, Angle){

    	//this.tmpAngle.push(Angle * BVH.TO_RAD);


    	//Obj.rotation[Axe] =  Angle * BVH.TO_RAD;
    	//Obj.rotationAutoUpdate = false;
    	//Obj.matrix.matrixAutoUpdate = false;

    	
    	/*var axis = new THREE.Vector3( 0, 0, 0 );
    	if(Axe === "x") axis.x = 1;
    	else if (Axe === "y") axis.y = 1;
    	else axis.z = 1;

    	axis.normalize();
    	*/


    	/*var quat = new THREE.Quaternion();
    	quat.setFromAxisAngle(axis,angle);
    	var vector = axis.clone();//new THREE.Vector3( 1, 0, 0 );
        vector.applyQuaternion( quat )

    	//Obj.rotateOnAxis(axe.normalize(), angle);

    	// world axes
    	//Obj.quaternion.multiplyQuaternions(quat,Obj.quaternion);

    	Obj.lookAt(vector);*/
        // body axes
        //Obj.quaternion.multiply(quat);

        //Obj.quaternion = quat;

    	/*var mtx = Obj.matrix.clone();

    	Obj.applyMatrix()
    	//mtx.extractRotation()
    	var mtx2 = Obj.matrix.clone();
    	mtx.matrixAutoUpdate = false;
    	mtx2.matrixAutoUpdate = false;
    	mtx.makeRotationAxis(axe.normalize(), angle);
    	Obj.matrixAutoUpdate = false;

    	Obj.matrix.multiplyMatrices(mtx, mtx2); 
    		Obj.matrixAutoUpdate = true;*/

    	//Obj.rotation.setFromRotationMatrix( mtx );

    },
    update:function(){
    	if ( this.play ) { 
			this.frame = ((((Date.now() - this.startTime) / this.secsPerFrame / 1000) )*this.speed)| 0;
			if(this.oldFrame!==0)this.frame += this.oldFrame;
			if(this.frame > this.numFrames ){this.frame = 0;this.oldFrame=0; this.startTime =Date.now() }

			this.animate();
		}
    },
    next:function(){
    	this.play = false;
    	this.frame ++;
    	if(this.frame > this.numFrames )this.frame = 0;
    	this.animate();
    },
    prev:function(){
    	this.play = false;
    	this.frame --;
    	if(this.frame<0)this.frame = this.numFrames;
    	this.animate();
    }


}