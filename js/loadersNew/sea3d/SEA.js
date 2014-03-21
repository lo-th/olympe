var SEA = {};

SEA.Pool = function(url, endFunction){
	this.models = [];
    this.endFunction = endFunction ||  function() {};
    this.load(url);
}

SEA.Pool.prototype = {
    constructor: SEA.Pool,

    load : function(url){
    	var SeaLoader = new THREE.SEA3D( true );
        var parent = this;
    	SeaLoader.onComplete = function( e ) {
            setTimeout( parent.detectMesh, 100, SeaLoader, parent);
    	}
    	SeaLoader.load( url );
    },

    detectMesh : function(SeaLoader, parent){
        var j, m, anim, morph;
        for ( var i=0, l= SeaLoader.meshes.length; i < l; i++){
            m = SeaLoader.meshes[i];
            anim = [];
            morph = [];
            if(m.animations){
                for ( j=0; j !== m.animations.length; j++){
                    anim[j] = m.animations[j].name;
                }
            }
            if(m.geometry.morphTargets){
                for ( j=0; j < m.geometry.morphTargets.length; j++){
                    morph[i] = m.geometry.morphTargets[j].name;
                }
            }

            parent.models[i] = { name:m.name, geo:m.geometry, anim:anim, morph:morph };
        }
        parent.endFunction();
    },

    getGeometry : function (name, AutoScale, Scale, Axe){
        var autoScale = AutoScale || false;
        var g;
        for (var i=0, l=this.models.length; i < l; i++){
            if(this.models[i].name === name){
                g = this.models[i].geo;
            }
        }
        if(autoScale)this.scaleGeometry(g, Scale, Axe);
        return g;
    },

    scaleGeometry : function (geometry, Scale, Axe) {
        var s = Scale || 1;
        var axe = Axe || 'z';

        for( var i = 0; i < geometry.vertices.length; i++) {
            var vertex  = geometry.vertices[i];
            if(axe==='x')vertex.x *= -s;
            else vertex.x *= s;
            if(axe==='y')vertex.y *= -s;
            else vertex.y *= s;
            if(axe==='z')vertex.z *= -s;
            else vertex.z *= s;
        }
        geometry.computeFaceNormals();
        geometry.computeCentroids();
        geometry.computeVertexNormals();
        geometry.verticesNeedUpdate = true;
    }
}



SEA.Animator = function(mesh, name){
    this.mesh = mesh;
    this.name = name;
    this.current = {};
    this.current.name = "";
    this.animation = [];
}

SEA.Animator.prototype = {
    constructor: SEA.Animator,
    add:function(name, loop){
        var a = new THREE.Animation( this.mesh, this.name+"/"+name, name);
        a.loop = loop || false;
        a.name = name;
        this.animation.push(a);
    },
    play:function(name){
        if(name!==this.current.name || this.current === null){
            if(this.current.name!=="")this.current.stop();
            for(var i=0, l=this.animation.length; i<l; i++ ){
                if(this.animation[i].name === name){
                    this.animation[i].play();
                    this.current = this.animation[i];
                } 
            }
        }
    },
    playFrame:function(name, n){
        for(var i=0, l=this.animation.length; i<l; i++ ){
                if(this.animation[i].name === name){
                    this.animation[i].play( n );
                    this.animation[i].stop();
                } 
            }
      //  this.current.play(n);
       // this.current.pause();
    },
    pause:function(){
        this.current.pause();
    },
    stop:function(){
        if(this.current.name!==""){
         this.current.stop();
         this.current = {};
         this.current.name = "";
         
     }
    },
    clear:function(){
        this.current.stop();
        /*for(var i=0, l=this.animation.length; i<l; i++ ){
            this.animation[i].reset();
        }*/

        this.animation.length = 0;
        this.current = null;
        this.mesh = null;
        this.name = "";
    }
}