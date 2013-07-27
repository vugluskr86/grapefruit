gf.PhysicsSystem = function(options) {
    options = options || {};

    this.space = new cp.Space();
    this.space.gravity = gf.utils.ensureVector(options.gravity !== undefined ? options.gravity : 9.87);

    //Time a body must remain idle to fall asleep
    //see: http://chipmunk-physics.net/release/ChipmunkLatest-API-Reference/structcp_space.html#a928d74741904aae266a9efff5b5f68f7
    this.space.sleepTimeThreshold = options.sleepTimeThreshold || 0.2;

    //Amount of encouraged penetration between colliding shapes.
    //see: http://chipmunk-physics.net/release/ChipmunkLatest-API-Reference/structcp_space.html#af1bec644a24e12bfc642a942a88520f7
    this.space.collisionSlop = options.collisionSlop || 0.1;

    //These two collision scenarios are separate because we don't
    //want tiles to collide with tiles all the time

    //sprite - sprite collisions
    this.space.addCollisionHandler(
        gf.PhysicsSystem.COLLISION_TYPE.SPRITE,
        gf.PhysicsSystem.COLLISION_TYPE.SPRITE,
        this.onCollisionBegin.bind(this), //begin
        null, //preSolve
        null, //postSolve
        null //separate
    );

    //sprite - tile collisions
    this.space.addCollisionHandler(
        gf.PhysicsSystem.COLLISION_TYPE.SPRITE,
        gf.PhysicsSystem.COLLISION_TYPE.TILE,
        this.onCollisionBegin.bind(this), //begin
        null, //preSolve
        null, //postSolve
        null //separate
    );
};

gf.inherits(gf.PhysicsSystem, Object, {
    _createBody: function(spr) {
        if(spr.mass === Infinity) {
            return this.space.staticBody;
        }

        return this.space.addBody(new cp.Body(
            spr.mass || 1,
            spr.inertia || cp.momentForBox(spr.mass || 1, spr.width, spr.height)
        ));
    },
    _createShape: function(spr, body) {
        var shape,
            hit = spr.hitArea,
            hw = spr.width / 2,
            hh = spr.height / 2;

        //specified shape
        if(hit) {
            if(hit instanceof gf.Rectangle) {
                //cp shape anchors are 0.5,0.5 but a rect is 0,0 so we must convert
                var l = hit.x - hw,
                    r = hit.x + hit.width - hw,
                    t = -(hit.y - hh),
                    b = -(hit.y + hit.height - hh);

                shape = new cp.BoxShape2(body, new cp.BB(l, b, r, t));
            }
            else if(hit instanceof gf.Circle) {
                shape = new cp.CircleShape(body, hit.radius, cp.vzero);
            }
            else if(hit instanceof gf.Polygon) {
                //cp shapes anchors are 0.5,0.5, but a polygon uses 0,0 as the topleft
                //of the bounding rect so we have to convert
                var points = [];

                for(var i = 0; i < hit.points.length; ++i) {
                    var p = hit.points[i];

                    points.push(p.x - hw);
                    points.push(-(p.y - hh));
                }

                shape = new cp.PolyShape(body, points, cp.vzero);
            }
        }

        //default box shape
        if(!shape) {
            shape = new cp.BoxShape(
                body,
                spr.width,
                spr.height
            );
        }

        this.space.addShape(shape);

        shape.width = spr.width;
        shape.height = spr.height;
        shape.setElasticity(0);
        shape.setFriction(spr.friction !== undefined ? spr.friction : 0.1);
        shape.sprite = spr;
        shape.setCollisionType(this.getCollisionType(spr));

        return shape;
    },
    getCollisionType: function(spr) {
        if(spr instanceof gf.Tile) {
            return gf.PhysicsSystem.COLLISION_TYPE.TILE;
        } else {
            return gf.PhysicsSystem.COLLISION_TYPE.SPRITE;
        }
    },
    add: function(spr) {
        if(!spr._phys)
            spr._phys = {};

        //already in system
        if(spr._phys.body)
            return;

        var body = this._createBody(spr),
            shape = this._createShape(spr, body);

        spr._phys.body = body;
        spr._phys.shape = shape;

        //add control body and constraints
        if(body.m !== Infinity) {
            var cbody = new cp.Body(Infinity, Infinity), //control body
                cpivot = this.space.addConstraint(new cp.PivotJoint(cbody, body, cp.vzero, cp.vzero)),
                cgear = this.space.addConstraint(new cp.GearJoint(cbody, body, 0, 1));

            cpivot.maxBias = 0; //disable join correction
            cpivot.maxForce = 10000; //emulate linear friction

            cgear.errorBias = 0; //attempt to fully correct the joint each step
            cgear.maxBias = 1.2; //but limit the angular correction
            cgear.maxForce = 50000; //emulate angular friction

            if(!spr._phys.control)
                spr._phys.control = {};

            spr._phys.control.body = cbody;
            spr._phys.control.pivot = cpivot;
            spr._phys.control.gear = cgear;
        }
    },
    remove: function(spr) {
        if(!spr || !spr._phys || !spr._phys.body || !spr._phys.shape)
            return;

        if(spr._phys.body.space)
            this.space.removeBody(spr._phys.body);

        if(spr._phys.shape.space)
            this.space.removeShape(spr._phys.shape);

        spr._phys.shape.sprite = null;

        //remove references
        spr._phys.body = null;
        spr._phys.shape = null;
    },
    setMass: function(spr, mass) {
        if(spr && spr._phys && spr._phys.body)
            spr._phys.body.setMass(mass);
    },
    setVelocity: function(spr, vel) {
        //update control body velocity (and pivot contraint makes regular follow)
        if(spr && spr._phys && spr._phys.control && spr._phys.control.body)
            spr._phys.control.body.setVel(vel);

        //if no control body then update real body
        else if(spr && spr._phys && spr._phys.body)
            spr._phys.body.setVel(vel);
    },
    setPosition: function(spr, pos) {
        //update body position
        if(spr && spr._phys && spr._phys.body)
            spr._phys.body.setPos(pos);

        //update control body position
        if(spr && spr._phys && spr._phys.control && spr._phys.control.body)
            spr._phys.control.body.setPos(pos);
    },
    setRotation: function(spr, rads) {
        //update control body rotation (and gear contraint makes regular follow)
        if(spr && spr._phys && spr._phys.control && spr._phys.control.body)
            spr._phys.control.body.setAngle(rads);

        //if no control body then update real body
        else if(spr && spr._phys && spr._phys.body)
            spr._phys.body.setAngle(rads);

    },
    update: function(dt) {
        //execute the physics step
        this.space.step(dt);

        //go through each changed shape
        this.space.activeShapes.each(function(shape) {
            //since the anchor for a cp shape is 0.5 0.5, we have to modify the pos a bit
            //to make it match the sprite's anchor point
            var spr = shape.sprite;
            spr.position.x = shape.body.p.x;// + ((spr.anchor.x * shape.width) - (shape.width / 2));
            spr.position.y = shape.body.p.y;// + ((spr.anchor.y * shape.height) - (shape.height / 2));
            spr.rotation = shape.body.a;
        });
    },
    onCollisionBegin: function(arbiter) {//, space) {
        var shapes = arbiter.getShapes(),
            spr1 = shapes[0].sprite,
            spr2 = shapes[1].sprite;

        spr1.onCollision(spr2);
        spr2.onCollision(spr1);

        //maintain the colliding state
        return true;
    }
});

gf.PhysicsSystem.COLLISION_TYPE = {
    SPRITE: 0,
    TILE: 1
};