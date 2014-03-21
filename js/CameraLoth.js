"use strict";
var camPos = {w: 100, h:100, horizontal: 40, vertical: 60, distance: 300, automove: false};
var vsize = { x:window.innerWidth, y:window.innerHeight };
var mouse = {x: 0, y: 0, down:false, over:false, ox: 0, oy: 0, h: 0, v: 0, mx:0, my:0, moving:true};
var center = new THREE.Vector3(0,0,0);
var ToRad = Math.PI / 180;
var DomElement;

var camera;

function CameraLoth(domElement) {
	this.domElement = ( domElement !== undefined ) ? domElement : document
	camera = new THREE.PerspectiveCamera( 60, 1, 1, 1000 );
	scene.add(camera);
	moveCamera();

	//this.vsize = {x:0, y:0};

	this.domElement.addEventListener( 'mousemove', onMouseMove, false );
	this.domElement.addEventListener( 'touchmove', onTouchMove, false );
	this.domElement.addEventListener( 'mousedown', onMouseDown, false );
	this.domElement.addEventListener( 'mouseup', onMouseUp, false );
	this.domElement.addEventListener( 'mousewheel', onMouseWheel, false );
	this.domElement.addEventListener( 'DOMMouseScroll', onMouseWheel, false ); // firefox

	DomElement = this.domElement;
}

function setViewSize(x, y) {
	vsize.x = x;
	vsize.y = y;
	camera.aspect = window.innerWidth / window.innerHeight;
	camera.updateProjectionMatrix();
}

//-----------------------------------------------------
//  MOUSE
//-----------------------------------------------------

/*function onMouseOut() {
	if(cursor){
	    document.body.style.cursor = 'auto';
	    cursorUp.style.visibility = 'hidden';
	    cursorDown.style.visibility = 'hidden';
	    mouse.over = false;
	}
}

function onMouseOver() {
	if(cursor){
		document.body.style.cursor = 'none';
    	cursorUp.style.visibility = 'visible';
    	mouse.over = true;
    }
}*/

function onMouseDown(e) {
	mouse.ox = e.clientX;
	mouse.oy = e.clientY;
	mouse.h = camPos.horizontal;
	mouse.v = camPos.vertical;

	
	//var decalx = (vsize.x - sizeListe[size].w)*0.5;
	//var decaly = (vsize.y - sizeListe[size].h)*0.5;

    mouse.mx = ( e.clientX / vsize.x ) * 2 - 1;
	mouse.my = -( e.clientY / vsize.y) * 2 + 1;

	mouse.down = true;

	//rayTest(false);

}

function onMouseUp(e) {
	document.body.style.cursor = 'auto';
	mouse.down = false;
}

function onMouseMove(e) {
	e.preventDefault();

	

	if (mouse.down && !camPos.automove ) {
		
	    if (mouse.moving) {
			document.body.style.cursor = 'move';
			mouse.x = e.clientX;
			mouse.y = e.clientY;
			
			camPos.horizontal = (-(mouse.x - mouse.ox) * 0.3) + mouse.h;
			camPos.vertical = (-(mouse.y - mouse.oy) * 0.3) + mouse.v;
			moveCamera();
	    } else {
	    	mouse.mx = ( e.clientX / vsize.x ) * 2 - 1;
	    	mouse.my = -( e.clientY / vsize.y ) * 2 + 1;
	    }
	}
}

function onTouchMove(e) { 
	e.preventDefault();
	var touchId = e.changedTouches[0].identifier;
    if (mouse.down && !camPos.automove ) {
		mouse.x = e.touches[touchId].clientX;
		mouse.y =  e.touches[touchId].clientY;
		camPos.horizontal = (-(mouse.x - mouse.ox) * 0.3) + mouse.h;
		camPos.vertical = (-(mouse.y - mouse.oy) * 0.3) + mouse.v;
		moveCamera();
    }
}

function onMouseWheel(e) {
	var delta = 0;
	var m;
	if ( e.wheelDelta ){ delta = e.wheelDelta; m=true}
	else if ( e.detail ) { delta = - e.detail; m=false}
	if(m)camPos.distance-=delta/10;
	else camPos.distance-=delta*10;
	moveCamera();
}

//-----------------------------------------------------
//  CAMERA
//-----------------------------------------------------
var cam = [0,0];

function moveCamera() {
	camera.position.copy(Orbit(center, camPos.horizontal, camPos.vertical, camPos.distance, true));
	camera.lookAt(center);
}

function endMove() {
	camPos.automove = false;
}

function onThreeChangeView(h, v, d) {
	TweenLite.to(camPos, 3, {horizontal: h, vertical: v, distance: d, onUpdate: moveCamera, onComplete: endMove });
	camPos.automove = true;
}

function cameraFollow(vec){
	center.copy(vec);
	moveCamera();
}

//-----------------------------------------------------
//  MATH
//-----------------------------------------------------

function exponentialEaseOut( v ) { return v === 1 ? 1 : - Math.pow( 2, - 10 * v ) + 1; };

function clamp(a,b,c) { return Math.max(b,Math.min(c,a)); }

function Orbit(origine, horizontal, vertical, distance, isCamera) {
	if(isCamera){
		if(distance>400)distance =400;
		else if(distance<50)distance =50;
		if(vertical>89)vertical =89;
		else if(vertical<1)vertical =1;
	} 
	var p = new THREE.Vector3();
	var phi = unwrapDegrees(vertical)*ToRad;
	var theta = unwrapDegrees(horizontal)*ToRad;
	
	p.x = (distance * Math.sin(phi) * Math.cos(theta)) + origine.x;
	p.z = (distance * Math.sin(phi) * Math.sin(theta)) + origine.z;
	p.y = (distance * Math.cos(phi)) + origine.y;
	return p;
}

function unwrapDegrees(r) {
	r = r % 360;
	if (r > 180) r -= 360;
	if (r < -180) r += 360;
	return r;
}

function getDistance (x1, y1, x2, y2) {
	return Math.sqrt((x1-x2)*(x1-x2)+(y1-y2)*(y1-y2));
}