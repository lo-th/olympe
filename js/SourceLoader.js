var img = new Image();
var scripts = [];

img.onload = function() {
	var LoadInfo = "";
	var t01 = Date.now();
	var c=document.createElement("canvas"), r='', pix, i;
	c.width = c.height = this.width;
	c.getContext('2d').drawImage(this, 0, 0);
	var d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data;
	var newScript = false;
	var ns = 0;
	var src = [];

	for ( i = 0, l=d.length; i<l; i+=4){
		pix = d[i];
		if(pix === 128) newScript = true;
		if( pix>31 && pix<128 ){ 
			if(newScript){ ns++; newScript = false; src[ns] ="";}
            src[ns] += String.fromCharCode(pix);
		}
	}
	var name, nn, pn, tmpsrc, lib=0;
	for( i = 0; i<ns; i++){
		tmpsrc = src[i+1];
		src[i+1] = "";
		nn = tmpsrc.indexOf("var");
		pn = tmpsrc.indexOf("=");
		name = tmpsrc.substring(nn+4,pn);
		if(name === "={fromGeometry:function(n,t){var ") name = "TOOLS";
		if(name === "e"){ if(lib===0){ lib++; name = "TWEENLITE";}  else {name = "HOWLER";}}

		LoadInfo += name + ", ";
		scripts[i] = document.createElement("script");
		scripts[i].type = "text/javascript";
		scripts[i].id = name;
		scripts[i].charset = "utf-8";
		scripts[i].async = true;
		
		scripts[i].textContent = tmpsrc;

		document.getElementsByTagName('head')[0].appendChild(scripts[i]);
		//document.body.appendChild(scripts[i]);
	}

	tmpsrc = "";
	src = null;

	LoadInfo += "<br>decode time: " + (Date.now()-t01) + " ms<br>";

	sourceLoaded(LoadInfo);
};
img.src = "img/full.png";