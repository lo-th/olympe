/*
OimoPhysics alpha dev 10
@author Saharan _ http://el-ement.com
@link https://github.com/saharan/OimoPhysics
...
oimo.js worker for three.js 
@author Loth _ http://3dflashlo.wordpress.com/

OimoPhysics use international system units
0.1 to 10 meters max for dynamique body
size and position x100 for three.js
*/
//'use strict';
importScripts('oimo/runtime_min.js');
importScripts('oimo/oimo_dev_min_old.js');

// main class
var version = "10.DEV";
var World, RigidBody, BroadPhase;
var Shape, ShapeConfig, BoxShape, SphereShape;
var JointConfig, HingeJoint, WheelJoint, DistanceJoint;
var Vec3, Quat, Mat33;

// physics variable
var world;
var dt = 1/60;
var scale = 10;
var invScale = 0.1;
var iterations = 8;
var Gravity = -10, newGravity = -10;

var timer, delay, timerStep;
var fps=0, time, time_prev=0, fpsint = 0;
var ToRad = Math.PI / 180;

// array variable
var bodys;
var matrix;
var sleeps;
var types;
var sizes;
var infos = new Float32Array(12);
//var infos =[]; infos.length=12;
var currentDemo = 0;
var maxDemo = 8;

var droid;
var droidSet={rot:0}
var wheels = [];
var joints = [];
var arms = [];
var droidMove = [0,0,0, 0, 0];
var droidAngle = 0;

var renderLoop;
// vehicle by key
/*var car = null;
var van = null;
var ball = null;*/

//--------------------------------------------------
//   WORKER MESSAGE
//--------------------------------------------------

self.onmessage = function (e) {
    var phase = e.data.tell;
    if(phase === "INITWORLD"){
        dt = e.data.dt;
        iterations = e.data.iterations;
        newGravity = e.data.G;
        initClass();
    }
    if(phase === "UPDATE"){
        update();
        //renderLoop = setInterval( update, timerStep );

    }
    if(phase === "KEY") userKey(e.data.key);
    //if(phase === "CAMERA") userCamera(e.data.cam);
    if(phase === "GRAVITY") newGravity = e.data.G;
    if(phase === "DROIDMOVE"){
        droidMove[0] =  e.data.mx*invScale;///*invScale;
        droidMove[1] =  e.data.mz*invScale;//*invScale;
        droidMove[2] =  e.data.ry;
        droidMove[3] =  e.data.px*invScale;///*invScale;
        droidMove[4] =  e.data.pz*invScale;
        /*droid.position.x = e.data.px*invScale;
        droid.position.z = e.data.pz*invScale;
        droid.position.y = 0.6;
        var sin = Math.sin(e.data.ry * 0.5);
        var cos = Math.cos(e.data.ry * 0.5);
        droid.orientation = new Quat(cos, 0, sin * 1, 0);*/
        /*droid.linearVelocity.x =0;
        droid.linearVelocity.z =0;
        droid.linearVelocity.y =0;
        droid.angularVelocity.x =0;
        droid.angularVelocity.z =0;
        droid.angularVelocity.y =0;*/
        //update()
        //droid.rotation = eulerToAxisAngle(0,  e.data.ry, 0);
        //droid.rotation.y = e.data.ry;
        //droid.position.y = 0.06;
    } 
    if(phase === "CLEAR"){
        clearWorld();
    }
}

//--------------------------------------------------
//   WORLD UPDATE
//--------------------------------------------------

function update() {
    var t01 = Date.now();

    //world.step();

    var r, p, t, n;
    var max = bodys.length;
    var sin, cos;

    for ( var i = 0; i !== max ; ++i ) {
        if( bodys[i].sleeping) sleeps[i] = 1;
        else{ 
            sleeps[i] = 0;
            if(types[i]===3){
                
                //bodys[i].angularVelocity.scaleEqual(0.98)
               /* bodys[i].position.x = droidMove[3];
                bodys[i].position.z = droidMove[4];
               
                sin = Math.sin(droidMove[2]*0.5);
                cos = Math.cos(droidMove[2]*0.5);
                bodys[i].orientation = new Quat(cos, 0, sin * 1, 0);*/
            }
            r = bodys[i].rotation;
            p = bodys[i].position;
            n = 12*i;

            matrix[n+0]=r.e00; matrix[n+1]=r.e01; matrix[n+2]=r.e02; matrix[n+3]=p.x*scale;
            matrix[n+4]=r.e10; matrix[n+5]=r.e11; matrix[n+6]=r.e12; matrix[n+7]=p.y*scale;
            matrix[n+8]=r.e20; matrix[n+9]=r.e21; matrix[n+10]=r.e22; matrix[n+11]=p.z*scale;
            
        }
    }

    /*if(Gravity!==newGravity){
        Gravity = newGravity;
        world.gravity = new Vec3(0, Gravity, 0);
        for ( var i = 0; i !== max ; ++i ) bodys[i].awake();
    }*/

    world.step();
    //worldInfo();

    //self.postMessage({tell:"RUN", infos: infos, matrix:matrix, sleeps:sleeps  })
    self.postMessage({tell:"RUN", matrix:matrix, sleeps:sleeps, types:types  })

    delay = timerStep - (Date.now()-t01);
    timer = setTimeout(update, delay);
}

//--------------------------------------------------
//   USER KEY
//--------------------------------------------------

function userKey(key) {
    moveDroid((key[0]===1 ? -1 : 0) + (key[1]===1 ? 1 : 0), (key[2]===1 ? -1 : 0) + (key[3]===1 ? 1 : 0));
   /* var phi = (-matrixToEuler(droid.rotation)[1])+(-90*ToRad);//droidSet.rot*ToRad;
    var speed = 0.5;
    if (key[0] === 1) {
        droid.linearVelocity.x -= Math.cos(phi) * speed;
        droid.linearVelocity.z -= Math.sin(phi) * speed;
        //droid.linearVelocity.x = -Math.cos(phi) * speed;
        //droid.linearVelocity.z = -Math.sin(phi) * speed;
    }
    if (key[1] === 1) {
        droid.linearVelocity.x += Math.cos(phi) * speed;
        droid.linearVelocity.z += Math.sin(phi) * speed;
        //droid.linearVelocity.x = Math.cos(phi) * speed;
        //droid.linearVelocity.z = Math.sin(phi) * speed;
    }
    if (key[2] ===1) {
        droid.angularVelocity.y=-2;//*ToRad;
        //droidSet.rot-=2;
        //droid.linearVelocity.x -= Math.cos(phi - Math.PI * 0.5) * speed;
        //droid.linearVelocity.z -= Math.sin(phi - Math.PI * 0.5) * speed;
    }
    if (key[3] ===1) {
        droid.angularVelocity.y=2;//*ToRad;
        //droidSet.rot+=2;
        //droid.linearVelocity.x -= Math.cos(phi + Math.PI * 0.5) * speed;
        //droid.linearVelocity.z -= Math.sin(phi + Math.PI * 0.5) * speed;
    }
    if (key[0] === 0 && key[1] === 0 && key[2] === 0 && key[3] === 0) {
        droid.linearVelocity.x = 0;
        droid.linearVelocity.z = 0;
        droid.angularVelocity.y=0;//.scaleEqual(0.98);
    }*/
}

//--------------------------------------------------
//  DROID
//--------------------------------------------------

function creatDroid(){
    var sc = new ShapeConfig();
    var h = 12;
    var w = 15.8;
    var d =  22.5;
    var rad = 5;
    sc.density = 10;
    //sc.friction = 0.5;
    droid = addRigid({type:"droid", size:[36,9,57], pos:[0,5,0], sc:sc, move:true, noSleep:true, rotation:[0,droidSet.rot*ToRad,0]})//, center:[0, 5, 0];

    // create wheels
    sc.friction =4;
    //sc.relativePosition.init(0, 0, 0);
    var wy = 5;
    /*wheels[0] = addRigid({type:"sphere", size:[rad, rad, rad], pos:[ -w , wy,  -d], sc:sc, move:true});
    wheels[1] = addRigid({type:"sphere", size:[rad, rad, rad], pos:[ w, wy,- d], sc:sc, move:true});
    wheels[2] = addRigid({type:"sphere", size:[rad, rad, rad], pos:[ -w, wy, d], sc:sc, move:true});
    wheels[3] = addRigid({type:"sphere", size:[rad, rad, rad], pos:[ w, wy, d], sc:sc, move:true});*/

    wheels[0] = addRigid({type:"wl", size:[rad, rad, rad], pos:[ -w , wy,  -d], sc:sc, move:true});
    wheels[1] = addRigid({type:"wr", size:[rad, rad, rad], pos:[ w, wy,- d], sc:sc, move:true});
    wheels[2] = addRigid({type:"wr", size:[rad, rad, rad], pos:[ -w, wy, d], sc:sc, move:true});
    wheels[3] = addRigid({type:"wl", size:[rad, rad, rad], pos:[ w, wy, d], sc:sc, move:true});

    joints[0] = addJoint({type:"wheel", body1:droid, body2:wheels[0], pos1:[-w, 0, -d], axis1:[0, -1, 0], axis2:[-1, 0, 0], limit:[0,0], spring:[8,1] });
    joints[1] = addJoint({type:"wheel", body1:droid, body2:wheels[1], pos1:[w, 0, -d], axis1:[0, -1, 0], axis2:[-1, 0, 0], limit:[0,0], spring:[8,1] });
    joints[2] = addJoint({type:"wheel", body1:droid, body2:wheels[2], pos1:[-w, -0, d], axis1:[0, -1, 0], axis2:[-1, 0, 0], limit:[0,0] });
    joints[3] = addJoint({type:"wheel", body1:droid, body2:wheels[3], pos1:[w,0, d], axis1:[0, -1, 0], axis2:[-1, 0, 0], limit:[0,0] });

    sc.friction = 1;
    sc.density = 0.1;
    var platform =  addRigid({type:"boxd", size:[22,6.5,25], pos:[0,9.5,-14.5], sc:sc, move:true, noSleep:true});
    joints[4] = addJoint({type:"wheel", body1:droid, body2:platform, pos1:[0, 4.5+3.25, -14.5], axis1:[0, -1, 0], axis2:[-1, 0, 0], limit:[0,0], collision:true });


    arms[0] =  addRigid({type:"boxd", size:[20,8.5,20], pos:[0,9.5,16.6], sc:sc, move:true, noSleep:true});
    joints[5] = addJoint({type:"wheel", body1:droid, body2: arms[0], pos1:[0, 4.5+4.25, 16.6], axis1:[0, -1, 0], axis2:[-1, 0, 0], limit:[0,0], collision:true  });



}

function moveDroid (accelSign, handleSign) {
    var breaking = droid.linearVelocity.dot(new Vec3(droid.rotation.e02, droid.rotation.e12, droid.rotation.e22)) * accelSign > 0;
    var ratio = 0;
    var v = droid.linearVelocity.length() * 3.6;
    var maxSpeed = Math.PI * 2 / 60 * 1200; // 1200rpm
    var minTorque = 40;
    
    if (breaking) minTorque *= 2;
    
    if (v < 10) ratio = 3;
    else if (v < 30) ratio = 2;
    else if (v < 70) ratio = 1.4;
    else if (v < 100) ratio = 1.2;
    else  ratio = 1;
    
    var speed = maxSpeed / ratio * accelSign;
    var torque = minTorque * ratio * (accelSign * accelSign);
    
    /*var deg45 = Math.PI / 4;
    droidAngle += handleSign * 0.02;
    droidAngle *= 0.94;
    droidAngle = droidAngle > deg45 ? deg45 : droidAngle < -deg45 ? -deg45 : droidAngle;*/
    droid.angularVelocity.y = handleSign * 2;
    
    if(handleSign!==0){
        joints[0].rotationalLimitMotor2.setMotor(speed, torque);
        joints[1].rotationalLimitMotor2.setMotor(speed, -torque);
        joints[2].rotationalLimitMotor2.setMotor(speed, -torque);
        joints[3].rotationalLimitMotor2.setMotor(speed, torque);
    }else{
        joints[0].rotationalLimitMotor2.setMotor(speed, torque);
        joints[1].rotationalLimitMotor2.setMotor(speed, torque);
        joints[2].rotationalLimitMotor2.setMotor(speed, torque);
        joints[3].rotationalLimitMotor2.setMotor(speed, torque);
    }
    
    //joints[0].rotationalLimitMotor1.setLimit(droidAngle, droidAngle);
    //joints[1].rotationalLimitMotor1.setLimit(droidAngle, droidAngle);
    
    var axis = new Vec3(droid.rotation.e01, droid.rotation.e11, droid.rotation.e21); // up axis
    
    correctRotation(wheels[0], axis);
    correctRotation(wheels[1], axis);
    correctRotation(wheels[2], axis);
    correctRotation(wheels[3], axis);
}
    
function correctRotation(w, axis1) {
    //var axis1 = new Vec3(droid.rotation.e01, droid.rotation.e11, droid.rotation.e21);
    var axis2 = new Vec3(w.rotation.e00, w.rotation.e10, w.rotation.e20);
    var axis3 = new Vec3().sub(axis2, axis1.scaleEqual(axis1.dot(axis2)));
    w.orientation.mul(new Quat().arc(axis2, axis3.normalize(axis3)), w.orientation);
    w.orientation.normalize(w.orientation);
}

//--------------------------------------------------
//   OIMO WORLD INIT
//--------------------------------------------------

function initClass(){
    with(joo.classLoader) {
        import_("com.elementdev.oimo.physics.OimoPhysics");
        complete(function(imports){with(imports){
            World = com.elementdev.oimo.physics.dynamics.World;
            RigidBody = com.elementdev.oimo.physics.dynamics.RigidBody;
            BroadPhase = com.elementdev.oimo.physics.collision.broadphase.BroadPhase;
            // Shape
            Shape = com.elementdev.oimo.physics.collision.shape.Shape;
            ShapeConfig = com.elementdev.oimo.physics.collision.shape.ShapeConfig;
            BoxShape = com.elementdev.oimo.physics.collision.shape.BoxShape;
            SphereShape = com.elementdev.oimo.physics.collision.shape.SphereShape;
            // Joint
            JointConfig = com.elementdev.oimo.physics.constraint.joint.JointConfig;
            HingeJoint = com.elementdev.oimo.physics.constraint.joint.HingeJoint;
            WheelJoint = com.elementdev.oimo.physics.constraint.joint.WheelJoint;
            DistanceJoint = com.elementdev.oimo.physics.constraint.joint.DistanceJoint;
            // Math
            Vec3 = com.elementdev.oimo.math.Vec3;
            Quat = com.elementdev.oimo.math.Quat;
            Mat33 = com.elementdev.oimo.math.Mat33;

            initWorld();
        }});
    }
}

function initWorld(){
    if(world==null){
        world = new World();

        //world.broadphase = BroadPhase.BROAD_PHASE_BRUTE_FORCE;
        //world.broadphase = BroadPhase.BROAD_PHASE_SWEEP_AND_PRUNE;
        //world.broadphase = BroadPhase.BROAD_PHASE_DYNAMIC_BOUNDING_VOLUME_TREE;
        
        world.numIterations = iterations;
        world.timeStep = dt;
        timerStep = dt * 1000;
        world.gravity = new Vec3(0, Gravity, 0);
    }

    bodys = [];
    types = [];
    sizes = [];

    
    var sc = new ShapeConfig();
    sc.density = 1;

    // ground
    addRigid({type:"box", size:[2000,100,2000], pos:[0,-50,0], sc:sc});

    sc.friction = 0.5;
    sc.density = 1;
    addRigid({type:"box", size:[10,10,10], pos:[0,10,50], sc:sc, move:true, noSleep:true});

    creatDroid();

    var N = bodys.length;
    matrix = new Float32Array(N*12);
    sleeps = new Uint8Array(N);

    self.postMessage({tell:"INIT", types:types, sizes:sizes});
}

function clearWorld(){
    clearTimeout(timer);
    if(world != null) world.clear();
    // Clear three object
    self.postMessage({tell:"CLEAR"});
}

//--------------------------------------------------
//    BASIC OBJECT
//--------------------------------------------------

function addRigid(obj){
    var p = obj.pos || [0,0,0];
    var s = obj.size || [1,1,1];
    var r = obj.rot || [0,0,0,0];
    var rotation = obj.rotation || null;
    var move = obj.move || false;
    var sc = obj.sc || new ShapeConfig();
    var noSleep  = obj.noSleep || false;
    var center = obj.center || [0,0,0];
    //var noAdjust = obj.noAdjust || false;


    // rotation x y z in degre to axis
    //if(rotation !== null ) r = eulerToAxisAngle(rotation[0]*ToRad, rotation[1]*ToRad, rotation[2]*ToRad);
    // rotation x y z in radian
    if(rotation !== null ) r = eulerToAxisAngle(rotation[0], rotation[1], rotation[2]);
    else r[0] = r[0]*ToRad;

    var shape, t;
    var shape2 = null;
    switch(obj.type){
        case "sphere": shape=new SphereShape(sc, s[0]*invScale); t=1; break;
        case "box": shape=new BoxShape(sc, s[0]*invScale, s[1]*invScale, s[2]*invScale); t=2; break;
        case "droid": shape=new BoxShape(sc, s[0]*invScale, s[1]*invScale, s[2]*invScale); t=3; break;

        case "wr": shape=new SphereShape(sc, s[0]*invScale); t=4; break;
        case "wl": shape=new SphereShape(sc, s[0]*invScale); t=5; break;

        case "boxd": shape=new BoxShape(sc, s[0]*invScale, s[1]*invScale, s[2]*invScale); t=6; break;
    }
    var body = new RigidBody(p[0]*invScale, p[1]*invScale, p[2]*invScale, r[0], r[1], r[2], r[3]);
    
    body.addShape(shape);
    //if(shape2!=null)body.addShape(shape2);
    //if(t===5)body.addShape(new BoxShape(sc, s[0] * 2, 0.2, 0.2));

    if(!move)body.setupMass(0x2); // static
    else{ 
        // define center of mass
        if(center[0]!==0 || center[1]!==0 || center[2]!==0){
            sc.relativePosition.init(center[0]*invScale, center[1]*invScale, center[2]*invScale);
            body.setupMass(0x1, false);
        } else {
            sc.relativePosition.init(0, 0, 0);
            body.setupMass(0x1, true);
        } 

        bodys.push(body);
        types.push(t);
        sizes.push([s[0], s[1], s[2]]);
        if(noSleep)body.allowSleep = false;
        else body.allowSleep = true;
    }
    world.addRigidBody(body);
    return body;
}

//--------------------------------------------------
//    BASIC JOINT
//--------------------------------------------------

function addJoint(obj){
    var jc = new JointConfig();
    var axis1 = obj.axis1 || [1,0,0];
    var axis2 = obj.axis2 || [1,0,0];
    var pos1 = obj.pos1 || [0,0,0];
    var pos2 = obj.pos2 || [0,0,0];
    var minDistance =0.01// obj.minDistance || 0.01;
    var maxDistance = obj.maxDistance || 0.1;
    var lowerAngleLimit = obj.lowerAngle || 1;
    var upperAngleLimit = obj.upperAngle || 0;
    var type = obj.type || "hinge";
    var limit = obj.limit || null;
    var spring = obj.spring || null;
    var collision = obj.collision || false;
    jc.allowCollision=collision;
    jc.localAxis1.init(axis1[0], axis1[1], axis1[2]);
    jc.localAxis2.init(axis2[0], axis2[1], axis2[2]);
    jc.localAnchorPoint1.init(pos1[0]*invScale, pos1[1]*invScale, pos1[2]*invScale);
    jc.localAnchorPoint2.init(pos2[0]*invScale, pos2[1]*invScale, pos2[2]*invScale);
    jc.body1 = obj.body1;
    jc.body2 = obj.body2;
    var joint;
    switch(type){
        case "distance": joint = new DistanceJoint(jc, minDistance, maxDistance); break;
        case "hinge": joint = new HingeJoint(jc, lowerAngleLimit, upperAngleLimit); break;
        case "wheel": 
            joint = new WheelJoint(jc);  
            if(limit !== null) 
                joint.rotationalLimitMotor1.setLimit(limit[0], limit[1]);
            if(spring !== null) 
                joint.rotationalLimitMotor1.setSpring(spring[0], spring[1]);
        break;
    }
    //joint.limitMotor.setSpring(100, 0.9); // soften the joint
    world.addJoint(joint);
    return joint;
}

//--------------------------------------------------
//   WORLD INFO
//--------------------------------------------------

function worldInfo() {

    time = Date.now();
    if (time - 1000 > time_prev) {
        time_prev = time; fpsint = fps; fps = 0;
    } fps++;

    infos[0] = currentDemo;
    infos[1] = world.numRigidBodies;
    infos[2] = world.numContacts;
    infos[3] = world.broadPhase.numPairChecks;
    infos[4] = world.numContactPoints;
    infos[5] = world.numIslands;
    infos[6] = world.performance.broadPhaseTime;
    infos[7] = world.performance.narrowPhaseTime ;
    infos[8] = world.performance.solvingTime;
    infos[9] = world.performance.updatingTime;
    infos[10] = world.performance.totalTime;
    infos[11] = fpsint;
}

//--------------------------------------------------
//   MATH
//--------------------------------------------------

function eulerToAxisAngle   ( x, y, z ){
    // Assuming the angles are in radians.
    var c1 = Math.cos(y*0.5);//heading
    var s1 = Math.sin(y*0.5);
    var c2 = Math.cos(z*0.5);//altitude
    var s2 = Math.sin(z*0.5);
    var c3 = Math.cos(x*0.5);//bank
    var s3 = Math.sin(x*0.5);
    var c1c2 = c1*c2;
    var s1s2 = s1*s2;
    var w =c1c2*c3 - s1s2*s3;
    var x =c1c2*s3 + s1s2*c3;
    var y =s1*c2*c3 + c1*s2*s3;
    var z =c1*s2*c3 - s1*c2*s3;
    var angle = 2 * Math.acos(w);
    var norm = x*x+y*y+z*z;
    if (norm < 0.001) {
        x=1;
        y=z=0;
    } else {
        norm = Math.sqrt(norm);
        x /= norm;
        y /= norm;
        z /= norm;
    }
    return [angle, x, y, z];
}

function matrixToEuler(m) {
    var x, y, z;
    // Assuming the angles are in radians.
    if (m.e10 > 0.998) { // singularity at north pole
        y = Math.atan2(m.e02,m.e22);
        z = Math.PI/2;
        x = 0;
        //return [x, y, z];
    }
    if (m.e10 < -0.998) { // singularity at south pole
        y = Math.atan2(m.e02,m.e22);
        z = -Math.PI/2;
        x = 0;
        //return [x, y, z];
    }
    y = Math.atan2(-m.e20,m.e00);
    x = Math.atan2(-m.e12,m.e11);
    z = Math.asin(m.e10);
    return [x, y, z];
}

function getDistance3d (p1, p2) {
    var xd = p2[0]-p1[0];
    var yd = p2[1]-p1[1];
    var zd = p2[2]-p1[2];
    return Math.sqrt(xd*xd + yd*yd + zd*zd);
}