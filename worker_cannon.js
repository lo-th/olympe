var world;
importScripts('js/physics/cannon.min.js');

onmessage = function (e) {
	var data = e.data;

            if (!world) {
                // Init physics
                world = new CANNON.World();
                world.broadphase = new CANNON.NaiveBroadphase();
                world.gravity.set(0,-10,0);
                world.solver.tolerance = 0.001;

                // Ground plane
                var plane = new CANNON.Plane();
                var groundBody = new CANNON.RigidBody(0,plane);
                groundBody.quaternion.setFromAxisAngle(new CANNON.Vec3(1,0,0),-Math.PI/2);
                world.add(groundBody);

                // Create N cubes
                var shape = new CANNON.Box(new CANNON.Vec3(0.5,0.5,0.5));
                for(var i=0; i!==data.N; i++){
                    var body = new CANNON.RigidBody(1,shape);
                    body.position.set(Math.random()-0.5,2.5*i+0.5,Math.random()-0.5);
                    world.add(body);
                }
            }

            // Step the world
            world.step(data.dt);

            // Copy over the data to the buffers
            var positions = data.positions;
            var quaternions = data.quaternions;
            for(var i=0; i!==world.bodies.length; i++){
                var b = world.bodies[i],
                    p = b.position,
                    q = b.quaternion;
                positions[3*i + 0] = p.x;
                positions[3*i + 1] = p.y;
                positions[3*i + 2] = p.z;
                quaternions[4*i + 0] = q.x;
                quaternions[4*i + 1] = q.y;
                quaternions[4*i + 2] = q.z;
                quaternions[4*i + 3] = q.w;
            }

            // Send data back to the main thread
            postMessage({
                positions:positions,
                quaternions:quaternions
            });//, [positions.buffer, quaternions.buffer]);
};