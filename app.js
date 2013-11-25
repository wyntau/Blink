
/**
 * Module dependencies.
 */
require('coffee-script');

var express = require('express');
var http    = require('http');
var path    = require('path');
var socket  = require('socket.io');
var ioEvent = require('./lib/ioEvent');

var app = express();

// all environments
app.set('port', process.env.PORT || 3000);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.bodyParser());
app.use(express.methodOverride());
app.use(app.router);
app.use(express.static(path.join(__dirname, 'public')));

var server = http.createServer(app);
var io = socket.listen(server);

server.listen(app.get('port'));

var arr = [];
for(var i = 0; i< 5000; i++){
    arr.push([
        73 + 62e5 * Math.random() / 100000, // lng
        3 + 50e5 * Math.random() / 100000, // lat
        parseInt(Math.random() * 8000) // score
        ]);
}

io.sockets.on('connection', function(socket){
    socket.emit('init',{dots: arr});
});

setInterval(function(){
    var update = [];
    for(var i = 0; i< arr.length; i++){
        update[i] = parseInt(Math.random() * 4000) * (Math.random() >= 0.5 ? 1 : -1);
        arr[i][2] += update[i]
    }
    io.sockets.emit('update',{update:update})
}, 4000)

// development only
if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}

// http.createServer(app).listen(app.get('port'), function(){
//   console.log('Express server listening on port ' + app.get('port'));
// });
