/**
 * Generic animation class with support for dropped frames both optional easing and duration.

 * Optional duration is useful when the lifetime is defined by another condition than time
 * e.g. speed of an animating object, etc.

 * Dropped frame logic allows to keep using the same updater logic independent from the actual
 * rendering. This eases a lot of cases where it might be pretty complex to break down a state
 * based on the pure time difference.
*/


(function() {
  var Animation, Easing, Pixel;

  Animation = (function() {
    var counter, desiredFrames, millisecondsPerSecond, running, time;

    function Animation() {}

    time = Date.now || function() {
      return +new Date();
    };

    desiredFrames = 60;

    millisecondsPerSecond = 1000;

    running = {};

    counter = 1;

    (function(w) {
      var TARGET_FPS, aAnimQueue, cancelAnimationFrame, iIntervalId, iRequestId, processing, requestAnimationFrame;
      requestAnimationFrame = w.requestAnimationFrame || w.mozRequestAnimationFrame || w.webkitRequestAnimationFrame || w.msRequestAnimationFrame;
      cancelAnimationFrame = w.cancelAnimationFrame || w.mozCancelAnimationFrame || w.webkitCancelAnimationFrame || w.msCancelAnimationFrame;
      if (!requestAnimationFrame || !cancelAnimationFrame) {
        TARGET_FPS = 60;
        aAnimQueue = [];
        processing = [];
        iRequestId = 0;
        iIntervalId = null;
        w.requestAnimationFrame = function(callback) {
          aAnimQueue.push([++iRequestId, callback]);
          if (!iIntervalId) {
            iIntervalId = setInterval(function() {
              var iTime, temp, _results;
              if (aAnimQueue.length) {
                iTime = time();
                temp = processing;
                processing = aAnimQueue;
                aAnimQueue = temp;
                _results = [];
                while (processing.length) {
                  _results.push(processing.shift()[1](iTime));
                }
                return _results;
              } else {
                clearInterval(iIntervalId);
                return iIntervalId = void 0;
              }
            }, 1000 / TARGET_FPS);
          }
          return iRequestId;
        };
        return w.cancelAnimationFrame = function(requestId) {
          var i, _i, _j, _ref, _ref1;
          for (i = _i = 0, _ref = aAnimQueue.length; 0 <= _ref ? _i < _ref : _i > _ref; i = 0 <= _ref ? ++_i : --_i) {
            if (aAnimQueue[i][0] === requestId) {
              aAnimQueue.splice(i, 1);
              return;
            }
          }
          for (i = _j = 0, _ref1 = processing.length; 0 <= _ref1 ? _j < _ref1 : _j > _ref1; i = 0 <= _ref1 ? ++_j : --_j) {
            if (processing[i][0] === requestId) {
              processing.splice(i, 1);
              return;
            }
          }
        };
      }
    })(window);

    /**
     * Stops the given animation.
     * @param id {Integer} Unique animation ID
     * @return {Boolean} Whether the animation was stopped (aka, was running before)
    */


    Animation.stop = function(id) {
      var cleared;
      cleared = running[id] != null;
      if (cleared) {
        running[id] = null;
      }
      return cleared;
    };

    /**
     * Whether the given animation is still running.
     * @param id {Integer} Unique animation ID
     * @return {Boolean} Whether the animation is still running
    */


    Animation.isRunning = function(id) {
      return running[id] != null;
    };

    /**
     * Start the animation.
     * @param stepCallback {Function} Pointer to function which is executed on every step.
     * Signature of the method should be `function(percent, now, virtual) { return continueWithAnimation; }`
     * @param verifyCallback {Function} Executed before every animation step.
     * Signature of the method should be `function() { return continueWithAnimation; }`
     * @param completedCallback {Function} Signature of the method should be `function(renderedFrames, animateId, finishedAnimation) {}`
     * @param duration {Integer} Milliseconds to run the animation
     * @param easingMethod {Function} Pointer to easing function Signature of the method should be `function(percent) { return modifiedValue; }`
     * @return {Integer} Identifier of animation. Can be used to stop it any time.
    */


    Animation.start = function(stepCallback, verifyCallback, completedCallback, duration, easingMethod) {
      var dropCounter, id, lastFrame, newRunning, percent, start, step, usedId;
      start = time();
      lastFrame = start;
      percent = 0;
      dropCounter = 0;
      id = counter++;
      if (id % 20 === 0) {
        newRunning = {};
        for (usedId in running) {
          if (running[usedId] === true) {
            newRunning[usedId] = true;
          }
        }
        running = newRunning;
      }
      step = function(virtual) {
        var droppedFrames, j, now, render, value, _i, _ref;
        render = virtual !== true;
        now = time();
        if (!running[id] || (verifyCallback && !verifyCallback(id))) {
          running[id] = null;
          completedCallback && completedCallback(desiredFrames - (dropCounter / ((now - start) / millisecondsPerSecond)), id, false);
          return;
        }
        if (render) {
          droppedFrames = Math.round((now - lastFrame) / (millisecondsPerSecond / desiredFrames)) - 1;
          for (j = _i = 0, _ref = Math.min(droppedFrames, 4); 0 <= _ref ? _i < _ref : _i > _ref; j = 0 <= _ref ? ++_i : --_i) {
            step(true);
            dropCounter++;
          }
        }
        if (duration) {
          percent = (now - start) / duration;
          if (percent > 1) {
            percent = 1;
          }
        }
        value = easingMethod ? easingMethod(percent) : percent;
        if ((stepCallback(value, now, render) === false || percent === 1) && render) {
          running[id] = null;
          return completedCallback && completedCallback(desiredFrames - dropCounter / ((now - start) / millisecondsPerSecond), id, percent === 1 || duration === null);
        } else if (render) {
          lastFrame = now;
          return window.requestAnimationFrame(step);
        }
      };
      running[id] = true;
      window.requestAnimationFrame(step);
      return id;
    };

    return Animation;

  })();

  window.Animation = Animation;

  Pixel = (function() {
    Pixel.RADIUS = 5;

    Pixel.DURATION = 500;

    function Pixel(option) {
      this.setPosition(option.x, option.y);
      this.setRadius(option.R);
      this.setColor(option.r, option.g, option.b);
      this.setLife(option.delay, option.duration);
      this.setEaseingMethod(option.easeing);
    }

    Pixel.prototype.setPosition = function(x, y) {
      this.x = x || 0;
      this.y = y || 0;
      return this;
    };

    Pixel.prototype.setRadius = function(toR) {
      this.fromR = 0;
      this.toR = toR || Pixel.RADIUS;
      this.R = this.fromR;
      return this;
    };

    Pixel.prototype.setColor = function(r, g, b) {
      this.r = Math.floor(r || Math.random() * 255);
      this.g = Math.floor(g || Math.random() * 255);
      this.b = Math.floor(b || Math.random() * 255);
      return this;
    };

    Pixel.prototype.setLife = function(delay, duration) {
      this.start = +new Date() + (delay || 0);
      this.duration = duration || Pixel.DURATION;
      return this;
    };

    Pixel.prototype.setEaseingMethod = function(easingMethod) {
      var mode, section, _ref, _ref1;
      if (!easingMethod) {
        this.easingMethod = function(x) {
          return x;
        };
        return;
      }
      _ref = easingMethod.split('.'), section = _ref[0], mode = _ref[1];
      this.easingMethod = ((_ref1 = Easing[section]) != null ? _ref1[mode] : void 0) || function(x) {
        return x;
      };
      return this;
    };

    Pixel.prototype.update = function() {
      var now, spend;
      now = +new Date();
      spend = now - this.start;
      if (spend <= this.duration) {
        this.R = this.fromR + (this.toR - this.fromR) * this.easingMethod(spend / this.duration);
      } else if ((this.duration <= spend && spend <= 2 * this.duration)) {
        this.R = this.fromR + (this.toR - this.fromR) * this.easingMethod((2 * this.duration - spend) / this.duration);
      } else if (spend > 2 * this.duration) {
        return null;
      } else {
        console.log('notmatch');
      }
      return {
        x: this.x,
        y: this.y,
        r: this.r,
        g: this.g,
        b: this.b,
        R: this.R
      };
    };

    return Pixel;

  })();

  Easing = (function() {
    function Easing() {}

    Easing.Quadratic = {
      In: function(k) {
        return k * k;
      },
      Out: function(k) {
        return k * (2 - k);
      },
      InOut: function(k) {
        if ((k *= 2) < 1) {
          return 0.5 * k * k;
        } else {
          return -0.5 * (--k * (k - 2) - 1);
        }
      }
    };

    Easing.Cubic = {
      In: function(k) {
        return k * k * k;
      },
      Out: function(k) {
        return --k * k * k + 1;
      },
      InOut: function(k) {
        if ((k *= 2) < 1) {
          return 0.5 * k * k * k;
        } else {
          return 0.5 * ((k -= 2) * k * k + 2);
        }
      }
    };

    Easing.Quartic = {
      In: function(k) {
        return k * k * k * k;
      },
      Out: function(k) {
        return 1 - (--k * k * k * k);
      },
      InOut: function(k) {
        if ((k *= 2) < 1) {
          return 0.5 * k * k * k * k;
        } else {
          return -0.5 * ((k -= 2) * k * k * k - 2);
        }
      }
    };

    Easing.Bounce = {
      In: function(k) {
        return 1 - Easing.Bounce.Out(1 - k);
      },
      Out: function(k) {
        if (k < (1 / 2.75)) {
          return 7.5625 * k * k;
        } else if (k < (2 / 2.75)) {
          return 7.5625 * (k -= 1.5 / 2.75) * k + 0.75;
        } else if (k < (2.5 / 2.75)) {
          return 7.5625 * (k -= 2.25 / 2.75) * k + 0.9375;
        } else {
          return 7.5625 * (k -= 2.625 / 2.75) * k + 0.984375;
        }
      },
      InOut: function(k) {
        if (k < 0.5) {
          return Easing.Bounce.In(k * 2) * 0.5;
        } else {
          return Easing.Bounce.Out(k * 2 - 1) * 0.5 + 0.5;
        }
      }
    };

    return Easing;

  })();

  window.Pixel = Pixel;

}).call(this);
