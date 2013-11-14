(function() {
  var DEFAUTL_BACKGROUND, HEIGHT, MAX_DELAY, MAX_DURATION, MAX_RADIUS, PIXEL_NUM, WIDTH, addPixel, arr, canvas, complete, ctx, img, socket, stats, step, verify;

  PIXEL_NUM = 5000;

  WIDTH = window.innerWidth;

  HEIGHT = window.innerHeight;

  DEFAUTL_BACKGROUND = '#000';

  MAX_DELAY = 5000;

  MAX_DURATION = 5000;

  MAX_RADIUS = 10;

  canvas = document.getElementById('canvas');

  ctx = canvas.getContext('2d');

  ctx.canvas.width = WIDTH;

  ctx.canvas.height = HEIGHT;

  img = new Image();

  img.src = 'img/particle.png';

  arr = [];

  stats = new Stats();

  stats.domElement.style.position = 'absolute';

  stats.domElement.style.right = '30px';

  stats.domElement.style.top = '30px';

  stats.domElement.style.width = '90px';

  document.body.appendChild(stats.domElement);

  addPixel = function(num) {
    var i, _i, _results;
    _results = [];
    for (i = _i = 0; 0 <= num ? _i < num : _i > num; i = 0 <= num ? ++_i : --_i) {
      _results.push(arr.push(new Pixel({
        x: Math.random() * WIDTH,
        y: Math.random() * HEIGHT,
        R: Math.random() * MAX_RADIUS + 1,
        delay: Math.random * MAX_DELAY + 50,
        duration: Math.random() * MAX_DURATION + 50
      })));
    }
    return _results;
  };

  socket = io.connect('http://localhost:3000');

  socket.on('init', function(num) {
    addPixel(num);
    return Animation.start(step, verify, complete);
  });

  socket.on('refresh', function(num) {
    return addPixel(num);
  });

  step = function() {
    var R, a, b, drop, g, i, pixel, r, state, states, x, y, _i, _j, _len, _len1, _ref;
    stats.begin();
    states = [];
    drop = 0;
    _ref = arr.slice(0);
    for (i = _i = 0, _len = _ref.length; _i < _len; i = ++_i) {
      pixel = _ref[i];
      if ((state = pixel.update()) === null) {
        arr.splice(i, 1);
        drop++;
      } else if (state) {
        states.push(state);
      }
    }
    ctx.fillStyle = DEFAUTL_BACKGROUND;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    for (_j = 0, _len1 = states.length; _j < _len1; _j++) {
      state = states[_j];
      r = state.r, g = state.g, b = state.b, a = state.a, R = state.R, x = state.x, y = state.y;
      ctx.drawImage(img, x - R, y - R, 2 * R, 2 * R);
    }
    states = [];
    socket.emit('refresh', drop);
    return stats.end();
  };

  verify = function() {
    return arr.length;
  };

  complete = function() {
    return console.log('complete');
  };

}).call(this);
