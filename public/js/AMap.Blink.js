(function($) {
    var MIN_RADIUS = 0,
        MAX_RADIUS = 15,
        MAX_DURATION = 1500,
        MIN_SCORE = 0,
        MAX_SCORE = 8000;

    $.Blink = (function(){
        var Blink = function(config){
            if(config.source){
                this.setSource(config.source);
            }
            if(config.map){
                this.setMap(config.map);
            }
            this._points = [];
        };

        Blink.prototype.setSource = function(source){
            if (source) {
                this._source = source;
            }
        };
        Blink.prototype.setMap = function(mapObj){
            if (mapObj && mapObj instanceof $.Map) {
                this._mapObj = mapObj;
            }else{
                throw new Error('map error');
            }
            this._level = this._mapObj.getZoom();
            if (this._level >= 8) {
                this._type = 'heatmap';
            }else{
                this._type = 'highlight';
            }
            this._canvasObj = new $.Canvas();
            $.event.addListener(this._canvasObj, 'draw', this._onDraw, this);
            this._canvasObj.setMap(this._mapObj);
        };
        Blink.prototype._onDraw = function(data){
            var self = this;
            if (this._canvas) {
                return;
            }
            this._canvas = data.node;

            this._heatmap = Heatmap.create({
                canvas: this._canvas
                // ,radius: 60
            });

            if (!this._source) {
                throw new Error('source not defined!');
            }
            this._socket = io.connect(this._source);
            this._socket.on('init', function(data){
                self._onSocketInit(data, self);
            });
            this._socket.on('update', function(data){
                self._onSocketUpdate(data, self);
            });
            $.event.addListener(this._mapObj, 'dragging', this._onDragging, this);
            $.event.addListener(this._mapObj, 'zoomend', this._onZoomend, this);
            this._drawCanvas();
        };

        Blink.prototype._onSocketInit = function(data, self){
            if (!self._mapObj) {
                throw new Error('mapObj not defined!');
            }
            var i, dot;
            for(i = 0; i < data.dots.length; i++){
                dot = data.dots[i];
                self._points.push(new Pixel(self._mapObj, {
                        lng: dot[0],
                        lat: dot[1],
                        score: dot[2]
                    }
                ));
            }
        };

        Blink.prototype._onSocketUpdate = function(data, self){
            var i, dot;
            for(i = 0; i< data.update.length; i++){
                dot = data.update[i];
                self._points[i].addLife(dot);
            }
        };

        Blink.prototype._onDragging = function(){
            var i, dot;
            for(i = 0; i < this._points.length; i++){
                dot = this._points[i];
                dot.updatePos(this._mapObj);
            }
        };

        Blink.prototype._onZoomend = function(){
            var i, dot;
            for(i = 0; i < this._points.length; i++){
                dot = this._points[i];
                dot.updatePos(this._mapObj);
            }
            this._level = this._mapObj.getZoom();
            if (this._level >= 8) {
                this._type = 'heatmap';
            }else{
                this._type = 'highlight';
            }
        };

        Blink.prototype._drawCanvas = function(){
            var img = new Image();
            var self = this;
            img.onload = function(){
                img.onload = null;
                self._img = img;
                Animation.start(_step, _verify, _complete);
            };
            img.src = 'http://localhost:3000/img/particle.png';

            var _step = function(){
                var ctx = self._canvas.getContext('2d');
                ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
                ctx.fillStyle = 'rgba(0,0,0,0.5)';
                ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
                var pixels = [];
                var i, dot, tmp;
                for(i = 0; i< self._points.length; i++){
                    dot = self._points[i];
                    tmp = dot.update();
                    if (tmp && tmp.x >= 0 && tmp.x <= self._canvas.width && tmp.y >= 0 && tmp.y <= self._canvas.height) {
                        pixels.push(tmp);
                    }
                }
                var x, y, R, C, pixel, counts = [], max = 0, heatmapData;
                for(i = 0; i< pixels.length; i++){
                    pixel = pixels[i];
                    x = pixel.x;
                    y = pixel.y;
                    R = pixel.R;
                    C = pixel.C;
                    if (self._type == 'highlight') {
                        ctx.drawImage(self._img, x - R, y - R, 2 * R, 2 * R);
                    }else if(self._type =='heatmap'){
                        if (x >= 0 && x <= self._canvas.width && y >= 0 && y <= self._canvas.height) {
                            max = max > C ? max : C;
                            counts.push({
                                x: x,
                                y: y,
                                count: C
                            });
                        }
                    }
                }
                if (self._type == 'heatmap') {
                    heatmapData = {
                        max: max,
                        data: counts
                    };
                    self._heatmap.store.setDataSet(heatmapData);
                }
            };

            var _verify = function(){
                return true;
            };

            var _complete = function(){
                console.log('complete');
            };
        };

        return Blink;
    })();

    // Animation shim
    var Animation = (function() {
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
                                iIntervalId = undefined;
                                return iIntervalId;
                            }
                        }, 1000 / TARGET_FPS);
                    }
                    return iRequestId;
                };
                w.cancelAnimationFrame = function(requestId) {
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
            cleared = running[id] !== null && running[id] !== undefined;
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
            return running[id] !== null && running[id] !== undefined;
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
                    if (completedCallback) {
                        completedCallback(desiredFrames - (dropCounter / ((now - start) / millisecondsPerSecond)), id, false);
                    }
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

    // Class Pixel
    var Pixel = (function() {
        var Pixel = function(mapObj, opts) {
            this._lnglat = new AMap.LngLat(opts.lng, opts.lat);
            this._pos = mapObj.lnglatTocontainer(this._lnglat);
            this._score = Math.max(MIN_SCORE, Math.min(opts.score, MAX_SCORE));
            this._minR = MIN_RADIUS;
            this._maxR = this._score / MAX_SCORE * MAX_RADIUS;
            this._curR = this._minR;
            this._count = this._curR / MAX_RADIUS * MAX_SCORE;
            this._duration = this._score / MAX_SCORE * MAX_DURATION;
            this._start = +new Date() + Math.random() * MAX_DURATION * 2;
        };

        /**
         * 一个生命周期完毕后重新初始化下一个生命周期
         * @return {bool} 是否正确初始化完毕
         */
        Pixel.prototype.reInit = function() {
            if (!this._next || this._next.length <= 0) {
                return false;
            } else {
                var newScore = this._score + this._next.pop();
                this._score = Math.max(MIN_SCORE, Math.min(newScore, MAX_SCORE));
                this._maxR = this._score / MAX_SCORE * MAX_RADIUS;
                this._curR = this._minR;
                this._count = this._curR / MAX_RADIUS * MAX_SCORE;
                this._duration = this._score / MAX_SCORE * MAX_DURATION;
                this._start = +new Date() + Math.random() * MAX_DURATION * 2;
                return true;
            }
        };

        /**
         * 添加新的权重值
         * @param {number} newScore 新的权重值
         */
        Pixel.prototype.addLife = function(newScore) {
            if (!this._next) {
                this._next = [newScore];
            } else {
                this._next.push(newScore);
            }
        };

        /**
         * 在每帧刷新时返回此点的位置, 半径 方便canvas绘制
         * @return {Point | bool} 点的位置或者是否生命周期已经完毕
         */
        Pixel.prototype.update = function() {
            if (this._complete) {
                this.reInit();
                this._complete = false;
            }
            var now = +new Date();
            var spend = now - this._start;

            if (spend < 0) {
                // hasn't start blink
                return false;
            }

            if (spend <= this._duration) {
                this._curR = this._minR + (this._maxR - this._minR) * (spend / this._duration);
                this._count = this._curR / MAX_RADIUS * MAX_SCORE;
            } else if (this._duration <= spend && spend <= this._duration * 2) {
                // is disappearing
                this._curR = this._minR + (this._maxR - this._minR) * (2 * this._duration - spend) / this._duration;
                this._count = this._curR / MAX_RADIUS * MAX_SCORE;
            } else {
                this._complete = true;
                return false;
            }

            return {
                x: this._pos.x,
                y: this._pos.y,
                R: this._curR,
                C: this._count
            };
        };

        /**
         * 地图状态改变时,重新计算此点在container中的坐标
         * @param  {AMap.Map} mapObj mapObj
         * @return {None}
         */
        Pixel.prototype.updatePos = function(mapObj) {
            this._pos = mapObj.lnglatTocontainer(this._lnglat);
        };

        return Pixel;
    })();

    // Heatmap
    var Heatmap = (function() {

        // store object constructor
        // a heatmap contains a store
        // the store has to know about the heatmap in order to trigger heatmap updates when datapoints get added
        var store = function store(hmap) {

            var _ = {
                // data is a two dimensional array
                // a datapoint gets saved as data[point-x-value][point-y-value]
                // the value at [point-x-value][point-y-value] is the occurrence of the datapoint
                data: [],
                // tight coupling of the heatmap object
                heatmap: hmap
            };
            // the max occurrence - the heatmaps radial gradient alpha transition is based on it
            this.max = 1;

            this.get = function(key) {
                return _[key];
            };
            this.set = function(key, value) {
                _[key] = value;
            };
        };

        store.prototype = {
            setDataSet: function(obj, internal) {
                var me = this,
                    heatmap = me.get("heatmap"),
                    data = [],
                    d = obj.data,
                    dlen = d.length;
                // clear the heatmap before the data set gets drawn
                heatmap.clear();
                this.max = obj.max;
                // if a legend is set, update it
                heatmap.get("legend") && heatmap.get("legend").update(obj.max);

                if (internal !== null && internal !== undefined && internal) { // internal api
                    for (var one in d) {
                        // jump over undefined indexes
                        if (one === undefined)
                            continue;
                        for (var two in d[one]) {
                            if (two === undefined)
                                continue;
                            // if both indexes are defined, push the values into the array
                            heatmap.drawAlpha(one, two, d[one][two], false);
                        }
                    }
                } else {
                    while (dlen--) {
                        var point = d[dlen];
                        heatmap.drawAlpha(point.x, point.y, point.count, false);
                        if (!data[point.x])
                            data[point.x] = [];

                        if (!data[point.x][point.y])
                            data[point.x][point.y] = 0;

                        data[point.x][point.y] = point.count;
                    }
                }
                heatmap.colorize();
                this.set("data", d);
            },
            generateRandomDataSet: function(points) {
                var heatmap = this.get("heatmap"),
                    w = heatmap.get("width"),
                    h = heatmap.get("height");
                var randomset = {},
                    max = Math.floor(Math.random() * 1000 + 1);
                randomset.max = max;
                var data = [];
                while (points--) {
                    data.push({
                        x: Math.floor(Math.random() * w + 1),
                        y: Math.floor(Math.random() * h + 1),
                        count: Math.floor(Math.random() * max + 1)
                    });
                }
                randomset.data = data;
                this.setDataSet(randomset);
            }
        };

        var legend = function legend(config) {
            this.config = config;

            var _ = {
                element: null,
                labelsEl: null,
                gradientCfg: null,
                ctx: null
            };
            this.get = function(key) {
                return _[key];
            };
            this.set = function(key, value) {
                _[key] = value;
            };
            this.init();
        };
        legend.prototype = {
            init: function() {
                var me = this,
                    config = me.config,
                    title = config.title || "Legend",
                    position = config.position,
                    offset = config.offset || 10,
                    gconfig = config.gradient,
                    labelsEl = document.createElement("ul"),
                    labelsHtml = "",
                    grad, element, gradient, positionCss = "";

                me.processGradientObject();

                // Positioning

                // top or bottom
                if (position.indexOf('t') > -1) {
                    positionCss += 'top:' + offset + 'px;';
                } else {
                    positionCss += 'bottom:' + offset + 'px;';
                }

                // left or right
                if (position.indexOf('l') > -1) {
                    positionCss += 'left:' + offset + 'px;';
                } else {
                    positionCss += 'right:' + offset + 'px;';
                }

                element = document.createElement("div");
                element.style.cssText = "border-radius:5px;position:absolute;" + positionCss + "font-family:Helvetica; width:256px;z-index:10000000000; background:rgba(255,255,255,1);padding:10px;border:1px solid black;margin:0;";
                element.innerHTML = "<h3 style='padding:0;margin:0;text-align:center;font-size:16px;'>" + title + "</h3>";
                // create gradient in canvas
                labelsEl.style.cssText = "position:relative;font-size:12px;display:block;list-style:none;list-style-type:none;margin:0;height:15px;";


                // create gradient element
                gradient = document.createElement("div");
                gradient.style.cssText = ["position:relative;display:block;width:256px;height:15px;border-bottom:1px solid black; background-image:url(", me.createGradientImage(), ");"].join("");

                element.appendChild(labelsEl);
                element.appendChild(gradient);

                me.set("element", element);
                me.set("labelsEl", labelsEl);

                me.update(1);
            },
            processGradientObject: function() {
                // create array and sort it
                var me = this,
                    gradientConfig = this.config.gradient,
                    gradientArr = [];

                for (var key in gradientConfig) {
                    if (gradientConfig.hasOwnProperty(key)) {
                        gradientArr.push({
                            stop: key,
                            value: gradientConfig[key]
                        });
                    }
                }
                gradientArr.sort(function(a, b) {
                    return (a.stop - b.stop);
                });
                gradientArr.unshift({
                    stop: 0,
                    value: 'rgba(0,0,0,0)'
                });

                me.set("gradientArr", gradientArr);
            },
            createGradientImage: function() {
                var me = this,
                    gradArr = me.get("gradientArr"),
                    length = gradArr.length,
                    canvas = document.createElement("canvas"),
                    ctx = canvas.getContext("2d"),
                    grad;
                // the gradient in the legend including the ticks will be 256x15px
                canvas.width = "256";
                canvas.height = "15";

                grad = ctx.createLinearGradient(0, 5, 256, 10);

                for (var i = 0; i < length; i++) {
                    grad.addColorStop(1 / (length - 1) * i, gradArr[i].value);
                }

                ctx.fillStyle = grad;
                ctx.fillRect(0, 5, 256, 10);
                ctx.strokeStyle = "black";
                ctx.beginPath();

                for (i = 0; i < length; i++) {
                    ctx.moveTo(((1 / (length - 1) * i * 256) >> 0) + 0.5, 0);
                    ctx.lineTo(((1 / (length - 1) * i * 256) >> 0) + 0.5, (i === 0) ? 15 : 5);
                }
                ctx.moveTo(255.5, 0);
                ctx.lineTo(255.5, 15);
                ctx.moveTo(255.5, 4.5);
                ctx.lineTo(0, 4.5);

                ctx.stroke();

                // we re-use the context for measuring the legends label widths
                me.set("ctx", ctx);

                return canvas.toDataURL();
            },
            getElement: function() {
                return this.get("element");
            },
            update: function(max) {
                var me = this,
                    gradient = me.get("gradientArr"),
                    ctx = me.get("ctx"),
                    labels = me.get("labelsEl"),
                    labelText, labelsHtml = "",
                    offset;

                for (var i = 0; i < gradient.length; i++) {

                    labelText = max * gradient[i].stop >> 0;
                    offset = (ctx.measureText(labelText).width / 2) >> 0;

                    if (i === 0) {
                        offset = 0;
                    }
                    if (i == gradient.length - 1) {
                        offset *= 2;
                    }
                    labelsHtml += '<li style="position:absolute;left:' + (((((1 / (gradient.length - 1) * i * 256) || 0)) >> 0) - offset + 0.5) + 'px">' + labelText + '</li>';
                }
                labels.innerHTML = labelsHtml;
            }
        };

        // heatmap object constructor
        var heatmap = function heatmap(config) {
            // private variables
            var _ = {
                radius: 40,
                element: {},
                canvas: {},
                acanvas: {},
                ctx: {},
                actx: {},
                legend: null,
                visible: true,
                width: 0,
                height: 0,
                max: false,
                gradient: false,
                opacity: 180,
                premultiplyAlpha: false,
                bounds: {
                    l: 1000,
                    r: 0,
                    t: 1000,
                    b: 0
                },
                debug: false
            };
            // heatmap store containing the datapoints and information about the maximum
            // accessible via instance.store
            this.store = new store(this);

            this.get = function(key) {
                return _[key];
            };
            this.set = function(key, value) {
                _[key] = value;
            };
            // configure the heatmap when an instance gets created
            this.configure(config);
            // and initialize it
            this.init();
        };

        // public functions
        heatmap.prototype = {
            configure: function(config) {
                var me = this,
                    rout, rin;

                me.set("radius", config["radius"] || 40);
                // me.set("element", (config.element instanceof Object) ? config.element : document.getElementById(config.element));
                me.set("visible", (config.visible !== null && config.visible !== undefined) ? config.visible : true);
                me.set("max", config.max || false);
                me.set("gradient", config.gradient || {
                    0.45: "rgb(0,0,255)",
                    0.55: "rgb(0,255,255)",
                    0.65: "rgb(0,255,0)",
                    0.95: "yellow",
                    1.0: "rgb(255,0,0)"
                }); // default is the common blue to red gradient
                me.set("opacity", parseInt(255 / (100 / config.opacity), 10) || 180);
                me.set("width", config.width || 0);
                me.set("height", config.height || 0);
                me.set("debug", config.debug);
                me.set('canvas', config.canvas);

                if (config.legend) {
                    var legendCfg = config.legend;
                    legendCfg.gradient = me.get("gradient");
                    me.set("legend", new legend(legendCfg));
                }

            },
            resize: function() {
                var me = this,
                    // element = me.get("element"),
                    canvas = me.get("canvas"),
                    acanvas = me.get("acanvas");
                acanvas.width = canvas.width;
                acanvas.height = canvas.height;
                this.set("width", canvas.width);
                this.set("height", canvas.height);
                // canvas.width = acanvas.width = me.get("width") || element.style.width.replace(/px/, "") || me.getWidth(element);
                // this.set("width", canvas.width);
                // canvas.height = acanvas.height = me.get("height") || element.style.height.replace(/px/, "") || me.getHeight(element);
                // this.set("height", canvas.height);
            },

            init: function() {
                var me = this,
                    canvas = me.get('canvas'), // document.createElement("canvas"),
                    acanvas = document.createElement("canvas"),
                    ctx = canvas.getContext("2d"),
                    actx = acanvas.getContext("2d");
                    // element = me.get("element");


                me.initColorPalette();

                // me.set("canvas", canvas);
                me.set("ctx", ctx);
                me.set("acanvas", acanvas);
                me.set("actx", actx);

                me.resize();
                // canvas.style.cssText = acanvas.style.cssText = "position:absolute;top:0;left:0;z-index:10000000;";

                if (!me.get("visible"))
                    canvas.style.display = "none";

                // element.appendChild(canvas);
                if (me.get("legend")) {
                    element.appendChild(me.get("legend").getElement());
                }

                // debugging purposes only
                if (me.get("debug"))
                    document.body.appendChild(acanvas);

                actx.shadowOffsetX = 15000;
                actx.shadowOffsetY = 15000;
                actx.shadowBlur = 15;
            },
            initColorPalette: function() {

                var me = this,
                    canvas = document.createElement("canvas"),
                    gradient = me.get("gradient"),
                    ctx, grad, testData;

                canvas.width = "1";
                canvas.height = "256";
                ctx = canvas.getContext("2d");
                grad = ctx.createLinearGradient(0, 0, 1, 256);

                // Test how the browser renders alpha by setting a partially transparent pixel
                // and reading the result.  A good browser will return a value reasonably close
                // to what was set.  Some browsers (e.g. on Android) will return a ridiculously wrong value.
                testData = ctx.getImageData(0, 0, 1, 1);
                testData.data[0] = testData.data[3] = 64; // 25% red & alpha
                testData.data[1] = testData.data[2] = 0; // 0% blue & green
                ctx.putImageData(testData, 0, 0);
                testData = ctx.getImageData(0, 0, 1, 1);
                me.set("premultiplyAlpha", (testData.data[0] < 60 || testData.data[0] > 70));

                for (var x in gradient) {
                    grad.addColorStop(x, gradient[x]);
                }

                ctx.fillStyle = grad;
                ctx.fillRect(0, 0, 1, 256);

                me.set("gradient", ctx.getImageData(0, 0, 1, 256).data);
            },
            // getWidth: function(element) {
            //     var width = element.offsetWidth;
            //     if (element.style.paddingLeft) {
            //         width += element.style.paddingLeft;
            //     }
            //     if (element.style.paddingRight) {
            //         width += element.style.paddingRight;
            //     }

            //     return width;
            // },
            // getHeight: function(element) {
            //     var height = element.offsetHeight;
            //     if (element.style.paddingTop) {
            //         height += element.style.paddingTop;
            //     }
            //     if (element.style.paddingBottom) {
            //         height += element.style.paddingBottom;
            //     }

            //     return height;
            // },
            colorize: function(x, y) {
                // get the private variables
                var me = this,
                    width = me.get("width"),
                    radius = me.get("radius"),
                    height = me.get("height"),
                    actx = me.get("actx"),
                    ctx = me.get("ctx"),
                    x2 = radius * 3,
                    premultiplyAlpha = me.get("premultiplyAlpha"),
                    palette = me.get("gradient"),
                    opacity = me.get("opacity"),
                    bounds = me.get("bounds"),
                    left, top, bottom, right,
                    image, imageData, length, alpha, offset, finalAlpha;

                if (x !== null && x !== undefined && y !== null && y !== undefined) {
                    if (x + x2 > width) {
                        x = width - x2;
                    }
                    if (x < 0) {
                        x = 0;
                    }
                    if (y < 0) {
                        y = 0;
                    }
                    if (y + x2 > height) {
                        y = height - x2;
                    }
                    left = x;
                    top = y;
                    right = x + x2;
                    bottom = y + x2;

                } else {
                    if (bounds['l'] < 0) {
                        left = 0;
                    } else {
                        left = bounds['l'];
                    }
                    if (bounds['r'] > width) {
                        right = width;
                    } else {
                        right = bounds['r'];
                    }
                    if (bounds['t'] < 0) {
                        top = 0;
                    } else {
                        top = bounds['t'];
                    }
                    if (bounds['b'] > height) {
                        bottom = height;
                    } else {
                        bottom = bounds['b'];
                    }
                }

                image = actx.getImageData(left, top, right - left, bottom - top);
                imageData = image.data;
                length = imageData.length;
                // loop thru the area
                for (var i = 3; i < length; i += 4) {

                    // [0] -> r, [1] -> g, [2] -> b, [3] -> alpha
                    alpha = imageData[i],
                    offset = alpha * 4;

                    if (!offset)
                        continue;

                    // we ve started with i=3
                    // set the new r, g and b values
                    finalAlpha = (alpha < opacity) ? alpha : opacity;
                    imageData[i - 3] = palette[offset];
                    imageData[i - 2] = palette[offset + 1];
                    imageData[i - 1] = palette[offset + 2];

                    if (premultiplyAlpha) {
                        // To fix browsers that premultiply incorrectly, we'll pass in a value scaled
                        // appropriately so when the multiplication happens the correct value will result.
                        imageData[i - 3] /= 255 / finalAlpha;
                        imageData[i - 2] /= 255 / finalAlpha;
                        imageData[i - 1] /= 255 / finalAlpha;
                    }

                    // we want the heatmap to have a gradient from transparent to the colors
                    // as long as alpha is lower than the defined opacity (maximum), we'll use the alpha value
                    imageData[i] = finalAlpha;
                }
                // the rgb data manipulation didn't affect the ImageData object(defined on the top)
                // after the manipulation process we have to set the manipulated data to the ImageData object
                image.data = imageData;
                ctx.putImageData(image, left, top);
            },
            drawAlpha: function(x, y, count, colorize) {
                // storing the variables because they will be often used
                var me = this,
                    radius = me.get("radius"),
                    ctx = me.get("actx"),
                    max = me.get("max"),
                    bounds = me.get("bounds"),
                    xb = x - (1.5 * radius) >> 0,
                    yb = y - (1.5 * radius) >> 0,
                    xc = x + (1.5 * radius) >> 0,
                    yc = y + (1.5 * radius) >> 0;

                ctx.shadowColor = ('rgba(0,0,0,' + ((count) ? (count / me.store.max) : '0.1') + ')');

                ctx.shadowOffsetX = 15000;
                ctx.shadowOffsetY = 15000;
                ctx.shadowBlur = 15;

                ctx.beginPath();
                ctx.arc(x - 15000, y - 15000, radius, 0, Math.PI * 2, true);
                ctx.closePath();
                ctx.fill();
                if (colorize) {
                    // finally colorize the area
                    me.colorize(xb, yb);
                } else {
                    // or update the boundaries for the area that then should be colorized
                    if (xb < bounds["l"]) {
                        bounds["l"] = xb;
                    }
                    if (yb < bounds["t"]) {
                        bounds["t"] = yb;
                    }
                    if (xc > bounds['r']) {
                        bounds['r'] = xc;
                    }
                    if (yc > bounds['b']) {
                        bounds['b'] = yc;
                    }
                }
            },
            toggleDisplay: function() {
                var me = this,
                    visible = me.get("visible"),
                    canvas = me.get("canvas");

                if (!visible)
                    canvas.style.display = "block";
                else
                    canvas.style.display = "none";

                me.set("visible", !visible);
            },
            // dataURL export
            getImageData: function() {
                return this.get("canvas").toDataURL();
            },
            clear: function() {
                var me = this,
                    w = me.get("width"),
                    h = me.get("height");

                me.store.set("data", []);
                // @TODO: reset stores max to 1
                //me.store.max = 1;
                me.get("ctx").clearRect(0, 0, w, h);
                me.get("actx").clearRect(0, 0, w, h);
            },
            cleanup: function() {
                var me = this;
                // me.get("element").removeChild(me.get("canvas"));
            }
        };

        return {
            create: function(config) {
                return new heatmap(config);
            },
            util: {
                mousePosition: function(ev) {
                    // this doesn't work right
                    // rather use
                    /*
                        // this = element to observe
                        var x = ev.pageX - this.offsetLeft;
                        var y = ev.pageY - this.offsetTop;

                    */
                    var x, y;

                    if (ev.layerX) { // Firefox
                        x = ev.layerX;
                        y = ev.layerY;
                    } else if (ev.offsetX) { // Opera
                        x = ev.offsetX;
                        y = ev.offsetY;
                    }
                    if (typeof(x) == 'undefined')
                        return;

                    return [x, y];
                }
            }
        };
    })();

})(AMap);