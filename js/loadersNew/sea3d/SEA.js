var SEA = {};

SEA.Pool = function(){
	this.models = [];
}

SEA.Pool.prototype = {
    constructor: SEA.Pool,

    load : function(url){
    	var SeaLoader = new THREE.SEA3D( true );
    	SeaLoader.onComplete = function( e ) {
            var i, j, m, anim = [], morph = [];
    		for ( i=0; i < SeaLoader.meshes.length; i++){
    		    m = SeaLoader.meshes[i];
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
                this.models[i] = { name:m.name, geo:this.getSeaGeometry(m), anim:anim, morph:morph }
    	    }
    	}
    	SeaLoader.load( url );
    },

    getSeaGeometry : function (name, scale, axe){
        var a = axe || "z";
        var s = scale || 1;
        var g = this.getMeshByName(name).geometry;
        this.scaleSea3DGeometry(g, s, a);
        return g;
    },

    getMeshByName : function (name){
        for (var i=0; i !== meshs.length; i++){
            if(meshs[i].name === name){
                return meshs[i];
            } 
        } 
    },

    scaleSea3DGeometry : function (geometry, scale, Axe) {
        var s = 1;
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
    this.current = null;
    this.animation = [];
}

SEA.Animator.prototype = {
    constructor: SEA.Animator,
    add:function(name, loop){
        var a = new THREE.Animation( this.mesh, this.name+"/"+name, name);
        a.loop = loop || false;
        a.name = name;
        this.animation.push(a);
        if(name === "idle") this.current = a;
    },
    play:function(name){
        if(name!==this.current.name || this.current === null){
            this.current.stop();
            for(var i=0, l=this.animation.length; i<l; i++ ){
                if(this.animation[i].name === name){
                    this.animation[i].play();
                    this.current = this.animation[i];
                } 
            }
        }
    },
    stop:function(){
        this.current.stop();
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