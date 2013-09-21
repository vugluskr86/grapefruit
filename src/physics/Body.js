// Based heavily off of PhotonStorm's Phaser Arcade Physics, and ChipmunkJS (mostly the former)
// Phaser: https://github.com/photonstorm/phaser 
// ChipmunkJS: https://github.com/josephg/Chipmunk-js

var Rectangle = require('../math/Rectangle'),
    Vector = require('../math/Vector'),
    math = require('../math/math'),
    inherit = require('../utils/inherit'),
    C = require('../constants');

var Body = module.exports = function(sprite) {
    Rectangle.call(this, sprite.position.x, sprite.position.y, sprite.width, sprite.height);

    this.sprite = sprite;
    this.size = sprite.currentFrame;

    this.type = C.PHYSICS_TYPE.DYNAMIC;
    this.solveType = C.SOLVE_TYPE.DISPLACE;

    this.velocity = new Vector();
    this.accel = new Vector();
    this.drag = new Vector();
    this.gravity = new Vector();
    this.bounce = new Vector();
    this.offset = new Vector();
    this.maxVelocity = new Vector(10000, 10000);

    this.angularVelocity = 0;
    this.angularAccel = 0;
    this.angularDrag = 0;
    this.maxAngular = 1000;

    this.mass = 1;
    this.rotation = 0;
    this.allowRotation = true;

    //touching/canCollide directional flags
    this.allowCollide = C.DIRECTION.ALL;
    this.touching = C.DIRECTION.NONE;
    this.wasTouching = C.DIRECTION.NONE;

    this.overlap = new Vector();

    this.lastPos = new Vector();

    //some temp vars to prevent having to create a bunch each update
    this._accel = 0;
    this._drag = 0;
    this._vDelta = 0;
    this._accel = 0;
    this._accel = 0;
};

inherit(Body, Rectangle, {
    computeVelocity: function(dt, vel, accel, drag, maxVel) {
        this._accel = accel * dt;
        this._drag = drag * dt;

        //apply acceleration if there is any
        if(this._accel) {
            vel += this._accel;
        }
        //if no acceleration, then apply drag
        else if(this._drag) {
            if(vel - this._drag > 0)
                vel -= this._drag;
            else if(vel + this._drag < 0)
                vel += this._drag;
            else
                vel = 0;
        }

        //if there is velocity, clamp it
        if(vel)
            math.clamp(vel, -maxVel, maxVel);

        return vel;
    },
    updateMotion: function(dt) {
        //apply gravity
        if(this.type === C.PHYSICS_TYPE.DYNAMIC) {
            this.velocity.x += this.gravity.x * dt;
            this.velocity.y += this.gravity.y * dt;
        }

        // compute angular velocity
        this._vDelta = (this.computeVelocity(dt, this.angularVelocity, this.angularAccel, this.angularDrag, this.maxAngular) - this.angularVelocity) / 2;
        this.angularVelocity += this._vDelta;
        this.rotation += this.angularVelocity * dt;

        // compute X velocity
        this._vDelta = (this.computeVelocity(dt, this.velocity.x, this.accel.x, this.drag.x, this.maxVelocity.x) - this.velocity.x) / 2;
        this.velocity.x += this._vDelta;
        this.x += this.velocity.x * dt;

        // compute Y velocity
        this._vDelta = (this.computeVelocity(dt, this.velocity.y, this.accel.y, this.drag.y, this.maxVelocity.y) - this.velocity.y) / 2;
        this.velocity.y += this._vDelta;
        this.y += this.velocity.y * dt;
    },
    update: function(dt) {
        this.wasTouching = this.touching;
        this.touching = C.DIRECTION.NONE;

        this.lastPos.set(this.x, this.y);

        this.x = (this.sprite.position.x - (this.sprite.anchor.x * this._width)) + this.offset.x;
        this.y = (this.sprite.position.y - (this.sprite.anchor.y * this._height)) + this.offset.y;

        this.rotation = this.sprite.angle;

        if(this.type !== C.PHYSICS_TYPE.STATIC)
            this.updateMotion(dt);

        //update sprite position/rotation
        this.syncSprite();
    },
    syncSprite: function() {
        this.sprite.position.x = this.x - this.offset.x + (this.sprite.anchor.x * this._width);
        this.sprite.position.y = this.y - this.offset.y + (this.sprite.anchor.y * this._height);

        if(this.allowRotation) {
            this.sprite.angle = this.rotation;
        }
    },
    deltaX: function() {
        return this.x - this.lastPos.x;
    },
    deltaY: function() {
        return this.y - this.lastPos.y;
    }
});
