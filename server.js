var http = require('http');
var Static = require('node-static');
var app = http.createServer(handler);
var io = require('socket.io').listen(app);
var port = process.env.PORT || 8080;


var files = new Static.Server('./public');

function handler (request, response) {
	request.on('end', function() {
		files.serve(request, response);
	}).resume();
}



var allKnownLocations = {};
var ttls = {};
var cleanExpitedLocations = function() {
    var now = new Date();
    var expired = [];
    for (var key in ttls) {
        if (ttls.hasOwnProperty(key)) {
            if (ttls[key] < now) {

                console.log('Removed expired entry', key, ttls[key], now);
                expired.push(key);
            }
        }
    }

    for (var key2 in expired) {
        delete allKnownLocations[key2];
        delete ttls[key2];
    }
};

io.configure(function () {
    // delete to see more logs from sockets
    io.set('log level', 1);
    io.set("transports", ["xhr-polling"]);
    io.set("polling duration", 10);
});

io.sockets.on('connection', function (socket) {
    console.log('client connected');
    socket.send(socket.id);

    socket.on('disconnect', function () {
        console.log('client disconnected');
    });

    socket.on('send:test', function (data) {
        console.log('Recived send:test', data);
        socket.broadcast.emit('load:test', data);
    });

	socket.on('send:coords', function (data) {
        console.log('Recived send:coords', data);
        ttls[data.id] = new Date((new Date()).getTime() + 60000);
        allKnownLocations[data.id] = data;
		socket.broadcast.emit('load:coords', data);
	});

    socket.on('send:request_coords', function (data) {
        cleanExpitedLocations();

        console.log('Recived send:request_coords', data);
        console.log('Answer send:request_coords', allKnownLocations);
        //socket.broadcast.emit('load:request_coords', allKnownLocations);
        io.sockets.socket(data.socketid).emit('load:request_coords', allKnownLocations);
    });

});

// start app on specified port
var server = app.listen(port, function() {
    console.log('GISServer listening on port %d', server.address().port, server.address());
});

