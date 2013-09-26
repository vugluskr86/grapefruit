var Particle = require('./Particle'),
    ObjectPool = require('../utils/ObjectPool'),
    Container = require('../display/Container'),
    math = require('../math/math'),
    inherit = require('../inherit'),
    C = require('../constants');

var ParticleEmitter = module.exports = function(game, name) {
    Container.call(this);

    this.maxParticles = C.PARTICLES.MAX_EMITTER_PARTICLES;

    this.game = game;

    this.name = name;

    //particles are emitted in a random integer location within these values
    this.width = 0;
    this.height = 0;

    //options set on the particle when created
    this.lifespan = Infinity;
    this.minSpeed = new Vector(-100, -100);
    this.maxSpeed = new Vector(100, 100);
    this.minScale = 1;
    this.maxScale = 1;
    this.minRotation = -2 * Math.PI;
    this.maxRotation = 2 * Math.PI;
    this.gravity = new Vector(0, 5);
    this.drag = new Vector();
    this.angularDrag = 0;
    this.bounce = new Vector();

    //the spread of the emitted particles
    this.spread = Math.PI / 32;

    //time in ms between emissions (if explode = false)
    this.delay = 100;

    //should we be actively emitting particles?
    this.active = false;

    //the pool to create particles from
    this.particles = new ObjectPool(Particle, this);

    //some internal trackers
    this._rate = 0; //the number of particles to emit each emission cycle
    this._total = 0; //total particles to emit

    this._emitted = 0; //total particles emitted
    this._timer = 0; //tracker for time to know when to emit particles

    //params for particle ctor
    this._anims = null;
    this._speed = null;
    this._startAnim = null;
};

inherit(ParticleEmitter, Container, {
    /**
     * Starts the particle emission, must call `setup` first to setup
     * what kind of particle to emit.
     *
     * @method start
     * @param [lifespan=Infinity] {Number} The lifespan of a particle in ms
     * @param [delay=250] {Number} The time between each particle emission in ms
     * @param [rate=1] {Number} The number of particles to emit each emission
     * @param [total=gf.PARTICLES.MAX_EMITTER_PARTICLES] {Number} The total number of particles to emit
     */
    start: function(lifespan, delay, rate, total) {
        this.active = true;

        this.lifespan = lifespan || Infinity;
        this.delay = delay || 250;
        this._rate = rate || 1;
        this._total = total || C.PARTICLES.MAX_EMITTER_PARTICLES;

        this._timer = 0;
    },
    stop: function() {
        this.active = false;
    },
    /**
     * Sets up the particles to be emitted
     *
     * @method setup
     * @param sprite {Sprite|Array<Texture>|Texture} Pass a sprite to be clones as a particle,
     *      or an array of textures to be randomly chosen from for different particles,
     *      or a single texture to use for each particle.
     * @param [collide=gf.DIRECTION.ALL] {Number} The directions the particles are allowed to collide in, use gf.DIRECTION bit flags
     */
    setup: function(sprite, collide) {
        if(typeof anims === 'string') {
            anims = this.game.cache.getTexture(anims);
        }

        
    },
    emitParticle: function() {
        var part = this.particles.create(this._anims, this._speed, this._startAnim);

        if(!part)
            return;

        //set visible true
        part.visible = true;

        //set optionally random position
        part.position.x = math.randomInt(this.position.x, this.position.x + this.width);
        part.position.y = math.randomInt(this.position.y, this.position.y + this.height);

        //set lifespan
        part.lifespan = this.lifespan;

        //sync physics body
        part.body.x = part.position.x;
        part.body.y = part.position.y;
        part.body.lastPos.copy(part.position);

        part.body.bounce.copy(this.bounce);
        part.body.gravity.copy(this.gravity);

        part.body.velocity.set(
            math.randomInt(this.minSpeed.x, this.maxSpeed.x),
            math.randomInt(this.minSpeed.y, this.maxSpeed.y)
        );
        part.body.angularVelocity = math.randomInt(this.minRotation, this.maxRotation);

        var scale = math.randomReal(this.minScale, this.maxScale);
        part.body.scale.set(scale, scale);

        part.body.drag.copy(this.drag);
        part.body.angularDrag = this.angularDrag;
    },
    update: function(dt) {
        if(!this.active)
            return;

        //increment time we have waited
        this._timer += dt * 1000;

        //if we waited more than delay, emit some particles
        if(this._timer >= this._delay) {
            this._timer -= this._delay;

            for(var i = 0; i < this._rate; ++i) {
                this.emitParticle();
            }
        }
    }
});