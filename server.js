//test commit
console.log('---------------------------------------------------------');
console.log('here we go');
console.log('---------------------------------------------------------');


var express = require('express');
var app = express();

var bodyParser = require('body-parser')
app.use( bodyParser.json() );       // to support JSON-encoded bodies
app.use(bodyParser.urlencoded({     // to support URL-encoded bodies
  extended: true
}));


var http = require('http').Server(app);
var io = require('socket.io')(http);

var cycleLen = 1000;


var util = require('./libs/util');
var change = require('./libs/change');


var text = "";
var colors = [];


var colorList = ['blue', 'red', 'green'];
var colorsInUse = [];

app.use('/', express.static(__dirname + '/static'));
app.use('/libs', express.static(__dirname + '/libs'));


app.set('port', 8080);

http.listen(app.get('port'), function(){
	console.log('listening on *:' + app.get('port'));
});


var number = 0;
var connections = 0;
var edits = {};

function findClientsSocket(roomId, namespace) {
    var res = []
    , ns = io.of(namespace ||"/");    // the default namespace is "/"

    if (ns) {
        for (var id in ns.connected) {
            if(roomId) {
                var index = ns.connected[id].rooms.indexOf(roomId) ;
                if(index !== -1) {
                    res.push(ns.connected[id]);
                }
            } else {
                res.push(ns.connected[id]);
            }
        }
    }
    return res;
}


function cleanUpEdits(clients) {
	var clients = findClientsSocket();
	
	if (clients.length == 0) {
		edits = {};
		return;
	}

	var lowest = clients[0].lastEdit;
	if (lowest == undefined) return;

	for (var i = 1; i < clients.length; i++) {
		//lowest = 1
		// lastEdit = 998

		var differenceForward = clients[i].lastEdit - lowest;
		var differenceBackward = -differenceForward;

		while (differenceForward < 0) differenceForward += cycleLen/2;
		while (differenceBackward < 0) differenceBackward += cycleLen/2;

		if (differenceForward > differenceBackward) {
			lowest = clients[i].lastEdit;
		}
	}

	for (var i = 0; i < cycleLen/2; i++) {
		lowest--;
		if (lowest < 0) lowest += cycleLen;

		edits[lowest] = undefined;
	}

}

io.on('connection', function(socket){

	console.log("connection");


	var userColor = colorList.pop();
	colorsInUse.push(userColor);

	socket.emit('init', {text:text, number:number, colors:colors, color:userColor});
	connections++;
	socket.color = userColor;

	socket.on('input', function(input) {
		var c = input['change'];
		var n = input['number'];

		var edit = change.stringToEditPath(c);
		


		//console.log(n + ", " + number + ": " + text);


		if (n != number) {
			for (var i = n; n != number; n = (n+1)%cycleLen) {
				util.applyOffsets(edit, edits[i]);
				console.log('applying', JSON.stringify(edits[i]));
				console.log('new edit', JSON.stringify(edit));
			}
		}

		console.log("got edit", JSON.stringify(edit));
		console.log(text + " -> " + change.applyEditPath(text, edit));
		text = change.applyEditPath(text, edit);
		change.applyEditPathToColors(colors, edit, input['color']);

		edits[number] = edit;
		socket.lastEdit = number;
		cleanUpEdits();


		number = (number + 1) % cycleLen;

		var hash = change.hashString(text);

		socket.broadcast.emit('edit', {number: number, edit:edit, hash:hash, text:text, color:input['color']});
		socket.emit('inputResponse', {number:number, hash:hash, text:text});
	});

	socket.on('editRecieved', function(data) {
		socket.lastEdit = data.number;
		cleanUpEdits();

	});


	socket.on('disconnect', function(){
		colorList.push(socket.color);

	});
  
});
