(function() {
    gf.Sprite = Class.extend.call(PIXI.MovieClip, {
        /**
         * The base Sprite class. This class is the base for all images on the screen
         *
         * @class Sprite
         * @extends PIXI.MovieClip
         * @constructor
         * @param pos {Array|gf.Vector|gf.Point} The starting position of the sprite
         * @param settings {Object} Settings to override the defauls, acceptable values
         *          are size {gf.Vector}, name {String}, animations {Object}
         * @example
         *      var spr = new gf.Sprite([10, 1], { name: 'MySprite' });
         */
        init: function(pos, settings) {
            /**
             * The size of the sprite
             *
             * @property size
             * @type gf.Vector
             * @default new gf.Vector(0, 0);
             */
            this.size = new gf.Vector(0, 0);

            /**
             * The name of this sprite
             *
             * @property name
             * @type String
             * @default ''
             */
            this.name = '';

            //defined sprite animations
            this.anim = {};

            //currently active animation
            this.currentAnim = null;

            //call base class
            PIXI.MovieClip.call(this);

            //mixin user's settings
            gf.utils.setValues(this, settings);

            //set the initial position
            this.setPosition(pos);

            //add the animations passed to ctor
            if(settings.animations) {
                for(var name in settings.animations) {
                    this.addAnimation(name, settings.animations[name]);
                }
            }
        },
        /**
         * Defines a new animation on the Sprite
         *
         * @method addAnimation
         * @param name {String} The name of the animation, any string you want to name it
         * @param frames {gf.Texture|Array} The frames of the animation, you can pass one gf.Texture
         *      as a frame, or an Array of gf.Texture's
         * @return {gf.Sprite} Returns itself for chainability
         * @example
         *      spr.addAnimation('walk-left', new gf.Texture())
         *          .addAnimation('walk-right', [new gf.Texture(), new gf.Texture()]);
         */
        addAnimation: function(name, frames) {
            settings = settings || {};

            if(settings instanceof Array)
                settings = { textures: settings };

            if(frames instanceof gf.Texture)
                frames = [settings];

            if(!settings.textures)
                throw 'No textures passed to addAnimation()';

            this.anim[name] = {
                name: name,
                textures: frames
            };

            return this;
        },
        /**
         * Sets the active animation of the sprite, and starts the animation at index 0 
         *
         * @method setActiveAnimation
         * @param name {String} The name of the animation to play (defined with addAnimation());
         * @param cb {Function} Callback when the animation completes, NOT YET IMPLEMENTED
         * @return {gf.Sprite} Returns itself for chainability
         * @example
         *      spr.addAnimation('me', new gf.Texture())
         *          .setActiveAnimation('me');
         */
        setActiveAnimation: function(name, cb) {
            if(this.anim[name]) {
                this.currentAnim = name;
                this.textures = this.anim[name].textures;
                //TODO: Callback
                this.gotoAndPlay(0);
            } else {
                throw 'Unknown animation ' + name;
            }

            return this;
        },
        /**
         * Convenience method for setting the position of the Sprite.
         *
         * @method setPosition
         * @param x {int|Array|gf.Vector|gf.Point} X coord to put the sprite at.
         *       If an Array, gf.Vector, or gf.Point is passed then the y parameter is ignored
         * @param y {int} Y coord to put the sprite at
         * @return {gf.Sprite} Returns itself for chainability
         * @example
         *      spr.setPosition(1, 1)
         *          .setPosition([5, 5])
         *          .setPosition(new gf.Point(10, 10))
         *          .setPosition(new gf.Vector(20, 20));
         */
        setPosition: function(x, y) {
            if(x instanceof gf.Vector || x instanceof gf.Point) {
                this.position.x = x.x;
                this.position.y = x.y;
            }
            else if(x instanceof Array) {
                this.position.x = x[0];
                this.position.y = x[1];
            } else {
                this.position.x = x;
                this.position.y = y;
            }

            return this;
        },
        /**
         * Checks if the name is the active animation
         *
         * @method isActiveAnimation
         * @param name {String} The name of the animation to check if it is currently active
         * @return {bool} true if the animation is active, false otherwise.
         * @example
         *      spr.addAnimation('walk-left', new gf.Texture())
         *          .isActiveAnimation('walk-left'); //false
         *
         *      spr.setActiveAnimation('walk-left')
         *          .isActiveAnimation('walk-left'); //true
         */
        isActiveAnimation: function(name) {
            return this.currentAnim === name;
        },
        /**
         * Frame update stub
         *
         * @method update
         * @private
         */
        update: function() {
            return this;
        }
    });
})();